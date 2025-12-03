# AggieBuddy

A smart campus activity planner for Texas A&M students that helps students optimize the gaps in their schedule.

## What It Does

- **Upload your schedule** — Import your class schedule via `.ics` file
- **Assign buildings** — Map your classes to campus buildings
- **Get smart suggestions** — AI-powered recommendations that fit your free time blocks

The app calculates optimal locations based on where your classes are, how much free time you have, and your activity preferences with no GPS tracking.

## Tech Stack

**Frontend:** React Native + Expo  
**Backend:** Flask (Python)  
**AI:** DeepSeek API (with rule-based fallback)

## Getting Started

### Prerequisites
- Node.js
- Python 3.8+

### Install & Run

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Run both frontend and backend
npm run dev
```

Or run separately:
```bash
# Frontend only
npm run web

# Backend only
cd backend && python app.py
```

## License

MIT
