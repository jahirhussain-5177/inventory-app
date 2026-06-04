# Setup Guide

## 1. Supabase (free cloud database)

1. Go to https://supabase.com and sign up (free)
2. Click **New project** → pick a name → set a database password → choose region nearest you → wait ~2 min
3. In the left sidebar, click **SQL Editor** → **New query**
4. Paste this query and click **Run**:

```sql
create table records (
  id text primary key,
  partNumber text not null,
  partName text not null,
  model text,
  chassis text,
  quantity integer default 1,
  availabilityStatus text default '',
  typeOfWork text,
  counterSaleNumber text,
  workOrderNumber text,
  province text default '',
  received boolean default false,
  receivedDate text,
  createdDate text
);
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON records FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON records TO anon;

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_users" ON users FOR SELECT USING (true);
GRANT SELECT ON users TO anon;

INSERT INTO users (username, password) VALUES ('admin', 'admin123');

CREATE TABLE IF NOT EXISTS master_models (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS master_provinces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
INSERT INTO master_models (name) VALUES
  ('Falcon - E1'),
  ('Falcon - E2'),
  ('Falcon - E3'),
  ('Falcon - E4'),
  ('Falcon - E5'),
  ('Falcon-JTAC/YANMAR'),
  ('Falcon-Spheros/VALEO'),
  ('FALCON NON-AC'),
  ('FALCON KBAUTO'),
  ('PARTNER'),
  ('GAZL-JTAC'),
  ('GAZL-VALEO'),
  ('OYSTER-JTAC'),
  ('OYSTER-VALEO'),
  ('BOSS'),
  ('TRUCK 1518'),
  ('TRUCK 9016'),
  ('TRUCK 1618'),
  ('CMC Freezer van 1.2'),
  ('CMC Freezer van 1.3'),
  ('CMC Freezer van 1.5'),
  ('CMC Panel Van 1.3'),
  ('CMC Panel Van 1.5'),
  ('CMC D260'),
  ('CMC D270'),
  ('CMC Z7');

INSERT INTO master_provinces (name) VALUES
  ('Dammam Branch'),
  ('Dammam CPD-523'),
  ('Jubail'),
  ('Jeddah'),
  ('Tabuk');

ALTER TABLE master_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON master_models FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON master_models TO anon;
ALTER TABLE master_provinces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON master_provinces FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON master_provinces TO anon;
```

## 2. Get API keys

1. Go to left sidebar → **Project Settings** → **API**
2. Copy the **Project URL** (looks like `https://xxx.supabase.co`)
3. Copy the **anon public** key (starts with **`eyJ...`** — not `sb_publishable_...`)

## 3. Update config

The Supabase URL and anon key are already set in `index.html` and `login.html` inside the `<script id="supabase-config">` block. If you ever need to change them, update both files.

## 4. Deploy to GitHub Pages

1. Create a public GitHub repository (e.g. `inventory-app`)
2. Set the remote:
   ```bash
   git remote set-url origin https://github.com/jahirhussain-5177/inventory-app.git
   git push -u origin main
   ```
3. In your repo on GitHub → **Settings** → **Pages** → under "Branch" select `main` → **Save**
4. Wait 1-2 minutes. Your app is at `https://jahirhussain-5177.github.io/inventory-app/`

## 5. Install on mobile

1. Open the GitHub Pages URL in Chrome on Android
2. You'll see an **Install** banner at the bottom, or tap the menu → **Add to Home screen**
3. The app opens like a native app with teal icon
