'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TerminalPanel from '@/components/ui/TerminalPanel';
import GlitchButton from '@/components/ui/GlitchButton';

interface Sender {
  id: string;
  email: string;
  label?: string;
}

export default function SendersPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', label: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSenders();
  }, []);

  const fetchSenders = async () => {
    try {
      const res = await fetch('/api/senders');
      if (res.ok) {
        const data = await res.json();
        setSenders(data);
      }
    } catch (error) {
      console.error('Failed to fetch senders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ email: '', password: '', label: '' });
        fetchSenders();
      } else {
        alert('Failed to save sender');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving sender');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("CONFIRM_DELETION: This invalidates the app password immediately.")) return;

      try {
          const res = await fetch(`/api/senders?id=${id}`, { method: 'DELETE' });
          if (res.ok) fetchSenders();
          else alert("Failed to delete");
      } catch (e) {
          alert("Error deleting");
      }
  };

  if (loading) return <div className="p-8 text-center text-green-500 font-mono animate-pulse">INITIALIZING_DB_CONNECTION...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-widest text-green-500 font-mono uppercase">
            // SENDERS_DB
        </h1>
      </div>

      <TerminalPanel title="ADD_NEW_ENTRY" className="p-8">
        <h2 className="text-xl font-bold mb-6 text-green-400">INPUT CREDENTIALS</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-green-700">DISPLAY_NAME</label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none text-green-400 placeholder-green-900"
              placeholder="MARKETING_V1"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-green-700">GMAIL_ADDR</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none text-green-400 placeholder-green-900"
              placeholder="user@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-green-700">APP_PASSWORD_TOKEN</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-black border-2 border-green-800 rounded-none focus:border-green-400 outline-none text-green-400 placeholder-green-900"
              placeholder="xxxx xxxx xxxx xxxx"
            />
          </div>
          <GlitchButton type="submit" disabled={isSubmitting}>
             {isSubmitting ? 'ENCRYPTING...' : 'WRITE_TO_DB'}
          </GlitchButton>
        </form>
      </TerminalPanel>

      <div className="grid gap-4">
        {senders.map((sender) => (
          <TerminalPanel key={sender.id} title={`ID:${sender.id.substring(0,6)}`} className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-green-400">{sender.label}</h3>
                <p className="text-green-700 font-mono text-sm">{sender.email}</p>
              </div>
              <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-green-900/20 text-green-500 text-xs border border-green-500/50 font-mono">
                      [ENCRYPTED]
                  </div>
                  <button onClick={() => handleDelete(sender.id)} className="text-red-700 hover:text-red-500 font-mono text-xs">
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

