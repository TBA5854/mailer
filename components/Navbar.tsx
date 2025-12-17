'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import GlitchButton from "./ui/GlitchButton";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-black border-b-2 border-green-500">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold font-mono tracking-widest text-green-500 hover:text-white transition uppercase">
          {'>'} _TBA_MAILER_V1_
        </Link>

        {/* Links and Auth */}
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <div className="hidden md:flex gap-8 font-mono text-sm uppercase text-green-500/70">
                <Link href="/senders" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[Senders]</Link>
                <Link href="/templates" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[Templates]</Link>
                <Link href="/batches" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[Batches]</Link>
              </div>
              <span className="text-xs text-green-700 font-mono hidden sm:inline">USR: {session.user?.email}</span>
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
      </div>
    </nav>
  )
}

