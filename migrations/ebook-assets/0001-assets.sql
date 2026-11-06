CREATE TABLE IF NOT EXISTS ebook_assets (
  sha256 TEXT PRIMARY KEY CHECK(length(sha256) = 64),
  mime_type TEXT NOT NULL CHECK(mime_type = 'image/webp'),
  byte_length INTEGER NOT NULL CHECK(byte_length > 12 AND byte_length <= 1500000),
  width INTEGER NOT NULL CHECK(width > 0 AND width <= 8192),
  height INTEGER NOT NULL CHECK(height > 0 AND height <= 8192),
  body BLOB NOT NULL CHECK(length(body) = byte_length),
  published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0, 1)),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS ebook_asset_daily_usage (
  day TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0 CHECK(requests >= 0)
) STRICT;
