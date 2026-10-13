# Tnalp — Plant Store E-Commerce

Full-stack MERN e-commerce demo: browse plants, manage a cart, place orders, pay by bank transfer with a payment-slip upload, and manage everything from an admin dashboard. ("Tnalp" = "plant" backwards.)

## Features

- JWT auth with user / admin roles (bcrypt-hashed passwords)
- Product catalog with search, categories, and reviews
- Cart, checkout, and order history
- Payment-slip upload — admin reviews the slip and marks the order paid (manual verification by design, modeled on Thai bank-transfer flows)
- Admin dashboard: products, orders, users, sales summary charts
- Image uploads stored on the server's disk (`backend/uploads/`, served at `/uploads`)

## Tech Stack

React 18 (CRA 5) · React Router 6 · React-Bootstrap · Express 4 · Mongoose 7 · MongoDB · JWT · Multer

## Quick Start

Requirements: **Node 22** (older Node needs no OpenSSL flag but is untested), **MongoDB** listening on `localhost:27017` (any local install works), Git Bash / PowerShell.

```bash
git clone https://github.com/8818x/Tnalp.git
cd Tnalp

# 1. Backend
cd backend
cp .env.example .env          # then edit JWT_SECRET
npm install
node seed.js                  # seed products + demo users (one-time)

# 2. Frontend (second terminal)
cd frontend
npm install --legacy-peer-deps
npm start
```

Node 22 note: react-scripts 5 needs the legacy OpenSSL provider. Either set it per shell
(`NODE_OPTIONS=--openssl-legacy-provider npm start`) or persist it in `frontend/.env`:

```
NODE_OPTIONS=--openssl-legacy-provider
```

Open http://localhost:3000 (backend serves the API on http://localhost:9002; the CRA dev server proxies `/api` and `/uploads`).

### Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tnalp.com` | `admin1234` |
| Customer | `user@tnalp.com` | `user1234` |

Re-seed anytime with `node seed.js` from `backend/` (wipes products and users).

## API Overview

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /api/users/signin`, `/signup` | public | auth |
| `GET /api/products`, `/api/products/:id` | public | catalog |
| `POST /api/orders`, `GET /api/orders/myorders` | user | orders |
| `PUT /api/orders/:id/upload` | user | attach payment slip |
| `POST /api/upload` | user | image upload → `{ secure_url }` |
| `PUT /api/orders/:id/pay` | user | admin confirms payment |
| `GET /api/orders`, `/api/orders/summary` | admin | management |
| `GET /api/seed` | admin | reset + reseed |

## Known Limitations (by design)

- Payment is **manual slip review**, not a payment gateway — the admin sees the uploaded slip and confirms. Automated slip verification (e.g. PromptPay API) is the natural next step.
- Uploads live on local disk; a production deployment needs object storage (S3/Cloudinary).
- CRA 5 is in maintenance mode; a Vite migration is straightforward but out of scope here.
- No automated tests.
