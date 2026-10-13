# Tnalp: Project Context

This document summarizes the project context and behavior observed in the source code as of October 14, 2026. It is intended for developers and agents continuing work on the project. Use the vocabulary in [GLOSSARY.md](./GLOSSARY.md) and recheck the source when behavior changes.

## Purpose and Scope

Tnalp is a plant store e-commerce demo and portfolio project. Its name is "plant" spelled backwards. It covers product search, a shopping cart, registration, ordering, payment-slip uploads, product reviews, and an admin dashboard.

The project has one domain context: the plant store. The frontend and backend are technical divisions. Payments use PromptPay transfers with manual slip review. There is no payment gateway integration or automated slip verification service.

## Users and Core Data

- **User / Customer**: A regular user account for buying products, viewing order history, and writing reviews.
- **Admin**: An account with access to product, user, and order management, plus sales summaries.
- **Product**: A catalog entry with a name, slug, image, price, category, brand, stock count, and reviews.
- **Order**: Stores the customer, order items, shipping address, payment method, totals, payment slip, and status flags.
- **Review**: A rating and comment stored within a Product.

The Cart lives in the browser rather than as a database document. Each Order stores item names, images, prices, and quantities at the time of ordering, along with references to Products.

## Structure and Entry Points

| Location | Responsibility |
| --- | --- |
| `backend/server.js` | Loads environment variables, connects to MongoDB, configures Express, and mounts routes |
| `backend/models/` | Mongoose models: User, Product, Order |
| `backend/routes/` | Product, user, order, upload, and seed APIs |
| `backend/utils.js` | JWT creation and the `isAuth` and `isAdmin` middleware |
| `backend/data.js`, `backend/seed.js` | Demo data and the database bootstrap script |
| `backend/uploads/` | Uploaded files stored on disk and served through `/uploads` |
| `frontend/src/index.js`, `frontend/src/App.js` | React entry point, page composition, and routing |
| `frontend/src/Store.js` | React Context and reducer for user and cart state |
| `frontend/src/screens/` | Storefront and checkout screens |
| `frontend/src/management_screens/` | Admin management screens |
| `frontend/src/components/` | Shared components, including route guards |

The backend uses JavaScript ES modules, Express 4, Mongoose 7, bcryptjs, JWT, and Multer. The frontend uses React 18, CRA 5, React Router 6, Axios, and React-Bootstrap. Consult each side's `package.json` for its dependencies and scripts.

## Main Flow

1. Customers browse Products or search by name, category, price range, and rating, with sorting options.
2. They add Products to the Cart, sign in, enter a Shipping Address, and select PromptPay.
3. The Preview Order screen calculates totals and submits data to `POST /api/orders`.
4. The backend saves the Order and starts reducing stock. The frontend clears the Cart and opens the order page.
5. Customers transfer money, upload a slip image through `POST /api/upload`, and attach its URL to the Order through `PUT /api/orders/:id/upload`.
6. Payment confirmation uses `PUT /api/orders/:id/pay`. Recording delivery uses `PUT /api/orders/:id/deliver`.
7. Cancellation uses `PUT /api/orders/:id/cancel`, which marks the Order as canceled and attempts to restore stock.

Uploading a slip and confirming payment are separate steps. The upload API returns `secure_url`, even though the file is stored on local disk.

## Current Rules and Statuses

- Prices are displayed in Thai baht. Items Price is the sum of each unit price multiplied by its quantity.
- Checkout charges 0 baht for shipping when `province === 'Bangkok'`, and 100 baht for any other value. Total Price is Items Price plus Shipping Price.
- The backend accepts prices, quantities, and totals from the request without recalculating prices from Products.
- Orders use independent flags: `isUploaded`, `isPaid`, `isDelivered`, and `isCanceled`, with associated timestamps. No state machine enforces a transition sequence.
- Payment confirmation sets `paymentResult.status` to `accept`. It does not contain a bank verification result.
- The review API prevents duplicate reviews by user name. It does not check whether the reviewer purchased the Product. The overall Rating is the average of all reviews.
- The dashboard sums `totalPrice` across all Orders without filtering for paid Orders or excluding canceled Orders. This figure should not be interpreted as money actually received.

## Authentication and Authorization

JWTs expire after 30 days and contain `_id`, `name`, `email`, and `isAdmin`. Authenticated APIs use the `Authorization: Bearer <token>` header. The frontend stores `userInfo`, including the token, and checkout data in localStorage.

Product and user management, listing all Orders, order summaries, order deletion, and the seed API use both `isAuth` and `isAdmin`.

Reading an Order by ID and the `pay`, `deliver`, `upload`, and `cancel` endpoints check only `isAuth`. They do not check order ownership or Admin privileges, so the API does not fully enforce the intended role boundaries.

## Running Locally

Use MongoDB and the environment variables in `backend/.env.example`: `MONGODB_URI`, `JWT_SECRET`, and `PORT`. The current upload route does not use the example Cloudinary variables.

```powershell
# Terminal 1: from the repository root
cd backend
Copy-Item .env.example .env
# Set JWT_SECRET in .env and ensure MongoDB is available
npm install
node seed.js
npm start
```

```powershell
# Terminal 2: from the repository root
cd frontend
npm install --legacy-peer-deps
# Follow the README run recipe for Node 22 / CRA 5
$env:NODE_OPTIONS = '--openssl-legacy-provider'
npm start
```

The frontend runs at `http://localhost:3000` and proxies API requests to `http://localhost:9002`. The backend defaults to port 9002.

Both `node seed.js` and `GET /api/seed` delete existing Products and Users and recreate demo data without clearing Orders. Reseeding can leave existing Orders referencing deleted records. Use these operations only with a demo database.

## Known Limitations

- Stock reduction and restoration use async callbacks inside `map` without waiting for all operations. There is no transaction to guarantee consistency with the Order.
- Cancellation looks up Products using `item._id`, the Order subdocument ID, rather than `item.product`. This incorrect reference causes problems with stock restoration.
- The API does not enforce status transition conditions or prevent repeated cancellation.
- The upload route does not define file-type filters or a maximum file size. Uploaded files are accessible through static URLs.
- The backend's `test` script does not provide a working test suite. `frontend/src/App.test.js` still contains the CRA template test for `learn react`, rather than a storefront flow test.

These limitations were identified by inspecting source code, not by testing the running system.

## Related Documents

- [GLOSSARY.md](./GLOSSARY.md): Shared business vocabulary.
- [README.md](./README.md): Overview, setup instructions, and demo accounts.
- [DESIGN.md](./DESIGN.md): UI and accessibility guidelines.
- [docs/agents/domain.md](./docs/agents/domain.md): How agents should use domain documentation when exploring the project.

Update CONTEXT.md when flows, pricing rules, statuses, or authorization boundaries change. Update GLOSSARY.md when the meaning of a domain term changes.
