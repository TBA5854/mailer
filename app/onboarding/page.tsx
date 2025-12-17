
import TerminalPanel from "@/components/ui/TerminalPanel";
import GlitchButton from "@/components/ui/GlitchButton";
import Link from "next/link";

export default function OnboardingPage() {
  const steps = [
    {
      id: "01",
      title: "ESTABLISH_IDENTITY",
      desc: "Navigate to SENDERS to configure your SMTP credentials. Generate an App Password from your provider (e.g., Gmail) and input it here. The system encrypts this key locally.",
      action: "CONFIGURE_SENDER",
      link: "/senders"
    },
    {
      id: "02",
      title: "CRAFT_PAYLOAD",
      desc: "Proceed to TEMPLATES. Write your HTML content. Use Handlebars syntax {{variable}} for dynamic data injection (e.g., Hello {{name}}).",
      action: "DESIGN_TEMPLATE",
      link: "/templates"
    },
    {
      id: "03",
      title: "INITIATE_SEQUENCE",
      desc: "Go to BATCHES. Select your Sender and Template. Upload your CSV target list. Ensure CSV headers match your template variables (e.g., email, name).",
      action: "CREATE_BATCH",
      link: "/batches"
    },
    {
      id: "04",
      title: "ENGAGE_TRANSMITTER",
      desc: "In Batch Details, review your targets. Click 'ENGAGE_TRANSMITTER' to begin the stream. Monitor the Hit Rate and Retry any failed transmissions.",
      action: "VIEW_STATUS",
      link: "/"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-20 px-4">
       <div className="text-center mb-16 space-y-4">
           <h1 className="text-5xl font-bold font-mono text-green-500 tracking-tighter shimmer-text">
               OPERATIONAL_GUIDE
           </h1>
           <p className="text-green-800 font-mono text-sm max-w-lg mx-auto border-t border-b border-green-900 py-2">
               PROTOCOL_V1.0 // AUTHORIZED_PERSONNEL_ONLY
           </p>
       </div>

       <div className="relative">
           {/* Connecting Line */}
           <div className="absolute left-1/2 top-0 bottom-0 w-px bg-green-900 transform -translate-x-1/2 hidden md:block" />

           <div className="space-y-12">
               {steps.map((step, index) => (
                   <div key={step.id} className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}>
                       
                       {/* Step Number Badge */}
                       <div className="relative z-10 w-16 h-16 bg-black border-2 border-green-500 flex items-center justify-center shrink-0">
                           <span className="font-mono text-xl font-bold text-green-500">{step.id}</span>
                       </div>

                       {/* Content Card */}
                       <div className="w-full md:w-1/2">
                           <TerminalPanel title={step.title} className="h-full group hover:bg-green-900/10 transition-colors">
                               <div className="p-6 space-y-4">
                                   <p className="text-green-400 font-mono text-sm leading-relaxed">
                                       {step.desc}
                                   </p>
                                   <div className="pt-4 border-t border-green-900/50 flex justify-end">
                                       <Link href={step.link}>
                                           <span className="text-xs font-mono text-green-600 group-hover:text-green-400 underline decoration-green-800 underline-offset-4 cursor-pointer">
                                               {'>'} {step.action}
                                           </span>
                                       </Link>
                                   </div>
                               </div>
                           </TerminalPanel>
                       </div>
                   </div>
               ))}
           </div>
       </div>

       <div className="mt-20 text-center">
            <Link href="/">
                <GlitchButton variant="primary">ACKNOWLEDGE & BEGIN</GlitchButton>
            </Link>
       </div>
    </div>
  );
}
