#!/bin/bash

# =============================================================================
# Initial SSL Certificate Setup Script
# Run this ONCE on your server to get your first Let's Encrypt certificate
# =============================================================================

# Configuration - CHANGE THESE!
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting SSL certificate setup for ${DOMAIN}${NC}"

# Create required directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Step 1: Create a temporary nginx config for initial certificate
echo -e "${GREEN}Step 1: Creating temporary nginx configuration...${NC}"

cat > nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

# Replace placeholder with actual domain
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN} www.${DOMAIN}/g" nginx/conf.d/default.conf

# Step 2: Start nginx
echo -e "${GREEN}Step 2: Starting nginx...${NC}"
docker compose up -d nginx

# Wait for nginx to start
sleep 5

# Step 3: Get the certificate
echo -e "${GREEN}Step 3: Requesting SSL certificate from Let's Encrypt...${NC}"
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN} \
    -d www.${DOMAIN}

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to obtain certificate. Check your domain DNS settings.${NC}"
    exit 1
fi

# Step 4: Restore the full nginx config
echo -e "${GREEN}Step 4: Restoring full nginx configuration...${NC}"

cat > nginx/conf.d/default.conf << 'EOF'
upstream nextjs {
    server app:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_ONLY/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_ONLY/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://nextjs;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

# Replace placeholders
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN} www.${DOMAIN}/g" nginx/conf.d/default.conf
sed -i "s/DOMAIN_ONLY/${DOMAIN}/g" nginx/conf.d/default.conf

# Step 5: Restart everything
echo -e "${GREEN}Step 5: Starting all services...${NC}"
docker compose down
docker compose up -d

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}SSL setup complete!${NC}"
echo -e "${GREEN}Your site should now be available at:${NC}"
echo -e "${GREEN}  https://${DOMAIN}${NC}"
echo -e "${GREEN}============================================${NC}"
