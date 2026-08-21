-- ==============================================================================
-- SUNDARAM MAHADEO GROUP - SUPABASE POSTGRESQL SCHEMA
-- Execute this entire script in your Supabase SQL Editor (supabase.com -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'EXECUTIVE', -- 'ADMIN', 'EXECUTIVE', 'FIELD_EXEC'
    status TEXT NOT NULL DEFAULT 'PENDING',  -- 'APPROVED', 'ACTIVE', 'PENDING', 'DISABLED'
    current_address TEXT,
    supervisor TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    opening_odometer NUMERIC NOT NULL,
    opening_photo TEXT,
    start_location JSONB,
    start_time TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED'
    visits_count INTEGER DEFAULT 0,
    closing_odometer NUMERIC,
    closing_photo TEXT,
    end_time TIMESTAMPTZ,
    close_location JSONB,
    total_kms NUMERIC DEFAULT 0,
    incentives NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. FIRMS TABLE
CREATE TABLE IF NOT EXISTS firms (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    exec_id TEXT,
    name TEXT NOT NULL,
    gstin TEXT,
    address TEXT,
    phone TEXT,
    contact_person TEXT,
    brands_handled TEXT,
    prices JSONB,
    location JSONB,
    photo TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. VISITS & TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    exec_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    firm_name TEXT NOT NULL,
    purpose TEXT DEFAULT 'Sales',
    product TEXT,
    quantity NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'Bags',
    bag_incentive NUMERIC DEFAULT 0,
    order_value NUMERIC DEFAULT 0,
    collected_amount NUMERIC DEFAULT 0,
    payment_mode TEXT DEFAULT 'Cash',
    txn_id TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    photo TEXT,
    location JSONB,
    products_discussed JSONB,
    status TEXT DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ
);

-- 6. LEDGER ENTRIES TABLE (Financial reconciliation & double-entry auditing)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    firm_name TEXT NOT NULL,
    exec_id TEXT,
    entry_type TEXT NOT NULL, -- 'BILLING', 'COLLECTION', 'EXPENSE', 'SETTLEMENT'
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_mode TEXT,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. APP CONFIGURATION TABLE (Rate multipliers & incentives)
CREATE TABLE IF NOT EXISTS app_config (
    id TEXT PRIMARY KEY DEFAULT 'global',
    km_rate NUMERIC DEFAULT 5,
    fooding_allowance NUMERIC DEFAULT 250,
    incentives JSONB DEFAULT '[
      {"id": "1", "name": "Cement (UltraTech / ACC)", "unit": "Bags", "rate": 10},
      {"id": "2", "name": "TMT Steel (Tata Tiscon / Jindal)", "unit": "MT", "rate": 50},
      {"id": "3", "name": "Pipes & Fittings", "unit": "Pcs", "rate": 10},
      {"id": "4", "name": "Sand & Aggregates", "unit": "CFT", "rate": 2},
      {"id": "5", "name": "Bricks & Blocks", "unit": "Pcs", "rate": 1}
    ]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. INSERT DEFAULT GLOBAL CONFIG
INSERT INTO app_config (id, km_rate, fooding_allowance)
VALUES ('global', 5, 250)
ON CONFLICT (id) DO NOTHING;

-- 9. SEED DEFAULT ADMIN ACCOUNT (Admin ID: 9435188967 | Password: admin123)
-- Password Hash for 'admin123' generated with bcrypt
INSERT INTO users (
    id, full_name, phone_number, email, password_hash, role, status, current_address
) VALUES (
    'admin-0000-0000-0000-000000000001',
    'Sundaram Mahadeo Admin',
    '9435188967',
    'admin@sundarammahadeogroup.com',
    '$2a$10$tZ2EknzD3g3bLdQz95jLreBv6E6XzQ8s0u7c5kG4QxYn3xO5H4u.m',
    'ADMIN',
    'APPROVED',
    'HQ Central Office, Sundaram Mahadeo Group'
) ON CONFLICT (phone_number) DO UPDATE SET 
    role = 'ADMIN',
    status = 'APPROVED';

-- 10. ENABLE ROW LEVEL SECURITY (Optional/Permissive for Backend API access)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow full access through the backend anon/service_role keys
CREATE POLICY "Allow all operations for public/anon backend" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for public/anon backend" ON shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for public/anon backend" ON firms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for public/anon backend" ON visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for public/anon backend" ON ledger_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for public/anon backend" ON app_config FOR ALL USING (true) WITH CHECK (true);
