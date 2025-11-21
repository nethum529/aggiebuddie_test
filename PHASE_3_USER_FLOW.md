# Phase 3: Complete User Flow Guide

This document describes the complete user journey through the AggieBuddie app from a user's perspective.

---

## 🚀 Complete User Journey

### Step 1: Login
**Screen:** `index.js`

User opens the app and sees the login screen.
- Enters email and password
- Taps "Log In"
- System validates credentials
- User is navigated to Home screen

---

### Step 2: Home Dashboard
**Screen:** `home.js`

User sees the home dashboard with a clean menu:

```
┌─────────────────────────────┐
│        AggieBuddie          │
│    Your Smart Schedule      │
├─────────────────────────────┤
│                             │
│  📅  Upload Schedule        │
│      Import your ICS file   │
│                             │
│  📍  View Schedule          │
│      See your classes       │
│                             │
│  ⚙️  Activity Preferences   │
│      Set gym preferences    │
│                             │
└─────────────────────────────┘
```

User taps **"Upload Schedule"** to begin.

---

### Step 3: Upload Schedule
**Screen:** `fileUpload.js`

```
┌─────────────────────────────┐
│  📁  Upload Your Schedule   │
├─────────────────────────────┤
│                             │
│   [Select ICS File]         │
│                             │
│   No file selected          │
│                             │
│                             │
│   📖 Quick Guide:           │
│   1. Export .ics from       │
│      Howdy                  │
│   2. Tap 'Select' above     │
│   3. Choose your file       │
│                             │
└─────────────────────────────┘
```

**User Actions:**
1. Taps **"Select ICS File"**
2. File picker opens (native)
3. User selects `my_schedule.ics`
4. Screen updates:

```
┌─────────────────────────────┐
│  📁  Upload Your Schedule   │
├─────────────────────────────┤
│                             │
│   ✅ File Selected          │
│                             │
│   📄 my_schedule.ics        │
│   Size: 2.4 KB              │
│   Type: text/calendar       │
│                             │
│   [Upload & Continue]       │
│                             │
└─────────────────────────────┘
```

5. User taps **"Upload & Continue"**
6. Loading spinner appears
7. File is sent to backend → Backend parses ICS → Returns class list
8. User is navigated to Building Picker

---

### Step 4: Assign Buildings to Classes
**Screen:** `buildingPicker.js`

```
┌─────────────────────────────┐
│  🏢  Assign Building Locations  │
│     Progress: 0 of 4        │
├─────────────────────────────┤
│                             │
│  📚 MATH 304                │
│  ⏰ MWF 08:00 - 08:50       │
│                             │
│  Building Location:         │
│  [Select building...]  🔍   │
│                             │
├─────────────────────────────┤
│  📚 CSCE 221                │
│  ⏰ TR 10:20 - 11:10        │
│                             │
│  Building Location:         │
│  [Select building...]  🔍   │
│                             │
└─────────────────────────────┘
```

**User Actions:**
1. Taps on first dropdown → Modal opens with searchable list

```
┌─────────────────────────────┐
│  Search Buildings           │
│  [🔍 Search...........] ❌  │
├─────────────────────────────┤
│  BLOC - Blocker Building    │
│  ZACH - Zachry Engineering  │
│  HRBB - Heldenfels Hall     │
│  ACAD - Academic Building   │
│  ...                        │
└─────────────────────────────┘
```

2. User types "BLOC" → List filters
3. User taps "BLOC" → Dropdown closes
4. Screen updates:

```
│  📚 MATH 304                │
│  ⏰ MWF 08:00 - 08:50       │
│                             │
│  Building Location:         │
│  ✅ BLOC - Blocker Building │
│                             │
```

5. Progress updates: "1 of 4"
6. User repeats for all classes
7. When all assigned:

```
│  Progress: 4 of 4 ✅        │
│                             │
│  [Finish] (enabled)         │
```

8. User taps **"Finish"**
9. Assignments sent to backend
10. Success! → Navigated to Activity Preferences

---

### Step 5: Set Activity Preferences
**Screen:** `activityPreferences.js`

```
┌─────────────────────────────┐
│  ⚙️  Activity Preferences   │
├─────────────────────────────┤
│                             │
│  🕐 Time Range              │
│                             │
│  Start Time:                │
│  [09:00]                    │
│                             │
│  End Time:                  │
│  [16:00]                    │
│                             │
│  🏋️ Activity Type           │
│  [Cardio          ▼]        │
│                             │
│  ⏱️ Desired Duration         │
│  [45] minutes               │
│                             │
│  [Generate Suggestions]     │
│                             │
└─────────────────────────────┘
```

