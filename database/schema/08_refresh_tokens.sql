-- =============================================================
-- VPPT — database/schema/08_refresh_tokens.sql
-- Purpose: Persistent refresh token store for JWT refresh flow.
-- One row per active refresh session.
-- Run after: 01_users_roles.sql
-- =============================================================

USE vppt;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED    NOT NULL,
    token_hash      VARCHAR(255)    NOT NULL
                    COMMENT 'SHA-256 hash of the raw refresh token (never store raw)',
    expires_at      DATETIME        NOT NULL
                    COMMENT 'Token expiry; derived from JWT_REFRESH_EXPIRES_IN',
    revoked         TINYINT(1)      NOT NULL DEFAULT 0
                    COMMENT '1 = manually revoked (logout); 0 = still valid',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_refresh_tokens    PRIMARY KEY  (token_id),
    CONSTRAINT fk_rt_user           FOREIGN KEY  (user_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_rt_user               (user_id),
    INDEX idx_rt_hash               (token_hash),
    INDEX idx_rt_expires_at         (expires_at),
    INDEX idx_rt_revoked            (revoked)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Persisted refresh token records. token_hash stores SHA-256 of the raw JWT.';
