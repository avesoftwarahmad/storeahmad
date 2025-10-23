# Week 5 MVP - Backend API

RESTful API with MongoDB, real-time SSE streaming, and intelligent assistant.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your MongoDB URI
```

3. Seed database:
```bash
npm run seed
```

4. Start server:
```bash
npm start      # Production
npm run dev    # Development with nodemon
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run seed` - Seed database with test data
- `npm test` - Run tests

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (required)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGINS` - Allowed origins (comma-separated)
- `LLM_ENDPOINT` - Optional LLM service base URL (e.g. https://<ngrok>.ngrok-free.app)

## API Documentation

See main README for endpoint documentation.

## Ngrok + Local LLM (Optional)

You can run a lightweight local LLM and connect it to this backend without code changes. The assistant will use `POST ${LLM_ENDPOINT}/generate` automatically when `LLM_ENDPOINT` is set.

Quick start:

```bash
# From repo root
python3 setup-llm-deployment.py

# Copy the printed ngrok URL, then set:
export LLM_ENDPOINT=https://<your-ngrok>.ngrok-free.app

# Or add it to apps/api/.env and restart the server
```

Manual alternative:

```bash
python3 llm_deployment_optimized.py
```

This starts a FastAPI server on port 8000 and exposes endpoints:
- `POST /generate` (used by the assistant)
- `POST /chat` (RAG demo)

Arabic note: ملاحظة: كل شيء شغال؛ فقط أدخل/فعّل ngrok وسيعمل كل شيء تلقائياً. محلياً يوجد LLM صغير للتجربة.

## Database Schema

### Customers
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `phone`: String
- `address`: String
- `createdAt`: Date
- `updatedAt`: Date

### Products
- `_id`: ObjectId
- `name`: String
- `description`: String
- `price`: Number
- `category`: String
- `tags`: Array
- `imageUrl`: String
- `stock`: Number
- `createdAt`: Date
- `updatedAt`: Date

### Orders
- `_id`: ObjectId
- `customerId`: String
- `customerEmail`: String
- `customerName`: String
- `items`: Array of OrderItems
- `total`: Number
- `status`: String (PENDING/PROCESSING/SHIPPED/DELIVERED)
- `carrier`: String
- `estimatedDelivery`: Date
- `createdAt`: Date
- `updatedAt`: Date
- `statusHistory`: Array
