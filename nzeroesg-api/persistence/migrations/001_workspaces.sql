CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(120) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id VARCHAR(80) PRIMARY KEY,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT workspaces_expiry_after_issue CHECK (expires_at > issued_at)
);

CREATE TABLE IF NOT EXISTS workspace_retention (
    workspace_id VARCHAR(80) PRIMARY KEY REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    policy VARCHAR(80) NOT NULL DEFAULT 'workspace_and_derived_data',
    CONSTRAINT workspace_retention_policy CHECK (policy = 'workspace_and_derived_data')
);

CREATE TABLE IF NOT EXISTS workspace_quotas (
    workspace_id VARCHAR(80) REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    quota_key VARCHAR(80) NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    quota_limit INTEGER NOT NULL,
    period_start DATE NOT NULL,
    PRIMARY KEY (workspace_id, quota_key),
    CONSTRAINT workspace_quotas_used_nonnegative CHECK (used >= 0),
    CONSTRAINT workspace_quotas_limit_positive CHECK (quota_limit > 0),
    CONSTRAINT workspace_quotas_used_within_limit CHECK (used <= quota_limit)
);

CREATE INDEX IF NOT EXISTS workspaces_expires_at_idx ON workspaces (expires_at);
CREATE INDEX IF NOT EXISTS workspace_retention_expires_at_idx
    ON workspace_retention (expires_at);
