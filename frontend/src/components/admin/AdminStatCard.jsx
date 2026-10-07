export const AdminStatCard = ({
  title,
  icon: Icon,
  value,
  subtitle,
  subtitleColor = 'text-slate-500',
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-sm font-semibold">{title}</span>
        {Icon && <Icon size={20} className="text-blue-600" />}
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className={`text-xs font-medium ${subtitleColor}`}>{subtitle}</p>}
    </div>
  );
};
