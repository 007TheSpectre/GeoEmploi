import { useState } from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const Alert = ({
  type = 'none',
  size = 'md',
  title,
  headingLevel = 'h3',
  description,
  children,
  dismissible = false,
  onClose,
  showIcon = true,
  icon: customIcon,
  closeButtonTitle = 'Masquer le message',
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible)
    return null;

  const handleClose = (e) => {
    setIsVisible(false);
    if (onClose) {
      onClose(e);
    }
  };

  const typeConfigs = {
    none: {
      typeClass: '',
      containerStyle: 'bg-slate-100/90 border-blue text-slate-800',
      titleStyle: 'text-slate-900',
      iconStyle: 'text-blue',
      IconComponent: Info,
    },
    info: {
      typeClass: 'fr-alert--info',
      containerStyle: 'bg-blue-50 border-blue text-blue-900',
      titleStyle: 'text-blue-900 font-semibold',
      iconStyle: 'text-blue',
      IconComponent: Info,
    },
    warning: {
      typeClass: 'fr-alert--warning',
      containerStyle: 'bg-[#fff4e5] border-[#b34000] text-[#6d2500]',
      titleStyle: 'text-[#b34000]',
      iconStyle: 'text-[#b34000]',
      IconComponent: AlertTriangle,
    },
    error: {
      typeClass: 'fr-alert--error',
      containerStyle: 'bg-[#ffe9e9] border-[#ce0500] text-[#ce0500]',
      titleStyle: 'text-[#ce0500]',
      iconStyle: 'text-[#ce0500]',
      IconComponent: AlertCircle,
    },
    success: {
      typeClass: 'fr-alert--success',
      containerStyle: 'bg-[#e6f5e9] border-[#18753c] text-[#18753c]',
      titleStyle: 'text-[#18753c]',
      iconStyle: 'text-[#18753c]',
      IconComponent: CheckCircle2,
    },
  };

  const currentConfig = typeConfigs[type] || typeConfigs.none;
  const HeadingTag = headingLevel || 'h3';

  const isSmall = size === 'sm';
  const sizeClass = isSmall ? 'fr-alert--sm' : '';

  const IconToRender = customIcon ? null : currentConfig.IconComponent;
  const iconSize = isSmall ? 18 : 22;
  const messageContent = description || children;

  return (
    <div
      className={`fr-alert ${currentConfig.typeClass} ${sizeClass} relative flex items-start gap-3.5 border-l-4 rounded-r-xs transition-all ${
        isSmall ? 'p-3 pl-3.5 text-sm' : 'p-4 pl-4 text-base'
      } ${currentConfig.containerStyle} ${className}`}
      role="alert"
      {...props}
    >
      {showIcon && (
        <div className={`shrink-0 ${isSmall ? 'mt-0.5' : 'mt-0.5'} ${currentConfig.iconStyle}`}>
          {customIcon ? (
            customIcon
          ) : (
            <IconToRender size={iconSize} className="shrink-0" aria-hidden="true" />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <HeadingTag
            className={`fr-alert__title font-bold leading-snug ${
              isSmall ? 'text-sm mb-0.5' : 'text-base sm:text-lg mb-1'
            } ${currentConfig.titleStyle}`}
          >
            {title}
          </HeadingTag>
        )}
        {messageContent && (
          <div
            className={`fr-alert__text leading-relaxed text-slate-800 ${
              isSmall ? 'text-xs' : 'text-sm'
            }`}
          >
            {typeof messageContent === 'string' ? <p>{messageContent}</p> : messageContent}
          </div>
        )}
      </div>

      {(dismissible || onClose) && (
        <button
          type="button"
          title={closeButtonTitle}
          aria-label={closeButtonTitle}
          onClick={handleClose}
          className="fr-btn--close fr-btn fr-alert__close shrink-0 p-1 rounded-xs opacity-75 hover:opacity-100 hover:bg-black/10 active:bg-black/15 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-current ml-auto"
        >
          <X size={isSmall ? 16 : 18} aria-hidden="true" />
          <span className="sr-only">{closeButtonTitle}</span>
        </button>
      )}
    </div>
  );
};
