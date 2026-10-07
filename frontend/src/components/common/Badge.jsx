export const Badge = ({ variant = 'neutral', size = 'md', icon, children, className = '', ...props }) => {
  const variantStyles = {
    gov: 'bg-blue text-white border-blue',
    info: 'bg-blue-light text-blue border-blue/35',
    success: 'bg-[#bee8d5] text-[#18753c] border-[#86d2a7]',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-xs gap-1',
    md: 'text-xs px-2.5 py-1 rounded-sm gap-1.5',
  };

  return (
    <span className={`inline-flex items-center font-medium border uppercase tracking-wider ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size]} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
