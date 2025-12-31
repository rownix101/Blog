-- Cloudflare D1 评论系统数据库 Schema
-- 适配 Astro + Cloudflare Pages Functions 架构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    website TEXT,
    bio TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL, -- 对应博客文章的 identifier
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- 支持嵌套回复
    content TEXT NOT NULL,
    html_content TEXT, -- 处理后的 HTML 内容
    status TEXT DEFAULT 'published', -- published, pending, deleted
    ip_address TEXT, -- 用于反垃圾 (D1 不支持 INET 类型)
    user_agent TEXT, -- 用于反垃圾
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 会话表（用于用户登录状态管理）
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 评论点赞表（可选功能）
CREATE TABLE IF NOT EXISTS comment_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(comment_id, user_id)
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 触发器：自动更新 updated_at (D1 使用不同的语法)
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_comments_updated_at
    AFTER UPDATE ON comments
    FOR EACH ROW
BEGIN
    UPDATE comments SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- 视图：评论与用户信息（用于 API 查询优化）
-- D1 支持视图，但我们需要在查询时动态计算点赞数和回复数
-- 这里创建一个基础视图，统计信息在 API 中动态计算
CREATE VIEW IF NOT EXISTS comments_with_users AS
SELECT
    c.id,
    c.post_id,
    c.parent_id,
    c.content,
    c.html_content,
    c.status,
    c.created_at,
    c.updated_at,
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.avatar_url as user_avatar,
    u.website as user_website
FROM comments c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.status != 'deleted';