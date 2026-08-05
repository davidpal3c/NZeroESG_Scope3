CREATE TABLE IF NOT EXISTS shipments (
    record_id UUID PRIMARY KEY,
    workspace_id VARCHAR(80) NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    shipment_id VARCHAR(80) NOT NULL,
    origin VARCHAR(200) NOT NULL,
    destination VARCHAR(200) NOT NULL,
    weight_kg DOUBLE PRECISION NOT NULL,
    distance_km DOUBLE PRECISION NOT NULL,
    transport_method VARCHAR(20) NOT NULL,
    source_row INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shipments_weight_positive CHECK (weight_kg > 0),
    CONSTRAINT shipments_distance_positive CHECK (distance_km > 0),
    CONSTRAINT shipments_source_row_positive CHECK (source_row > 1)
);

CREATE INDEX IF NOT EXISTS shipments_workspace_idx ON shipments (workspace_id, source_row);
