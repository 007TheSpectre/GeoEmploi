import { Link } from 'react-router-dom';

export const Logo = ({ logoUrl = '/logo.png', title = 'GÉOEMPLOI', tagline = 'Plateforme de l\'emploi géolocalisé', className = '' }) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 group text-slate-900 ${className}`}>
      <img src={logoUrl} alt="GéoEmploi" className="h-10 w-10 rounded-xl shadow-xs object-cover shrink-0 group-hover:scale-105 transition-transform" />
      <div className="flex flex-col">
        <span className="font-extrabold uppercase tracking-tight text-blue text-xl sm:text-2xl leading-none">
          {title}
        </span>
        {tagline && <span className="text-[11px] text-slate-500 font-medium mt-1 leading-none">{tagline}</span>}
      </div>
    </Link>
  );
};

