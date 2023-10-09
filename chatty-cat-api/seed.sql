CREATE TABLE IF NOT EXISTS users ( 
  id TEXT PRIMARY KEY, 
  name TEXT
);

CREATE INDEX IF NOT EXISTS users_name ON users (name);