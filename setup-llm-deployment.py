#!/usr/bin/env python3
"""
Quick LLM Deployment Setup for Ahmad Store
This script helps you deploy the LLM service and get the endpoint URL
"""

import subprocess
import sys
import time
import requests
from pyngrok import ngrok

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", 
                             "transformers", "torch", "sentence-transformers", 
                             "faiss-cpu", "fastapi", "uvicorn", "pyngrok", 
                             "nest-asyncio", "accelerate", "bitsandbytes"])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def start_llm_service():
    """Start the LLM service"""
    print("🚀 Starting LLM service...")
    try:
        # Import and run the LLM service
        from llm_deployment_optimized import app
        import uvicorn
        import threading
        
        # Start the service in a separate thread
        def run_server():
            uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
        
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        
        # Wait a moment for the server to start
        time.sleep(5)
        print("✅ LLM service started on port 8000")
        return True
    except Exception as e:
        print(f"❌ Failed to start LLM service: {e}")
        return False

def create_ngrok_tunnel():
    """Create ngrok tunnel"""
    print("🌐 Creating ngrok tunnel...")
    try:
        # Create tunnel
        tunnel = ngrok.connect(8000)
        public_url = tunnel.public_url
        print(f"✅ Ngrok tunnel created: {public_url}")
        return public_url
    except Exception as e:
        print(f"❌ Failed to create ngrok tunnel: {e}")
        return None

def test_endpoint(url):
    """Test the LLM endpoint"""
    print("🧪 Testing LLM endpoint...")
    try:
        response = requests.post(f"{url}/generate", 
                               json={"prompt": "Hello, how are you?", "max_tokens": 50},
                               timeout=30)
        if response.status_code == 200:
            print("✅ LLM endpoint is working!")
            return True
        else:
            print(f"❌ LLM endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Failed to test LLM endpoint: {e}")
        return False

def main():
    print("🎯 Ahmad Store LLM Deployment Setup")
    print("=" * 50)
    
    # Step 1: Install dependencies
    if not install_dependencies():
        return
    
    # Step 2: Start LLM service
    if not start_llm_service():
        return
    
    # Step 3: Create ngrok tunnel
    public_url = create_ngrok_tunnel()
    if not public_url:
        return
    
    # Step 4: Test endpoint
    if not test_endpoint(public_url):
        print("⚠️  LLM endpoint test failed, but tunnel is created")
    
    # Step 5: Show configuration
    print("\n" + "=" * 50)
    print("🎉 LLM Deployment Complete!")
    print("=" * 50)
    print(f"🌐 Public URL: {public_url}")
    print(f"🔗 Generate endpoint: {public_url}/generate")
    print(f"🔗 Chat endpoint: {public_url}/chat")
    print("\n📝 Next Steps:")
    print("1. Copy the URL above")
    print("2. Update your Render deployment with:")
    print(f"   LLM_ENDPOINT={public_url}")
    print("3. Redeploy your backend service")
    print("\n⚠️  Keep this terminal open to maintain the tunnel!")

if __name__ == "__main__":
    main()