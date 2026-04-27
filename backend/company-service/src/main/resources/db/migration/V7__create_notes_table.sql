CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_tick BOOLEAN NOT NULL DEFAULT FALSE,
    read_date TIMESTAMP
);

CREATE INDEX idx_notes_user_email ON notes(user_email);
CREATE INDEX idx_notes_user_email_read_tick ON notes(user_email, read_tick);
