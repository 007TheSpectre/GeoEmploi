export const AccountActivityItem = ({ title, subtitle, count = 0 }) => {
  return (
    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
      <div>
        <p className="font-medium text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded">
        {count}
      </span>
    </div>
  );
};
