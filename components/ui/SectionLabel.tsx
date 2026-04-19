interface SectionLabelProps {
  children: string;
  className?: string;
}

export default function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <p className={`text-[10px] text-ar-text-muted uppercase tracking-widest mb-2 ${className}`}>
      {children}
    </p>
  );
}
