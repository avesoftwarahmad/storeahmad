# 🚀 Complete LLM Deployment Guide: Google Colab + ngrok + Render

This guide will help you deploy your own LLM and integrate it with your website's AI assistant.

## 📋 Prerequisites

1. **Google Colab Account** (free tier works)
2. **ngrok Account** (free tier available)
3. **Render Account** (for your backend)
4. **Your website already deployed** (frontend + backend)

## 🎯 Step-by-Step Deployment

### Step 1: Deploy LLM on Google Colab

1. **Open Google Colab** and create a new notebook
2. **Enable GPU** (Runtime → Change runtime type → GPU T4)
3. **Run the installation cell first:**

```python
# Install dependencies
!pip install -q transformers torch sentence-transformers faiss-cpu
!pip install -q fastapi uvicorn pyngrok nest-asyncio
!pip install -q accelerate bitsandbytes
```

4. **Upload and run the deployment script:**

```python
# Copy the content from llm_deployment_optimized.py
# Or run it directly in Colab cells
```

5. **Get your ngrok token:**
   - Go to [ngrok.com](https://ngrok.com)
   - Sign up/login
   - Go to "Your Authtoken" section
   - Copy your token

6. **Run the script and enter your ngrok token when prompted**

### Step 2: Get Your ngrok URL

After running the script, you'll get output like:
```
✅ API is live at: https://abc123.ngrok-free.app
🔧 Add this to your Render environment:
LLM_ENDPOINT=https://abc123.ngrok-free.app/generate
```

**Copy this URL!** You'll need it for the next step.

### Step 3: Configure Your Render Backend

1. **Go to your Render dashboard**
2. **Find your backend service**
3. **Go to Environment tab**
4. **Add/Update this environment variable:**

```
LLM_ENDPOINT=https://your-ngrok-url.ngrok-free.app/generate
```

5. **Save and redeploy** your backend service

### Step 4: Test the Integration

1. **Test the LLM endpoint directly:**
```bash
curl -X POST "https://your-ngrok-url.ngrok-free.app/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how can I help you?", "max_tokens": 50}'
```

2. **Test through your website:**
   - Go to your website
   - Open the AI assistant
   - Ask a question like "How do I register for an account?"

## 🔧 How It Works

### Your Current Setup
- **Frontend**: React app with AI assistant component
- **Backend**: Node.js API with assistant engine
- **LLM Integration**: Backend calls your custom LLM via `LLM_ENDPOINT`

### The Flow
1. User asks question in AI assistant
2. Frontend sends to backend `/api/assistant/chat`
3. Backend processes intent and calls your LLM
4. Your LLM (in Colab) generates response
5. Response sent back to user

### Key Files in Your Setup
- `apps/api/src/assistant/engine.js` - Main assistant logic
- `apps/storefront/src/assistant/engine.ts` - Frontend assistant
- `apps/api/env.example` - Environment configuration

## 🎛️ Configuration Details

### Backend Configuration
Your backend expects the LLM to respond to POST requests at `/generate` with this format:

**Request:**
```json
{
  "prompt": "Your prompt here",
  "max_tokens": 200,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "text": "Generated response text"
}
```

### Environment Variables
In your Render backend, set:
```
LLM_ENDPOINT=https://your-ngrok-url.ngrok-free.app/generate
```

## 🚨 Important Notes

### ngrok Limitations
- **Free tier**: URL changes every time you restart
- **Solution**: Use ngrok paid plan for static URLs, or update Render env each time

### Colab Limitations
- **Session timeout**: Colab sessions expire after inactivity
- **Solution**: Keep the tab active or use Colab Pro

### Memory Management
- **GPU memory**: Large models might not fit
- **Solution**: Use quantization (already included in script)

## 🔄 Keeping It Running

### Option 1: Manual (Free)
1. Keep Colab tab open
2. Update ngrok URL in Render when it changes
3. Restart if Colab session expires

### Option 2: Automated (Paid)
1. Use ngrok paid plan for static URLs
2. Use Colab Pro for longer sessions
3. Set up monitoring/alerting

## 🧪 Testing Your Setup

### Test 1: Direct LLM Test
```bash
curl -X POST "https://your-ngrok-url.ngrok-free.app/health"
```

### Test 2: Generation Test
```bash
curl -X POST "https://your-ngrok-url.ngrok-free.app/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tell me about Shoplite registration", "max_tokens": 100}'
```

### Test 3: Website Integration
1. Go to your website
2. Open AI assistant
3. Ask: "How do I register for an account?"
4. Should get a response about Shoplite registration

## 🎉 Success Indicators

✅ **LLM endpoint responds to health checks**
✅ **Generation endpoint returns text**
✅ **Website AI assistant works**
✅ **Responses are relevant to Shoplite**

## 🆘 Troubleshooting

### Common Issues

1. **"LLM call failed" error**
   - Check ngrok URL is correct
   - Verify LLM_ENDPOINT in Render
   - Test endpoint directly

2. **Empty responses**
   - Check Colab is still running
   - Verify model loaded correctly
   - Check GPU memory

3. **CORS errors**
   - ngrok handles CORS automatically
   - Check your backend CORS settings

4. **Timeout errors**
   - Increase timeout in backend
   - Check Colab session is active

### Getting Help
- Check the logs in Colab
- Check Render deployment logs
- Test each component separately

## 🚀 Next Steps

Once working, you can:
1. **Customize the knowledge base** with your specific content
2. **Fine-tune the model** for better responses
3. **Add more endpoints** for different use cases
4. **Implement caching** for better performance
5. **Add monitoring** and analytics

---

**🎯 You now have your own LLM integrated with your website's AI assistant!**