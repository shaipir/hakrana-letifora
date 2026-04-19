'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  children: ReactNode;
}

export default function GlowButton({
  variant = 'primary',
  size = 'md',
  glow = true,
  children,
  className = '',
  disabled,
  ...props
}: GlowButtonProps) {
  const base = 'relative inline-flex items-center justify-center gap-1.5 font-medium rounded-lg border transition-all duration-200 select-none overflow-hidden group';

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary: [
      'bg-ar-accent/10 border-ar-accent/40 text-ar-accent',
      'hover:bg-ar-accent/20 hover:border-ar-accent/70',
      glow ? 'hover:shadow-[0_0_16px_rgba(0,229,255,0.35)]' : '',
      'active:scale-[0.97]',
    ].join(' '),
    ghost: [
      'bg-transparent border-ar-border text-ar-text-muted',
      'hover:border-ar-border-subtle hover:text-ar-text hover:bg-ar-surface/40',
      'active:scale-[0.97]',
    ].join(' '),
    danger: [
      'bg-red-500/10 border-red-500/30 text-red-400',
      'hover:bg-red-500/20 hover:border-red-500/50',
      'active:scale-[0.97]',
    ].join(' '),
  };

  return (
    <button
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
      {...props}
    >
      {/* Shimmer sweep on hover */}
      <span
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        aria-hidden
      />
      {children}
    </button>
  );
}
