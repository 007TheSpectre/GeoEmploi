import { useId } from 'react';

export const Input = ({
  id: customId,
  name,
  type = 'text',
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
  button,
  buttonPosition = 'addon',
  multiline = false,
  rows = 4,
  spellCheck,
  autoCapitalize,
  autoComplete,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = customId || `input-${generatedId}`;
  const messagesId = `${inputId}-messages`;

  const isError = Boolean(error);
  const isValid = Boolean(success) && !isError;

  const groupStateClass = isError
    ? 'fr-input-group--error'
    : isValid
    ? 'fr-input-group--valid'
    : disabled
    ? 'fr-input-group--disabled opacity-65 cursor-not-allowed'
    : '';

  const wrapButtonClass = button
    ? buttonPosition === 'action'
      ? 'fr-input-wrap--action gap-2'
      : 'fr-input-wrap--addon [&>input]:rounded-r-none [&>textarea]:rounded-r-none [&>button]:rounded-l-none [&>button]:border-l-0'
    : '';

  const InputElement = multiline ? 'textarea' : 'input';

  return (
    <div className={`fr-input-group flex flex-col gap-1.5 w-full ${groupStateClass} ${className}`}>
      {label && (
        <label className="fr-label block font-semibold text-slate-800 text-sm" htmlFor={inputId}>
          {label}
          {required && <span className="text-red-600 ml-1" title="Champ obligatoire">*</span>}
          {hintText && <span className="fr-hint-text block font-normal text-xs text-slate-500 mt-0.5">{hintText}</span>}
        </label>
      )}

      <div className={`fr-input-wrap relative flex items-stretch w-full ${wrapButtonClass}`}>
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none shrink-0 z-10">
            {icon}
          </span>
        )}

        <InputElement
          id={inputId}
          name={name}
          type={multiline ? undefined : type}
          rows={multiline ? rows : undefined}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-describedby={messagesId}
          aria-required={required}
          spellCheck={spellCheck}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          className={`fr-input w-full bg-[#eeeeee] focus:bg-white text-slate-900 text-sm px-3.5 py-2.5 rounded-t-xs border-b-2 transition-all shadow-xs focus:outline-hidden disabled:bg-slate-200 disabled:border-slate-400 disabled:cursor-not-allowed ${
            icon ? 'pl-10' : ''
          } ${
            isError
              ? 'border-red-600 bg-red-50/40 focus:border-red-600 text-red-900'
              : isValid
              ? 'border-emerald-600 bg-emerald-50/40 focus:border-emerald-600'
              : 'border-slate-400 focus:border-blue'
          } ${inputClassName}`}
          {...props}
        />

        {button && <div className="shrink-0 flex items-stretch">{button}</div>}
      </div>

      {(error || success || info) && (
        <div className="fr-messages-group space-y-1 my-0.5 text-xs" id={messagesId} aria-live="polite">
          {error && (
            <p className="fr-message fr-message--error text-red-600 font-medium flex items-center gap-1" id={`${inputId}-message-error`}>
              <span>•</span> {error}
            </p>
          )}

          {success && !error && (
            <p className="fr-message fr-message--valid text-emerald-700 font-medium flex items-center gap-1" id={`${inputId}-message-valid`}>
              <span>✓</span> {success}
            </p>
          )}

          {info && !error && !success && (
            <p className="fr-message fr-message--info text-slate-600 flex items-center gap-1" id={`${inputId}-message-info`}>
              <span>•</span> {info}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
