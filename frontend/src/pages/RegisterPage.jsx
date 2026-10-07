import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Building2, ArrowRight } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { RegisterIndividualForm } from '../components/auth/RegisterIndividualForm';
import { RegisterCompanyForm } from '../components/auth/RegisterCompanyForm';
import { isValidSiret } from '../utils/siretUtils';
import { registerUserApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [registerType, setRegisterType] = useState('individual');
  const [feedback, setFeedback] = useState(null);
  const { loginState } = useAuth();
  const navigate = useNavigate();

  const handleIndSubmit = async (indData) => {
    if (indData.password !== indData.confirmPassword) {
      setFeedback({
        type: 'error',
        title: 'Mots de passe non identiques',
        description: 'Veuillez vous assurer que la confirmation du mot de passe correspond au mot de passe saisi.',
      });
      return;
    }

    try {
      const payload = {
        email: indData.email,
        password: indData.password,
        role: 'candidate',
        first_name: indData.firstName,
        last_name: indData.lastName,
        phone: indData.phone || undefined,
        postal_code: indData.postalCode || undefined,
      };

      const res = await registerUserApi(payload);
      loginState(res.user, res.token);

      setFeedback({
        type: 'success',
        title: 'Compte Candidat créé avec succès !',
        description: `Bienvenue ${indData.firstName} ! Redirection en cours...`,
      });

      setTimeout(() => navigate('/jobs'), 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Erreur lors de l\'inscription',
        description: err.message,
      });
    }
  };

  const handleCompSubmit = async (compData, siretStatus, setSiretStatus) => {
    if (compData.password !== compData.confirmPassword) {
      setFeedback({
        type: 'error',
        title: 'Mots de passe non identiques',
        description: 'La confirmation du mot de passe ne correspond pas au mot de passe saisi.',
      });
      return;
    }

    try {
      const payload = {
        email: compData.email,
        password: compData.password,
        role: 'employer',
        company_name: compData.companyName,
        siret: compData.siret ? compData.siret.replace(/[\s\-\.]/g, '') : undefined,
        sector: compData.sector || undefined,
        phone: compData.phone || undefined,
        city: compData.city || undefined,
        postal_code: compData.postalCode || undefined,
      };

      const res = await registerUserApi(payload);
      loginState(res.user, res.token);

      setFeedback({
        type: 'success',
        title: 'Compte Employeur créé avec succès !',
        description: `Profil créé pour "${compData.companyName}". Redirection en cours...`,
      });

      setTimeout(() => navigate('/jobs'), 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Erreur lors de l\'inscription',
        description: err.message,
      });
    }
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-140px)] flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Badge variant="info" icon={<ShieldCheck size={14} />}>
              Inscription Gratuite
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
            Création de compte
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Choisissez le type de compte correspondant à vos besoins (Candidat ou Employeur).
          </p>
        </div>

        {feedback && (
          <div className="mb-6">
            <Alert
              type={feedback.type}
              title={feedback.title}
              description={feedback.description}
              dismissible
              onClose={() => setFeedback(null)}
            />
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pb-4 border-b border-slate-200">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Type de compte :
            </span>

            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setRegisterType('individual');
                  setFeedback(null);
                }}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  registerType === 'individual'
                    ? 'bg-blue text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <User size={16} />
                <span>Candidat / Particulier</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterType('company');
                  setFeedback(null);
                }}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  registerType === 'company'
                    ? 'bg-blue text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Building2 size={16} />
                <span>Employeur / Entreprise</span>
              </button>
            </div>
          </div>

          {registerType === 'individual' ? (
            <RegisterIndividualForm onSubmit={handleIndSubmit} />
          ) : (
            <RegisterCompanyForm onSubmit={handleCompSubmit} />
          )}

          <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-600">
            Déjà inscrit ?{' '}
            <Link
              to="/login"
              className="text-blue font-bold hover:underline inline-flex items-center gap-1 ml-1"
            >
              Se connecter à votre espace <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
