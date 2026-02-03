-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(255) NOT NULL,
    CONSTRAINT fk_clients_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT uk_clients_project_name UNIQUE (project_id, name)
);

-- Create index for project_id
CREATE INDEX IF NOT EXISTS idx_clients_project_id ON public.clients USING btree (project_id);

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add client_id column to tasks table (nullable initially)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS client_id BIGINT NULL;

-- Migrate existing client data from VARCHAR to clients table
-- This will create client entries for unique client names per project
INSERT INTO public.clients (project_id, name, user_email, created_at, updated_at)
SELECT DISTINCT 
    t.project_id,
    t.client,
    COALESCE(t.user_email, 'system@example.com'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM public.tasks t
WHERE t.client IS NOT NULL 
  AND t.client != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.project_id = t.project_id 
      AND c.name = t.client
  );

-- Update tasks table to set client_id based on matching client names
UPDATE public.tasks t
SET client_id = c.id
FROM public.clients c
WHERE t.project_id = c.project_id
  AND t.client = c.name
  AND t.client IS NOT NULL
  AND t.client != '';

-- Add foreign key constraint for client_id
ALTER TABLE public.tasks 
    ADD CONSTRAINT fk_tasks_client 
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for client_id
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks USING btree (client_id);

-- Drop the old client VARCHAR column (commented out for safety - uncomment after verifying migration)
-- ALTER TABLE public.tasks DROP COLUMN IF EXISTS client;
-- DROP INDEX IF EXISTS idx_tasks_client;
