# 🚀 Deployment Guide - Web-Based VPS Terminal

This guide explains how to deploy your Web-Based VPS Terminal to your domain with production setup.

---

## 📋 Prerequisites

1. **VPS/Server** with SSH access
2. **Domain name** pointed to your server IP
3. **Node.js** v18+ installed
4. **PM2** installed globally: `npm install -g pm2`
5. **Nginx** installed: `sudo apt install nginx`
6. **Certbot** for SSL: `sudo apt install certbot python3-certbot-nginx`

---

## 🔧 Step 1: Environment Configuration

### Backend Environment (.env)
Create `/root/code-swape/server/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration (Your Frontend URL)
CORS_ORIGIN=https://yourdomain.com

# Terminal Configuration
SHELL=/bin/bash
HOME=/root
```

### Frontend Environment (.env.production)
Create `/root/code-swape/client/.env.production`:

```bash
# Backend API URL
VITE_API_URL=https://yourdomain.com

# WebSocket URL (use wss:// for secure WebSocket)
VITE_WS_URL=wss://yourdomain.com
```

**Alternative: Using API Subdomain**
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

---

## 🏗️ Step 2: Build Applications

### Build Backend
```bash
cd /root/code-swape/server
npm install
npm run build
```

This creates production-ready JavaScript files in `dist/` folder.

### Build Frontend
```bash
cd /root/code-swape/client
npm install
npm run build
```

This creates optimized static files in `dist/` folder.

---

## 🚀 Step 3: Deploy Backend with PM2

### Start Backend Server
```bash
cd /root/code-swape/server
npm run deploy
# or manually:
# npm run build && npm run start:pm2
```

### Verify Backend is Running
```bash
pm2 status
pm2 logs vps-terminal-server
curl http://localhost:3001/health
```

### Useful PM2 Commands
```bash
pm2 restart vps-terminal-server    # Restart server
pm2 stop vps-terminal-server       # Stop server
pm2 logs vps-terminal-server       # View logs
pm2 monit                          # Monitor resources
pm2 startup                        # Enable auto-start on boot
pm2 save                           # Save current process list
```

---

## 🌐 Step 4: Configure Nginx

### Copy Nginx Configuration
```bash
sudo cp /root/code-swape/nginx.conf.example /etc/nginx/sites-available/vps-terminal
```

### Edit Configuration
```bash
sudo nano /etc/nginx/sites-available/vps-terminal
```

**Replace the following:**
- `yourdomain.com` → Your actual domain
- `/root/code-swape/client/dist` → Correct path to frontend build

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/vps-terminal /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## 🔒 Step 5: Setup SSL with Let's Encrypt

### Install SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**If using API subdomain:**
```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Auto-Renewal
Certbot automatically sets up renewal. Test it:
```bash
sudo certbot renew --dry-run
```

---

## ✅ Step 6: Verify Deployment

### Check Services
```bash
# Check Backend
curl https://yourdomain.com/api/health

# Check Nginx
sudo systemctl status nginx

# Check PM2
pm2 status
```

### Test Frontend
Open your browser: `https://yourdomain.com`

You should see the terminal interface connected to your VPS!

---

## 🔄 Updating Your Application

### Update Backend
```bash
cd /root/code-swape/server
git pull  # if using git
npm install
npm run build
pm2 restart vps-terminal-server
```

### Update Frontend
```bash
cd /root/code-swape/client
git pull  # if using git
npm install
npm run build
# Files automatically updated in dist/ folder
# Nginx serves the new build
```

---

## 🐛 Troubleshooting

### Backend Issues

**Check Logs:**
```bash
pm2 logs vps-terminal-server
tail -f /root/code-swape/server/logs/error.log
```

**Port Already in Use:**
```bash
lsof -ti:3001 | xargs kill -9
pm2 restart vps-terminal-server
```

**WebSocket Connection Failed:**
- Check firewall allows port 3001
- Verify CORS_ORIGIN in `.env`
- Check Nginx WebSocket proxy settings

### Frontend Issues

**404 Errors:**
- Ensure `dist/` folder exists
- Check Nginx root path
- Verify file permissions: `chmod -R 755 /root/code-swape/client/dist`

**Can't Connect to Backend:**
- Check `VITE_API_URL` and `VITE_WS_URL` in `.env.production`
- Rebuild frontend after changing environment variables
- Check browser console for CORS errors

### SSL Issues

**Certificate Not Found:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

**Mixed Content (HTTP/HTTPS):**
- Ensure all URLs use `https://` and `wss://`
- Check browser console for mixed content warnings

---

## 🔐 Security Best Practices

1. **Use Non-Root User** (optional, but recommended)
   ```bash
   sudo adduser terminaluser
   sudo usermod -aG sudo terminaluser
   ```

2. **Firewall Configuration**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp  # SSH
   sudo ufw enable
   ```

3. **Rate Limiting** (add to Nginx config)
   ```nginx
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

   location /api/ {
       limit_req zone=api_limit burst=20 nodelay;
       # ... rest of config
   }
   ```

4. **Environment Variables**
   - Never commit `.env` files to git
   - Use strong secrets in production
   - Restrict file permissions: `chmod 600 .env`

---

## 📊 Monitoring

### View Server Logs
```bash
# PM2 Logs
pm2 logs vps-terminal-server --lines 100

# Nginx Logs
sudo tail -f /var/log/nginx/vps-terminal-access.log
sudo tail -f /var/log/nginx/vps-terminal-error.log

# System Logs
journalctl -u nginx -f
```

### Monitor Resources
```bash
pm2 monit           # PM2 monitoring
htop                # System resources
```

---

## 🎉 Success!

Your Web-Based VPS Terminal should now be live at:
- **Frontend**: https://yourdomain.com
- **Backend**: https://yourdomain.com/api/health
- **WebSocket**: wss://yourdomain.com/socket.io/

Test by opening the terminal and running commands like:
- `ls -la`
- `pwd`
- `git --version`
- `npm --version`

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/getting-started/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🆘 Need Help?

If you encounter issues:
1. Check server logs (PM2 + Nginx)
2. Verify environment variables
3. Test backend directly: `curl http://localhost:3001/health`
4. Check browser console for frontend errors
5. Verify firewall and DNS settings