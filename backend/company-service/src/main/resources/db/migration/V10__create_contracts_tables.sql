-- contracts table
CREATE TABLE public.contracts (
    id bigserial NOT NULL,
    company_id int8 NOT NULL,
    name varchar(255) NOT NULL,
    code varchar(100) NOT NULL,
    total_amount numeric(15, 2) NOT NULL,
    amount_available numeric(15, 2) NOT NULL,
    start_date date NULL,
    end_date date NULL,
    notes text NULL,
    status varchar(20) NOT NULL DEFAULT 'OPEN',
    user_email varchar(255) NOT NULL,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contracts_pkey PRIMARY KEY (id),
    CONSTRAINT uk_contracts_code UNIQUE (code),
    CONSTRAINT chk_contracts_status CHECK (status IN ('OPEN', 'COMPLETED')),
    CONSTRAINT chk_contracts_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_contracts_amount_available CHECK (amount_available >= 0),
    CONSTRAINT fk_contracts_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT
);
CREATE INDEX idx_contracts_company_id ON public.contracts USING btree (company_id);
CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);
CREATE INDEX idx_contracts_code ON public.contracts USING btree (code);
CREATE INDEX idx_contracts_user_email ON public.contracts USING btree (user_email);

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- join table: project <-> contract (many-to-many)
CREATE TABLE public.project_contracts (
    project_id int8 NOT NULL,
    contract_id int8 NOT NULL,
    CONSTRAINT project_contracts_pkey PRIMARY KEY (project_id, contract_id),
    CONSTRAINT fk_pc_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_contract FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE
);
CREATE INDEX idx_project_contracts_project ON public.project_contracts USING btree (project_id);
CREATE INDEX idx_project_contracts_contract ON public.project_contracts USING btree (contract_id);

-- tracks how much money each task consumed from each contract
CREATE TABLE public.task_contract_usages (
    id bigserial NOT NULL,
    task_id int8 NOT NULL,
    contract_id int8 NOT NULL,
    amount_used numeric(15, 2) NOT NULL DEFAULT 0,
    contract_code varchar(100) NOT NULL,
    CONSTRAINT task_contract_usages_pkey PRIMARY KEY (id),
    CONSTRAINT fk_tcu_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tcu_contract FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_tcu_amount CHECK (amount_used >= 0)
);
CREATE INDEX idx_tcu_task ON public.task_contract_usages USING btree (task_id);
CREATE INDEX idx_tcu_contract ON public.task_contract_usages USING btree (contract_id);
