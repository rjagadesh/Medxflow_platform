# Eirim — Multi-Tenant Platform

A tenant-based product with **role-based access control**, built with a React
frontend, a Django REST backend, and PostgreSQL. It ships with a branded login
screen and a home page that welcomes the signed-in user, with a logout flow.

---

## Architecture

```
Eirim_Product/
├── backend/                 # Django + DRF + JWT + PostgreSQL
│   ├── eirim/               # Project config (settings, urls, wsgi, asgi)
│   ├── accounts/            # Tenancy, users, roles, auth API
│   │   ├── models.py        # Tenant + custom email User + Role
│   │   ├── serializers.py   # Login (JWT), user & tenant serializers
│   │   ├── views.py         # Login / logout / me / tenants / users
│   │   ├── permissions.py   # IsSuperAdmin, IsTenantAdmin
│   │   ├── urls.py          # /api/ routes
│   │   ├── admin.py         # Django admin registration
│   │   └── management/commands/seed_data.py   # Seeds admin + demo tenants
│   ├── licensing/           # License tiers & tenant allocations
│   │   ├── models.py        # LicensePlan (3 tiers) + License allocation
│   │   ├── serializers.py   # Plan, license & allocate serializers
│   │   ├── views.py         # Plans + licenses (allocate = super admin only)
│   │   ├── urls.py          # /api/license-plans, /api/licenses
│   │   ├── admin.py
│   │   └── management/commands/seed_licenses.py  # Seeds 3 tiers + samples
│   ├── voiceai/             # Voice AI agents
│   │   ├── models.py        # VoiceAgent (voice/language/model/prompt config)
│   │   ├── serializers.py   # Agent serializer + option catalogue
│   │   ├── views.py         # Tenant-scoped agent CRUD + /options
│   │   ├── urls.py          # /api/voice-agents
│   │   └── management/commands/seed_agents.py    # Seeds demo agents
│   └── accounts/mfa.py      # TOTP MFA: setup / verify / disable
│   ├── .env                 # Environment config (DB, secrets, CORS)
│   └── requirements.txt
└── frontend/                # React (Vite) + React Router + axios
    ├── src/
    │   ├── api/client.js         # axios instance + JWT refresh
    │   ├── context/AuthContext.jsx
    │   ├── components/           # AppLayout, Sidebar, ProtectedRoute, icons, TenantLicenses
    │   ├── pages/                # Login, Dashboard, VoiceAI, Licenses, Settings
    │   └── styles/global.css     # Eirim green branding
    ├── public/fav.png
    └── vite.config.js            # Proxies /api -> Django :8000
```

### Multi-tenancy model
A single shared PostgreSQL database and schema. Every user belongs to one
`Tenant` (except the platform **super admin**, whose tenant is null). Data is
isolated per organisation at the application layer via the `tenant` foreign key.

### Roles
| Role           | Scope                                                        |
| -------------- | ------------------------------------------------------------ |
| `SUPER_ADMIN`  | Platform owner — sees and manages **all** tenants and users. |
| `TENANT_ADMIN` | Manages users **within their own tenant**.                   |
| `MEMBER`       | Regular end user of a tenant.                                |

---

## Running locally

