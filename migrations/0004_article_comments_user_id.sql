ALTER TABLE article_comments ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON article_comments (user_id);
