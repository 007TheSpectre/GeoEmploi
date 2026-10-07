export const KpiCard = ({
  label,
  value,
  icon,
  valueColor = 'text-blue',
  subtext,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-center space-y-1 hover:shadow-xs transition-shadow ${className}`}>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
        {label}
      </span>
      <div className={`text-2xl sm:text-3xl font-extrabold flex items-center justify-center gap-1.5 ${valueColor}`}>
        {icon && <span className="shrink-0 leading-none">{icon}</span>}
        <span>{value}</span>
      </div>
      {subtext && <p className="text-xs text-slate-400 font-normal">{subtext}</p>}
    </div>
  );
};
