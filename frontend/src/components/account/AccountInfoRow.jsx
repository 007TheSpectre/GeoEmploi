export const AccountInfoRow = ({ label, children }) => {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-50 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{children}</span>
    </div>
  );
};
