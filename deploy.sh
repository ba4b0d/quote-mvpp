#!/bin/bash

# quote-mvpp v2 Deployment Script
# Easy deployment for quote-mvpp v2 3D printing quotation system
# Usage: ./deploy.sh

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load configuration
if [ -f ".env" ]; then
    source .env
else
    echo -e "${RED}ERROR: .env file not found! Copy .env.example to .env and configure it.${NC}"
    exit 1
fi

echo -e "${GREEN}Deploying quote-mvpp v2 to $DOMAIN${NC}"
echo "Backend port: $BACKEND_PORT"
echo "Project dir: $PROJECT_DIR"

# Function to run sudo commands with PATH preserved
run_sudo() {
    if [ "$EUID" -eq 0 ]; then
        eval "$@"
    else
        sudo -E env "PATH=$PATH" "$@"
    fi
}

# Ensure /tmp is writable
chmod 1777 /tmp 2>/dev/null || true

# ============================================
# Step 1: Install Node.js (skip if already installed)
# ============================================
echo -e "\n${YELLOW}Step 1: Checking Node.js...${NC}"

if command -v node &> /dev/null; then
    echo -e "${GREEN}Node.js already installed: $(node --version)${NC}"
else
    echo "Installing Node.js..."
    NODE_VERSION="v22.12.0"
    
    # Download
    wget -q "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" -O "/tmp/node-$NODE_VERSION-linux-x64.tar.xz"
    
    # Extract
    tar -xJf "/tmp/node-$NODE_VERSION-linux-x64.tar.xz" -C /tmp
    
    # Move to /usr/local
    run_sudo mv "/tmp/node-$NODE_VERSION-linux-x64" /usr/local/
    run_sudo ln -sf "/usr/local/node-$NODE_VERSION-linux-x64/bin/node" /usr/local/bin/node
    run_sudo ln -sf "/usr/local/node-$NODE_VERSION-linux-x64/bin/npm" /usr/local/bin/npm
    
    # Cleanup
    rm -f "/tmp/node-$NODE_VERSION-linux-x64.tar.xz"
    
    echo -e "${GREEN}Node.js installed: $(node --version)${NC}"
fi

# Verify npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm not found after installation!${NC}"
    exit 1
fi

# ============================================
# Step 2: Install Python dependencies
# ============================================
echo -e "\n${YELLOW}Step 2: Installing Python dependencies...${NC}"

cd "$BACKEND_DIR"
pip install -q fastapi uvicorn sqlalchemy aiosqlite python-jose passlib[bcrypt] python-multipart

echo -e "${GREEN}Python dependencies installed${NC}"

# ============================================
# Step 3: Build frontend
# ============================================
echo -e "\n${YELLOW}Step 3: Building frontend...${NC}"

cd "$FRONTEND_DIR"

# Fix permissions for node_modules
if [ -d "node_modules" ]; then
    run_sudo chown -R "$USER:$USER" node_modules 2>/dev/null || true
fi

# Install dependencies
if ! npm install --quiet; then
    echo -e "${RED}ERROR: npm install failed!${NC}"
    exit 1
fi

echo -e "${GREEN}npm dependencies installed${NC}"

# Build frontend
if ! npm run build; then
    echo -e "${RED}ERROR: npm run build failed!${NC}"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}ERROR: Frontend build failed - dist/index.html not found!${NC}"
    exit 1
fi

echo -e "${GREEN}Frontend built successfully${NC}"

# ============================================
# Step 4: Create nginx config
# ============================================
echo -e "\n${YELLOW}Step 4: Creating nginx config...${NC}"

# Create config in /tmp first
cat > "/tmp/nginx-$DOMAIN.conf" << EOF
server {
  listen 80;
  server_name $DOMAIN;
  return 301 https://\$host\$request_uri;
}