**User Actions:**
1. Enters start time: `09:00`
2. Enters end time: `16:00`
3. Selects activity: "Cardio"
4. Enters duration: `45`
5. Taps **"Generate Suggestions"**
6. Loading spinner: "Analyzing your schedule..."
7. Backend AI analyzes:
   - Free time blocks
   - Walking distances
   - Gym capacities
   - Activity preferences
8. Success! → Navigated to Schedule with suggestions

---

### Step 6: View Schedule with AI Suggestions
**Screen:** `schedule.js`

```
┌─────────────────────────────────────┐
│  [ Daily ]  3-Day  Monthly          │
├─────────────────────────────────────┤
│ Mon │      November                 │
│  4  │  Week of Nov 4    ◀  ▶        │
│     │                               │
│ 8am │  ┌────────────────────┐       │
│     │  │ MATH 304           │       │
│     │  │ 8:00 - 8:50        │       │
│     │  │ 📍 BLOC 102         │       │
│     │  └────────────────────┘       │
│     │                               │
│ 9am │  ╔════════════════════╗       │ ← Suggestion #1
│     │  ║ 🏋️ Rec Center      ║       │   (Transparent Blue)
│     │  ║ 9:00 - 9:45        ║       │
│     │  ║ 🚶 5 min commute    ║ [❌][✅]│
│     │  ║ 💡 Closest to BLOC ║       │
│     │  ║ #1                 ║       │
│     │  ╚════════════════════╝       │
│     │                               │
│     │  ╔════════════════════╗       │ ← Suggestion #2
│     │  ║ 🏋️ Polo Gym        ║       │
│     │  ║ 9:05 - 9:50        ║       │
│     │  ║ 🚶 8 min commute    ║ [❌][✅]│
│     │  ║ #2                 ║       │
│     │  ╚════════════════════╝       │
│     │                               │
│10am │  ┌────────────────────┐       │
│     │  │ CSCE 221           │       │
│     │  │ 10:20 - 11:10      │ [👁️]  │
│     │  │ 📍 ZACH 350         │       │
│     │  └────────────────────┘       │
└─────────────────────────────────────┘
```

**Suggestion Features:**
- **Transparent Blue Background** - Easy to distinguish from classes
- **Dashed Border** - Visual cue that it's a suggestion
- **Rank Badge** - #1, #2, #3 showing priority
- **Emoji** - 🏋️ for gym
- **Commute Info** - 🚶 5 min walk
- **AI Reasoning** - 💡 Why this gym was suggested
- **Action Buttons** - ❌ Reject | ✅ Accept

**User Actions:**

#### Option A: Accept Suggestion
1. User taps ✅ on "Rec Center" suggestion
2. Alert appears:

```
┌─────────────────────────────┐
│  Suggestion Accepted!       │
│                             │
│  Rec Center has been added  │
│  to your schedule.          │
│                             │
│         [Great!]            │
└─────────────────────────────┘
```

3. Schedule updates:
   - Rec Center becomes **solid green event**
   - Other suggestions in that time block disappear
   - "Added ✓" badge appears

```
│ 9am │  ┌────────────────────┐       │
│     │  │ 🏋️ Rec Center      │ [👁️]  │
│     │  │ 9:00 - 9:45        │       │
│     │  │ 📍 Rec Center       │       │
│     │  │ Added ✓            │       │
│     │  └────────────────────┘       │
```

#### Option B: Reject Suggestion
1. User taps ❌ on "Polo Gym" suggestion
2. Alert appears:

```
┌─────────────────────────────┐
│  Hide Suggestion?           │
│                             │
│  Hide Polo Gym from your    │
│  schedule?                  │
│                             │
│    [Cancel]    [Hide]       │
└─────────────────────────────┘
```

3. User taps "Hide"
4. Polo Gym suggestion disappears from schedule

#### Option C: View Details
1. User taps 👁️ (eye icon) on any event
2. Navigated to Event Detail Screen

---

### Step 7: View Event Details
**Screen:** `event.js`

```
┌─────────────────────────────┐
│  ◀  Event Details           │
├─────────────────────────────┤
│                             │
│  📅  MATH 304               │
│                             │
│  🕐  Time                    │
│      8:00 AM - 8:50 AM      │
│                             │
│  📍  Location                │
│      BLOC 102               │
│                             │
│  ┌─────────────────────────┐│
│  │ 📝 Notes         [Edit] ││
│  │                         ││
│  │ No notes yet. Tap       ││
│  │ "Edit" to add some!     ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  ℹ️ Tip: Add notes to       │
│  remember important details │
│                             │
└─────────────────────────────┘
```

**User Actions:**

#### Add Notes
1. User taps **"Edit"**
2. Text input appears:

```
│  ┌─────────────────────────┐│
│  │ 📝 Notes        [Save]  ││
│  │                         ││
│  │ ┌─────────────────────┐ ││
│  │ │ Bring calculator    │ ││
│  │ │ Quiz on Friday      │ ││
│  │ │                     │ ││
│  │ └─────────────────────┘ ││
│  │                         ││
│  └─────────────────────────┘│
```

3. User types notes
4. User taps **"Save"**
5. Notes are saved (ready for backend/AsyncStorage persistence)

#### Return to Schedule
6. User taps ◀ (back button)
7. Returned to Schedule screen

---

## 🎯 Complete Flow Summary

```
┌────────────┐
│   Login    │
└─────┬──────┘
      │
      ▼
┌────────────┐
│    Home    │ ◀─────────────┐
└─────┬──────┘               │
      │                      │
      ├──────────────────────┤
      │ Upload Schedule      │
      ▼                      │
┌────────────┐               │
│ File Upload│               │
└─────┬──────┘               │
      │                      │
      ▼                      │
┌────────────┐               │
│  Building  │               │
│   Picker   │               │
└─────┬──────┘               │
      │                      │
      ▼                      │
┌────────────┐               │
│  Activity  │               │
│ Preferences│               │
└─────┬──────┘               │
      │                      │
      ▼                      │
┌────────────┐               │
│  Schedule  │───────────────┘
│    with    │    (Always accessible)
│ Suggestions│
└─────┬──────┘
      │
      ├─ Accept Suggestion → Updates Schedule
      ├─ Reject Suggestion → Hides Suggestion
      └─ View Details → Event Detail Screen
                  │
                  ▼
            ┌────────────┐
            │   Event    │
            │  Details   │
            └─────┬──────┘
                  │
                  ▼
            Add/Edit Notes
                  │
                  ▼
            Back to Schedule
```

---

## 📱 User Experience Highlights

### 1. **Smooth Navigation**
- Every screen has clear next steps
- Back buttons where expected
- Home is always accessible

### 2. **Clear Feedback**
- Loading spinners during API calls
- Success alerts after actions
- Error messages with retry options

### 3. **Professional UI**
- Consistent color scheme (Maroon + Blue, NO PURPLE)
- Icon-based information display
- Clean, readable layouts
- Proper spacing and alignment

### 4. **Smart Suggestions**
- AI analyzes schedule and preferences
- Shows top 3 gym options
- Explains reasoning for each
- Easy accept/reject workflow

### 5. **Searchable Inputs**
- Building dropdown filters as you type
- Fast search through 67+ buildings
- Handles large lists smoothly

---

## 🎨 Visual Design Elements

### Color Coding
- **Green events** = Classes
- **Blue suggestions** = AI-generated gym recommendations (transparent)
- **Green solid** = Accepted suggestions
- **Maroon accents** = Headers, primary buttons

### Icons
- 📅 Calendar - Events
- 🏋️ Gym - Fitness activities
- 📍 Location - Places
- 🚶 Walk - Commute info
- 💡 Light bulb - AI reasoning
- ✅ Checkmark - Accept
- ❌ X - Reject
- 👁️ Eye - View details

### Typography
- **Bold titles** for headers
- **Medium weight** for labels
- **Regular** for body text
- **Italic** for placeholder/helper text

---

## ⚡ Performance

### Fast Loading
- Minimal API calls
- Efficient state management
- Optimized rendering

### Responsive
- Instant UI feedback
- Smooth animations
- No lag or stuttering

---

## 🔒 Error Handling

Every screen handles errors gracefully:
- Network failures → Retry button
- Invalid inputs → Validation messages
- Backend errors → Clear explanations
- Timeout → Helpful troubleshooting

---

## 📊 User Data Flow

```
1. User uploads ICS file
   └─> Backend parses → Returns class list
       └─> Stored in UserContext

2. User assigns buildings
   └─> Backend saves mappings
       └─> Stored in UserContext

3. User sets preferences
   └─> Backend generates suggestions
       └─> Stored in UserContext

4. User accepts suggestion
   └─> Stored in UserContext (acceptedSuggestions)
       └─> Displayed as solid event

5. User rejects suggestion
   └─> Stored in UserContext (rejectedSuggestions)
       └─> Hidden from view

6. User adds notes
   └─> Stored locally (ready for backend persistence)
```

---

## 🎉 Key User Benefits

1. **Time Saving** - AI finds best gym times automatically
2. **Optimized Routes** - Minimizes walking between classes and gym
3. **Personalized** - Considers user's activity preferences
4. **Flexible** - Accept or reject any suggestion
5. **Organized** - All schedule info in one place
6. **Smart** - AI explains its reasoning

---

**End of User Flow Guide**

