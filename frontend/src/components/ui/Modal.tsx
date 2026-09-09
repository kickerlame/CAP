import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${maxWidths[maxWidth]} bg-vppt-card border border-vppt-gold/30 rounded-lg shadow-2xl relative flex flex-col max-h-[90vh] corner-accent animate-slide-in`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-vppt-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-cinzel font-semibold text-vppt-gold uppercase tracking-wider">{title}</h2>
            {subtitle && <p className="text-xs text-vppt-ash mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-vppt-ash hover:text-vppt-ivory hover:bg-vppt-surface p-1.5 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-vppt-ivory">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-vppt-border/60 bg-vppt-surface/50 flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
