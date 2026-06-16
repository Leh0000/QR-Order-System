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

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run seed       # Seed sample menu items
npm run dev        # Start API on http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # Start on http://localhost:5173
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
| PATCH | `/api/orders/:id` | Update order/payment status |

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
