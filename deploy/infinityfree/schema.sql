CREATE TABLE trades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pair VARCHAR(20) NOT NULL,
  quantity DECIMAL(18,8) NOT NULL,
  entry_price DECIMAL(18,8) NOT NULL,
  exit_price DECIMAL(18,8) NOT NULL,
  fees DECIMAL(18,8) NOT NULL DEFAULT 0,
  learnings TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  entry_price DECIMAL(18,8) NOT NULL,
  exit_price DECIMAL(18,8) NOT NULL,
  qty DECIMAL(18,8) NOT NULL,
  pnl DECIMAL(18,8) NOT NULL,
  setup_tag VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at DATE NULL
);

CREATE TABLE simple_earn (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset VARCHAR(30) NOT NULL,
  apr DECIMAL(10,6) NOT NULL,
  start_date DATE NULL,
  status VARCHAR(30) NOT NULL
);

CREATE TABLE market_kline_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  interval_name VARCHAR(10) NOT NULL,
  payload_json MEDIUMTEXT NOT NULL,
  cached_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  UNIQUE KEY uq_symbol_interval (symbol, interval_name),
  KEY idx_expires_at (expires_at)
);
