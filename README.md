# Tnalp — Plant Store

Tnalp is a full-stack e-commerce demo for a Thai plant and planter shop. The name is “plant” backwards. Browse products, place an order, and manage the store through an admin dashboard.

## Demo videos

| Flow | Recording |
| --- | --- |
| Storefront and cart | [Watch demo](screenshots/demo-storefront.webm) |
| Checkout and PromptPay instructions | [Watch demo](screenshots/demo-checkout.webm) |
| Admin dashboard and management pages | [Watch demo](screenshots/demo-admin.webm) |

## Features

- Product catalog with search, categories, ratings, and reviews
- Shopping cart, customer accounts, shipping details, and order history
- PromptPay checkout screen with payment-proof upload and manual admin review
- Admin dashboard for sales, products, orders, and users
- JWT authentication with customer/admin roles and bcrypt password hashes

## Tech stack

- **Frontend:** React 18, Create React App 5, React Router 6, React-Bootstrap, Axios
- **Backend:** Node.js, Express 4, Mongoose 7, JWT, bcryptjs, and Multer
- **Database:** MongoDB

## Run locally

You need Node.js 22, npm, and MongoDB running locally. The default MongoDB connection is `mongodb://localhost:27017/tnalp`.

1. Clone the repository and create the backend environment file:

   ```bash
   git clone https://github.com/8818x/Tnalp.git
   cd Tnalp/backend
   cp .env.example .env
   npm install
   ```

2. In the `backend` directory, edit `.env` and replace `JWT_SECRET` with a random secret. For a new demo database, seed the sample products and accounts once:

   ```bash
   node seed.js
   npm start
   ```

3. In a second terminal, start the frontend:

   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm start
   ```

Open [http://localhost:3000](http://localhost:3000). The API listens on port `9002`; the frontend development server proxies `/api` and `/uploads` to it.

> [!WARNING]
> `node seed.js` replaces every record in the MongoDB `products` and `users` collections. It leaves orders in place, so existing orders may refer to replaced users or products. Run it only against a disposable local database. The admin-only `GET /api/seed` endpoint has the same effect.

> [!NOTE]
> Create React App 5 may need the legacy OpenSSL provider on Node.js 22. If `npm start` fails with `ERR_OSSL_EVP_UNSUPPORTED`, set `NODE_OPTIONS=--openssl-legacy-provider` before starting the frontend. In PowerShell, run `$env:NODE_OPTIONS = "--openssl-legacy-provider"` first.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `9002` | Backend API port |
| `MONGODB_URI` | `mongodb://localhost:27017/tnalp` | MongoDB connection string |
| `JWT_SECRET` | `change-me` in the example file | Secret used to sign authentication tokens; replace it before running |

If you change the backend port, update the `proxy` value in `frontend/package.json` as well.

### Demo accounts

The seed script creates these local demo users:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tnalp.com` | `admin1234` |
| Customer | `user@tnalp.com` | `user1234` |

> [!IMPORTANT]
> These credentials are for local demonstrations only. Change or remove them before deploying the app anywhere accessible to other people.

## Payment and uploads

The checkout displays a static sample PromptPay QR code and example account details. It does not connect to a payment gateway or verify transfers. Customers can upload a JPG, PNG, or WebP payment slip (up to 5 MB); an admin reviews it and marks the order as paid.

Uploaded files are stored on the backend's local disk in `backend/uploads/` and served from `/uploads`. Use persistent, access-controlled object storage for a deployed environment.

## API overview

All API routes are served by the backend under `/api`.

| Route | Access | Purpose |
| --- | --- | --- |
| `POST /api/users/signin`, `POST /api/users/signup` | Public | Sign in or create an account |
| `GET /api/products`, `GET /api/products/search`, `GET /api/products/categories` | Public | Browse and search the catalog |
| `POST /api/orders`, `GET /api/orders/myorders`, `GET /api/orders/:id` | Signed-in user (owner/admin for order details) | Create and view orders |
| `POST /api/upload`, `PUT /api/orders/:id/upload` | Signed-in user | Upload and submit payment proof |
| `GET /api/orders`, `GET /api/orders/summary` | Admin | Review orders and dashboard totals |
| `PUT /api/orders/:id/pay` | Admin | Confirm payment after manual review |
| `GET /api/seed` | Admin | Replace seeded products and users; destructive |

## Build and test

To serve the built React app and API from the same Express process, build the frontend and start the backend (with MongoDB running and `backend/.env` configured):

```bash
cd frontend
npm run build

cd ../backend
npm start
```

Open [http://localhost:9002](http://localhost:9002). Express serves `frontend/build` and the API from the same port.

Run the frontend tests separately with:

```bash
cd frontend
npm test -- --watchAll=false
```
