import { MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const AccountPrivacySettings = ({
  geolocationEnabled = false,
  onToggleGeolocation,
  updatingGeo = false,
  geoFeedback,
  onDismissFeedback,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Réglages & Confidentialité
            </h2>
            <p className="text-xs text-slate-500">
              Gérez vos autorisations de localisation et le respect de votre vie privée
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          RGPD Art. 6 & 17
        </span>
      </div>

      {geoFeedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 animate-fadeIn ${
            geoFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {geoFeedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span className="flex-1 font-medium">{geoFeedback.message}</span>
          {onDismissFeedback && (
            <button
              type="button"
              onClick={onDismissFeedback}
              className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold ml-2"
              aria-label="Fermer le message"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">
              Géolocalisation automatique
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                geolocationEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {geolocationEnabled ? 'Activée' : 'Désactivée (données purgées)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Autorise GéoEmploi à détecter votre département pour centrer la carte des offres à chaque visite. Lorsque vous désactivez cette option, toutes vos coordonnées sont immédiatement purgées de votre compte.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          {updatingGeo && <Loader2 size={18} className="animate-spin text-blue" />}
          <button
            type="button"
            role="switch"
            aria-checked={geolocationEnabled}
            onClick={onToggleGeolocation}
            disabled={updatingGeo}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue ${
              geolocationEnabled ? 'bg-blue' : 'bg-slate-300'
            } ${updatingGeo ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={geolocationEnabled ? 'Désactiver la géolocalisation et purger mes coordonnées' : 'Activer la géolocalisation'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                geolocationEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
