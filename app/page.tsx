import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import TerminalPanel from "@/components/ui/TerminalPanel";
import GlitchButton from "@/components/ui/GlitchButton";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="max-w-6xl mx-auto space-y-12 text-green-500">
      {/* Hero Section */}
      <section className="text-center py-20 relative">
        <h1 className="text-6xl font-black tracking-widest mb-4 animate-pulse">
            _CYBER_MAILER_
        </h1>
        <p className="text-xl text-green-700 max-w-2xl mx-auto font-mono uppercase">
            [SECURE_CHANNEL_ESTABLISHED] <br/>
            STATUS: <span className="text-green-400 blink">ONLINE</span>
        </p>
      </section>

      {session ? (
        <div className="grid md:grid-cols-3 gap-8">
            <Link href="/senders" className="block transform hover:translate-y-[-4px] transition-transform">
               <TerminalPanel title="PROTO_SEND" className="p-8 h-full flex flex-col items-center text-center">
                  <div className="text-5xl mb-4 font-mono text-green-600 opacity-50">[KEY]</div>
                  <h2 className="text-2xl font-bold mb-2">SENDERS</h2>
                  <p className="text-green-700 font-mono text-sm">SMTP_GATEWAY_CONFIG</p>
               </TerminalPanel>
            </Link>
            
            <Link href="/templates" className="block transform hover:translate-y-[-4px] transition-transform">
               <TerminalPanel title="PROTO_TMPL" className="p-8 h-full flex flex-col items-center text-center" delay={0.1}>
                  <div className="text-5xl mb-4 font-mono text-green-600 opacity-50">[DOC]</div>
                  <h2 className="text-2xl font-bold mb-2">TEMPLATES</h2>
                  <p className="text-green-700 font-mono text-sm">HTML_PAYLOAD_DESIGN</p>
               </TerminalPanel>
            </Link>

            <Link href="/batches" className="block transform hover:translate-y-[-4px] transition-transform">
               <TerminalPanel title="PROTO_EXEC" className="p-8 h-full flex flex-col items-center text-center" delay={0.2}>
                  <div className="text-5xl mb-4 font-mono text-green-600 opacity-50">[EXE]</div>
                  <h2 className="text-2xl font-bold mb-2">BATCH_EXEC</h2>
                  <p className="text-green-700 font-mono text-sm">MASS_DISTRIBUTION_SEQ</p>
               </TerminalPanel>
            </Link>
        </div>
      ) : (
        <TerminalPanel title="AUTH_WALL" className="max-w-md mx-auto p-10 text-center">
            <h2 className="text-2xl font-bold mb-6">ACCESS RESTRICTED</h2>
            <p className="text-green-700 mb-8 font-mono">IDENTIFICATION REQUIRED FOR ENTRY.</p>
            <div className="inline-block px-4 py-2 border border-red-500 text-red-500 font-mono text-xs animate-pulse">
                [ACCESS_DENIED]
            </div>
        </TerminalPanel>
      )}

      {session && (
        <div className="space-y-8">
            <RecentBatches />
            <div className="flex justify-center gap-4">
                <Link href="/onboarding">
                    <GlitchButton variant="ghost">OPERATIONAL_GUIDE</GlitchButton>
                </Link>
                <Link href="/faq">
                    <GlitchButton variant="ghost">KNOWLEDGE_BASE [FAQ]</GlitchButton>
                </Link>
            </div>
        </div>
      )}
    </div>
  );
}

import { prisma } from "@/lib/prisma";

async function RecentBatches() {
  const batches = await prisma.batch.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: true,
      template: true,
    }
  });

  if (batches.length === 0) return null;

  return (
    <TerminalPanel title="RECENT_TRANSMISSIONS" className="overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-green-700 border-b border-green-900 bg-green-900/10 tracking-widest">
            <div className="col-span-3">TIMESTAMP</div>
            <div className="col-span-2">PROTOCOL (SENDER)</div>
            <div className="col-span-4">PAYLOAD (TEMPLATE)</div>
            <div className="col-span-2">STATUS</div>
            <div className="col-span-1">LINK</div>
        </div>
        <div className="divide-y divide-green-900/30">
            {batches.map(batch => (
                <div key={batch.id} className="grid grid-cols-12 gap-4 p-4 text-sm font-mono hover:bg-green-900/10 transition group">
                    <div className="col-span-3 text-green-600">
                        {new Date(batch.createdAt).toLocaleString()}
                    </div>
                    <div className="col-span-2 text-green-400 truncate">
                        {batch.sender?.label || 'UNKNOWN'}
                    </div>
                    <div className="col-span-4 text-green-300 truncate">
                        {batch.template?.name || 'UNKNOWN'}
                    </div>
                    <div className="col-span-2">
                        <span className={`
                             ${batch.status === 'COMPLETED' ? 'text-green-500' : 
                               batch.status === 'FAILED' ? 'text-red-500' : 'text-yellow-500'}
                        `}>
                            [{batch.status}]
                        </span>
                        <span className="text-xs text-green-800 ml-2">
                            {batch.successCount}/{batch.totalRecipients}
                        </span>
                    </div>
                    <div className="col-span-1 text-right">
                        <Link href={`/batches/${batch.id}`} className="text-green-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition">
                            {'>'} VIEW
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    </TerminalPanel>
  );
}

function FAQSection() {
    const FAQs = [
        { q: "WHAT IF AN AGENT IS COMPROMISED?", a: "SYSTEM AUTOMATICALLY FLAGGED & REVOKES CREDENTIALS UPON DETECTION." },
        { q: "MAXIMUM TRANSMISSION RATE?", a: "SMTP GATEWAYS THROTTLE AT 500 MSGS/HR PER NODE. DISTRIBUTED NETWORKS BYPASS THIS LIMIT." },
        { q: "DATA RETENTION POLICY?", a: "LOGS PURGED AFTER 72 HOURS. NO PERMANENT RECORD KEPT ON EDGE NODES." },
        { q: "MAIL NOT FOUND ERROR?", a: "TARGET ADDRESS INVALID OR BLOCKED (550). CHECK RECIPIENT LOG FOR TRACE." }
    ];

    return (
        <TerminalPanel title="SYSTEM_FAQ">
            <div className="space-y-4 font-mono">
                {FAQs.map((faq, i) => (
                    <div key={i} className="border-l-2 border-green-900 pl-4 py-1">
                        <h3 className="text-green-400 font-bold text-sm mb-1">Q: {faq.q}</h3>
                        <p className="text-green-700 text-xs">A: {faq.a}</p>
                    </div>
                ))}
            </div>
        </TerminalPanel>
    );
}
