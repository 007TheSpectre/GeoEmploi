-- ============================================================
-- GEOEMPLOI — SCHÉMA SQL CONSOLIDÉ
-- ============================================================
-- Contenu :
--   - Géographie
--   - Utilisateurs et administrateurs
--   - Employeurs
--   - Offres d'emploi
--   - Modération
--   - Signalements
--   - Candidats
--   - Candidatures
--   - Notifications
--   - Tokens
--
-- Coordonnées géographiques :
--   - latitude / longitude : WGS84 (EPSG:4326)
--   - lambert93_x / lambert93_y : Lambert-93 (EPSG:2154)
--
-- Les coordonnées Lambert-93 sont dérivées des coordonnées
-- WGS84 côté applicatif.
-- ============================================================



-- ============================================================
-- UTILISATEURS
-- ============================================================


CREATE TABLE users (
    id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,

    role              VARCHAR(20) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'active',
    geolocation_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    created_at        TIMESTAMP WITH TIME ZONE NOT NULL
                      DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL
                      DEFAULT CURRENT_TIMESTAMP,
    last_login_at     TIMESTAMP WITH TIME ZONE,

    suspended_at      TIMESTAMP WITH TIME ZONE,
    suspended_by      INT,
    suspension_reason TEXT,

    CONSTRAINT chk_users_role
        CHECK (role IN ('employer', 'candidate')),

    CONSTRAINT chk_users_status
        CHECK (status IN ('active', 'suspended', 'deleted')),

    CONSTRAINT fk_users_suspended_by
        FOREIGN KEY (suspended_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX index_users_role
    ON users(role);

CREATE INDEX index_users_status
    ON users(status);


CREATE TABLE admins (
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    INT          NOT NULL UNIQUE,
    full_name  VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
               DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admins_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- EMPLOYEURS
-- ============================================================

CREATE TABLE employer_profiles (
    id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             INT          NOT NULL UNIQUE,
    company_name        VARCHAR(255) NOT NULL,
    siret               VARCHAR(14) UNIQUE,
    sector              VARCHAR(100),
    description         TEXT,
    phone               VARCHAR(20),

    commune_code        VARCHAR(6),
    departement_code    VARCHAR(3),
    postal_code         VARCHAR(10),

    -- Coordonnées WGS84 — EPSG:4326
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,

    -- Coordonnées Lambert-93 — EPSG:2154
    lambert93_x         DOUBLE PRECISION,
    lambert93_y         DOUBLE PRECISION,

    verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified',

    created_at          TIMESTAMP WITH TIME ZONE NOT NULL
                        DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
                        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_employer_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_employer_profiles_verification_status
        CHECK (
            verification_status IN (
                'unverified',
                'pending',
                'verified',
                'rejected'
            )
        ),

    CONSTRAINT chk_employer_profiles_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_employer_profiles_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

    CONSTRAINT chk_employer_profiles_coordinates
        CHECK (
            (latitude IS NULL AND longitude IS NULL)
            OR
            (latitude IS NOT NULL AND longitude IS NOT NULL)
        ),

    CONSTRAINT chk_employer_profiles_lambert93_coordinates
        CHECK (
            (lambert93_x IS NULL AND lambert93_y IS NULL)
            OR
            (lambert93_x IS NOT NULL AND lambert93_y IS NOT NULL)
        )
);

CREATE INDEX index_employer_departement
    ON employer_profiles(departement_code);

CREATE INDEX index_employer_location
    ON employer_profiles(latitude, longitude);

CREATE INDEX index_employer_location93
    ON employer_profiles(lambert93_x, lambert93_y);


-- ============================================================
-- OFFRES D'EMPLOI
-- ============================================================

CREATE TABLE job_offers (
    id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employer_id         INT              NOT NULL,
    title               VARCHAR(255)     NOT NULL,
    description         TEXT             NOT NULL,

    contract_type       VARCHAR(20)      NOT NULL,

    salary_min          INT,
    salary_max          INT,
    experience_years    SMALLINT,

    commune_code        VARCHAR(6),
    departement_code    VARCHAR(3),
    postal_code         VARCHAR(10),

    -- Coordonnées WGS84 — EPSG:4326
    latitude            DOUBLE PRECISION NOT NULL,
    longitude           DOUBLE PRECISION NOT NULL,

    -- Coordonnées Lambert-93 — EPSG:2154
    lambert93_x         DOUBLE PRECISION,
    lambert93_y         DOUBLE PRECISION,

    broadcast_radius_km INT              NOT NULL DEFAULT 50,

    status              VARCHAR(30)      NOT NULL DEFAULT 'draft',

    published_at        TIMESTAMP WITH TIME ZONE,
    expires_at          TIMESTAMP WITH TIME ZONE,
    closed_at           TIMESTAMP WITH TIME ZONE,
    rejected_reason     TEXT,

    application_count   INT              NOT NULL DEFAULT 0,

    created_at          TIMESTAMP WITH TIME ZONE NOT NULL
                        DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
                        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_offers_employer
        FOREIGN KEY (employer_id)
        REFERENCES employer_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_job_offers_contract_type
        CHECK (
            contract_type IN (
                'CDI',
                'CDD',
                'interim',
                'alternance',
                'stage',
                'freelance',
                'autre'
            )
        ),

    CONSTRAINT chk_job_offers_status
        CHECK (
            status IN (
                'draft',
                'pending_moderation',
                'active',
                'rejected',
                'expired',
                'closed',
                'archived'
            )
        ),

    CONSTRAINT chk_job_offers_salary_min
        CHECK (salary_min IS NULL OR salary_min >= 0),

    CONSTRAINT chk_job_offers_salary_max
        CHECK (salary_max IS NULL OR salary_max >= 0),

    CONSTRAINT chk_job_offers_salary_range
        CHECK (
            salary_min IS NULL
            OR salary_max IS NULL
            OR salary_min <= salary_max
        ),

    CONSTRAINT chk_job_offers_experience_years
        CHECK (experience_years IS NULL OR experience_years >= 0),

    CONSTRAINT chk_job_offers_broadcast_radius
        CHECK (broadcast_radius_km > 0),

    CONSTRAINT chk_job_offers_application_count
        CHECK (application_count >= 0),

    CONSTRAINT chk_job_offers_latitude
        CHECK (latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_job_offers_longitude
        CHECK (longitude BETWEEN -180 AND 180),

    CONSTRAINT chk_job_offers_lambert93_coordinates
        CHECK (
            (lambert93_x IS NULL AND lambert93_y IS NULL)
            OR
            (lambert93_x IS NOT NULL AND lambert93_y IS NOT NULL)
        ),

    CONSTRAINT chk_job_offers_expiration
        CHECK (
            expires_at IS NULL
            OR published_at IS NULL
            OR expires_at > published_at
        )
);

CREATE INDEX index_jobs_status
    ON job_offers(status);

CREATE INDEX index_jobs_employer
    ON job_offers(employer_id);

CREATE INDEX index_jobs_departement
    ON job_offers(departement_code);

CREATE INDEX index_jobs_published_at
    ON job_offers(published_at);

CREATE INDEX index_jobs_location
    ON job_offers(latitude, longitude);

CREATE INDEX index_jobs_location93
    ON job_offers(lambert93_x, lambert93_y);


CREATE TABLE job_offer_tags (
    id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id INT          NOT NULL,
    tag    VARCHAR(100) NOT NULL,

    CONSTRAINT fk_job_offer_tags_job
        FOREIGN KEY (job_id)
        REFERENCES job_offers(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_job_offer_tags_job_tag
        UNIQUE (job_id, tag)
);

CREATE INDEX index_job_offer_tags_tag
    ON job_offer_tags(tag);


CREATE TABLE job_offer_views (
    id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id    INT  NOT NULL,
    view_date DATE NOT NULL,
    count     INT  NOT NULL DEFAULT 0,

    CONSTRAINT fk_job_offer_views_job
        FOREIGN KEY (job_id)
        REFERENCES job_offers(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_job_offer_views_job_date
        UNIQUE (job_id, view_date),

    CONSTRAINT chk_job_offer_views_count
        CHECK (count >= 0)
);

CREATE INDEX index_views_job
    ON job_offer_views(job_id);


-- ============================================================
-- MODÉRATION
-- ============================================================

CREATE TABLE moderation_logs (
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id   INT         NOT NULL,
    job_id     INT,
    user_id    INT,
    action     VARCHAR(20) NOT NULL,
    reason     TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
               DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_moderation_logs_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id),

    CONSTRAINT fk_moderation_logs_job
        FOREIGN KEY (job_id)
        REFERENCES job_offers(id),

    CONSTRAINT fk_moderation_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT chk_moderation_logs_action
        CHECK (
            action IN (
                'approved',
                'rejected',
                'suspended',
                'reactivated',
                'flagged',
                'closed'
            )
        ),

    CONSTRAINT chk_moderation_logs_target
        CHECK (
            (job_id IS NOT NULL AND user_id IS NULL)
            OR
            (job_id IS NULL AND user_id IS NOT NULL)
        )
);

CREATE INDEX index_modlog_job
    ON moderation_logs(job_id);

CREATE INDEX index_modlog_user
    ON moderation_logs(user_id);

CREATE INDEX index_modlog_admin
    ON moderation_logs(admin_id);


-- ============================================================
-- SIGNALEMENTS
-- ============================================================

CREATE TABLE reports (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    offer_id    INT         NOT NULL,
    reporter_id INT,
    reason      VARCHAR(50) NOT NULL,
    details     TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    resolved_by INT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL
                DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reports_offer
        FOREIGN KEY (offer_id)
        REFERENCES job_offers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reports_reporter
        FOREIGN KEY (reporter_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_reports_resolved_by
        FOREIGN KEY (resolved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_reports_reason
        CHECK (
            reason IN (
                'fraud',
                'expired',
                'inappropriate',
                'duplicate',
                'other'
            )
        ),

    CONSTRAINT chk_reports_status
        CHECK (
            status IN (
                'pending',
                'resolved',
                'dismissed'
            )
        ),

    CONSTRAINT chk_reports_resolution
        CHECK (
            (
                status = 'pending'
                AND resolved_by IS NULL
                AND resolved_at IS NULL
            )
            OR
            (
                status IN ('resolved', 'dismissed')
                AND resolved_by IS NOT NULL
                AND resolved_at IS NOT NULL
            )
        )
);

CREATE INDEX index_reports_offer
    ON reports(offer_id);

CREATE INDEX index_reports_status
    ON reports(status);

CREATE INDEX index_reports_reporter
    ON reports(reporter_id);

CREATE INDEX index_reports_resolved_by
    ON reports(resolved_by);


-- ============================================================
-- CANDIDATS
-- ============================================================

CREATE TABLE candidate_profiles (
    id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            INT          NOT NULL UNIQUE,
    first_name         VARCHAR(100) NOT NULL,
    last_name          VARCHAR(100) NOT NULL,
    headline           VARCHAR(255),
    bio                TEXT,
    phone              VARCHAR(20),
    cv_url             VARCHAR(255),
    photo_url          VARCHAR(255),

    availability       VARCHAR(20)  NOT NULL DEFAULT 'immediate',
    available_from     DATE,

    desired_salary_min INT,
    desired_salary_max INT,

    commune_code       VARCHAR(6),
    departement_code   VARCHAR(3),
    postal_code        VARCHAR(10),

    -- Coordonnées WGS84 — EPSG:4326
    latitude           DOUBLE PRECISION,
    longitude          DOUBLE PRECISION,

    -- Coordonnées Lambert-93 — EPSG:2154
    lambert93_x        DOUBLE PRECISION,
    lambert93_y        DOUBLE PRECISION,

    search_radius_km   INT     NOT NULL DEFAULT 30,
    is_profile_public  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at         TIMESTAMP WITH TIME ZONE NOT NULL
                       DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL
                       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidate_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_candidate_profiles_availability
        CHECK (
            availability IN (
                'immediate',
                'within_1_month',
                'within_3_months',
                'not_available'
            )
        ),

    CONSTRAINT chk_candidate_profiles_desired_salary_min
        CHECK (
            desired_salary_min IS NULL
            OR desired_salary_min >= 0
        ),

    CONSTRAINT chk_candidate_profiles_desired_salary_max
        CHECK (
            desired_salary_max IS NULL
            OR desired_salary_max >= 0
        ),

    CONSTRAINT chk_candidate_profiles_desired_salary_range
        CHECK (
            desired_salary_min IS NULL
            OR desired_salary_max IS NULL
            OR desired_salary_min <= desired_salary_max
        ),

    CONSTRAINT chk_candidate_profiles_search_radius
        CHECK (search_radius_km > 0),

    CONSTRAINT chk_candidate_profiles_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_candidate_profiles_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

    CONSTRAINT chk_candidate_profiles_coordinates
        CHECK (
            (latitude IS NULL AND longitude IS NULL)
            OR
            (latitude IS NOT NULL AND longitude IS NOT NULL)
        ),

    CONSTRAINT chk_candidate_profiles_lambert93_coordinates
        CHECK (
            (lambert93_x IS NULL AND lambert93_y IS NULL)
            OR
            (lambert93_x IS NOT NULL AND lambert93_y IS NOT NULL)
        )
);

CREATE INDEX index_candidate_departement
    ON candidate_profiles(departement_code);

CREATE INDEX index_candidate_avail
    ON candidate_profiles(availability);

CREATE INDEX index_candidate_location
    ON candidate_profiles(latitude, longitude);

CREATE INDEX index_candidate_location93
    ON candidate_profiles(lambert93_x, lambert93_y);


CREATE TABLE candidate_experiences (
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    candidate_id INT          NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_title    VARCHAR(255) NOT NULL,
    description  TEXT,
    started_at   DATE         NOT NULL,
    ended_at     DATE,
    is_current   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL
                 DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidate_experiences_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_candidate_experiences_dates
        CHECK (
            ended_at IS NULL
            OR ended_at >= started_at
        ),

    CONSTRAINT chk_candidate_experiences_current
        CHECK (
            is_current = FALSE
            OR ended_at IS NULL
        )
);

CREATE INDEX index_candidate_experiences_candidate
    ON candidate_experiences(candidate_id);


CREATE TABLE candidate_educations (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    candidate_id   INT          NOT NULL,
    institution    VARCHAR(255) NOT NULL,
    degree         VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    started_at     DATE         NOT NULL,
    ended_at       DATE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL
                   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidate_educations_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_candidate_educations_dates
        CHECK (
            ended_at IS NULL
            OR ended_at >= started_at
        )
);

CREATE INDEX index_candidate_educations_candidate
    ON candidate_educations(candidate_id);


CREATE TABLE candidate_skills (
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    candidate_id INT          NOT NULL,
    skill_name   VARCHAR(100) NOT NULL,
    level        SMALLINT,

    CONSTRAINT fk_candidate_skills_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_candidate_skills_level
        CHECK (
            level IS NULL
            OR level BETWEEN 1 AND 5
        ),

    CONSTRAINT uq_candidate_skills_candidate_skill
        UNIQUE (candidate_id, skill_name)
);

CREATE INDEX index_candidate_skills_name
    ON candidate_skills(skill_name);


-- ============================================================
-- CANDIDATURES
-- ============================================================

CREATE TABLE applications (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id         INT         NOT NULL,
    candidate_id   INT         NOT NULL,
    cover_letter   TEXT,
    cv_url         VARCHAR(255),

    status         VARCHAR(20) NOT NULL DEFAULT 'sent',
    employer_note  TEXT,

    viewed_at      TIMESTAMP WITH TIME ZONE,
    shortlisted_at TIMESTAMP WITH TIME ZONE,
    interview_at   TIMESTAMP WITH TIME ZONE,
    offer_made_at  TIMESTAMP WITH TIME ZONE,
    accepted_at    TIMESTAMP WITH TIME ZONE,
    rejected_at    TIMESTAMP WITH TIME ZONE,
    withdrawn_at   TIMESTAMP WITH TIME ZONE,

    created_at     TIMESTAMP WITH TIME ZONE NOT NULL
                   DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL
                   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id)
        REFERENCES job_offers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_applications_status
        CHECK (
            status IN (
                'sent',
                'viewed',
                'shortlisted',
                'interview',
                'offer_made',
                'accepted',
                'rejected',
                'withdrawn'
            )
        ),

    CONSTRAINT uq_applications_job_candidate
        UNIQUE (job_id, candidate_id)
);

CREATE INDEX index_app_job
    ON applications(job_id);

CREATE INDEX index_app_candidate
    ON applications(candidate_id);

CREATE INDEX index_app_status
    ON applications(status);


CREATE TABLE application_status_history (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id INT         NOT NULL,
    old_status     VARCHAR(20),
    new_status     VARCHAR(20) NOT NULL,
    changed_by     INT,
    note           TEXT,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL
                   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_application_status_history_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_status_history_changed_by
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_application_status_history_old_status
        CHECK (
            old_status IS NULL
            OR old_status IN (
                'sent',
                'viewed',
                'shortlisted',
                'interview',
                'offer_made',
                'accepted',
                'rejected',
                'withdrawn'
            )
        ),

    CONSTRAINT chk_application_status_history_new_status
        CHECK (
            new_status IN (
                'sent',
                'viewed',
                'shortlisted',
                'interview',
                'offer_made',
                'accepted',
                'rejected',
                'withdrawn'
            )
        ),

    CONSTRAINT chk_application_status_history_change
        CHECK (
            old_status IS NULL
            OR old_status <> new_status
        )
);

CREATE INDEX index_application_history_application
    ON application_status_history(application_id);

CREATE INDEX index_application_history_created_at
    ON application_status_history(created_at);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    INT          NOT NULL,
    type       VARCHAR(30)  NOT NULL,
    title      VARCHAR(255) NOT NULL,
    body       TEXT,
    link       VARCHAR(255),
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
               DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_notifications_type
        CHECK (
            type IN (
                'new_application',
                'application_status_change',
                'offer_approved',
                'offer_rejected',
                'offer_expires_soon',
                'offer_closed',
                'account_suspended',
                'account_activated',
                'employer_verified',
                'employer_verification_rejected'
            )
        ),

    CONSTRAINT chk_notifications_read_state
        CHECK (
            (is_read = FALSE AND read_at IS NULL)
            OR
            (is_read = TRUE AND read_at IS NOT NULL)
        )
);

CREATE INDEX index_notif_user
    ON notifications(user_id, is_read);

CREATE INDEX index_notif_created_at
    ON notifications(created_at);


-- ============================================================
-- TOKENS
-- ============================================================

CREATE TABLE tokens (
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    INT          NOT NULL,
    type       VARCHAR(30)  NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
               DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_tokens_type
        CHECK (
            type IN (
                'password_reset',
                'employer_verification'
            )
        ),

    CONSTRAINT chk_tokens_expiration
        CHECK (expires_at > created_at),

    CONSTRAINT chk_tokens_used_at
        CHECK (
            used_at IS NULL
            OR used_at >= created_at
        )
);

CREATE INDEX index_tokens_hash
    ON tokens(token_hash);

CREATE INDEX index_tokens_expires
    ON tokens(expires_at);

CREATE INDEX index_tokens_user_type
    ON tokens(user_id, type);


-- ============================================================
-- SAVED JOB OFFERS
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_job_offers (
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    job_id       INT NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS index_saved_jobs_candidate ON saved_job_offers(candidate_id);
CREATE INDEX IF NOT EXISTS index_saved_jobs_job       ON saved_job_offers(job_id);
