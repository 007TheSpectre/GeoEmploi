import { ChevronDown, ChevronUp } from 'lucide-react';

export const FaqAccordionItem = ({
  id,
  question,
  answer,
  isOpen,
  onToggle,
  className = '',
}) => {
  const buttonId = id ? `faq-btn-${id}` : undefined;
  const panelId = id ? `faq-panel-${id}` : undefined;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/20 ${className}`}
    >
      <button
        type="button"
        id={buttonId}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-inset focus-visible:bg-blue-50/40"
      >
        <span className="font-bold text-slate-900 text-sm sm:text-base">
          {question}
        </span>
        <span className="text-slate-400 shrink-0">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="px-4 pb-5 sm:px-5 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/40"
        >
          {answer}
        </div>
      )}
    </div>
  );
};

