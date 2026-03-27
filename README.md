# Locapedia — Setup & Deployment Guide

A community database of small-business models.
Stack: Supabase (Postgres) + GitHub Pages (static HTML/JS).

---

## 1. Supabase setup

1. Create a free account at https://supabase.com
2. Create a new project (choose any region; free tier is fine).
3. In the Supabase dashboard, open the **SQL Editor** and run the
   following to create your two tables:

```sql
-- Published / approved business models (public read)
create table business_models (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  name             text,
  description      text,
  sector           text,
  naics            text,
  structure        text,
  ownership        text,
  value_prop       text,
  customers        text,
  channels         text,
  customer_relations text,
  revenue_streams  text,
  activities       text,
  resources        text,
  partnerships     text,
  costs            text
);

-- Pending submissions (awaiting admin review)
create table submissions (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  name             text,
  description      text,
  sector           text,
  naics            text,
  structure        text,
  ownership        text,
  value_prop       text,
  customers        text,
  channels         text,
  customer_relations text,
  revenue_streams  text,
  activities       text,
  resources        text,
  partnerships     text,
  costs            text
);
```

4. Set Row Level Security (RLS) policies in **Authentication → Policies**:

   **business_models table:**
   - Enable RLS.
   - Add policy: `SELECT` for `anon` role, no conditions (public read)
      with `using` set to `true`.
   - Add policy: `INSERT`, `UPDATE`, `DELETE` for `service_role` only.
     (The anon key cannot write to this table — only the admin Supabase
     dashboard or the service key can. The app uses the anon key for reads
     and the Supabase JS client for admin writes — see note below.)

   **submissions table:**
   - Enable RLS.
   - Add policy: `INSERT` for `anon` role (public can submit)
   - Add policy: `SELECT`, `DELETE` for `service_role` only.

   > **Note on admin writes:** For simplicity, the app uses the anon key
   > for all operations. To allow the admin UI to insert/update/delete,
   > you can either:
   > (a) Use the `service_role` key only in `config.js` on a private
   >     server (not GitHub Pages), **or**
   > (b) Add permissive RLS policies gated on a custom claim or header,
   >     **or** (simplest for a small trusted team)
   > (c) Temporarily set permissive RLS during admin operations and
   >     tighten afterwards.
   >
   > For a low-traffic, trusted-admin site, option (c) or simply
   > disabling RLS on admin operations during initial deployment is fine.
   > See SECURITY NOTE below.

5. Copy your **Project URL** and **anon public key** from
   **Settings → API** — you'll need them in the next step.

---

## 2. Configure the app

1. Copy `config.js` and fill in your values:

```js
supabase_url:    "https://YOUR_PROJECT.supabase.co",
supabase_key:    "YOUR_ANON_PUBLIC_KEY",
admin_password:  "choose-a-strong-password",
```

2. **Important:** add `config.js` to your `.gitignore` so the password
   is never committed to GitHub:

```
# .gitignore
config.js
```

3. Keep a local copy of `config.js` safe — you'll need it whenever you
   work on the project locally.

---

## 3. Deploy to GitHub Pages

1. Create a new GitHub repository (public or private).
2. Push all files **except** `config.js` to the repository.
3. In the repo settings → **Pages**, set source to `main` branch, root `/`.
4. GitHub will publish the site at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.
5. When you open the site locally for testing, serve it with a local
   HTTP server (e.g. `python3 -m http.server 8080`) — opening HTML files
   directly as `file://` paths blocks the Supabase client.

---

## 4. Backup and restore

### Backup (from the web UI)
- Log in as admin, scroll to **Database Backup**, and click
  **Download All as JSON**. This saves a dated `.json` file.

### Backup (from the command line)
You can also use the Supabase CLI or `curl`:

```bash
curl "https://YOUR_PROJECT.supabase.co/rest/v1/business_models?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  > locapedia-backup-$(date +%Y-%m-%d).json
```

### Restore from a JSON backup file
Use the Supabase JavaScript client or the REST API to re-insert rows.
A simple restore script (run locally with Node.js):

```js
// restore.mjs
// Usage: node restore.mjs locapedia-backup-2025-01-01.json

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SERVICE_KEY  = "YOUR_SERVICE_ROLE_KEY";   // use service key for restore
const TABLE        = "business_models";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const records  = JSON.parse(readFileSync(process.argv[2], "utf8"));

// Strip auto-generated fields so Supabase generates fresh ones
const clean = records.map(({ id, created_at, ...rest }) => rest);

const { error } = await supabase.from(TABLE).insert(clean);
if (error) { console.error("Restore failed:", error); process.exit(1); }
console.log(`Restored ${clean.length} records to ${TABLE}.`);
```

---

## 5. Customising fields

All field definitions live in `config.js` under the `FIELDS` array.
Each field object has:

| Property       | Description |
|----------------|-------------|
| `key`          | Database column name (must match SQL schema) |
| `label`        | Display label in forms and read-only views |
| `type`         | `"single_line"` or `"multiline"` |
| `mandatory`    | `true` = required on the submission form |
| `simple_search`| `true` = searched and shown in simple search results |
| `section`      | `"core"` or `"canvas"` — controls UI grouping |
| `helper_text`  | Placeholder text in submission form inputs |

If you add or rename fields, also update the SQL `ALTER TABLE` statement
to add the corresponding columns in Supabase.

---

## Security note

The admin password in `config.js` is checked client-side in the browser.
This is adequate for a low-stakes, small-team reference database where the
data is not sensitive. An attacker with access to `config.js` (e.g. from
a CDN cache) could find the password. For stronger security:

- Move admin write operations to a server-side function (e.g. a Supabase
  Edge Function) that verifies the password before calling the service key.
- Or migrate to Supabase Auth for proper user accounts.

For a public reference database of business models, client-side auth is
a reasonable starting point.

---

## File overview

| File                  | Purpose |
|-----------------------|---------|
| `config.js`           | Credentials, field definitions, site config |
| `style.css`           | All shared styles |
| `app.js`              | Supabase client, auth, rendering, search, utilities |
| `index.html`          | Simple search (home page) |
| `advanced-search.html`| Advanced multi-field search |
| `all-objects.html`    | Alphabetical listing of all models |
| `show.html`           | Read-only view of a single model |
| `submit.html`         | Public submission form |
| `admin.html`          | Admin login + dashboard (queue + published list) |
| `review.html`         | Admin review/edit/approve pending submission |
| `edit.html`           | Admin edit/delete published model |
| `README.md`           | This file |
