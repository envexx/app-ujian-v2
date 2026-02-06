# Docker Security Best Practices

## ✅ Secrets Management

**DO NOT** use `ARG` or `ENV` in Dockerfile for sensitive data like:
- `SESSION_SECRET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `ANTHROPIC_API_KEY`
- `CRON_SECRET`
- `DATABASE_URL` (with credentials)
- Any API keys or passwords

## ✅ Correct Approach

### 1. Runtime Environment Variables
Secrets should be provided at **runtime** via environment variables from your deployment platform (Coolify, Docker Compose, Kubernetes, etc.)

### 2. In Coolify
Set environment variables in the Coolify dashboard:
- Go to your application settings
- Navigate to "Environment Variables"
- Add all secrets there
- They will be injected at runtime, not build time

### 3. Example Docker Compose
```yaml
services:
  app:
    build: .
    environment:
      - SESSION_SECRET=${SESSION_SECRET}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      # ... other secrets
    env_file:
      - .env
```

## ⚠️ Why This Matters

1. **Image Layers**: ARG/ENV values are stored in image layers and can be extracted
2. **Build History**: Secrets in build args appear in `docker history`
3. **Security**: Runtime injection keeps secrets out of the image
4. **Best Practice**: Industry standard for container security

## 📋 Required Environment Variables

Make sure these are set in Coolify (not in Dockerfile):

```env
# Database
DATABASE_URL=postgres://...

# Session
SESSION_SECRET=...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...

# APIs
ANTHROPIC_API_KEY=...
WHATSAPP_API_KEY=...
WHATSAPP_API_URL=...

# Cron
CRON_SECRET=...
```

## 🔒 Security Checklist

- [x] No ARG for secrets in Dockerfile
- [x] No ENV for secrets in Dockerfile
- [x] Secrets only in runtime environment
- [x] .dockerignore excludes .env files
- [x] .env files not committed to Git
