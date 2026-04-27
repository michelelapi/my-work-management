ALTER TABLE projects
    ADD COLUMN default_client_id BIGINT;

ALTER TABLE projects
    ADD CONSTRAINT fk_projects_default_client
        FOREIGN KEY (default_client_id)
            REFERENCES clients (id)
            ON DELETE SET NULL;
