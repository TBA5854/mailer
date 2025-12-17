'use client';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlitchButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export default function GlitchButton({ children, className, variant = 'primary', ...props }: GlitchButtonProps) {
  
  const colors = {
    primary: "border-green-500 text-green-500 hover:bg-green-500 hover:text-black",
    danger: "border-red-500 text-red-500 hover:bg-red-500 hover:text-black",
    ghost: "border-transparent text-gray-500 hover:text-green-500"
  };

  const disabledStyles = "opacity-50 cursor-not-allowed grayscale border-gray-600 text-gray-600 hover:bg-transparent hover:text-gray-600";

  return (
    <motion.button
      whileHover={props.disabled ? {} : { scale: 1.05 }}
      whileTap={props.disabled ? {} : { scale: 0.95 }}
      className={`relative px-6 py-2 border-2 font-mono uppercase tracking-widest transition-colors duration-100 group ${props.disabled ? disabledStyles : colors[variant]} ${className || ''}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2 justify-center font-bold">
        {children}
      </span>
      
      {/* Hard Glitch Rectangles on Hover */}
      <div className="absolute top-0 left-0 w-full h-1 bg-current opacity-0 group-hover:opacity-100 animate-pulse" />
    </motion.button>
  );
}

