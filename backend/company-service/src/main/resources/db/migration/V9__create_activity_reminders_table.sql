CREATE TABLE IF NOT EXISTS activity_reminders (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    activity_name VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_date TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_reminders_user_active_activity
    ON activity_reminders (user_email, active, activity_name);
