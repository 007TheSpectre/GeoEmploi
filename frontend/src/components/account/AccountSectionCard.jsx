export const AccountSectionCard = ({ icon: Icon, title, children }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="p-2 bg-blue-50 text-blue rounded-lg">
          {Icon && <Icon size={20} />}
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-slate-600">
        {children}
      </div>
    </div>
  );
};
