'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import TerminalPanel from '@/components/ui/TerminalPanel';
import GlitchButton from '@/components/ui/GlitchButton';

export default function BatchesPage() {
  const [step, setStep] = useState(1);
  const [senders, setSenders] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [requiredVars, setRequiredVars] = useState<string[]>([]);
  
  const [parsedRecipients, setParsedRecipients] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetch('/api/senders').then(res => res.json()).then(setSenders);
    fetch('/api/templates').then(res => res.json()).then(setTemplates);
  }, []);

  useEffect(() => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
        setRequiredVars([]);
        return;
    }

    const regex = /{{(.*?)}}/g;
    const vars = new Set<string>();
    let match;
    while ((match = regex.exec(template.htmlContent)) !== null) {
      vars.add(match[1]);
    }
    while ((match = regex.exec(template.subject)) !== null) {
        vars.add(match[1]);
    }
    setRequiredVars(Array.from(vars));
  }, [selectedTemplateId, templates]);

  const validateAndPreview = () => {
    // 1. Parse CSV
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      alert("CSV must have headers and at least one row");
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const recipients = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const data: any = {};
      headers.forEach((h, i) => data[h] = values[i]);
      return data;
    });
    setParsedRecipients(recipients);

    // 2. Validate Template Variables (Using pre-calculated requiredVars)
    const errors: string[] = [];
    requiredVars.forEach(v => {
      if (!headers.includes(v)) {
        errors.push(`Missing CSV column for variable: {{${v}}}`);
      }
    });
    setValidationErrors(errors);

    // 3. Generate Preview (First Recipient)
    const template = templates.find(t => t.id === selectedTemplateId);
    if (recipients.length > 0 && template) {
      let preview = template.htmlContent;
      const first = recipients[0];
      Object.keys(first).forEach(key => {
         preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), first[key] || '');
      });
      setPreviewHtml(preview);
    }
    
    setStep(2);
  };

  const handleSend = async () => {
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: selectedSenderId,
        templateId: selectedTemplateId,
        recipients: parsedRecipients
      }),
    });

    if (res.ok) {
      const batch = await res.json();
      router.push(`/batches/${batch.id}`);
    } else {
      alert("Failed to create batch");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b-2 border-green-900 pb-4">
          <h1 className="text-3xl font-bold text-green-500 font-mono tracking-widest">// BATCH_WIZARD</h1>
          <div className="text-xs font-mono text-green-700">
             SEQUENCE: <span className="text-green-500 font-bold">{step}</span> / 2
          </div>
      </div>

      {step === 1 && (
        <TerminalPanel title="INIT_PARAMETERS" className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-green-700">SELECT_SENDER_PROTOCOL</label>
              <select 
                className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none text-green-400"
                value={selectedSenderId}
                onChange={e => setSelectedSenderId(e.target.value)}
              >
                <option value="">-- NULL --</option>
                {senders.map(s => <option key={s.id} value={s.id}>{s.label || s.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-green-700">SELECT_PAYLOAD_TEMPLATE</label>
              <select 
                className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none text-green-400"
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
              >
                 <option value="">-- NULL --</option>
                 {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold mb-2 text-green-700">TARGET_DATA_STREAM (CSV)</label>
             {requiredVars.length > 0 && (
                <div className="mb-2 p-2 border border-green-800 bg-green-900/20 text-green-400 text-xs font-mono">
                    <span className="font-bold">REQUIRED_HEADERS:</span> {requiredVars.join(', ')}
                </div>
             )}
             <textarea 
               className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none font-mono text-xs h-64 text-green-400 placeholder-green-900"
               placeholder={`email, ${requiredVars.length ? requiredVars.join(', ') : 'name'}\nalice@example.com, ...`}
               value={csvContent}
               onChange={e => setCsvContent(e.target.value)}
             />
             <p className="text-xs text-green-800 mt-2">HEADERS_MUST_MATCH_VARIABLES.</p>
          </div>

          <div className="flex justify-end">
             <GlitchButton onClick={validateAndPreview} disabled={!selectedSenderId || !selectedTemplateId || !csvContent}>
                ANALYZE_STREAM {'>'}
             </GlitchButton>
          </div>
        </TerminalPanel>
      )}

      {step === 2 && (
        <div className="space-y-6">
           {validationErrors.length > 0 ? (
             <TerminalPanel title="ERROR_LOG" className="p-6 border-red-500">
                <h3 className="text-red-500 font-bold text-lg mb-2">⚠ INTEGRITY_FAILURE</h3>
                <ul className="list-disc pl-5 text-red-400 space-y-1 font-mono">
                   {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
                <p className="mt-4 text-sm text-red-800">Please re-calibrate CSV headers.</p>
             </TerminalPanel>
           ) : (
             <TerminalPanel title="VALIDATION_SUCCESS" className="p-6 border-green-500">
                <h3 className="text-green-500 font-bold text-lg mb-2">✓ CHECKSUM_OK</h3>
                <p className="text-green-700 text-sm font-mono">RECIPIENTS_PARSED: {parsedRecipients.length}. VARS_MATCHED.</p>
             </TerminalPanel>
           )}

           <TerminalPanel title="SIMULATION_PREVIEW" className="p-8">
              <h2 className="text-xl font-bold text-green-400 mb-4">TARGET: {parsedRecipients[0]?.email}</h2>
              {/* Sanitized HTML Preview */}
              <div 
                 className="p-6 bg-white rounded-none border-2 border-green-900 text-black min-h-[300px]"
                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml || '') }} 
              />
           </TerminalPanel>

           <div className="flex justify-between">
              <GlitchButton variant="ghost" onClick={() => setStep(1)}>{'<'} ABORT_RETRY</GlitchButton>
              <GlitchButton onClick={handleSend} disabled={validationErrors.length > 0}>
                 EXECUTE_BATCH_SEQUENCE
              </GlitchButton>
           </div>
        </div>
      )}
    </div>
  );
}

