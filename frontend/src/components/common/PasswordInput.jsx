import { useState, useId } from 'react';

export const PasswordInput = ({
  id: customId,
  name = 'password',
  label = 'Mot de passe',
  hintText,
  value,
  onChange,
  autocomplete = 'current-password',
  required = false,
  placeholder,
  error,
  success,
  messages = [],
  showCheckboxLabel = 'Afficher',
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = customId || `password-input-${generatedId}`;
  const messagesId = `${inputId}-messages`;
  const checkboxId = `${inputId}-show`;

  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(error) || messages.some((m) => m.state === 'error' || m.isValid === false);
  const hasSuccess = Boolean(success) && !hasError;

  return (
    <div className={`fr-password flex flex-col gap-1.5 w-full ${className}`}>
      <label className="fr-password__label fr-label block font-semibold text-slate-800 text-sm" htmlFor={inputId}>
        {label}
        {required && <span className="text-red-600 ml-1" title="Champ obligatoire">*</span>}
        {hintText && <span className="fr-hint-text block font-normal text-xs text-slate-500 mt-0.5">{hintText}</span>}
      </label>

      <div className="fr-input-wrap relative w-full">
        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoCapitalize="off"
          autoCorrect="off"
          aria-describedby={messagesId}
          aria-required={required}
          autoComplete={autocomplete}
          placeholder={placeholder}
          className={`fr-password__input fr-input w-full bg-[#eeeeee] focus:bg-white text-slate-900 text-sm px-3.5 py-2.5 rounded-t-xs border-b-2 transition-all shadow-xs focus:outline-hidden ${
            hasError
              ? 'border-red-600 bg-red-50/40 focus:border-red-600'
              : hasSuccess
              ? 'border-emerald-600 bg-emerald-50/40 focus:border-emerald-600'
              : 'border-slate-400 focus:border-blue'
          }`}
          {...props}
        />
      </div>
      <div className="fr-messages-group space-y-1 my-1 text-xs" id={messagesId} aria-live="polite">
        {error && (
          <p className="fr-message fr-message--error text-red-600 font-medium flex items-center gap-1">
            <span>•</span> {error}
          </p>
        )}

        {success && !error && (
          <p className="fr-message fr-message--valid text-emerald-700 font-medium flex items-center gap-1">
            <span>✓</span> {success}
          </p>
        )}

        {messages.map((msg, index) => {
          const isMsgValid = msg.state === 'valid' || msg.isValid === true;
          const isMsgError = msg.state === 'error' || msg.isValid === false;

          let msgClass = 'fr-message fr-message--info text-slate-600';
          let symbol = '•';

          if (isMsgValid) {
            msgClass = 'fr-message fr-message--valid text-emerald-700 font-medium';
            symbol = '✓';
          } else if (isMsgError) {
            msgClass = 'fr-message fr-message--error text-red-600 font-medium';
            symbol = '✕';
          }

          return (
            <p
              key={index}
              className={`${msgClass} flex items-center gap-1.5 leading-tight`}
              data-fr-valid={isMsgValid ? 'validé' : undefined}
              data-fr-error={isMsgError ? 'en erreur' : undefined}
            >
              <span className="shrink-0">{symbol}</span>
              <span>{msg.text}</span>
            </p>
          );
        })}
      </div>

      <div className="fr-password__checkbox fr-checkbox-group fr-checkbox-group--sm flex items-center gap-2 mt-0.5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          aria-label="Afficher le mot de passe"
          className="h-4 w-4 rounded-xs border-slate-400 text-blue focus:ring-blue cursor-pointer"
        />
        <label className="fr-label text-xs text-slate-700 font-medium cursor-pointer select-none" htmlFor={checkboxId}>
          {showCheckboxLabel}
        </label>
      </div>
    </div>
  );
};
