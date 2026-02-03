# WhatsApp Service Troubleshooting

## 🔴 Common Issue: Chromium Profile Lock

### Symptom
```
Error: Failed to launch the browser process: Code: 21
The profile appears to be in use by another Chromium process
```

### Root Cause
- Container restarts without properly cleaning up Chromium processes
- Lock files remain in persistent volume
- Multiple instances trying to use the same profile

### ✅ Solution (Already Implemented)

The service now includes **automatic cleanup**:

1. **On Startup:**
   - Kills all existing Chromium processes
   - Removes all lock files recursively
   - Waits 2 seconds before initializing
   - Automatic retry on failure

2. **On Disconnect/Auth Failure:**
   - Automatic cleanup triggered
   - Client reinitializes

3. **On Shutdown:**
   - Graceful client destruction
   - Final cleanup before exit

### Manual Fix (if needed)

**If service is stuck in restart loop:**

```bash
# Stop the service
docker stop whatsapp-service

# Remove lock files from volume
docker run --rm -v whatsapp-session:/data alpine \
  sh -c "rm -rf /data/*/SingletonLock /data/*/SingletonSocket /data/*/SingletonCookie /data/*/lockfile"

# Start the service
docker start whatsapp-service
```

**In Coolify:**
1. Stop the service
2. Access the volume (if possible) or recreate it
3. Start the service

---

## 🔴 Issue: Service keeps restarting

### Check Logs

```bash
# Docker
docker logs whatsapp-service -f

# Coolify
# Go to: Service → Logs
```

### Common Causes

1. **Chromium dependencies missing**
   - Check Dockerfile has all required packages
   - Solution: Rebuild image

2. **Memory issues**
   - Chromium needs 512MB-1GB RAM
   - Solution: Increase container memory

3. **Network issues**
   - Cannot reach backend webhook
   - Solution: Check `BACKEND_URL` environment variable

---

## 🔴 Issue: QR code not appearing

### Check Status

```bash
curl http://localhost:3001/status
```

### If status shows "initializing"

- Wait 10-30 seconds (client is starting)
- Check logs for errors

### If status shows error

- Check Chromium dependencies
- Check memory/CPU resources
- Try manual cleanup (see above)

---

## 🔴 Issue: WhatsApp disconnects frequently

### Possible Causes

1. **Session expired**
   - WhatsApp revoked access
   - Solution: Re-scan QR code

2. **Network interruption**
   - Unstable connection
   - Solution: Check network stability

3. **Resource constraints**
   - Container running out of memory
   - Solution: Increase resources

---

## 🔴 Issue: Webhook not working

### Test Backend Connectivity

```bash
# From WhatsApp service container
docker exec -it whatsapp-service sh
curl http://backend:8000/api/health
```

### If connection fails

1. **Check environment variables:**
   ```bash
   docker exec whatsapp-service env | grep BACKEND
   ```

2. **Check network:**
   - Are both services in same Docker network?
   - In Coolify: Are they in same project?

3. **Try public URL:**
   ```env
   BACKEND_URL=https://backend-mlh.heni.com.tr
   ```

---

## 🔴 Issue: Messages not appearing in CRM

### Debug Steps

1. **Check WhatsApp service logs:**
   - Look for: `✅ Delivered (200)`
   - If not present: Webhook issue

2. **Check backend logs:**
   - Look for: `INFO: Processed WhatsApp message`
   - If not present: Backend not receiving webhook

3. **Check Supabase:**
   ```sql
   SELECT * FROM messages ORDER BY sent_at DESC LIMIT 10;
   ```

---

## 🛠️ Maintenance Commands

### Restart WhatsApp client (without container restart)

Currently not available via API. Must restart container.

### Check client status

```bash
curl http://localhost:3001/status
```

### Get QR code

```bash
curl http://localhost:3001/qr
```

### Health check

```bash
curl http://localhost:3001/health
```

---

## 📊 Monitoring

### What to Monitor

1. **Health endpoint**: Should return 200
2. **Logs**: Look for errors/warnings
3. **Memory usage**: Should stay under 1GB
4. **CPU usage**: Should be low when idle
5. **WhatsApp connection**: `connected: true`

### Alert on

- Service restart loops (>3 restarts in 5 min)
- Memory usage >1.5GB
- `connected: false` for >5 minutes
- Webhook errors (look for 4xx/5xx responses)

---

## 🚨 Emergency Recovery

If everything fails:

```bash
# 1. Stop service
docker stop whatsapp-service

# 2. Remove volume (⚠️ Will require re-scanning QR!)
docker volume rm whatsapp-session

# 3. Recreate and start
docker-compose up -d whatsapp-service

# 4. Scan QR code again
curl http://localhost:3001/qr
```

**In Coolify:**
1. Delete the service
2. Recreate from scratch
3. Re-scan QR code

---

## 💡 Best Practices

1. **Always use persistent volumes** (avoid re-scanning QR)
2. **Monitor memory usage** (Chromium is heavy)
3. **Use internal network** for backend communication (faster, more secure)
4. **Enable health checks** in orchestrator
5. **Set proper restart policy** (e.g., `unless-stopped`)
6. **Regular backups** of WhatsApp session (optional)

---

## 📞 Getting Help

If issues persist:

1. Check all logs (WhatsApp service + Backend)
2. Verify environment variables
3. Test network connectivity
4. Check resource limits
5. Try manual cleanup
6. As last resort: Recreate service

---

## ✅ Signs of Healthy Service

- ✅ Health endpoint returns 200
- ✅ Status shows `connected: true`
- ✅ No errors in logs
- ✅ Test message delivered successfully
- ✅ Incoming messages appear in CRM
- ✅ Memory usage stable (<1GB)
- ✅ No restart loops
