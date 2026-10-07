import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PasswordInput } from '../common/PasswordInput';

export const RegisterIndividualForm = ({ onSubmit }) => {
  const [indData, setIndData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    password: '',
    confirmPassword: '',
    acceptCgu: false,
  });

  const getPasswordMessages = (pwd) => {
    if (!pwd)
      return [];
    return [
      { text: 'Au moins 8 caractères', isValid: pwd.length >= 8 },
      { text: 'Au moins 1 chiffre (0-9)', isValid: /\d/.test(pwd) },
      { text: 'Au moins 1 lettre majuscule', isValid: /[A-Z]/.test(pwd) },
    ];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(indData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mb-4 text-xs text-slate-800 flex items-start gap-2.5">
        <User className="shrink-0 text-blue mt-0.5" size={18} />
        <div>
          <p className="font-bold text-sm text-slate-900">Compte Candidat (Particulier)</p>
          <p className="mt-0.5 text-slate-600">
            Créez votre espace pour postuler aux offres d'emploi, déposer votre CV et suivre vos candidatures.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <Input
          label="Prénom"
          required
          icon={<User size={18} />}
          placeholder="Jean"
          hintText="Votre prénom officiel"
          value={indData.firstName}
          onChange={(e) => setIndData({ ...indData, firstName: e.target.value })}
        />

        <Input
          label="Nom"
          required
          icon={<User size={18} />}
          placeholder="Dupont"
          hintText="Votre nom de famille"
          value={indData.lastName}
          onChange={(e) => setIndData({ ...indData, lastName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <Input
          label="Adresse électronique"
          type="email"
          required
          icon={<Mail size={18} />}
          placeholder="jean.dupont@exemple.fr"
          hintText="Servira d'identifiant de connexion"
          value={indData.email}
          onChange={(e) => setIndData({ ...indData, email: e.target.value })}
        />

        <Input
          label="Numéro de téléphone"
          type="tel"
          icon={<Phone size={18} />}
          placeholder="06 12 34 56 78"
          hintText="Optionnel (format : 06 12 34 56 78)"
          value={indData.phone}
          onChange={(e) => setIndData({ ...indData, phone: e.target.value })}
        />
      </div>

      <Input
        label="Code postal de résidence"
        icon={<MapPin size={18} />}
        placeholder="75001"
        maxLength={5}
        hintText="Permet de cibler les offres d'emploi à proximité de chez vous"
        value={indData.postalCode}
        onChange={(e) => setIndData({ ...indData, postalCode: e.target.value })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
        <PasswordInput
          label="Créer un mot de passe"
          required
          placeholder="••••••••"
          value={indData.password}
          onChange={(e) => setIndData({ ...indData, password: e.target.value })}
          messages={getPasswordMessages(indData.password)}
        />

        <PasswordInput
          label="Confirmer le mot de passe"
          required
          placeholder="••••••••"
          value={indData.confirmPassword}
          onChange={(e) => setIndData({ ...indData, confirmPassword: e.target.value })}
          error={
            indData.confirmPassword && indData.confirmPassword !== indData.password
              ? 'Les mots de passe ne correspondent pas'
              : undefined
          }
          success={
            indData.confirmPassword && indData.confirmPassword === indData.password
              ? 'Mots de passe identiques'
              : undefined
          }
        />
      </div>

      <div className="pt-2">
        <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            checked={indData.acceptCgu}
            onChange={(e) => setIndData({ ...indData, acceptCgu: e.target.checked })}
            className="h-4 w-4 rounded-xs border-slate-300 text-blue focus:ring-blue mt-0.5 shrink-0"
          />
          <span>
            J'accepte les{' '}
            <Link to="/cgu" target="_blank" rel="noopener noreferrer" className="text-blue underline font-semibold">
              Conditions Générales d'Utilisation
            </Link>{' '}
            et la politique de protection des données personnelles (RGPD).
          </span>
        </label>
      </div>

      <div className="pt-4">
        <Button type="submit" variant="primary" fullWidth size="lg" disabled={!indData.acceptCgu}>
          Créer mon compte Particulier
        </Button>
      </div>
    </form>
  );
};
