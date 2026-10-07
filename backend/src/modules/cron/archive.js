import cron from 'node-cron';
import { query } from '../../config/db.js';

export async function expireOffers() {
  const result = await query(
    `UPDATE job_offers
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active' AND expires_at < CURRENT_TIMESTAMP`,
  );
  if (result.rowCount > 0)
    console.log(`[cron] ${result.rowCount} offre(s) expirée(s)`);
}

export async function archiveOffers() {
  const result = await query(
    `UPDATE job_offers
     SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE status = 'expired' AND expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days'`,
  );
  if (result.rowCount > 0)
    console.log(`[cron] ${result.rowCount} offre(s) archivée(s)`);
}

export function startCron() {
  cron.schedule('0 * * * *', () => {
    expireOffers().catch((err) => console.error('[cron] expireOffers failed', err));
  });
  cron.schedule('0 3 * * *', () => {
    archiveOffers().catch((err) => console.error('[cron] archiveOffers failed', err));
  });
}
