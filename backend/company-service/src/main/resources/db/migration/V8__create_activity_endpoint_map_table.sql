CREATE TABLE IF NOT EXISTS activity_endpoint_map (
    id BIGSERIAL PRIMARY KEY,
    activity_name VARCHAR(120) NOT NULL,
    endpoint_pattern VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_endpoint_map_method_enabled
    ON activity_endpoint_map (http_method, enabled);

INSERT INTO activity_endpoint_map (activity_name, endpoint_pattern, http_method, enabled)
VALUES
    ('Generate SAL', '/tasks/sal/pdf', 'GET', TRUE),
    ('Info For Bill', '/tasks', 'GET', TRUE),
    ('Info For Bill', '/projects/{projectId}/tasks', 'GET', TRUE),
    ('Update Billing Status', '/tasks/billing-status', 'PUT', TRUE),
    ('Update Payment Status', '/tasks/payment-status', 'PUT', TRUE);
