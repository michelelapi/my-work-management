ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS project_manager_name VARCHAR(255);
