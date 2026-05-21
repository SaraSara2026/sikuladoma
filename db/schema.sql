-- ŠikulaDoma database schema
-- Run with: node scripts/migrate.js

-- ============================================================
-- USERS — zákazníci + šikulové + admin
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('customer','sikula','admin')),
  name            TEXT NOT NULL,
  phone           TEXT,
  city            TEXT,
  avatar          TEXT,
  -- šikula-specific
  ico             TEXT,
  services        TEXT[] DEFAULT '{}',         -- pole category id, např. {'opravy','elektro'}
  plan            TEXT DEFAULT 'start' CHECK (plan IN ('start','plus','profi','top')),
  verified        BOOLEAN DEFAULT FALSE,
  rating          NUMERIC(2,1),
  jobs_count      INTEGER DEFAULT 0,
  bio             TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ============================================================
-- ORDERS — poptávky od zákazníků
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  customer_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  -- kontakt (pro nepřihlášené poptávky)
  customer_name       TEXT NOT NULL,
  customer_email      TEXT NOT NULL,
  customer_phone      TEXT,
  -- detaily
  title               TEXT NOT NULL,
  category            TEXT NOT NULL,
  subcategory         TEXT,
  description         TEXT,
  city                TEXT NOT NULL,
  floor               TEXT,
  parking             TEXT,
  budget              TEXT,
  preferred_date      DATE,
  preferred_time      TEXT,
  gender_preference   TEXT DEFAULT 'jedno' CHECK (gender_preference IN ('jedno','zena','muz')),
  urgent              BOOLEAN DEFAULT FALSE,
  note                TEXT,
  -- stav
  status              TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new','in_progress','accepted','completed','cancelled')),
  accepted_offer_id   INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_city     ON orders(city);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ============================================================
-- OFFERS — nabídky od šikulů na poptávku
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id                SERIAL PRIMARY KEY,
  order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sikula_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price             NUMERIC(10,2) NOT NULL,
  message           TEXT,
  available_date    DATE,
  available_time    TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id, sikula_id)
);

CREATE INDEX IF NOT EXISTS idx_offers_order  ON offers(order_id);
CREATE INDEX IF NOT EXISTS idx_offers_sikula ON offers(sikula_id);

-- FK zpětně z orders na offers (akceptovaná nabídka)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_accepted_offer_fk;
ALTER TABLE orders ADD CONSTRAINT orders_accepted_offer_fk
  FOREIGN KEY (accepted_offer_id) REFERENCES offers(id) ON DELETE SET NULL;

-- ============================================================
-- CONVERSATIONS + MESSAGES — chat
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sikula_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id      INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (customer_id, sikula_id, order_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id                SERIAL PRIMARY KEY,
  conversation_id   INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text              TEXT NOT NULL,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================================
-- INVOICES — faktury
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id              TEXT PRIMARY KEY,                   -- FAK-2025-001
  sikula_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_id        INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  customer_name   TEXT NOT NULL,
  created_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','paid','late')),
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_sikula ON invoices(sikula_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================================
-- MAGIC_LINKS — bezheslové přihlášení odkazem v e-mailu
-- ============================================================
CREATE TABLE IF NOT EXISTS magic_links (
  token       TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);

-- ============================================================
-- CONTACT_MESSAGES — zprávy z kontaktního formuláře
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT,
  message     TEXT NOT NULL,
  handled     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_handled ON contact_messages(handled, created_at);
