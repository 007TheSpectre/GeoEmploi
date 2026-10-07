export const TransparencyCard = ({
  icon,
  iconClassName = 'bg-blue-light text-blue border-blue/20',
  title,
  subtitle,
  subtitleClassName = 'text-blue',
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-blue transition-all space-y-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${iconClassName}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          {subtitle && (
            <p className={`text-xs font-semibold ${subtitleClassName}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
};
