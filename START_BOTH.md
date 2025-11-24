# How to Start Both Backend and Frontend

**Problem:** You need both servers running at the same time, but stopping one to start the other causes connection errors.

---

## ✅ Solution: Use Two Terminal Windows

### **Option 1: Manual (Recommended for now)**

**Terminal 1 - Backend:**
```bash
cd aggie-buddie/backend
python app.py
```
**Keep this running!** Don't press Ctrl+C.

**Terminal 2 - Frontend:**
```bash
cd aggie-buddie
npm run web
```
Run this in a **separate terminal window**.

---

### **Option 2: Windows Batch Script**

Double-click: `aggie-buddie/start-dev.bat`

This opens two windows automatically.

---

### **Option 3: Use npm script (requires concurrently)**

First install:
```bash
npm install --save-dev concurrently
```

Then run:
```bash
npm run dev
```

This starts both in one command.

---

## ⚠️ Important

**Both servers must be running at the same time:**
- ✅ Backend running → App can connect
- ❌ Backend stopped → `ERR_CONNECTION_REFUSED`

**Don't stop the backend to start the frontend!** Use two terminals.

---

## 🧪 Verify Both Are Running

**Backend:** Open `http://localhost:5000/api/health` in browser → Should see JSON

**Frontend:** Open `http://localhost:8081` in browser → Should see your app

Both should work simultaneously!

