# QR Order System — Olive & Oak

A mini restaurant QR ordering system. Customers scan a table QR code, browse the menu, add items to cart, and complete a simulated payment. Staff manage orders through the admin dashboard.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express + mysql2
- **Database:** MySQL 8

## Getting Started

### 1. Database Setup

```bash
# Create the database and tables
mysql -u root -p < backend/db/schema.sql
```

### 2. Install dependencies

```bash
npm install          # installs root + backend + frontend
```

Or, if you prefer to install each package separately:

```bash
npm run install:all
```

### 3. Backend env

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MySQL credentials
npm run seed         # Seed sample menu items
```

### 4. Run the app

```bash
npm run dev          # Starts API (http://localhost:4000) + frontend (http://localhost:5173)
```

To run only one side:

```bash
npm run dev:backend
npm run dev:frontend
```

## Routes

| URL | Description |
|-----|-------------|
| `/order?table=N` | Customer ordering page (scan QR) |
| `/admin` | Admin dashboard — view & manage orders |
| `/qr-generator` | Generate & download table QR codes |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List available menu items |
| GET | `/api/orders` | List all orders with items |
| POST | `/api/orders` | Create a new order |
| PATCH | `/api/orders/:id` | Update order status |

## Environment Variables (backend/.env)

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=mini_qr_ordering_system
PORT=4000
TAX_RATE=0.12
FRONTEND_URL=http://localhost:5173
```
