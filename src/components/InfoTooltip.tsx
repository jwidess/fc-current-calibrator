import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  label: string;
  children: ReactNode;
  iconClassName?: string;
  wrapperClassName?: string;
  tooltipClassName?: string;
}

export default function InfoTooltip({
  label,
  children,
  iconClassName,
  wrapperClassName,
  tooltipClassName,
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={cn('relative group', wrapperClassName)}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        aria-label={label}
        aria-expanded={isOpen}
      >
        <HelpCircle className={cn('w-3.5 h-3.5', iconClassName)} />
      </button>

      <div
        className={cn(
          'transition-all z-10 shadow-lg',
          isOpen
            ? 'opacity-100 visible pointer-events-auto'
            : 'opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible',
          tooltipClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}