server {
  listen 443 ssl http2;
  server_name $DOMAIN;

  client_max_body_size 100m;

  # SSL certificates
  ssl_certificate $SSL_CERT_PATH;
  ssl_certificate_key $SSL_KEY_PATH;

  # Serve v2 frontend
  root $FRONTEND_DIR/dist;
  index index.html;

  # API -> backend
  location /api/ {
    proxy_pass http://127.0.0.1:$BACKEND_PORT/;
    proxy_http_version 1.1;

    proxy_connect_timeout 60s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # SPA routes
  location / {
    try_files \$uri \$uri/ /index.html;
  }

  # PWA cache control
  location = /index.html { add_header Cache-Control "no-cache"; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
  location = /registerSW.js { add_header Cache-Control "no-cache"; }
}
EOF

# Move to nginx sites-available
if ! run_sudo mv "/tmp/nginx-$DOMAIN.conf" "/etc/nginx/sites-available/$DOMAIN"; then
    echo -e "${RED}ERROR: Failed to create nginx config!${NC}"
    exit 1
fi

# Enable site and disable default
run_sudo ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/"
run_sudo rm -f /etc/nginx/sites-enabled/default

echo -e "${GREEN}Nginx config created for $DOMAIN${NC}"

# ============================================
# Step 5: Create systemd service
# ============================================
echo -e "\n${YELLOW}Step 5: Creating systemd service...${NC}"

# Create service file in /tmp first
cat > /tmp/quote-mvpp.service << EOF
[Unit]
Description=quote-mvpp v2 Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/local/bin/uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Move to systemd
if ! run_sudo mv /tmp/quote-mvpp.service /etc/systemd/system/; then
    echo -e "${RED}ERROR: Failed to create systemd service!${NC}"
    exit 1
fi

run_sudo systemctl daemon-reload
run_sudo systemctl enable quote-mvpp

echo -e "${GREEN}Systemd service created${NC}"

# ============================================
# Step 6: Start services
# ============================================
echo -e "\n${YELLOW}Step 6: Starting services...${NC}"

# Start backend
run_sudo systemctl start quote-mvpp

# Test nginx config and reload
if ! run_sudo nginx -t; then
    echo -e "${RED}ERROR: Nginx config test failed!${NC}"
    exit 1
fi

run_sudo systemctl reload nginx

echo -e "${GREEN}Services started${NC}"

# ============================================
# Step 7: Verify deployment
# ============================================
echo -e "\n${YELLOW}Step 7: Verifying deployment...${NC}"

# Check backend
sleep 2
BACKEND_STATUS=$(curl -s "http://127.0.0.1:$BACKEND_PORT/health" 2>/dev/null || echo "")
if echo "$BACKEND_STATUS" | grep -q "healthy"; then
    echo -e "${GREEN}Backend is healthy${NC}"
else
    echo -e "${RED}Backend health check failed!${NC}"
    echo "Backend status:"
    run_sudo systemctl status quote-mvpp || true
    echo ""
    echo "Backend log:"
    run_sudo journalctl -u quote-mvpp --no-pager -n 20 || true
fi

# Check frontend files
if [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    echo -e "${GREEN}Frontend files exist${NC}"
else
    echo -e "${RED}Frontend files not found!${NC}"
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Summary:"
echo "  Domain:       https://$DOMAIN"
echo "  Backend:      http://127.0.0.1:$BACKEND_PORT"
echo "  API Docs:     https://$DOMAIN/docs"
echo "  Health:       https://$DOMAIN/health"
echo ""
echo "Login credentials:"
echo "  Username:     $ADMIN_USERNAME"
echo "  Password:     $ADMIN_PASSWORD"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status quote-mvpp    # Check backend status"
echo "  sudo systemctl restart quote-mvpp   # Restart backend"
echo "  sudo journalctl -u quote-mvpp -f    # View backend logs"
echo "  sudo nginx -t && sudo systemctl reload nginx  # Reload nginx"
echo ""
