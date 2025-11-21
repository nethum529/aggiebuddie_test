# AggieBuddie Backend API Documentation

**Version:** 1.0.0-mvp  
**Base URL:** `http://localhost:5000` (development)  
**Last Updated:** November 21, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Health Check](#get-apihealth)
   - [Upload Schedule](#post-apiupload-schedule)
   - [Assign Building Locations](#post-apischeduleadd-locations)
   - [Get Buildings List](#get-apibuildings)
   - [Generate Suggestions](#post-apigenerate-suggestions)
   - [Test Endpoints](#test-endpoints)
4. [Error Codes](#error-codes)
5. [Data Models](#data-models)

---

## Overview

The AggieBuddie API provides endpoints for:
- Parsing student ICS schedule files
- Assigning building locations to classes
- Generating intelligent gym recommendations based on free time blocks
- Calculating walking distances between campus locations

### Key Features
- ✅ **Privacy-First**: No GPS tracking, uses only class schedule data
- ✅ **Campus-Only**: Suggests only verified Texas A&M campus locations
- ✅ **Intelligent**: Considers commute times, spare time, and gym hours
- ✅ **RESTful**: Standard HTTP methods and JSON responses

---

## Authentication

**MVP Version**: No authentication required.

All endpoints are publicly accessible during development. Future versions will implement student authentication.

---

## Endpoints

### GET `/api/health`

Health check endpoint to verify API status and service availability.

**Response:**
```json
{
  "status": "healthy",
  "message": "AggieBuddie Backend API is running",
  "version": "1.0.0-mvp",
  "services": {
    "location_service": true,
    "distance_service": true,
    "schedule_service": true,
    "location_optimizer": true,
    "ai_service": true
  },
  "all_services_ready": true,
  "phase_1_complete": true,
  "phase_2_complete": true
}
```

**Status Codes:**
- `200 OK` - API is healthy and ready

---

### POST `/api/upload-schedule`

Upload and parse a student's ICS (iCalendar) schedule file.

**Request Body:**
```json
{
  "studentId": "unique-student-id",
  "fileContent": "BEGIN:VCALENDAR\nVERSION:2.0\n..."
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `studentId` | string | Yes | Unique identifier for the student |
| `fileContent` | string | Yes | Complete ICS file content as string |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Schedule uploaded and parsed successfully",
  "studentId": "unique-student-id",
  "schedule": {
    "classes_count": 94,
    "classes": [
      {
        "course_id": "CSCE 221 Data Structures",
        "start": "Mon, 13 Jan 2025 09:00:00 GMT",
        "end": "Mon, 13 Jan 2025 10:45:00 GMT",
        "location": "ZACH",
        "description": "",
        "uid": "",
        "building_id": null
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing parameters or invalid ICS format
- `500 Internal Server Error` - Server-side parsing error

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/upload-schedule \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student123",
    "fileContent": "BEGIN:VCALENDAR\n..."
  }'
```

---

### POST `/api/schedule/add-locations`

Assign building locations to classes in a student's schedule.

**Request Body:**
```json
{
  "studentId": "unique-student-id",
  "locations": {
    "CSCE 221 Data Structures": "zachry-engineering-education-complex",
    "MATH 308 Linear Algebra": "bagel-block"
  }
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `studentId` | string | Yes | Student ID from upload-schedule |
| `locations` | object | Yes | Map of course names to building IDs |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Building locations assigned successfully",
  "studentId": "unique-student-id",
  "requested_assignments": 2,
  "assignments_made": 94
}
```

**Notes:**
- `assignments_made` can be higher than `requested_assignments` due to recurring classes
- Building IDs must exist in the campus locations database
- Must call `/api/upload-schedule` first

**Error Responses:**
- `400 Bad Request` - Invalid building IDs
- `404 Not Found` - Schedule not found for student
- `500 Internal Server Error` - Server error

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/schedule/add-locations \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student123",
    "locations": {
      "CSCE 221": "zachry-engineering-education-complex"
    }
  }'
```

---

### GET `/api/buildings`

Get a list of all campus buildings available for class location assignment.

**Response (200 OK):**
```json
{
  "success": true,
  "count": 67,
  "buildings": [
    {
      "id": "zachry-engineering-education-complex",
      "name": "Zachry Engineering Education Complex",
      "address": "890 Spence St, College Station, TX",
      "coordinates": {
        "latitude": 30.61871,
        "longitude": -96.34091
      }
    }
  ]
}
```

**Notes:**
- Buildings are sorted alphabetically by name
- Excludes gyms (those are destinations, not class locations)
- Use the `id` field for the `/api/schedule/add-locations` endpoint

**Example cURL:**
```bash
curl http://localhost:5000/api/buildings
```

---

### POST `/api/generate-suggestions`

Generate intelligent gym recommendations for free time blocks.

**Request Body:**
```json
{
  "studentId": "unique-student-id",
  "startOfDay": "08:00",
  "endOfDay": "18:00",
  "durationMinutes": 60
}
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `studentId` | string | Yes | - | Student ID from previous calls |
| `startOfDay` | string | No | "08:00" | Start of consideration window (HH:MM) |
| `endOfDay` | string | No | "18:00" | End of consideration window (HH:MM) |
| `durationMinutes` | integer | No | 60 | Desired activity duration in minutes |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Generated 3 suggestions",
  "studentId": "unique-student-id",
  "parameters": {
    "start_of_day": "08:00",
    "end_of_day": "18:00",
    "duration_minutes": 60
  },
  "suggestions": {
    "suggestions": [
      {
        "rank": 1,
        "date": "2025-01-13",
        "start_time": "10:45",
        "end_time": "14:00",
        "activity": "Exercise",
        "activity_duration": 60,
        "location_id": "polo-road-rec-center",
        "location_name": "Polo Road Rec Center",
        "location_address": "322 Polo Rd, College Station, TX",
        "previous_class": "CSCE 221 Data Structures",
        "next_class": "MATH 308 Linear Algebra",
        "commute_info": {
          "time_to": 4,
          "time_from": 7,
          "total_commute": 11,
          "spare_time": 124
        },
        "reasoning": "Excellent location - only 11 min total commute. 124 min buffer for flexibility.",
        "confidence_score": 1.0
      }
    ]
  }
}
```

**Suggestion Object Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `rank` | integer | Suggestion ranking (1 = best, lower is better) |
| `date` | string | Date of the free time block (YYYY-MM-DD) |
| `start_time` | string | Earliest start time for activity (HH:MM) |
| `end_time` | string | Latest end time (next class starts) |
| `location_id` | string | Gym identifier |
| `location_name` | string | Human-readable gym name |
| `location_address` | string | Physical address |
| `previous_class` | string | Class before the gap |
| `next_class` | string | Class after the gap |
| `commute_info.time_to` | integer | Walking time from previous class (minutes) |
| `commute_info.time_from` | integer | Walking time to next class (minutes) |
| `commute_info.total_commute` | integer | Total commute time (minutes) |
| `commute_info.spare_time` | integer | Extra buffer time (minutes) |
| `reasoning` | string | Human-readable explanation |
| `confidence_score` | float | Confidence (0.0-1.0, higher is better) |

**Prerequisites:**
1. Must call `/api/upload-schedule` first
2. Must call `/api/schedule/add-locations` to assign buildings

**Error Responses:**
- `400 Bad Request` - Missing studentId or buildings not assigned
- `404 Not Found` - Schedule not found
- `500 Internal Server Error` - Suggestion generation failed

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/generate-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student123",
    "startOfDay": "08:00",
    "endOfDay": "18:00",
    "durationMinutes": 60
  }'
```

---

## Test Endpoints

These endpoints are for testing and debugging only.

### GET `/api/test/locations`

Test LocationService functionality.

**Response:**
```json
{
  "success": true,
  "total_locations": 70,
  "gyms_count": 3,
  "dining_count": 55,
  "study_count": 12,
  "sample_gym": {
    "id": "student-rec-center",
    "name": "Student Rec Center",
    "type": "gym"
  }
}
```

---

### POST `/api/test/distance`

Calculate walking time between two locations.

**Request Body:**
```json
{
  "location_id_a": "zachry-engineering-education-complex",
  "location_id_b": "student-rec-center"
}
```

**Response:**
```json
{
  "success": true,
  "distance_info": {
    "distance_meters": 450.23,
    "distance_miles": 0.280,
    "walking_time_minutes": 6,
    "from_name": "Zachry Engineering Education Complex",
    "to_name": "Student Rec Center"
  }
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or request body |
| 404 | Not Found | Resource (schedule, location) not found |
| 500 | Internal Server Error | Server-side error occurred |

### Error Response Format

All errors return JSON with the following structure:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "traceback": "Detailed error trace (dev only)"
}
```

### Common Errors

**Missing Parameters:**
```json
{
  "error": "Missing required parameters: studentId and fileContent"
}
```

**Schedule Not Found:**
```json
{
  "error": "Schedule not found for this student",
  "message": "Please upload schedule first"
}
```

**Buildings Not Assigned:**
```json
{
  "error": "Buildings not assigned",
  "message": "Please assign building locations to classes first"
}
```

**Invalid Building ID:**
```json
{
  "error": "Invalid building IDs",
  "invalid_buildings": ["invalid-building-id"]
}
```

---

## Data Models

### Schedule Object

```typescript
{
  classes: [
    {
      course_id: string,        // "CSCE 221 Data Structures"
      start: string,            // ISO datetime
      end: string,              // ISO datetime
      location: string,         // "ZACH" (building code from ICS)
      description: string,      // Course description
      uid: string,              // Unique event ID
      building_id: string|null  // Assigned building ID
    }
  ]
}
```

### Building Object

```typescript
{
  id: string,                   // "zachry-engineering-education-complex"
  name: string,                 // "Zachry Engineering Education Complex"
  address: string,              // "890 Spence St, College Station, TX"
  coordinates: {
    latitude: number,           // 30.61871
    longitude: number           // -96.34091
  }
}
```

### Suggestion Object

```typescript
{
  rank: number,                 // 1-3 (1 is best)
  date: string,                 // "2025-01-13"
  start_time: string,           // "10:45"
  end_time: string,             // "14:00"
  activity: string,             // "Exercise"
  activity_duration: number,    // 60
  location_id: string,          // "polo-road-rec-center"
  location_name: string,        // "Polo Road Rec Center"
  location_address: string,     // "322 Polo Rd, College Station, TX"
  previous_class: string,       // "CSCE 221 Data Structures"
  next_class: string,           // "MATH 308 Linear Algebra"
  commute_info: {
    time_to: number,            // Minutes to gym
    time_from: number,          // Minutes from gym
    total_commute: number,      // Total commute time
    spare_time: number          // Buffer time remaining
  },
  reasoning: string,            // Human-readable explanation
  confidence_score: number      // 0.0-1.0
}
```

---

## Complete Workflow Example

Here's a complete example of using the API from start to finish:

```bash
# 1. Check API health
curl http://localhost:5000/api/health

# 2. Upload student schedule
curl -X POST http://localhost:5000/api/upload-schedule \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student123",
    "fileContent": "BEGIN:VCALENDAR\n..."
  }'

# 3. Get list of buildings
curl http://localhost:5000/api/buildings

# 4. Assign buildings to classes
curl -X POST http://localhost:5000/api/schedule/add-locations \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student123",
    "locations": {
      "CSCE 221 Data Structures": "zachry-engineering-education-complex",
      "MATH 308 Linear Algebra": "blocker-building"
    }
  }'

# 5. Generate gym suggestions
curl -X POST http://localhost:5000/api/generate-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student123",
    "startOfDay": "08:00",
    "endOfDay": "18:00",
    "durationMinutes": 60
  }'
```

---

## Implementation Notes

### Privacy & Security

- **No GPS Tracking**: The API never requests or stores actual GPS coordinates
- **Campus-Only**: All suggestions are from verified Texas A&M locations
- **In-Memory Storage**: Schedules are stored in memory (not persisted to disk in MVP)
- **No Authentication**: MVP version has no auth (add for production!)

### Performance Considerations

- **Walking Time Calculation**: Uses Haversine formula with 20% campus buffer
- **Suggestion Generation**: Analyzes all free time blocks and ranks by commute optimization
- **Recurring Events**: ICS files with RRULE are expanded into individual occurrences

### Rate Limits

No rate limits in MVP. Consider adding for production:
- Upload schedule: 10 requests/minute per student
- Generate suggestions: 20 requests/minute per student

---

## Support & Feedback

For issues, questions, or feature requests, please contact the development team.

**Phase 2 Complete!** All backend API endpoints are implemented and tested. ✅

---

**Last Updated:** November 21, 2025  
**API Version:** 1.0.0-mvp  
**Phase Status:** Phase 0-2 Complete (100%)

