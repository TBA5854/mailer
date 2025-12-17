
import TerminalPanel from "@/components/ui/TerminalPanel";
import GlitchButton from "@/components/ui/GlitchButton";
import Link from "next/link";

export default function FAQPage() {
    return (
        <div className="max-w-4xl mx-auto py-20 relative z-10 px-4">
             {/* Header Glitch Effect */}
            <h1 className="text-4xl font-bold font-mono text-center mb-12 relative group cursor-default">
                <span className="absolute -inset-1 blur-sm bg-green-500/30 group-hover:bg-green-500/60 transition duration-500 rounded-lg"></span>
                <span className="relative text-green-500 tracking-[0.2em] group-hover:tracking-[0.3em] transition-all duration-300">
                    KNOWLEDGE_BASE
                </span>
            </h1>
            
            <div className="space-y-6">
                <TerminalPanel title="QUERY_01">
                    <div className="p-4 font-mono">
                        <h3 className="text-green-400 font-bold text-lg mb-2 flex items-start">
                            <span className="mr-2 text-green-600">{'>'}</span> 
                            How to create a Google App Password?
                        </h3>
                        <div className="pl-6 border-l-2 border-green-900 ml-1 py-1 text-green-300/80 text-sm leading-relaxed tracking-wide">
                            <p className="mb-2">
                                Since Google no longer allows "Less Secure Apps" for some accounts, you must use an App Password to send emails via SMTP.
                            </p>
                            <ol className="list-decimal pl-5 space-y-1 text-green-400">
                                <li>Go to your <strong>Google Account</strong> settings.</li>
                                <li>Select <strong>Security</strong> from the left navigation panel.</li>
                                <li>Under "Signing in to Google", select <strong>2-Step Verification</strong>. (Enable it if not already enabled).</li>
                                <li>At the bottom, select <strong>App passwords</strong>.</li>
                                <li>Generate a new password for "Mail" and copy the 16-character key.</li>
                            </ol>
                        </div>
                    </div>
                </TerminalPanel>

                <TerminalPanel title="QUERY_02">
                     <div className="p-4 font-mono">
                        <h3 className="text-green-400 font-bold text-lg mb-2 flex items-start">
                            <span className="mr-2 text-green-600">{'>'}</span> 
                            How to ensure my emails don't go to Spam?
                        </h3>
                        <div className="pl-6 border-l-2 border-green-900 ml-1 py-1 text-green-300/80 text-sm leading-relaxed tracking-wide">
                             <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Respect Rate Limits:</strong> Personal Gmail limits are strict (500/day). Workspace allows more.</li>
                                <li><strong>Warm Up:</strong> Start with small batches (50-100) and increase gradually.</li>
                                <li><strong>Clean Lists:</strong> Verify emails to avoid bounces. High bounce rates trigger spam filters.</li>
                                <li><strong>Content:</strong> Avoid aggressive sales language or misleading subjects.</li>
                             </ul>
                        </div>
                    </div>
                </TerminalPanel>
                
                <TerminalPanel title="QUERY_03">
                    <div className="p-4 font-mono">
                        <h3 className="text-green-400 font-bold text-lg mb-2 flex items-start">
                            <span className="mr-2 text-green-600">{'>'}</span> 
                            Is my App Password secure?
                        </h3>
                         <div className="pl-6 border-l-2 border-green-900 ml-1 py-1 text-green-300/80 text-sm leading-relaxed tracking-wide">
                            <p>
                                Yes. We encrypt your App Password using <strong>AES-256-CBC</strong> encryption before storing it. The decryption key resides in the server environment, never the database.
                            </p>
                        </div>
                    </div>
                </TerminalPanel>
            </div>

            <div className="mt-12 text-center">
                <Link href="/">
                    <GlitchButton variant="ghost">{'<<'} RETURN_TO_BASE</GlitchButton>
                </Link>
            </div>
        </div>
    );
}
