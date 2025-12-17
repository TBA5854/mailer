'use client';
import { motion } from 'framer-motion';

interface TerminalPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  delay?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export default function TerminalPanel({ children, className, title = "TERMINAL_WINDOW", delay = 0, onClick }: TerminalPanelProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay }}
      className={`relative bg-black border border-green-500 ${className || ''}`}
      onClick={onClick}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-green-500/10 border-b border-green-500">
          <span className="text-xs font-mono text-green-500 uppercase tracking-widest">
              [{title}]
          </span>
          <div className="flex gap-1">
             <div className="w-2 h-2 bg-green-500"></div>
             <div className="w-2 h-2 border border-green-500"></div>
          </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Decorative Corner Lines */}
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500 pointer-events-none" />
    </motion.div>
  );
}
