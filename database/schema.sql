-- Vercel Postgres 评论系统数据库 Schema
-- 适配 Astro + Cloudflare Functions 架构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    website VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(255) NOT NULL, -- 对应博客文章的 identifier
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- 支持嵌套回复
    content TEXT NOT NULL,
    html_content TEXT, -- 处理后的 HTML 内容
    status VARCHAR(20) DEFAULT 'published', -- published, pending, deleted
    ip_address INET, -- 用于反垃圾
    user_agent TEXT, -- 用于反垃圾
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 索引优化
    INDEX idx_comments_post_id (post_id),
    INDEX idx_comments_user_id (user_id),
    INDEX idx_comments_parent_id (parent_id),
    INDEX idx_comments_status (status),
    INDEX idx_comments_created_at (created_at)
);

-- 会话表（用于用户登录状态管理）
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论点赞表（可选功能）
CREATE TABLE IF NOT EXISTS comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 视图：评论与用户信息（用于 API 查询优化）
CREATE OR REPLACE VIEW comments_with_users AS
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
    u.website as user_website,
    -- 计算点赞数
    (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count,
    -- 计算回复数
    (SELECT COUNT(*) FROM comments cr WHERE cr.parent_id = c.id AND cr.status = 'published') as reply_count
FROM comments c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.status != 'deleted';

-- 初始化数据（可选：创建管理员用户）
-- INSERT INTO users (email, name, bio) VALUES
-- ('admin@yourblog.com', 'Blog Admin', '博客管理员')
-- ON CONFLICT (email) DO NOTHING;