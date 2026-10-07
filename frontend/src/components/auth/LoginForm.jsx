import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PasswordInput } from '../common/PasswordInput';

export const LoginForm = ({ onSubmit }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(loginData);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Connexion à votre espace
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Saisissez vos identifiants pour accéder à votre profil candidat ou employeur.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Adresse électronique"
          type="email"
          name="email"
          required
          icon={<Mail size={18} />}
          placeholder="nom@domaine.fr"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
        />

        <PasswordInput
          label="Mot de passe"
          name="password"
          required
          placeholder="••••••••"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-xs border-slate-300 text-blue focus:ring-blue"
            />
            <span>Se souvenir de moi</span>
          </label>
          <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-blue hover:underline font-medium">
            Mot de passe oublié ?
          </a>
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" fullWidth size="lg">
            Se connecter
          </Button>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          En vous connectant, vous acceptez les{' '}
          <Link to="/cgu" className="text-blue underline font-medium">
            CGU
          </Link>{' '}
          et notre politique de{' '}
          <Link to="/faq" className="text-blue underline font-medium">
            transparence
          </Link>.
        </p>
      </form>

      <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-600">
        Pas encore de compte ?{' '}
        <Link
          to="/register"
          className="text-blue font-bold hover:underline inline-flex items-center gap-1 ml-1"
        >
          S'inscrire gratuitement <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
