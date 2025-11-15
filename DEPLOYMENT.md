# Production Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- Domain name configured (optional but recommended)
- SSL certificates (use Let's Encrypt with certbot)

## Environment Setup

1. **Configure environment variables** in `server/.env`:
```env
NODE_ENV=production
PORT=3001
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
```

2. **Build and run**:
```bash
docker-compose up -d --build
```

## SSL/HTTPS Setup (Recommended)

1. **Get SSL certificates** (using certbot):
```bash
sudo certbot certonly --standalone -d your-domain.com
```

2. **Copy certificates**:
```bash
mkdir ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
```

3. **Update nginx.conf**:
   - Uncomment the HTTPS server block
   - Replace `your-domain.com` with your actual domain
   - Uncomment the HTTP to HTTPS redirect

4. **Restart nginx**:
```bash
docker-compose restart nginx
```

## Production Checklist

✅ ElasticSearch removed (not needed)
✅ Multi-stage Docker build (smaller image)
✅ Non-root user in container
✅ Resource limits configured
✅ Health checks enabled
✅ Restart policies set
✅ Rate limiting on contact form
✅ nginx reverse proxy
✅ Security headers
✅ Gzip compression
✅ Static file caching
✅ Email credentials in .env file

## Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Check health
curl http://localhost/api/health
```

## Monitoring

The app includes health checks at `/api/health` that return:
- Status
- Timestamp
- Uptime

## Security Notes

- Never commit `.env` files
- Use strong email app passwords
- Keep Docker images updated
- Monitor nginx logs for suspicious activity
- Consider adding fail2ban for additional protection
