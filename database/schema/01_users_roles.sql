-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 01_users_roles.sql
-- Purpose: roles and users tables
-- Run after: 00_create_database.sql
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- Table: roles
-- Stores the 5 defined system roles.
-- permissions is a JSON object of boolean flags for fine-grained
-- access control that the backend middleware reads at runtime.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id     TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    role_name   VARCHAR(50)         NOT NULL,
    description TEXT                    NULL,
    permissions JSON                NOT NULL DEFAULT ('{}'),
    created_at  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_roles       PRIMARY KEY (role_id),
    CONSTRAINT uq_role_name   UNIQUE      (role_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='System roles. permissions JSON is read by backend middleware.';


-- -------------------------------------------------------------
-- Table: departments
-- Declared before users because users.department_id references it.
-- head_user_id is nullable to break the circular dependency:
--   departments.head_user_id → users.user_id
--   users.department_id      → departments.department_id
-- The FK from departments to users is added AFTER users exists.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    department_id INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    dept_name     VARCHAR(100)      NOT NULL,
    dept_code     VARCHAR(20)       NOT NULL,
    head_user_id  INT UNSIGNED          NULL DEFAULT NULL,
    is_active     TINYINT(1)        NOT NULL DEFAULT 1,
    created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_departments   PRIMARY KEY (department_id),
    CONSTRAINT uq_dept_name     UNIQUE      (dept_name),
    CONSTRAINT uq_dept_code     UNIQUE      (dept_code)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Organizational departments. head_user_id FK added after users table.';


-- -------------------------------------------------------------
-- Table: users
-- System users. password_hash stores a bcrypt hash (never plain text).
-- department_id is nullable for users not tied to a department (e.g. admin).
-- deleted_at enables soft-delete: set timestamp instead of DELETE.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    role_id         TINYINT UNSIGNED NOT NULL,
    department_id   INT UNSIGNED        NULL DEFAULT NULL,
    username        VARCHAR(80)     NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(150)    NOT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    last_login_at   DATETIME            NULL DEFAULT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME            NULL DEFAULT NULL,

    CONSTRAINT pk_users         PRIMARY KEY  (user_id),
    CONSTRAINT uq_username      UNIQUE       (username),
    CONSTRAINT uq_email         UNIQUE       (email),
    CONSTRAINT fk_users_role    FOREIGN KEY  (role_id)
        REFERENCES roles (role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_users_dept    FOREIGN KEY  (department_id)
        REFERENCES departments (department_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_users_role        (role_id),
    INDEX idx_users_dept        (department_id),
    INDEX idx_users_active      (is_active),
    INDEX idx_users_deleted     (deleted_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='System users. Soft-delete via deleted_at.';


-- -------------------------------------------------------------
-- Deferred FK: departments.head_user_id → users.user_id
-- Added here after users is created to break the circular dependency.
-- -------------------------------------------------------------
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_head
        FOREIGN KEY (head_user_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

ALTER TABLE departments
    ADD INDEX idx_dept_head (head_user_id);
