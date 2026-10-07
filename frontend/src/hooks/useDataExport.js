import { useState, useCallback } from 'react';
import { downloadUserExport } from '../api/authApi';

export const useDataExport = (initialToken, initialEmail) => {
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(null);

  const handleExportData = useCallback(
    async (tokenParam, emailParam) => {
      const candidateToken = typeof tokenParam === 'string' && tokenParam.trim() ? tokenParam.trim() : null;
      const activeToken = candidateToken || initialToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('geoemploi_token') : null);

      const candidateEmail = typeof emailParam === 'string' && emailParam.trim() ? emailParam.trim() : null;
      const activeEmail = candidateEmail || initialEmail;

      if (!activeToken) {
        setExportFeedback({
          type: 'error',
          message: 'Session expirée ou token manquant. Veuillez vous reconnecter pour exporter vos données.',
        });
        return;
      }

      setExporting(true);
      setExportFeedback(null);

      try {
        await downloadUserExport(activeToken, activeEmail);
        setExportFeedback({
          type: 'success',
          message: "L'archive de vos données personnelles (JSON structuré) a été générée et téléchargée avec succès.",
        });
      } catch (err) {
        setExportFeedback({
          type: 'error',
          message: err?.message || "Impossible d'exporter vos données personnelles.",
        });
      } finally {
        setExporting(false);
      }
    },
    [initialToken, initialEmail]
  );

  const clearFeedback = useCallback(() => {
    setExportFeedback(null);
  }, []);

  return {
    exporting,
    exportFeedback,
    setExportFeedback,
    handleExportData,
    clearFeedback,
  };
};
