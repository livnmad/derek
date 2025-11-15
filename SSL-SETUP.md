# SSL Certificate Setup for derekbateman.com

## Prerequisites
- Docker and Docker Compose installed
- Domain DNS pointed to your server IP
- Ports 80 and 443 open on your firewall

## Option 1: Using Certbot (Recommended)

### 1. Install Certbot
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot

# macOS
brew install certbot
```

### 2. Stop nginx if running
```bash
docker-compose -f docker-compose.nginx.yml down
```

### 3. Generate certificates
```bash
sudo certbot certonly --standalone -d derekbateman.com -d www.derekbateman.com
```

### 4. Copy certificates to project
```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/derekbateman.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/derekbateman.com/privkey.pem ssl/
sudo chmod 644 ssl/*.pem
```

### 5. Start services
```bash
docker-compose -f docker-compose.nginx.yml up -d
```

## Option 2: Using Docker Certbot

### 1. Create docker-compose.certbot.yml
```yaml
version: '3.8'

services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./ssl:/etc/letsencrypt
      - ./certbot-www:/var/www/certbot
    command: certonly --webroot --webroot-path=/var/www/certbot --email derekbateman81@gmail.com --agree-tos --no-eff-email -d derekbateman.com -d www.derekbateman.com
```

### 2. Run certbot
```bash
docker-compose -f docker-compose.certbot.yml run --rm certbot
```

## Certificate Renewal

Certificates expire every 90 days. Set up auto-renewal:

### Cron job (Linux)
```bash
# Edit crontab
sudo crontab -e

# Add this line (runs daily at 2am)
0 2 * * * certbot renew --quiet && docker-compose -f /path/to/docker-compose.nginx.yml restart nginx
```

## Verify SSL

After setup, verify your SSL configuration:
```bash
# Check certificate
curl -vI https://derekbateman.com

# Test SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=derekbateman.com
```

## Troubleshooting

### Certificate files not found
- Ensure SSL files are in `./ssl/` directory
- Check file permissions: `sudo chmod 644 ssl/*.pem`

### Port 80/443 already in use
- Stop other web servers: `sudo systemctl stop apache2 nginx`
- Check what's using ports: `sudo netstat -tlnp | grep :80`

### Domain not resolving
- Verify DNS A records point to your server IP
- Wait for DNS propagation (can take up to 48 hours)
- Test: `nslookup derekbateman.com`

## Production Deployment

Once SSL is configured:

```bash
# Build and start with nginx
docker-compose -f docker-compose.nginx.yml up -d --build

# View logs
docker-compose -f docker-compose.nginx.yml logs -f

# Check status
docker-compose -f docker-compose.nginx.yml ps
```

Your site will be available at:
- https://derekbateman.com
- https://www.derekbateman.com

HTTP requests will automatically redirect to HTTPS.
