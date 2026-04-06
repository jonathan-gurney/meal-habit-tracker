# Meal Habit Tracker Production Plan (Hosted Online + Personal Access Gateway)

## Objective

Host Meal Habit Tracker on the public internet while enforcing a **gateway-based access policy so only you can sign in**.

## What “online but only me” means

- The app has a public DNS hostname (for example, `meals.yourdomain.com`).
- Traffic must pass through an identity-aware gateway before reaching the app.
- Only your identity (email/account/device posture) is authorized.
- Direct-to-origin access is blocked so the gateway cannot be bypassed.

---

## Recommended Architecture

## Edge and gateway (required)

Use **Cloudflare Zero Trust Access** as the front-door gateway:

1. DNS for `meals.yourdomain.com` managed in Cloudflare.
2. Cloudflare Access policy set to **allow only your email identity**.
3. Optional second factor via your identity provider (Google/GitHub/Microsoft).
4. Session duration kept short (for example, 12 hours).

## Origin hosting (app runtime)

- Host the app on a Linux VM or container platform.
- Run your existing Docker image (`Express serves API + built React`).
- Keep SQLite on persistent disk/volume.
- Terminate TLS at Cloudflare; keep encrypted origin transport using Cloudflare Tunnel.

## Network path (critical)

- Prefer **Cloudflare Tunnel (`cloudflared`)** from origin to Cloudflare.
- Do **not** open port `3001` publicly on the VM.
- Firewall allows SSH admin access only from trusted source(s).

This ensures the app is reachable online but only through your identity gateway.

---

## Phase 1 — Application Production Hardening

### Runtime configuration

Add and document environment variables:

- `NODE_ENV=production`
- `PORT=3001`
- `TRUST_PROXY=1`
- `APP_BASE_URL=https://meals.yourdomain.com`
- `SQLITE_PATH=/app/data/meals.db`
- `LOG_LEVEL=info`

### Security middleware

- Add `helmet` with strict defaults.
- Restrict CORS to exact app origin only.
- Add request size limits and basic rate limits on write endpoints.
- Validate all inputs (`date`, `category`, query params).

### Health endpoints

- `GET /health/live` for process liveness.
- `GET /health/ready` for DB readiness.

### Logging

Use JSON logs with:

- `ts`, `level`, `route`, `method`, `status`, `latency_ms`, `request_id`.

---

## Phase 2 — Gateway and Identity Controls

### Cloudflare Access policy design

Create one app policy for `meals.yourdomain.com`:

- **Include**: your exact identity email.
- **Require**: MFA.
- **Optional require**: known device posture or client certificate.
- **Deny all others** by default.

### Session and token posture

- Session TTL: 8–12 hours.
- Re-authentication on sensitive path (optional).
- Disable one-time PIN fallback if you don’t need it.

### Break-glass path

- Create a second emergency admin identity stored securely.
- Test emergency login once, then keep unused.

---

## Phase 3 — Origin Lockdown (Prevent Gateway Bypass)

### If using Cloudflare Tunnel (recommended)

- No inbound app port opened on internet.
- VM firewall denies external `3001` and proxy ports.
- `cloudflared` service authenticates outbound tunnel to Cloudflare.

### If using public reverse proxy (fallback)

- Restrict ingress to Cloudflare IP ranges only.
- Enforce authenticated origin pulls or mTLS.
- Block all non-Cloudflare traffic at firewall.

### Host hardening baseline

- Non-root deploy user.
- SSH keys only, password login disabled.
- Automatic OS security updates enabled.
- Docker daemon + logs monitored.

---

## Phase 4 — Deployment and Release Process

### CI checks on every PR

1. `npm ci`
2. `npm run test`
3. `npm run build`
4. Build Docker image
5. Optional image vulnerability scan (Trivy)

### CD to production

- Build image and push to GHCR (tag by commit SHA).
- On host, deploy pinned image tag with Compose.
- Restart only after successful image pull.

### Rollback

- Keep previous stable image tag.
- Rollback command uses prior tag and `docker compose up -d`.
- Always snapshot DB before schema-impacting releases.

---

## Phase 5 — Data Protection, Backup, and Recovery

### Backup design

- Nightly SQLite backup using safe checkpoint/backup flow.
- Retain:
  - 7 daily
  - 4 weekly
  - 3 monthly
- Encrypt backups before upload to object storage.

### Recovery objectives

- RPO: 24 hours.
- RTO: 2 hours.

### Restore test cadence

- Monthly restore drill to a staging container.
- Verify dashboard totals and recent entries integrity.
- Record runbook timing and any failure points.

---

## Phase 6 — Monitoring and Alerts

### Must-have alerts

- Health endpoint failure (gateway-reachable URL).
- Origin container crash/restart loop.
- Disk utilization > 80%.
- Backup job failure.
- Tunnel disconnected alert.

### Log retention

- 14–30 days on host.
- Rotation configured to prevent disk exhaustion.

---

## Phase 7 — Hosted-Online Security Checklist

- [ ] App reachable at `https://meals.yourdomain.com`.
- [ ] Cloudflare Access challenge appears before app loads.
- [ ] Only your identity can complete login.
- [ ] Unknown identity is denied.
- [ ] Direct origin IP access is blocked.
- [ ] Port `3001` is not publicly reachable.
- [ ] TLS is valid end-to-end (edge and tunnel/origin).
- [ ] Security headers validated.
- [ ] Backup and restore tested.

---

## Implementation Timeline (2 Weeks)

## Week 1

- Add app hardening (env config, health, logs, security middleware).
- Set up Cloudflare zone, Access app, and policy.
- Configure tunnel and route hostname to origin service.
- Lock firewall and verify origin is inaccessible directly.

## Week 2

- Implement CI/CD tagging + pinned deploy workflow.
- Add backup automation and alerting.
- Execute rollback rehearsal.
- Execute restore rehearsal.
- Complete hosted-online security checklist.

---

## Concrete First Deploy Runbook

1. Provision Linux VM.
2. Install Docker + Compose.
3. Install `cloudflared` and authenticate tunnel.
4. Configure tunnel route to local app (`http://localhost:3001`).
5. Configure Cloudflare Access app for `meals.yourdomain.com`.
6. Create Access policy allowing only your identity + MFA.
7. Deploy app container with persistent `/app/data` volume.
8. Confirm app works through gateway login.
9. Confirm direct VM IP access to app port fails.
10. Configure nightly encrypted backups.
11. Set health, tunnel, and backup alerts.
12. Record deployment tag and runbook notes.

---

## Definition of Done

Production is complete when:

1. The app is publicly hosted under your domain.
2. Gateway challenge is mandatory for every new session.
3. Only your identity can access the app.
4. Origin cannot be accessed directly from the internet.
5. Backups, monitoring, rollback, and restore are tested and documented.
