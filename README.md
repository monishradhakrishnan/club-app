# Campus Budget Request & Club Management Ecosystem

A full-stack app for managing campus clubs, OTP-based attendance, and budget
request/approval workflows — with role-based access control (ADMIN / STAFF / STUDENT)
and JWT authentication. One Expo codebase runs on web AND mobile (same pattern as
PDFShare), backed by a Spring Boot + MySQL API.

## 1. App setup (web + mobile, one codebase)

```bash
cd app
npm install
```

### Run in the browser
```bash
npm run web
```
Opens at `http://localhost:8081` (or whichever port Expo picks). It auto-detects the
backend at `http://<same-host>:8080` — no config needed if backend and app run on the
same machine.

### Run on your phone (Expo Go)
1. Find your computer's LAN IP: `ipconfig` (Windows) → look for IPv4 Address, e.g.
   `192.168.1.100`.
2. Open `app/src/api/client.js` and set `NATIVE_LAN_IP` to that IP.
3. ```bash
   npm start
   ```
4. Scan the QR code with the Expo Go app on your phone. **Phone and computer must be
   on the same Wi-Fi.**

**If Expo Go says "project is incompatible / requires a different SDK version"**:
run `npx expo install expo@latest` then `npx expo install --fix`, or update Expo Go
on your phone to match.


