import { Link, useLocation } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export const NavItem = ({ label, to = '/', icon, external = false, active, onClick, className = '', title, ...props }) => {
  const location = useLocation();
  const isActive = active !== undefined
    ? active
    : (location.pathname === to || (to === '/jobs' && location.pathname === '/'));

  if (external) {
    return (
      <a href={to} onClick={onClick} title={title} className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all text-blue hover:text-blue-hover hover:bg-slate-100/80 rounded-md ${isActive ? 'bg-slate-100 text-blue-hover font-bold' : ''} ${className}`} {...props}>
        {icon && <span className="shrink-0 text-blue">{icon}</span>}
        <span>{label}</span>
        <ExternalLink size={14} className="shrink-0 text-blue opacity-80" />
      </a>
    );
  }

  return (
    <Link to={to} onClick={onClick} title={title} className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all text-blue hover:text-blue-hover hover:bg-slate-100/80 rounded-md ${isActive ? 'bg-slate-100 text-blue-hover font-bold' : ''} ${className}`} {...props}>
      {icon && <span className="shrink-0 text-blue">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
};
