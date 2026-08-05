CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id UUID PRIMARY KEY,
    workspace_id VARCHAR(80) NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    region VARCHAR(120),
    certifications TEXT[] NOT NULL DEFAULT '{}',
    transport_modes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS evidence_documents (
    document_id UUID PRIMARY KEY,
    workspace_id VARCHAR(80) NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    media_type VARCHAR(80) NOT NULL,
    sha256 CHAR(64) NOT NULL,
    page_count INTEGER NOT NULL,
    extracted_chars INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (workspace_id, sha256)
);

CREATE TABLE IF NOT EXISTS evidence_chunks (
    chunk_id UUID PRIMARY KEY,
    workspace_id VARCHAR(80) NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES evidence_documents(document_id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    section VARCHAR(160),
    content TEXT NOT NULL,
    search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS suppliers_workspace_idx ON suppliers (workspace_id, name);
CREATE INDEX IF NOT EXISTS evidence_documents_workspace_idx
    ON evidence_documents (workspace_id, created_at);
CREATE INDEX IF NOT EXISTS evidence_chunks_search_idx
    ON evidence_chunks USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS evidence_chunks_workspace_idx
    ON evidence_chunks (workspace_id, supplier_id);
