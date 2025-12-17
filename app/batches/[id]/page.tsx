'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import TerminalPanel from '@/components/ui/TerminalPanel';
import GlitchButton from '@/components/ui/GlitchButton';

interface RecipientStatus {
  id: string;
  email: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  errorDetails?: string;
}

export default function BatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const { id } = use(params);
  
  const [batch, setBatch] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [activeLog, setActiveLog] = useState<string>("SYSTEM_READY");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [requiredVars, setRequiredVars] = useState<string[]>([]);
  const [previewContent, setPreviewContent] = useState<{subject: string, html: string} | null>(null);
  
  const router = useRouter();

  const fetchBatch = async () => {
    const res = await fetch(`/api/batches/${id}`);
    if (res.ok) {
        const data = await res.json();
        setBatch(data);
        setRecipients(data.recipients || []);
      
      // Extract Required Vars from Template
      if (data.template) {
          const regex = /{{(.*?)}}/g;
          const vars = new Set<string>();
          let match;
          while ((match = regex.exec(data.template.htmlContent)) !== null) vars.add(match[1]);
          while ((match = regex.exec(data.template.subject)) !== null) vars.add(match[1]);
          
          // Case-insensitive dedup
          const normalized = new Set<string>();
          vars.forEach(v => {
              if (v.toLowerCase() !== 'email') normalized.add(v);
          });
          
          setRequiredVars(Array.from(normalized));
      }
    }
  };

  useEffect(() => {
    fetchBatch();
    const interval = setInterval(fetchBatch, 60000); // 1m poll for status/bounces
    return () => { clearInterval(interval); };
  }, [id, batch?.senderId]);

  const handleManualSync = async () => {
      setActiveLog("MANUAL_SYNC_INITIATED...");
      await fetchBatch();
      if (batch?.senderId) {
          try {
             setActiveLog("CHECKING_BOUNCES...");
             await fetch('/api/bounces/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: batch.senderId })
             });
             await fetchBatch();
             setActiveLog("SYNC_COMPLETE.");
          } catch(e) { 
              setActiveLog("SYNC_ERROR: " + e);
          }
      }
  };

  const startStreaming = () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setActiveLog("Connecting to stream...");

    const eventSource = new EventSource(`/api/batches/${id}/stream`);

    eventSource.addEventListener('start', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setActiveLog(`Started sending to ${data.total} recipients.`);
    });

    eventSource.addEventListener('progress', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        if (data.status === 'SCANNING_BOUNCES') {
            setActiveLog("SCANNING_FOR_BOUNCES...");
            return;
        }
        
        setBatch((prev: any) => {
           if (!prev) return null;
           const newRecipients = prev.recipients.map((r: any) => 
               r.id === data.recipientId ? { ...r, status: data.status, errorDetails: data.error } : r
           );
           
           if (data.status === 'SENT') {
               return { ...prev, successCount: prev.successCount + 1, recipients: newRecipients };
           } else {
               return { ...prev, failureCount: prev.failureCount + 1, recipients: newRecipients };
           }
        });
      });

      eventSource.addEventListener('bounce_summary', (e: MessageEvent) => {
          const data = JSON.parse(e.data);
          // data.updates contains the list. We could update local state or just refetch.
          // Since it's a bulk update at end, refetching is cleaner but we can optimistically update too.
          if (data.bouncedCount > 0) {
              fetchBatch();
          }
      });
      
      eventSource.addEventListener('complete', () => {
        setActiveLog("Batch sending completed.");
        setIsStreaming(false);
        eventSource.close();
        setBatch((prev: any) => ({ ...prev, status: 'COMPLETED' }));
    });

    eventSource.addEventListener('error', (e: MessageEvent) => {
        if (e.data) {
             const data = JSON.parse(e.data);
             setActiveLog(`Error: ${data.message}`);
        } else {
             // Standard connection error handling
             // Don't close immediately on generic error, but here we assume critical
             // setActiveLog("Connection lost.");
        }
    });
    
    eventSource.onerror = (err) => {
       console.error("EventSource failed:", err);
       eventSource.close();
       setIsStreaming(false);
    };
  };

  const toggleExpand = (rid: string) => {
    if (expandedId === rid) setExpandedId(null);
    else setExpandedId(rid);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ...

  const handleAddTargets = async () => {
     if (isSubmitting) return;
     setIsSubmitting(true);
     
     // Parse CSV logic (similar to step 1)
     const lines = csvContent.trim().split('\n');
     if (lines.length < 2) {
       alert("CSV must have headers and at least one row");
       setIsSubmitting(false);
       return;
     }

     // ... (parsing logic)
     const headers = lines[0].split(',').map(h => h.trim());
     
     // Normalize headers
     const normalizedHeaders = headers.map(h => h.toLowerCase());
     
     if (!normalizedHeaders.includes('email')) {
         alert("CSV must contain 'email' header");
         setIsSubmitting(false);
         return;
     }

     // Validate Required Vars (Case Sensitive Matching usually preferred for vars, but let's be loose if needed)
     // Actually for vars replacement we usually want exact match, but let's just check existence.
     // If template has {{Name}}, csv must have Name.
     const missing = requiredVars.filter(v => !headers.includes(v));
     if (missing.length > 0) {
         alert(`Missing required columns: ${missing.join(', ')}`);
         setIsSubmitting(false);
         return;
     }

     const newRecipients = lines.slice(1).map(line => {
       const values = line.split(',').map(v => v.trim());
       const data: any = {};
       headers.forEach((h, i) => data[h] = values[i]);
       return data;
     });

     try {
         const res = await fetch(`/api/batches/${id}/recipients`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ recipients: newRecipients })
         });

         if (res.ok) {
             setCsvContent('');
             setIsAdding(false);
             fetchBatch(); // Reload
         } else {
             alert("Failed to add recipients");
         }
     } catch (e) {
         alert("Network error");
     } finally {
         setIsSubmitting(false);
     }
  };

  const startEdit = (r: RecipientStatus) => {
      setEditingId(r.id);
      setEditEmail(r.email);
  };

  const saveEdit = async (r: RecipientStatus) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      
      try {
          const res = await fetch(`/api/batches/${id}/recipients`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recipientId: r.id, email: editEmail })
          });

          if (res.ok) {
              setEditingId(null);
              fetchBatch(); // Reload
          } else {
              alert("Failed to update recipient");
          }
      } catch (e) {
          alert("Network error");
      } finally {
         setIsSubmitting(false);
      }
  };

  const showPreview = (r: any) => {
      if (!batch?.template) return;
      
      let html = batch.template.htmlContent;
      let subject = batch.template.subject;
      const vars = r.variables || {};

      // Interpolate
      requiredVars.forEach(v => {
          const regex = new RegExp(`{{${v}}}`, 'g');
          const val = vars[v] || `[MISSING: ${v}]`;
          html = html.replace(regex, val);
          subject = subject.replace(regex, val);
      });

      setPreviewContent({ subject, html });
  };

  if (!batch) return <div className="p-8 text-green-500 font-mono">LOADING_SEQUENCE...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-black p-6 border-b-2 border-green-900 sticky top-4 z-10 gap-4">
        <div>
           <h1 className="text-2xl font-bold font-mono text-green-500 tracking-wider">BATCH: {batch.sender?.label}</h1>
           <p className="text-green-800 text-sm font-mono mt-1">{'>'} {activeLog}</p>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-end md:items-center">
            <GlitchButton variant="ghost" onClick={() => setIsAdding(!isAdding)}>
                {isAdding ? 'CANCEL' : 'INJECT'}
            </GlitchButton>

            {(batch.status !== 'COMPLETED' || batch.failureCount > 0) && !isStreaming ? (
       <div className="flex flex-col items-end">
        <div className="flex gap-4">
             <GlitchButton onClick={startStreaming}>
                 {batch.status === 'COMPLETED' ? 'RETRY_FAIL' : 'ENGAGE'}
             </GlitchButton>
        </div>
        
        {/* Bounce Monitor Status */}
        <div className="flex items-center gap-2 mt-2 text-xs font-mono text-green-800">
            <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            BOUNCE_MON: ACTIVE [60s]
        </div>
        <div className="mt-1 flex justify-end">
            <button onClick={handleManualSync} className="text-[10px] text-green-600 hover:text-green-400 font-mono border border-green-900 px-1 uppercase hover:bg-green-900/30">
                [SYNC]
            </button>
        </div>
       </div>
            ) : (
            <div className={`px-4 py-2 font-mono text-sm border ${isStreaming ? 'border-green-500 text-green-500 animate-pulse' : 'border-green-900 text-green-800'}`}>
                {isStreaming ? 'TRANSMITTING...' : batch.status === 'COMPLETED' && batch.failureCount === 0 ? 'COMPLETE' : batch.status}
            </div>
            )}
        </div>
      </div>

      {isAdding && (
          <TerminalPanel title="TARGET_INJECTION_PROTOCOL">
              <div className="mb-2 p-2 border border-green-800 bg-green-900/20 text-green-400 text-xs font-mono">
                  REQUIRED_HEADERS: email{requiredVars.length > 0 ? ', ' + requiredVars.join(', ') : ''}
                  <br/><span className="opacity-70 mt-1 block">HEADERS_MUST_MATCH_VARIABLES</span>
              </div>
              <textarea 
               className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none font-mono text-xs h-32 text-green-400 placeholder-green-900 mb-4"
               placeholder={`email, ${requiredVars.length > 0 ? requiredVars.join(', ') : 'name'}\nnewtarget@example.com, Value...`}
               value={csvContent}
               onChange={e => setCsvContent(e.target.value)}
             />
             <div className="flex justify-end">
                 <GlitchButton onClick={handleAddTargets}>UPLOAD_DATA_PACKET</GlitchButton>
             </div>
          </TerminalPanel>
      )}

      {/* Preview Overlay */}
      {previewContent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewContent(null)}>
            <TerminalPanel title="PAYLOAD_PREVIEW" className="max-w-3xl w-full max-h-[80vh] overflow-y-auto bg-black border-2 border-green-500" onClick={(e: any) => e.stopPropagation()}>
                    <div className="mb-4 text-green-400 font-mono text-sm border-b border-green-900 pb-2">
                        <span className="text-green-700">SUBJECT:</span> {previewContent.subject}
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-4 rounded" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent.html) }} />
                    <div className="mt-4 text-right">
                        <GlitchButton onClick={() => setPreviewContent(null)}>CLOSE_VIEW</GlitchButton>
                    </div>
            </TerminalPanel>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <TerminalPanel title="TOTAL_TARGETS">
          <div className="text-4xl font-bold text-green-400 font-mono my-2">{batch.totalRecipients}</div>
        </TerminalPanel>
        <TerminalPanel title="CONFIRMED_KILLS">
          <div className="text-4xl font-bold text-green-500 font-mono my-2">{batch.successCount}</div>
        </TerminalPanel>
        <TerminalPanel title="MISSES">
          <div className="text-4xl font-bold text-red-500 font-mono my-2">{batch.failureCount}</div>
        </TerminalPanel>
        <TerminalPanel title="HIT_RATE">
          <div className="text-4xl font-bold text-blue-400 font-mono my-2">
             {batch.totalRecipients > 0 
                ? ((batch.successCount / batch.totalRecipients) * 100).toFixed(1) 
                : 0}%
          </div>
        </TerminalPanel>
      </div>

      {batch.totalRecipients > 0 && (
         <div className="w-full h-6 bg-black border border-green-900 flex relative">
             <div 
                className="bg-green-600 h-full transition-all duration-500 ease-out" 
                style={{ width: `${(batch.successCount / batch.totalRecipients) * 100}%` }}
             />
             <div 
                className="bg-red-600 h-full transition-all duration-500 ease-out" 
                style={{ width: `${(batch.failureCount / batch.totalRecipients) * 100}%` }}
             />
             {/* Scanline overlay for effect */}
             <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,0,0.1)_50%,transparent_100%)] pointer-events-none" />
         </div>
      )}

      <TerminalPanel title="RECIPIENT_LOG" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
            <div className="min-w-[700px]">
                <div className="p-4 border-b border-green-900 bg-green-900/10 font-mono text-green-600 text-xs grid grid-cols-12 gap-2 font-bold tracking-wider">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-6">TARGET_EMAIL</div>
                    <div className="col-span-3">STATUS_CODE</div>
                    <div className="col-span-2 text-right">ACTION</div>
                </div>
                
                <div className="divide-y divide-green-900/30">
                    {recipients.map((r, i) => (
                        <div key={r.id} className="group hover:bg-green-900/10 transition duration-150">
                            <div className="p-3 grid grid-cols-12 gap-2 items-center cursor-pointer font-mono text-sm">
                                <div className="col-span-1 text-green-800" onClick={() => toggleExpand(r.id)}>{String(i + 1).padStart(3, '0')}</div>
                                <div className="col-span-6 text-green-400 truncate tracking-wide">
                                    {editingId === r.id ? (
                                        <input 
                                            className="bg-black border border-green-500 text-green-500 px-2 py-1 w-full outline-none"
                                            value={editEmail}
                                            onChange={e => setEditEmail(e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span onClick={() => toggleExpand(r.id)}>{r.email}</span>
                                    )}
                                </div>
                                <div className="col-span-3" onClick={() => toggleExpand(r.id)}>
                                    <span className={`
                                        ${r.status === 'SENT' ? 'text-green-500' :
                                          r.status === 'FAILED' ? 'text-red-500' :
                                          'text-green-800'}
                                    `}>
                                        [{r.status}]
                                    </span>
                                </div>
                                <div className="col-span-2 text-right flex justify-end items-center">
                                    <button onClick={(e) => { e.stopPropagation(); showPreview(r); }} className="text-blue-500 hover:text-blue-300 mr-2 opacity-0 group-hover:opacity-100 transition text-xs tracking-tighter">[PREVIEW]</button>
                                    {editingId === r.id ? (
                                        <button onClick={() => saveEdit(r)} className="text-green-500 hover:text-green-300">[SAVE]</button>
                                    ) : (
                                        (r.status === 'PENDING' || r.status === 'FAILED') && (
                                            <button onClick={() => startEdit(r)} className="text-green-700 hover:text-green-500 opacity-0 group-hover:opacity-100 transition">
                                                [EDIT]
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                            {/* Details Dropdown */}
                            {(expandedId === r.id || r.status === 'FAILED') && r.errorDetails && !editingId && (
                                <div className="bg-red-900/20 p-4 text-xs text-red-400 font-mono border-l-2 border-red-500 ml-4 mb-2 mr-4">
                                    <strong className="text-red-600">ERR_TRACE:</strong> {DOMPurify.sanitize(r.errorDetails)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </TerminalPanel>
    </div>
  );
}
