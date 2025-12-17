'use client';

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import GlitchButton from "./ui/GlitchButton";

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-black border-b-2 border-green-500">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center bg-black relative z-50">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold font-mono tracking-widest text-green-500 hover:text-white transition uppercase">
          {'>'} _TBA_MAILER_V1_
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <>
              <div className="flex gap-8 font-mono text-sm uppercase text-green-500/70">
                <Link href="/senders" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[Senders]</Link>
                <Link href="/templates" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[Templates]</Link>
                <Link href="/batches" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[Batches]</Link>
              </div>
              <span className="text-xs text-green-700 font-mono">USR: {session.user?.email}</span>
              <GlitchButton variant="ghost" onClick={() => signOut()} className="text-xs border border-green-900 text-green-700 hover:border-green-500 hover:bg-green-500/10 hover:text-green-400">
                LOGOUT
              </GlitchButton>
            </>
          ) : (
            <GlitchButton onClick={() => signIn('google')}>
               INIT_SESSION
            </GlitchButton>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-green-500 p-2">
                {isOpen ? '[X]' : '[MENU]'}
            </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-black border-b border-green-900 p-4 space-y-4 shadow-2xl z-40 animate-in slide-in-from-top-2">
           {session ? (
            <div className="flex flex-col gap-4 font-mono text-sm uppercase text-green-500">
                <Link href="/senders" onClick={() => setIsOpen(false)} className="py-2 border-b border-green-900 hover:bg-green-900/10">[Senders]</Link>
                <Link href="/templates" onClick={() => setIsOpen(false)} className="py-2 border-b border-green-900 hover:bg-green-900/10">[Templates]</Link>
                <Link href="/batches" onClick={() => setIsOpen(false)} className="py-2 border-b border-green-900 hover:bg-green-900/10">[Batches]</Link>
                <div className="pt-2 flex justify-between items-center">
                    <span className="text-xs text-green-700 normal-case">{session.user?.email}</span>
                    <button onClick={() => signOut()} className="text-red-500 text-xs hover:underline">[LOGOUT]</button>
                </div>
            </div>
           ) : (
             <GlitchButton onClick={() => signIn('google')} className="w-full">
               INIT_SESSION
            </GlitchButton>
           )}
        </div>
      )}
    </nav>
  )
}

