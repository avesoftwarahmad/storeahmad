# 📦 ShopSmart - E-Commerce Platform Setup Guide

## ⚡ Quick Setup (5 Minutes)

### 1️⃣ Install Dependencies

Open terminal in project root and run:

```bash
# Install backend dependencies
cd apps/api
npm install

# Install frontend dependencies
cd ../storefront
npm install
```

### 2️⃣ Configure MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Add your IP to whitelist (or use 0.0.0.0/0 for all IPs)
4. Get your connection string

### 3️⃣ Configure Environment

Edit `apps/api/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/shopmart
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

### 4️⃣ Seed Database

```bash
cd apps/api
npm run seed
```

### 5️⃣ Start Application

**Terminal 1 - Backend:**
```bash
cd apps/api
npm start
```

**Terminal 2 - Frontend:**
```bash
cd apps/storefront
npm run dev
```

### 6️⃣ Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Admin Dashboard:** http://localhost:5173/admin

## 🧪 Test User

- **Email:** `demouser@example.com`
- Has 3 pre-created orders for testing

## 🔥 Key Features

### Real-Time Order Tracking (SSE)
- Orders automatically progress through statuses
- Live updates without page refresh
- Visual timeline with animations

### Admin Dashboard
- Revenue metrics
- Order management
- Product performance
- API statistics

### Intelligent Assistant
- 7 intent types
- Policy citations
- Function calling
- Context-aware responses

## 📝 API Testing

### Create an Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "507f1f77bcf86cd799439011",
    "items": [
      {"productId": "507f1f77bcf86cd799439012", "quantity": 2}
    ]
  }'
```

### Track Order with SSE
```bash
curl http://localhost:3001/api/orders/ORDER_ID/stream \
  -H "Accept: text/event-stream"
```

## 🔧 Troubleshooting

### MongoDB Connection Failed
- Check IP whitelist includes your IP
- Verify connection string format
- Ensure password has no special characters

### SSE Not Working
- Check browser supports EventSource
- Verify CORS settings
- Look for console errors

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Vite will auto-select next available

## 📚 Project Structure

```
week5-mvp/
├── apps/
│   ├── api/               # Backend (Node.js + Express)
│   │   ├── src/
│   │   │   ├── routes/    # API endpoints
│   │   │   ├── sse/       # Real-time streaming
│   │   │   └── assistant/ # AI assistant
│   │   └── scripts/       # Database seeding
│   │
│   └── storefront/        # Frontend (React + Vite)
│       └── src/
│           ├── components/
│           ├── pages/
│           └── lib/       # API client & SSE
│
├── docs/                  # Documentation
│   ├── prompts.yaml      # Assistant config
│   └── ground-truth.json # Policy knowledge
│
└── tests/                # Test suites
```

## 🚀 Production Deployment

1. **MongoDB Atlas** - Already production-ready
2. **Backend** - Deploy to Render/Railway/Heroku
3. **Frontend** - Deploy to Vercel/Netlify
4. **Environment Variables** - Update URLs for production

## 💡 Tips

- Use Chrome DevTools Network tab to monitor SSE connections
- Check MongoDB Atlas dashboard for database activity
- Use Postman/Insomnia for API testing
- Enable React DevTools for debugging

## 🆘 Support

If you encounter issues:
1. Check console for errors
2. Verify all services are running
3. Confirm environment variables are set
4. Test with the demo user account

---

**Ready to start?** Follow steps 1-6 above and you'll have a fully functional e-commerce platform running locally!
