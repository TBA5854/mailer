import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import TerminalPanel from "@/components/ui/TerminalPanel";
import GlitchButton from "@/components/ui/GlitchButton";
import AuthWall from "@/components/AuthWall";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="max-w-6xl mx-auto space-y-12 text-green-500">
      {/* Hero Section */}
      <section className="text-center py-20 relative">
        <h1 className="text-6xl font-black tracking-widest mb-4 animate-pulse">
            _TBA_MAILER_
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
        <AuthWall />
      )}

      {session && (
        <div className="space-y-8">
            <RecentBatches userId={session.user.id} />
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

async function RecentBatches({ userId }: { userId: string }) {
  const batches = await prisma.batch.findMany({
    where: { ownerId: userId },
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
        <div className="overflow-x-auto">
            <div className="min-w-[800px]">
                <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-green-700 border-b border-green-900 bg-green-900/10 tracking-widest">
                    <div className="col-span-3">TIMESTAMP</div>
                    <div className="col-span-2">PROTOCOL (SENDER)</div>
                    <div className="col-span-4">PAYLOAD (TEMPLATE)</div>
                    <div className="col-span-2">STATUS</div>
                    <div className="col-span-1">LINK</div>
                </div>
                <div className="divide-y divide-green-900">
                    {batches.map((batch) => (
                        <div key={batch.id} className="grid grid-cols-12 gap-4 p-4 text-sm font-mono hover:bg-green-900/5 transition-colors group">
                            <div className="col-span-3 text-green-600">
                                {new Date(batch.createdAt).toLocaleDateString()} <span className="opacity-50">{new Date(batch.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="col-span-2 text-green-400 group-hover:text-green-300">
                                {batch.sender?.label}
                            </div>
                            <div className="col-span-4 text-green-500 truncate group-hover:text-green-400">
                                {batch.template?.name}
                            </div>
                            <div className="col-span-2">
                                <span className={`
                                    ${batch.status === 'COMPLETED' ? 'text-green-500' : ''}
                                    ${batch.status === 'PENDING' ? 'text-yellow-500 animate-pulse' : ''}
                                    ${batch.status === 'FAILED' ? 'text-red-500' : ''}
                                `}>
                                    [{batch.status}]
                                </span>
                            </div>
                            <div className="col-span-1 text-right">
                                <Link href={`/batches/${batch.id}`} className="text-green-700 hover:text-green-400 hover:underline">
                                    {'>'} VIEW
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </TerminalPanel>
  );
}
