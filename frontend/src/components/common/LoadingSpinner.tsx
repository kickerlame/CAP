import React from 'react';

export const LoadingSpinner: React.FC<{ text?: string; fullPage?: boolean }> = ({
  text = 'Loading...',
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3 p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-vppt-gold/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-t-vppt-gold border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border border-vppt-gold/40 border-b-vppt-gold animate-spin [animation-duration:1.5s]"></div>
      </div>
      {text && <p className="text-xs uppercase tracking-widest font-cinzel text-vppt-ash/70 animate-pulse">{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="min-h-[60vh] flex items-center justify-center">{content}</div>;
  }

  return content;
};
