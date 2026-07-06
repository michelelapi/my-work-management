ALTER TABLE tasks ADD COLUMN is_partially_billed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE task_contract_usages ADD COLUMN invoice_id VARCHAR(255);
ALTER TABLE task_contract_usages ADD COLUMN billing_date DATE;
