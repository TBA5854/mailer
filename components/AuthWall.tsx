'use client';

import { signIn } from "next-auth/react";
import TerminalPanel from "@/components/ui/TerminalPanel";

export default function AuthWall() {
  return (
    <TerminalPanel 
      title="AUTH_WALL" 
      className="max-w-md mx-auto p-10 text-center relative overflow-hidden group cursor-pointer" 
      onClick={() => signIn()}
    >
        <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <h2 className="text-2xl font-bold mb-6 group-hover:text-green-400 transition-colors">ACCESS RESTRICTED</h2>
        <p className="text-green-700 mb-8 font-mono group-hover:text-green-500">IDENTIFICATION REQUIRED FOR ENTRY.</p>
        <div className="inline-block px-4 py-2 border border-red-500 text-red-500 font-mono text-xs animate-pulse group-hover:border-green-500 group-hover:text-green-500 group-hover:animate-none">
            [CLICK_TO_AUTHENTICATE]
        </div>
    </TerminalPanel>
  );
}
