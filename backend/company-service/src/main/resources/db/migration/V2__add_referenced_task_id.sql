-- Add referenced_task_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS referenced_task_id VARCHAR(255) NULL;

-- Add index for referenced_task_id for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_referenced_task_id ON public.tasks USING btree (referenced_task_id);

