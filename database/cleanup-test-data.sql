-- Purge des données créées pour/par les tests e2e.
-- Exécuté par le service `cleanup` après le succès de `tests`.

BEGIN;

CREATE TEMP TABLE _test_user_ids ON COMMIT DROP AS
SELECT id FROM users
WHERE email LIKE '%@test.local'
   OR email LIKE '%@anonyme.local';

CREATE TEMP TABLE _test_offer_ids ON COMMIT DROP AS
SELECT o.id
FROM job_offers o
JOIN employer_profiles ep ON ep.id = o.employer_id
JOIN users u ON u.id = ep.user_id
WHERE u.id IN (SELECT id FROM _test_user_ids);

DELETE FROM moderation_logs
WHERE user_id IN (SELECT id FROM _test_user_ids)
   OR job_id IN (SELECT id FROM _test_offer_ids)
   OR admin_id IN (
        SELECT a.id FROM admins a
        JOIN users u ON u.id = a.user_id
        WHERE u.id IN (SELECT id FROM _test_user_ids)
   );

DELETE FROM application_status_history
WHERE changed_by IN (SELECT id FROM _test_user_ids)
   OR application_id IN (
        SELECT a.id
        FROM applications a
        JOIN candidate_profiles cp ON cp.id = a.candidate_id
        JOIN users u ON u.id = cp.user_id
        WHERE u.id IN (SELECT id FROM _test_user_ids)
   );

DELETE FROM reports
WHERE reporter_id IN (SELECT id FROM _test_user_ids)
   OR resolved_by IN (SELECT id FROM _test_user_ids)
   OR offer_id IN (SELECT id FROM _test_offer_ids);


UPDATE users
SET suspended_by = NULL
WHERE suspended_by IN (SELECT id FROM _test_user_ids);

DELETE FROM users WHERE id IN (SELECT id FROM _test_user_ids);

COMMIT;
