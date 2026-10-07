import { useId, useState } from 'react';
import { Search } from 'lucide-react';

const SIZE_STYLES = {
  md: {
    input: 'h-10 text-base py-2 px-4',
    button: 'h-10 min-w-10 px-3',
    icon: 20,
  },
  lg: {
    input: 'h-12 text-base py-2.5 px-4',
    button: 'h-12 min-w-12 px-4 sm:px-5',
    icon: 22,
  },
};

const MESSAGE_STYLES = {
  error: 'text-[#ce0500]',
  valid: 'text-[#18753c]',
  info: 'text-[#0063cb]',
};

export const SearchBar = ({
  id,
  name = 'q',
  label = 'Rechercher',
  hideLabel = true,
  placeholder = 'Rechercher',
  buttonLabel = 'Rechercher',
  showButtonLabel,
  size = 'md',
  defaultValue = '',
  value,
  onChange,
  onSearch,
  action,
  method = 'get',
  disabled = false,
  message,
  messageType,
  className = '',
  inputClassName = '',
}) => {
  const generatedId = useId();
  const inputId = id || `search-input-${generatedId}`;
  const messagesId = `${inputId}-messages`;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const query = isControlled ? value : internalValue;
  const styles = SIZE_STYLES[size] || SIZE_STYLES.md;
  const textOnButton = showButtonLabel ?? size === 'lg';
  const hasMessage = Boolean(message);
  const messageClass = MESSAGE_STYLES[messageType] || 'text-slate-700';
  const inputStatusBorder =
    messageType === 'error'
      ? 'border-[#ce0500] focus:border-[#ce0500] focus:shadow-[inset_0_-2px_0_0_#ce0500]'
      : messageType === 'valid'
        ? 'border-[#18753c] focus:border-[#18753c] focus:shadow-[inset_0_-2px_0_0_#18753c]'
        : 'border-[#3a3a3a] focus:border-blue focus:shadow-[inset_0_-2px_0_0_var(--color-blue)]';

  const handleChange = (event) => {
    if (!isControlled)
      setInternalValue(event.target.value);
    onChange?.(event.target.value, event);
  };

  const handleSubmit = (event) => {
    if (onSearch) {
      event.preventDefault();
      onSearch(query);
    }
  };

  return (
    <form action={action} method={method} onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex flex-wrap items-stretch" role="search">
        <label
          htmlFor={inputId}
          className={hideLabel ? 'sr-only' : 'mb-2 w-full text-sm font-medium text-[#161616]'}
        >
          {label}
        </label>

        <input
          id={inputId}
          name={name}
          type="search"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={messagesId}
          aria-invalid={messageType === 'error' || undefined}
          onChange={handleChange}
          className={`
            min-w-0 flex-1 appearance-none rounded-tl-sm rounded-tr-none rounded-br-none rounded-bl-none
            border-0 border-b-2 bg-[#eeeeee] text-[#161616]
            placeholder:italic placeholder:text-[#666666]
            [&::-webkit-search-cancel-button]:appearance-none
            focus:bg-white focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
            ${styles.input} ${inputStatusBorder} ${inputClassName}
          `.trim()}
        />

        <button
          type="submit"
          title={buttonLabel}
          disabled={disabled}
          className={`
            inline-flex shrink-0 items-center justify-center gap-2
            rounded-tr-sm rounded-tl-none rounded-br-none rounded-bl-none border-0
            bg-blue text-sm font-medium text-white
            hover:bg-blue-hover focus:outline-none focus-visible:ring-2
            focus-visible:ring-blue focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${styles.button}
          `.trim()}
        >
          <Search size={styles.icon} aria-hidden="true" className="shrink-0" />
          <span className={textOnButton ? undefined : 'sr-only'}>{buttonLabel}</span>
        </button>

        <div
          id={messagesId}
          className={`w-full basis-full ${hasMessage ? 'mt-2' : ''}`}
          aria-live="polite"
        >
          {hasMessage && (
            <p
              className={`text-xs leading-5 ${messageClass}`}
              role={messageType === 'error' ? 'alert' : undefined}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </form>
  );
};