### 1. Backend (Django, port 8000)
```bash
cd backend
python3 -m venv venv               # first time only
./venv/bin/pip install -r requirements.txt
./venv/bin/python manage.py migrate
./venv/bin/python manage.py seed_data       # creates admin + demo tenants
./venv/bin/python manage.py seed_licenses   # creates 3 tiers + sample licenses
./venv/bin/python manage.py seed_agents     # creates demo voice agents
./venv/bin/python manage.py seed_connectors # creates connectors + sample skill runs
./venv/bin/python manage.py seed_vault      # creates vault items + file folders
./venv/bin/python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend (React, port 5173)
```bash
cd frontend
npm install                        # first time only
npm run dev
```
Open the URL Vite prints (e.g. http://localhost:5173).

> The Vite dev server proxies all `/api` calls to Django, so no CORS setup is
> needed in development.

---

## Demo accounts (created by `seed_data`)

| Role         | Email                    | Password       |
| ------------ | ------------------------ | -------------- |
| Super Admin  | admin@eirim.io           | Admin@12345    |
| Tenant Admin | admin@acme.eirim.io      | Tenant@12345   |
| Member       | user@acme.eirim.io       | Member@12345   |
| Tenant Admin | admin@globex.eirim.io    | Tenant@12345   |
| Member       | user@globex.eirim.io     | Member@12345   |

Sign in as the **super admin** to see the platform-wide tenant list on the home
page; sign in as a member to see the tenant-scoped experience.

---

## API reference

| Method | Endpoint             | Access            | Purpose                        |
| ------ | -------------------- | ----------------- | ------------------------------ |
| POST   | `/api/auth/register/`| Public            | Sign up: new org + tenant admin |
| POST   | `/api/auth/login/`   | Public            | Email + password (+ otp) → JWT |
| POST   | `/api/auth/refresh/` | Public            | Refresh access token           |
| POST   | `/api/auth/logout/`  | Authenticated     | Log out                        |
| GET    | `/api/me/`           | Authenticated     | Current user's profile         |
| PATCH  | `/api/me/`           | Authenticated     | Update name / upload avatar    |
| POST   | `/api/mfa/setup/`    | Authenticated     | Begin MFA — returns QR + secret |
| POST   | `/api/mfa/verify/`   | Authenticated     | Confirm code, enable MFA       |
| POST   | `/api/mfa/disable/`  | Authenticated     | Disable MFA (needs a code)     |
| GET/POST | `/api/voice-agents/` | Authenticated  | List / create agents (tenant)  |
| GET/PATCH/DELETE | `/api/voice-agents/<id>/` | Authenticated | Manage an agent    |
| GET    | `/api/voice-agents/options/` | Authenticated | Voice/language/model choices |
| GET    | `/api/skills/`       | Authenticated     | Skill catalogue + input schemas |
| POST   | `/api/skills/<slug>/run/` | Authenticated | Run a skill: input → output (logged) |
| GET    | `/api/skill-runs/`   | Authenticated     | Recent runs (tenant-scoped)    |
| GET/POST | `/api/connectors/` | Authenticated     | List / add connectors (MCP or REST) |
| POST   | `/api/connectors/<id>/test/` | Authenticated | Probe & record connection status |
| GET    | `/api/decision-engine/` | Authenticated  | Executive KPIs + recommendations |
| GET/POST | `/api/users/`      | Tenant/Super admin | List / create tenant sub-users |
| GET    | `/api/rbac/catalog/` | Authenticated     | Features + configurable roles  |
| GET/PUT | `/api/rbac/permissions/` | Read: any; Write: tenant admin | Role permission matrix |
| GET    | `/api/rbac/my-permissions/` | Authenticated | Current user's effective perms |
| GET/POST | `/api/dev-chat/`   | Authenticated     | Developer-mode section chat    |
| GET    | `/api/files/browse/` | Authenticated     | Folder contents + breadcrumb   |
| POST   | `/api/files/` · `/api/files/folders/` | Authenticated | Upload file / create folder |
| GET/POST | `/api/vault/items/` | Authenticated    | List (no secrets) / create item |
| GET    | `/api/vault/items/<id>/reveal/` | Authenticated | Decrypt & return one secret |
| GET    | `/api/vault/generate/` | Authenticated  | Strong random password         |

### File Manager

A tenant-scoped file tree: create folders, upload files (multipart), navigate
by breadcrumb, download and delete. Files live under `backend/media/` and are
isolated per tenant. Deleting a record also removes the file from storage.

### Secret Vault (1Password-style)

A password manager with a master list + detail pane. Items have a category
(Login, API Key, Secure Note, Database, …), username, URL, notes and a
**secret**. Secrets are **encrypted at rest** with Fernet
([vault/crypto.py](backend/vault/crypto.py)) — the list never returns them; a
dedicated **reveal** endpoint decrypts one on demand. Includes a **password
generator**. Both features are permissionable via the Roles matrix.

### Roles & access (Settings → Roles)

Tenant admins configure a **permission matrix**: for each feature (Eligibility,
Decision Engine, Connectors, …) and each role (Tenant Admin, Member), toggle
**View / Edit / Delete**. Missing rows fall back to
[rbac/features.py](backend/rbac/features.py) defaults. `my-permissions` returns
the caller's effective grants; the sidebar hides any feature the role can't
**View**. Super Admin always has full access.

### Team (Settings → Team)

Tenant admins create **sub-users** inside their own tenant (name, email,
temporary password, role). New users are auto-scoped to the admin's tenant.

### Developer mode

A **Developer** toggle in the top bar (remembered per browser) opens a
**section-aware chat dock**. The dock derives the current screen from the route
and talks to `/api/dev-chat`, so the assistant's guidance is scoped to that tab
(e.g. "add a field", "restyle the KPI cards"). Conversations are logged per
user + section. The responder in [assistant/reply.py](backend/assistant/reply.py)
is a rule-based scaffold with a clearly marked hook to swap in a live Claude
Messages API call.

### Skills, Connectors & the Decision Engine

**Skills** are the healthcare workflows — Eligibility Verification, Prior
Authorization, Referrals, Claim Submission, Telehealth. Each is defined once in
[skills/registry.py](backend/skills/registry.py) with its input fields and a
`run(data, context)` function, so **every skill takes input and returns
structured output** and its UI form is generated automatically. Every run is
logged as a `SkillRun` (tenant-scoped).

**Connectors** are reusable integrations — an **MCP server** or a **REST API** —
that skills can run "through" (choose one in a skill's *Run via connector*
field). API keys are write-only. A *Test* action probes the endpoint and records
a live status.

**Decision Engine** rolls every skill run up into executive KPIs (success rate,
volume, revenue processed) with a per-workflow breakdown and rule-based
recommendations — the leadership view.

> Skill runners are **schema-driven**: add a skill to the registry on the
> backend and its menu form + output panel appear on the frontend with no UI
> changes. Runners currently return deterministic simulated results; swap a
> `run` body for a real API/MCP call to go live.
| GET    | `/api/tenants/`      | Super admin       | List all tenants               |
| GET    | `/api/users/`        | Tenant/Super admin | List users (tenant-scoped)    |
| GET    | `/api/license-plans/`| Authenticated     | The three license tiers        |
| GET    | `/api/licenses/`     | Scoped by role    | Super admin: all; tenant: own  |
| POST   | `/api/licenses/`     | **Super admin**   | Allocate a license to a tenant |
| PATCH/DELETE | `/api/licenses/<id>/` | **Super admin** | Update / revoke a license   |

### Licensing

Three tiers ship seeded: **Basic** (5 seats, free), **Professional**
(25 seats, $49/mo) and **Enterprise** (100 seats, $199/mo). A tenant can hold
**multiple** licenses at once. **Only the super admin can allocate or revoke**
licenses — enforced server-side (`IsSuperAdmin` on POST/PATCH/DELETE) and in the
UI (the "Licenses" page and nav link are super-admin only). Tenant users see
their own organisation's licenses read-only on the home page.

The Django admin site is available at http://localhost:8000/admin/ using the
super admin credentials.

### Sign-up

`/register` is a public self-service flow: it creates a brand-new **organisation
(tenant)** and makes the registrant its **tenant admin**, then signs them in.

### Security (MFA)

Users can enable **TOTP two-factor auth** from **Settings → Two-factor
authentication**: the backend returns a QR code (a data-URI PNG) + a manual
secret, the user scans it with any authenticator app and confirms one code.
Once enabled, login becomes two-step — password, then a 6-digit code. Enabling
`full_name`/avatar edits never touch role or tenant, and MFA codes are verified
server-side with `pyotp`.

### Profile photos

Avatars upload via multipart `PATCH /api/me` (stored under `backend/media/`,
served by Django in dev). A user's photo — or their initials as a fallback —
appears in the **top-right** of every page and on Settings.

### Voice AI studio

The **Voice AI** page is a no-code studio for building voice agents. "Create
agent" opens a friendly **4-step wizard**:

1. **Identity** — name, personality, description, status.
2. **Voice** — pick a voice, language, and greeting.
3. **Brain** — system prompt, model (Haiku / Sonnet / Opus), and a
   Focused↔Creative temperature slider.
4. **Review** — check everything and launch.

Agents are **tenant-scoped** (each org sees only its own), stored as
`VoiceAgent` records, and editable/deletable through the same wizard.

---

## Configuration

All backend settings are read from `backend/.env`: `SECRET_KEY`, `DEBUG`,
database connection (`DB_*`), `CORS_ALLOWED_ORIGINS`, and the seeded super admin
credentials (`SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`). Change these before
deploying to any real environment.
