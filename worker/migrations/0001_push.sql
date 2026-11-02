CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  subscription TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  advance INTEGER NOT NULL CHECK (advance IN (1, 5, 10, 15, 20)),
  enabled INTEGER NOT NULL DEFAULT 1,
  enabled_at INTEGER NOT NULL,
  revision TEXT NOT NULL,
  last_test INTEGER NOT NULL DEFAULT 0,
  test_due INTEGER
);
CREATE TABLE deliveries (
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  activity_key TEXT NOT NULL,
  claimed_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  PRIMARY KEY (subscription_id, activity_key)
);
CREATE INDEX subscriptions_enabled ON subscriptions(enabled);
