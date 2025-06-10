-- public.companies definition

-- Drop table

-- DROP TABLE public.companies;

CREATE TABLE public.companies (
	id bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	contact_person varchar(255) NULL,
	email varchar(255) NULL,
	phone varchar(50) NULL,
	address text NULL,
	website varchar(255) NULL,
	tax_id varchar(100) NULL,
	payment_terms int4 NULL DEFAULT 30,
	status varchar(10) NULL DEFAULT 'ACTIVE',
	created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	user_email varchar(255) NOT NULL,
	CONSTRAINT chk_companies_email CHECK (((email IS NULL) OR ((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))),
	CONSTRAINT chk_companies_payment_terms CHECK ((payment_terms > 0)),
	CONSTRAINT companies_pkey PRIMARY KEY (id),
	CONSTRAINT uk_companies_name UNIQUE (name),
	CONSTRAINT uk_companies_tax_id UNIQUE (tax_id)
);
CREATE INDEX idx_companies_name ON public.companies USING btree (name);
CREATE INDEX idx_companies_status ON public.companies USING btree (status);

-- Table Triggers

create trigger update_companies_updated_at before
update
    on
    public.companies for each row execute function update_updated_at_column();


-- public.company_contacts definition

-- Drop table

-- DROP TABLE public.company_contacts;

CREATE TABLE public.company_contacts (
	id bigserial NOT NULL,
	company_id int8 NOT NULL,
	"name" varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	phone varchar(50) NOT NULL,
	"role" varchar(100) NULL,
	is_primary bool NULL DEFAULT false,
	created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT chk_contacts_email CHECK (((email IS NULL) OR ((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))),
	CONSTRAINT company_contacts_pkey PRIMARY KEY (id),
	CONSTRAINT fk_contacts_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);
CREATE INDEX idx_contacts_company_id ON public.company_contacts USING btree (company_id);
CREATE INDEX idx_contacts_email ON public.company_contacts USING btree (email);
CREATE UNIQUE INDEX uk_company_primary_contact ON public.company_contacts USING btree (company_id) WHERE (is_primary = true);


-- public.projects definition

-- Drop table

-- DROP TABLE public.projects;

CREATE TABLE public.projects (
	id bigserial NOT NULL,
	company_id int8 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	daily_rate numeric(10, 2) NULL,
	hourly_rate numeric(10, 2) NULL,
	currency varchar(3) NULL DEFAULT 'EUR',
	start_date date NULL,
	end_date date NULL,
	estimated_hours int4 NULL,
	status varchar(10) NULL DEFAULT 'ACTIVE',
	created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	user_email varchar(255) NULL,
	CONSTRAINT chk_projects_currency CHECK (((currency)::text ~ '^[A-Z]{3}$'::text)),
	CONSTRAINT chk_projects_daily_rate CHECK (((daily_rate IS NULL) OR (daily_rate > (0)::numeric))),
	CONSTRAINT chk_projects_dates CHECK (((end_date IS NULL) OR (end_date >= start_date))),
	CONSTRAINT chk_projects_estimated_hours CHECK (((estimated_hours IS NULL) OR (estimated_hours > 0))),
	CONSTRAINT chk_projects_hourly_rate CHECK (((hourly_rate IS NULL) OR (hourly_rate > (0)::numeric))),
	CONSTRAINT chk_projects_rate_required CHECK (((daily_rate IS NOT NULL) OR (hourly_rate IS NOT NULL))),
	CONSTRAINT projects_pkey PRIMARY KEY (id),
	CONSTRAINT uk_projects_company_name UNIQUE (company_id, name),
	CONSTRAINT fk_projects_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT
);
CREATE INDEX idx_projects_company_id ON public.projects USING btree (company_id);
CREATE INDEX idx_projects_dates ON public.projects USING btree (start_date, end_date);
CREATE INDEX idx_projects_status ON public.projects USING btree (status);

-- Table Triggers

create trigger update_projects_updated_at before
update
    on
    public.projects for each row execute function update_updated_at_column();


-- public.tasks definition

-- Drop table

-- DROP TABLE public.tasks;

CREATE TABLE public.tasks (
	id bigserial NOT NULL,
	project_id int8 NOT NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	ticket_id varchar(100) NULL,
	start_date date NOT NULL,
	end_date date NULL,
	hours_worked numeric(5, 2) NOT NULL,
	rate_used numeric(10, 2) NULL,
	rate_type varchar(6) NULL,
	currency varchar(3) NULL DEFAULT 'EUR',
	is_billed bool NULL DEFAULT false,
	is_paid bool NULL DEFAULT false,
	billing_date date NULL,
	payment_date date NULL,
	invoice_id varchar(100) NULL,
	notes text NULL,
	created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	user_email varchar(255) NULL,
	CONSTRAINT tasks_pkey PRIMARY KEY (id),
	CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT
);
CREATE INDEX idx_tasks_billing_date ON public.tasks USING btree (billing_date);
CREATE INDEX idx_tasks_billing_status ON public.tasks USING btree (is_billed, is_paid);
CREATE INDEX idx_tasks_dates ON public.tasks USING btree (start_date, end_date);
CREATE INDEX idx_tasks_payment_date ON public.tasks USING btree (payment_date);
CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);
CREATE INDEX idx_tasks_ticket_id ON public.tasks USING btree (ticket_id);


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;


-- Table Triggers

create trigger update_tasks_updated_at before
update
    on
    public.tasks for each row execute function update_updated_at_column();