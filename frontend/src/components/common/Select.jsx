import { useId } from 'react';

export const Select = ({
  id: customId,
  name,
  label,
  hintText,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  error,
  success,
  info,
  icon,
  options = [],
  children,
  className = '',
  selectClassName = '',
  ...props
}) => {
  const generatedId = useId();
  const selectId = customId || `select-${generatedId}`;
  const messagesId = `${selectId}-messages`;

  const isError = Boolean(error);
  const isValid = Boolean(success) && !isError;

  const groupStateClass = isError
    ? 'fr-select-group--error'
    : isValid
    ? 'fr-select-group--valid'
    : disabled
    ? 'fr-select-group--disabled opacity-65 cursor-not-allowed'
    : '';

  return (
    <div className={`fr-select-group flex flex-col gap-1.5 w-full ${groupStateClass} ${className}`}>
      {label && (
        <label className="fr-label block font-semibold text-slate-800 text-sm" htmlFor={selectId}>
          {label}
          {required && <span className="text-red-600 ml-1" title="Champ obligatoire">*</span>}
          {hintText && <span className="fr-hint-text block font-normal text-xs text-slate-500 mt-0.5">{hintText}</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none shrink-0 z-10">
            {icon}
          </span>
        )}

        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-describedby={messagesId}
          aria-required={required}
          className={`fr-select w-full bg-[#eeeeee] focus:bg-white text-slate-900 text-sm px-3.5 py-2.5 rounded-t-xs border-b-2 transition-all shadow-xs focus:outline-hidden disabled:bg-slate-200 disabled:border-slate-400 disabled:cursor-not-allowed cursor-pointer ${
            icon ? 'pl-10' : ''
          } ${
            isError
              ? 'border-red-600 bg-red-50/40 focus:border-red-600 text-red-900'
              : isValid
              ? 'border-emerald-600 bg-emerald-50/40 focus:border-emerald-600'
              : 'border-slate-400 focus:border-blue'
          } ${selectClassName}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options && options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      </div>

      {(error || success || info) && (
        <div className="fr-messages-group space-y-1 my-0.5 text-xs" id={messagesId} aria-live="polite">
          {error && (
            <p className="fr-message fr-message--error text-red-600 font-medium flex items-center gap-1" id={`${selectId}-message-error`}>
              <span>•</span> {error}
            </p>
          )}

          {success && !error && (
            <p className="fr-message fr-message--valid text-emerald-700 font-medium flex items-center gap-1" id={`${selectId}-message-valid`}>
              <span>✓</span> {success}
            </p>
          )}

          {info && !error && !success && (
            <p className="fr-message fr-message--info text-slate-600 flex items-center gap-1" id={`${selectId}-message-info`}>
              <span>•</span> {info}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
