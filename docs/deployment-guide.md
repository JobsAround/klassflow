# Deployment Guide: Hetzner VPS

## 1. Server Provisioning
On your new Hetzner VPS (Ubuntu 22.04 or 24.04 recommended):

```bash
# Update system
apt update && apt upgrade -y

# Install Docker & Docker Compose
apt install docker.io docker-compose -y

# Start Docker
systemctl enable --now docker
```

## 2. DNS Configuration
Point your domain (e.g., `app.yourdomain.com`) to the **IPv4 Address** of your VPS.
*   Type: `A`
*   Name: `app` (or `@` for root domain)
*   Value: `[YOUR_VPS_IP]`

## 3. GitHub Secrets
Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
Add the following Repository Secrets:

| Name | Value | Description |
|------|-------|-------------|
| `VPS_HOST` | `[YOUR_VPS_IP]` | IP address of your server |
| `VPS_USER` | `root` | SSH Login user (usually root) |
| `VPS_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY...` | Your private SSH key (must match the public key on server) |
| `RESEND_API_KEY` | `re_Cyx3pwot_...` | Your Resend API Key |

## 4. Environment Variables (On Server)
SSH into your server and create the production env file:

```bash
# Create directory
mkdir -p /root/klassflow
cd /root/klassflow

# Create .env.production
nano .env.production
```

Paste the following content (adjust values!):

```env
# Database (Internal Docker Network)
POSTGRES_USER=klassflow
POSTGRES_PASSWORD=secure_random_production_password
POSTGRES_DB=klassflow

# Domain for Traefik (HTTPS)
DOMAIN_NAME=app.yourdomain.com
SSL_EMAIL=your-email@example.com

# Auth Secret (Generate with `openssl rand -base64 32`)
AUTH_SECRET=long_random_string_for_nextauth

# App URL
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com

# SMTP (Using Resend Key via system fallback, or explicit here)
RESEND_API_KEY=re_Cyx3pwot_...
```

## 5. First Deployment
1.  Push your code to the `main` branch.
2.  Go to **Actions** tab in GitHub to watch the "Deploy to Production" workflow.
3.  Once finished, your site should be live at `https://app.yourdomain.com`.
