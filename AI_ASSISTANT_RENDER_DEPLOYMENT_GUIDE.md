# AI Assistant Render Deployment Guide

## Issues Fixed

This script has fixed the following common deployment issues:

1. ✅ **Node.js Engine Compatibility** - Updated package.json to support Node 20+
2. ✅ **Environment Variables** - Created comprehensive .env template
3. ✅ **Render Configuration** - Updated render.yaml with proper settings
4. ✅ **Dependencies** - Ensured all required packages are installed
5. ✅ **CORS Configuration** - Set up proper CORS origins
6. ✅ **Health Checks** - Configured proper health check endpoint

## Deployment Steps

### 1. Set Up MongoDB Atlas (Required)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. Get your connection string
5. Update the MONGODB_URI in your Render environment

### 2. Deploy to Render

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Fix AI assistant deployment issues"
   git push origin main
   ```

2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Use these settings:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm ci --only=production`
   - **Start Command**: `node src/server.js`
   - **Health Check Path**: `/api/health`

### 3. Configure Environment Variables

In your Render service, add these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopmart?retryWrites=true&w=majority
NODE_ENV=production
CORS_ORIGINS=https://your-service-name.onrender.com,http://localhost:5173
AUTO_SEED=true
LLM_ENDPOINT=
PORT=3001
```

### 4. Test Your Deployment

After deployment, run the test script:

```bash
# Test locally
node test-ai-assistant-deployment.js

# Test deployed version
API_BASE=https://your-service-name.onrender.com node test-ai-assistant-deployment.js
```

## Optional: Set Up LLM Service

For full AI functionality, you can set up an LLM service:

### Option 1: Google Colab + ngrok (Free)
1. Open `apps/llm_deployment (3).ipynb` in Google Colab
2. Run all cells
3. Copy the ngrok URL
4. Add `LLM_ENDPOINT=https://your-ngrok-url.ngrok-free.app/generate` to Render

### Option 2: Local LLM Service
1. Run `python3 llm_deployment_optimized.py`
2. Copy the generated URL
3. Add to Render environment variables

## Troubleshooting

### Common Issues

1. **"Cannot find module 'express'"**
   - Solution: Dependencies not installed
   - Fix: Run `npm install` in the apps/api directory

2. **"MONGODB_URI environment variable is not set"**
   - Solution: Set up MongoDB Atlas and add the URI to Render

3. **"CORS error"**
   - Solution: Check CORS_ORIGINS in environment variables

4. **"LLM call failed"**
   - Solution: This is normal if LLM_ENDPOINT is not set
   - The assistant will use fallback responses

### Checking Logs

1. Go to your Render service dashboard
2. Click on "Logs" tab
3. Look for these success messages:
   - ✅ "Connected to MongoDB"
   - ✅ "Assistant configuration loaded"
   - ✅ "Knowledge base loaded: X policies"
   - ✅ "Server running on port 3001"

## Expected Behavior

### Without LLM (Fallback Mode)
- ✅ Basic but helpful responses
- ✅ Intent classification works
- ✅ Function calls for orders/products
- ✅ Policy information from knowledge base

### With LLM (Full Mode)
- ✅ Natural, contextual responses
- ✅ Advanced conversation handling
- ✅ Better policy question answers
- ✅ More engaging user experience

## Support

If you encounter issues:
1. Check the deployment logs in Render
2. Run the test script to identify specific problems
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas is accessible from Render

Your AI assistant should now work properly on Render! 🎉
