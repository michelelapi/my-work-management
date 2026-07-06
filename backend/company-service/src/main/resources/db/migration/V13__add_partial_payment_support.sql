ALTER TABLE tasks ADD COLUMN is_partially_paid BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE task_contract_usages ADD COLUMN payment_date DATE;
