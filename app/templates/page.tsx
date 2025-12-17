'use client';

import { useState, useEffect } from 'react';
import TerminalPanel from '@/components/ui/TerminalPanel';
import GlitchButton from '@/components/ui/GlitchButton';
import DOMPurify from 'isomorphic-dompurify';

interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', subject: '', htmlContent: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates', error);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (template: Template) => {
      setEditingId(template.id);
      setFormData({ name: template.name, subject: template.subject, htmlContent: template.htmlContent });
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
      if (!confirm("CONFIRM_DELETION: This action cannot be undone.")) return;
      
      try {
          const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
          if (res.ok) fetchTemplates();
          else alert("Failed to delete");
      } catch (e) {
          alert("Error deleting");
      }
  };

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const url = '/api/templates';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({ name: '', subject: '', htmlContent: '' });
        setEditingId(null);
        fetchTemplates();
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving template');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-green-500 font-mono animate-pulse">LOADING_MODULES...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold tracking-widest text-green-500 font-mono uppercase">
          // TEMPLATE_CORE
      </h1>

      <TerminalPanel title={editingId ? `EDIT_MODE [${editingId.substring(0,8)}]` : "COMPOSER_V1"} className={`p-8 ${editingId ? 'border-yellow-500' : ''}`}>
        <h2 className={`text-xl font-bold mb-6 ${editingId ? 'text-yellow-500' : 'text-green-400'}`}>
            {editingId ? 'MODIFY_PAYLOAD' : 'NEW_PAYLOAD'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold mb-2 text-green-700">REF_ID (NAME)</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none text-green-400 placeholder-green-900"
                    placeholder="NEWSLETTER_JAN"
                />
             </div>
             <div>
                <label className="block text-sm font-bold mb-2 text-green-700">SUBJECT_HEADER</label>
                <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none text-green-400 placeholder-green-900"
                    placeholder="HELLO {{NAME}}"
                />
             </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-green-700">HTML_BODY</label>
            <textarea
                required
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none font-mono text-sm h-64 text-green-400"
                placeholder="<div class='content'>...</div>"
            />
            <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-green-600">
                    USE <code className="text-white">{'{{VAR}}'}</code> FOR INJECTION.
                </p>
                {formData.htmlContent && (
                    <button type="button" onClick={() => setPreviewHtml(formData.htmlContent)} className="text-xs text-blue-500 hover:text-blue-400 underline decoration-blue-800">
                        [PREVIEW_RENDER]
                    </button>
                )}
            </div>
          </div>
          <div className="flex gap-4">
            <GlitchButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'SAVING...' : editingId ? 'OVERWRITE_DATA' : 'COMMIT_TEMPLATE'}
            </GlitchButton>
            {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', subject: '', htmlContent: '' }); }} className="text-green-600 hover:text-green-400 font-mono text-sm uppercase">
                    [CANCEL]
                </button>
            )}
          </div>
        </form>
      </TerminalPanel>
      
      {previewHtml && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewHtml(null)}>
            <TerminalPanel title="RENDER_PREVIEW" className="max-w-3xl w-full max-h-[80vh] overflow-y-auto bg-black border-2 border-primary" onClick={(e: any) => e.stopPropagation()}>
                 <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-4 rounded" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }} />
                 <div className="mt-4 text-right">
                    <GlitchButton onClick={() => setPreviewHtml(null)}>CLOSE_VIEW</GlitchButton>
                 </div>
            </TerminalPanel>
        </div>
      )}

      <div className="grid gap-4">
        {templates.map((template) => (
          <TerminalPanel key={template.id} title={`ID:${template.id.substring(0,8)}`} className="p-6 cursor-default hover:bg-green-900/5 transition">
             <div className="flex justify-between items-start">
                <div>
                   <h3 className="font-bold text-lg text-green-400">{template.name}</h3>
                   <p className="text-green-700 text-sm mt-1">RE: <span className="text-green-600 italic">{template.subject}</span></p>
                </div>
                <div className="flex space-x-4 items-center font-mono text-xs">
                    <button onClick={() => setPreviewHtml(template.htmlContent)} className="text-blue-500 hover:text-blue-400">
                        [PREVIEW]
                    </button>
                    <button onClick={() => handleEdit(template)} className="text-yellow-600 hover:text-yellow-400">
                        [EDIT]
                    </button>
                    <button onClick={() => handleDelete(template.id)} className="text-red-700 hover:text-red-500">
                        [DELETE]
                    </button>
                </div>
             </div>
          </TerminalPanel>
        ))}
      </div>
    </div>
  );
}

