-- ─────────────────────────────────────────
-- MovieBase — Supabase Schema
-- Paste this entire file into:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- Creates all tables, indexes, and RLS policies in one shot.
-- ─────────────────────────────────────────


-- ═══════════════════════════════════════
-- 1. USERS
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL UNIQUE,        -- Supabase Auth UID
  username         TEXT NOT NULL UNIQUE,         -- lowercase, public-facing
  email            TEXT NOT NULL,
  bio              TEXT,
  avatar_url       TEXT,
  is_public        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT username_lowercase CHECK (username = LOWER(username)),
  CONSTRAINT username_min_length CHECK (LENGTH(username) >= 3),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]+$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_user_id  ON users (user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Auto-update updated_at on every row update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profiles
CREATE POLICY "Public profiles are viewable by anyone"
  ON users FOR SELECT
  USING (is_public = true);

-- Authenticated users can insert their own profile
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON users FOR DELETE
  USING (auth.uid()::text = user_id);


-- ═══════════════════════════════════════
-- 2. USER_MOVIES
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_movies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  movie_id          INTEGER NOT NULL,
  title             TEXT NOT NULL,
  poster_path       TEXT,
  release_year      TEXT,
  media_type        TEXT NOT NULL DEFAULT 'movie',
  category          TEXT NOT NULL,                -- watched | watchlist | favorites
  rating_label      TEXT,                         -- great | good | bad | worst
  rating_value      INTEGER,                      -- 4 | 3 | 2 | 1
  interaction_score INTEGER NOT NULL DEFAULT 0,
  added_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per user+movie — no duplicates
  CONSTRAINT unique_user_movie UNIQUE (user_id, movie_id),

  CONSTRAINT valid_category CHECK (
    category IN ('watched', 'watchlist', 'favorites')
  ),
  CONSTRAINT valid_rating_label CHECK (
    rating_label IS NULL OR rating_label IN ('great', 'good', 'bad', 'worst')
  ),
  CONSTRAINT valid_rating_value CHECK (
    rating_value IS NULL OR rating_value IN (1, 2, 3, 4)
  ),
  CONSTRAINT valid_media_type CHECK (
    media_type IN ('movie', 'tv')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_um_user_id          ON user_movies (user_id);
CREATE INDEX IF NOT EXISTS idx_um_movie_id         ON user_movies (movie_id);
CREATE INDEX IF NOT EXISTS idx_um_category         ON user_movies (category);
CREATE INDEX IF NOT EXISTS idx_um_user_category    ON user_movies (user_id, category);
CREATE INDEX IF NOT EXISTS idx_um_user_rating      ON user_movies (user_id, rating_value);

-- Auto-update updated_at
CREATE TRIGGER user_movies_updated_at
  BEFORE UPDATE ON user_movies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE user_movies ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for public profile pages)
CREATE POLICY "User movies are publicly readable"
  ON user_movies FOR SELECT
  USING (true);

-- Only owner can insert
CREATE POLICY "Users can insert their own movies"
  ON user_movies FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Only owner can update
CREATE POLICY "Users can update their own movies"
  ON user_movies FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Only owner can delete
CREATE POLICY "Users can delete their own movies"
  ON user_movies FOR DELETE
  USING (auth.uid()::text = user_id);


-- ═══════════════════════════════════════
-- 3. ANALYTICS
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS analytics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event      TEXT NOT NULL,
  value      TEXT NOT NULL,
  movie_id   INTEGER,
  user_id    TEXT,
  session_id TEXT,
  metadata   JSONB,           -- flexible JSON — no string encoding needed
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event    ON analytics (event);
CREATE INDEX IF NOT EXISTS idx_analytics_movie_id ON analytics (movie_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ts       ON analytics (timestamp DESC);

-- Row Level Security
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert analytics events
CREATE POLICY "Anyone can insert analytics"
  ON analytics FOR INSERT
  WITH CHECK (true);

-- Only service role (admin) can read analytics
CREATE POLICY "Only admins can read analytics"
  ON analytics FOR SELECT
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────
-- Done! All tables, indexes and RLS policies created.
-- ─────────────────────────────────────────