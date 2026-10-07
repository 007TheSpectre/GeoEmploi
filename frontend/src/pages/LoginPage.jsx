import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { LoginForm } from '../components/auth/LoginForm';
import { loginUserApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [feedback, setFeedback] = useState(null);
  const { loginState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.accountDeleted) {
      setFeedback({
        type: 'success',
        title: 'Compte supprimé',
        description: location.state?.message || 'Votre compte a été supprimé avec succès conformément au RGPD.',
      });
    }
  }, [location.state]);

  const handleLoginSubmit = async (loginData) => {
    try {
      const res = await loginUserApi(loginData);
      loginState(res.user, res.token);

      setFeedback({
        type: 'success',
        title: 'Connexion réussie',
        description: `Bienvenue ! Redirection en cours...`,
      });

      setTimeout(() => {
        const returnTo = location.state?.returnTo;
        const offerId = location.state?.offerId;
        if (returnTo && offerId) {
          navigate(`${returnTo}?offerId=${offerId}`);
        } else if (returnTo) {
          navigate(returnTo);
        } else {
          navigate('/jobs');
        }
      }, 1200);
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Erreur de connexion',
        description: err.message || 'Email ou mot de passe incorrect.',
      });
    }
  };

  return (
    <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-140px)] flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Badge variant="info" icon={<ShieldCheck size={14} />}>
              Espace Sécurisé
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
            Espace Connexion
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Accédez à votre compte pour gérer vos candidatures ou vos offres d'emploi.
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

        <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 sm:p-10">
          <LoginForm onSubmit={handleLoginSubmit} />
        </div>
      </div>
    </main>
  );
};
