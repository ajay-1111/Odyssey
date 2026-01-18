#!/bin/bash

# ============================================
# ODYSSEY FREE DEPLOYMENT SCRIPT
# Deploy your travel app with $0 cost
# ============================================

echo "🚀 Odyssey FREE Deployment Script"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# STEP 1: Prerequisites Check
# ============================================
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "  ✅ $1 is installed"
        return 0
    else
        echo -e "  ❌ $1 is NOT installed"
        return 1
    fi
}

check_command "node"
check_command "npm"
check_command "python3"
check_command "git"

echo ""

# ============================================
# STEP 2: Environment Setup
# ============================================
echo -e "${BLUE}Step 2: Setting up Environment Files${NC}"

# Backend .env
if [ ! -f "/app/backend/.env" ]; then
    cat > /app/backend/.env << 'EOF'
# MongoDB (FREE Atlas Cluster)
MONGO_URL=mongodb+srv://your-connection-string
DB_NAME=odyssey

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=change-this-to-a-secure-random-string

# Emergent LLM Key (for AI features)
EMERGENT_API_KEY=your-emergent-key

# Amadeus Flight API (FREE 2000 calls/month)
AMADEUS_API_KEY=your-amadeus-client-id
AMADEUS_API_SECRET=your-amadeus-client-secret

# Affiliate IDs (Revenue Generation)
BOOKING_AFFILIATE_ID=your-booking-aid

# Stripe (Payment - Optional for MVP)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend URL
FRONTEND_URL=https://your-app.vercel.app
EOF
    echo -e "  ✅ Created /app/backend/.env (UPDATE WITH YOUR VALUES)"
else
    echo -e "  ✅ /app/backend/.env already exists"
fi

# Frontend .env
if [ ! -f "/app/frontend/.env.production" ]; then
    cat > /app/frontend/.env.production << 'EOF'
# Production Backend URL (Railway/Render)
REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
EOF
    echo -e "  ✅ Created /app/frontend/.env.production (UPDATE WITH YOUR BACKEND URL)"
else
    echo -e "  ✅ /app/frontend/.env.production already exists"
fi

echo ""

# ============================================
# STEP 3: Build Frontend
# ============================================
echo -e "${BLUE}Step 3: Building Frontend for Production${NC}"

cd /app/frontend

# Install dependencies
echo "  📦 Installing dependencies..."
npm install --silent 2>/dev/null

# Build
echo "  🔨 Building production bundle..."
npm run build 2>/dev/null

if [ -d "build" ]; then
    echo -e "  ✅ Frontend built successfully!"
    echo "  📁 Output: /app/frontend/build"
else
    echo -e "  ⚠️ Build may have warnings, check above"
fi

echo ""

# ============================================
# STEP 4: Deployment Instructions
# ============================================
echo -e "${BLUE}Step 4: Deployment Options${NC}"
echo ""

echo -e "${GREEN}=== OPTION A: Vercel (Frontend) - RECOMMENDED ===${NC}"
echo "
1. Install Vercel CLI:
   npm i -g vercel

2. Deploy:
   cd /app/frontend
   vercel --prod

3. Set environment variable in Vercel dashboard:
   REACT_APP_BACKEND_URL = your-backend-url
"

echo -e "${GREEN}=== OPTION B: Railway.app (Backend) - RECOMMENDED ===${NC}"
echo "
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repository
5. Add environment variables from .env
6. Deploy!

Railway gives you \$5 FREE credit/month
"

echo -e "${GREEN}=== OPTION C: Render.com (Backend Alternative) ===${NC}"
echo "
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Build Command: pip install -r requirements.txt
   - Start Command: uvicorn server:app --host 0.0.0.0 --port \$PORT
5. Add environment variables
6. Deploy!

Render gives 750 FREE hours/month
"

echo -e "${GREEN}=== OPTION D: MongoDB Atlas (Database) ===${NC}"
echo "
1. Go to https://mongodb.com/atlas
2. Create FREE account
3. Create FREE M0 Cluster
4. Database Access → Add User
5. Network Access → Add IP (0.0.0.0/0 for all)
6. Connect → Get connection string
7. Add to MONGO_URL in .env

FREE forever: 512MB storage
"

echo ""

# ============================================
# STEP 5: Quick Start APIs
# ============================================
echo -e "${BLUE}Step 5: Get Your FREE API Keys${NC}"
echo ""

echo "📋 API Registration Links:"
echo ""
echo "1. Amadeus (Flights) - FREE 2,000 calls/month"
echo "   https://developers.amadeus.com"
echo ""
echo "2. Booking.com Affiliate - UNLIMITED, earn commission"
echo "   https://www.booking.com/affiliate-program"
echo ""
echo "3. ExchangeRate-API (Currency) - FREE 1,500 calls/month"
echo "   https://www.exchangerate-api.com"
echo ""
echo "4. Stripe (Payments) - Pay only on transactions"
echo "   https://stripe.com"
echo ""

# ============================================
# STEP 6: Vercel Deployment (Automated)
# ============================================
echo -e "${BLUE}Step 6: Quick Vercel Deployment${NC}"
echo ""

# Check if vercel is installed
if command -v vercel &> /dev/null; then
    echo "Vercel CLI is installed."
    read -p "Deploy frontend to Vercel now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd /app/frontend
        echo "Deploying to Vercel..."
        vercel --prod
    fi
else
    echo "To deploy automatically, install Vercel CLI:"
    echo "  npm i -g vercel"
fi

echo ""
echo "============================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "============================================"
echo ""
echo "Next Steps:"
echo "1. Update .env files with your API keys"
echo "2. Deploy backend to Railway/Render"
echo "3. Deploy frontend to Vercel"
echo "4. Update REACT_APP_BACKEND_URL"
echo "5. Test your deployed app!"
echo ""
echo "Need help? Check these files:"
echo "  - /app/PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "  - /app/API_INTEGRATION_GUIDE.md"
echo ""
echo "Happy launching! 🚀"
