-- Add client column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS client VARCHAR(255) NULL;

-- Add index for client for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_client ON public.tasks USING btree (client);
