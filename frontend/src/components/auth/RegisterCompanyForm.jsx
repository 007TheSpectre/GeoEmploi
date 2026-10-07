import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Building, Mail, Phone, MapPin, Briefcase, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PasswordInput } from '../common/PasswordInput';

export const RegisterCompanyForm = ({ onSubmit }) => {
  const [compData, setCompData] = useState({
    companyName: '',
    siret: '',
    sector: '',
    email: '',
    phone: '',
    city: '',
    postalCode: '',
    password: '',
    confirmPassword: '',
    acceptCgu: false,
  });

  const [siretStatus, setSiretStatus] = useState({
    status: 'idle',
    message: '',
  });

  const handleVerifySiret = async (e) => {
    e.preventDefault();
    if (!compData.siret.trim()) {
      setSiretStatus({
        status: 'error',
        message: 'Veuillez saisir un numéro de SIRET à vérifier.',
      });
      return;
    }

    setSiretStatus({ status: 'checking', message: 'Vérification auprès des services INSEE/SIRENE...' });

    try {
      const { checkSiretApi } = await import('../../api/authApi');
      const response = await checkSiretApi(compData.siret);
      const etab = response.data;

      setCompData((prev) => ({
        ...prev,
        companyName: etab.company_name || prev.companyName,
        sector: etab.sector_label || etab.sector || prev.sector,
        city: etab.city || etab.commune || prev.city,
        postalCode: etab.postal_code || prev.postalCode,
      }));

      setSiretStatus({
        status: 'success',
        message: `Établissement vérifié avec succès (${etab.company_name || 'Société répertoriée'}).`,
      });
    } catch (err) {
      setSiretStatus({
        status: 'error',
        message: err.message || 'Numéro SIRET invalide ou introuvable dans la base SIRENE.',
      });
    }
  };

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
      onSubmit(compData, siretStatus, setSiretStatus);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mb-4 text-xs text-slate-800 flex items-start gap-2.5">
        <Building2 className="shrink-0 text-blue mt-0.5" size={18} />
        <div>
          <p className="font-bold text-sm text-slate-900">Compte Employeur / Entreprise</p>
          <p className="mt-0.5 text-slate-600">
            Réservé aux entreprises, recruteurs et structures professionnelles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <Input
          label="Nom de l'entreprise / Raison sociale"
          required
          icon={<Building2 size={18} />}
          placeholder="Ex: Tech Solutions SAS / DSI Conseil"
          hintText="Nom officiel au registre SIRENE"
          value={compData.companyName}
          onChange={(e) => setCompData({ ...compData, companyName: e.target.value })}
        />

        <Input
          label="Secteur d'activité"
          icon={<Briefcase size={18} />}
          placeholder="Ex: Territoire, IT, Santé, BTP..."
          hintText="Domaine d'activité principal"
          value={compData.sector}
          onChange={(e) => setCompData({ ...compData, sector: e.target.value })}
        />
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
        <Input
          label="Numéro de SIRET (14 chiffres)"
          required
          icon={<Building size={18} />}
          placeholder="12345678900012"
          maxLength={17}
          hintText="Saisissez les 14 chiffres de votre établissement et cliquez sur Vérifier"
          value={compData.siret}
          onChange={(e) => {
            setCompData({ ...compData, siret: e.target.value });
            if (siretStatus.status !== 'idle') {
              setSiretStatus({ status: 'idle', message: '' });
            }
          }}
          button={
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleVerifySiret}
              disabled={siretStatus.status === 'checking'}
            >
              {siretStatus.status === 'checking' ? 'Vérification...' : 'Vérifier le SIRET'}
            </Button>
          }
          error={siretStatus.status === 'error' ? siretStatus.message : undefined}
          success={siretStatus.status === 'success' ? siretStatus.message : undefined}
          info={siretStatus.status === 'checking' ? siretStatus.message : undefined}
        />

        {siretStatus.status === 'success' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/70 p-2 rounded-md border border-emerald-300">
            <Check size={16} className="text-emerald-700" />
            <span>SIRET valide & vérifié pour {compData.companyName || "votre établissement"}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <Input
          label="Adresse électronique professionnelle"
          type="email"
          required
          icon={<Mail size={18} />}
          placeholder="recrutement@organisme.fr"
          hintText="Adresse officielle de contact RH"
          value={compData.email}
          onChange={(e) => setCompData({ ...compData, email: e.target.value })}
        />

        <Input
          label="Téléphone de contact"
          type="tel"
          required
          icon={<Phone size={18} />}
          placeholder="03 20 00 00 00"
          hintText="Ligne directe de l'établissement"
          value={compData.phone}
          onChange={(e) => setCompData({ ...compData, phone: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <div className="sm:col-span-2">
            <Input
              label="Commune ou Arrondissement"
              icon={<MapPin size={18} />}
              placeholder="ex: Paris 11e, Lille, Lyon 3e..."
              hintText="Commune de l'établissement"
              value={compData.city}
              onChange={(e) => setCompData({ ...compData, city: e.target.value })}
            />
          </div>
          <Input
            label="Code postal"
            icon={<MapPin size={18} />}
            placeholder="59000"
            maxLength={5}
            hintText="Code à 5 chiffres"
            value={compData.postalCode}
            onChange={(e) => setCompData({ ...compData, postalCode: e.target.value })}
          />
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
        <PasswordInput
          label="Créer un mot de passe"
          required
          placeholder="••••••••"
          value={compData.password}
          onChange={(e) => setCompData({ ...compData, password: e.target.value })}
          messages={getPasswordMessages(compData.password)}
        />

        <PasswordInput
          label="Confirmer le mot de passe"
          required
          placeholder="••••••••"
          value={compData.confirmPassword}
          onChange={(e) => setCompData({ ...compData, confirmPassword: e.target.value })}
          error={
            compData.confirmPassword && compData.confirmPassword !== compData.password
              ? 'Les mots de passe ne correspondent pas'
              : undefined
          }
          success={
            compData.confirmPassword && compData.confirmPassword === compData.password
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
            checked={compData.acceptCgu}
            onChange={(e) => setCompData({ ...compData, acceptCgu: e.target.checked })}
            className="h-4 w-4 rounded-xs border-slate-300 text-blue focus:ring-blue mt-0.5 shrink-0"
          />
          <span>
            Je certifie agir au nom et pour le compte de l'organisme/entreprise et j'accepte les{' '}
            <Link to="/cgu" target="_blank" rel="noopener noreferrer" className="text-blue underline font-semibold">
              CGU Employeur
            </Link>.
          </span>
        </label>
      </div>

      <div className="pt-4">
        <Button type="submit" variant="primary" fullWidth size="lg" disabled={!compData.acceptCgu}>
          Créer mon compte Entreprise / Employeur
        </Button>
      </div>
    </form>
  );
};
