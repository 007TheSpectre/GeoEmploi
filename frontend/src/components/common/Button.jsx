import { Children } from 'react';

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  fullWidth = false,
  href,
  as,
  title,
  ariaLabel,
  className = '',
  children,
  ...props
}) => {
  const variantMap = {
    primary: {
      dsfrClass: '',
      style: 'bg-blue hover:bg-blue-hover text-white border-transparent active:bg-blue-dark',
    },
    secondary: {
      dsfrClass: 'fr-btn--secondary',
      style: 'bg-white hover:bg-blue-50 text-blue border-blue active:bg-blue-100 font-semibold',
    },
    tertiary: {
      dsfrClass: 'fr-btn--tertiary',
      style: 'bg-transparent hover:bg-slate-100 text-blue border-slate-300 active:bg-slate-200 font-normal',
    },
    'tertiary-no-outline': {
      dsfrClass: 'fr-btn--tertiary-no-outline',
      style: 'bg-transparent hover:bg-slate-100 text-blue border-transparent active:bg-slate-200 font-normal',
    },
    outline: {
      dsfrClass: 'fr-btn--secondary',
      style: 'bg-transparent hover:bg-blue-50 text-blue border-blue',
    },
    ghost: {
      dsfrClass: 'fr-btn--tertiary-no-outline',
      style: 'bg-transparent hover:bg-slate-100 text-slate-700 border-transparent',
    },
    danger: {
      dsfrClass: '',
      style: 'bg-red-600 hover:bg-red-700 text-white border-transparent active:bg-red-800 font-semibold shadow-xs',
    },
  };

  const currentVariant = variantMap[variant] || variantMap.primary;

  const sizeMap = {
    sm: {
      dsfrClass: 'fr-btn--sm',
      style: 'text-xs px-3 py-1.5 gap-1.5 rounded-xs',
    },
    md: {
      dsfrClass: '',
      style: 'text-sm px-4 py-2 gap-2 rounded-xs',
    },
    lg: {
      dsfrClass: 'fr-btn--lg',
      style: 'text-base px-5 py-2.5 gap-2.5 rounded-sm',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const isIconOnly = iconPosition === 'only' || (icon && !children);

  const iconPositionClass = isIconOnly
    ? 'fr-btn--icon-only p-2 shrink-0'
    : iconPosition === 'right'
    ? 'fr-btn--icon-right'
    : 'fr-btn--icon-left';

  const Component = as || (href ? 'a' : 'button');
  const compProps = href
    ? { href, ...props }
    : { type: props.type || 'button', disabled, ...props };

  const baseStyles =
    'fr-btn inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none border focus:outline-hidden focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  return (
    <Component
      className={`${baseStyles} ${currentVariant.dsfrClass} ${currentSize.dsfrClass} ${iconPositionClass} ${currentVariant.style} ${currentSize.style} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      title={title}
      aria-label={ariaLabel || (isIconOnly && typeof children === 'string' ? children : undefined)}
      {...compProps}
    >
      {icon && (iconPosition === 'left' || isIconOnly) && (
        <span className="shrink-0 leading-none">{icon}</span>
      )}

      {children && (
        <span className={isIconOnly ? 'sr-only' : ''}>{children}</span>
      )}

      {icon && iconPosition === 'right' && !isIconOnly && (
        <span className="shrink-0 leading-none">{icon}</span>
      )}
    </Component>
  );
};

export const ButtonGroup = ({
  children,
  size,
  iconPosition,
  align = 'left',
  inline = false,
  inlineBreakpoint,
  reverse = false,
  equisized = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'fr-btns-group--sm',
    lg: 'fr-btns-group--lg',
  };

  const iconPosClasses = {
    left: 'fr-btns-group--icon-left',
    right: 'fr-btns-group--icon-right',
  };

  const alignClasses = {
    left: '',
    right: 'fr-btns-group--right justify-end',
    center: 'fr-btns-group--center justify-center',
  };

  const inlineBreakpointClasses = {
    sm: 'fr-btns-group--inline-sm sm:flex-row sm:items-center',
    md: 'fr-btns-group--inline-md md:flex-row md:items-center',
    lg: 'fr-btns-group--inline-lg lg:flex-row lg:items-center',
  };

  const groupClasses = [
    'fr-btns-group flex flex-col gap-3 list-none p-0 m-0',
    sizeClasses[size] || '',
    iconPosClasses[iconPosition] || '',
    alignClasses[align] || '',
    inline ? 'fr-btns-group--inline flex-row flex-wrap items-center' : '',
    inlineBreakpoint ? inlineBreakpointClasses[inlineBreakpoint] || '' : '',
    reverse ? 'fr-btns-group--inline-reverse flex-row-reverse' : '',
    equisized ? 'fr-btns-group--equisized [&>li]:flex-1 [&>li>button]:w-full [&>li>a]:w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ul className={groupClasses} {...props}>
      {Children.map(children, (child) => {
        if (!child)
            return null;
        if (child.type === 'li')
            return child;
        return <li className={equisized ? 'flex-1' : ''}>{child}</li>;
      })}
    </ul>
  );
};
