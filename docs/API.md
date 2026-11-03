# RAKIT Campus — REST API v1 Documentation

## 1. Overview & Conventions

The RAKIT Campus REST API provides a secure, versioned backend service consumed by the Flutter mobile client and third-party integrations.

- **Base URL:** `http://localhost:8000/api/v1` (or local IP / domain)
- **Headers:**
  - `Accept: application/json`
  - `Content-Type: application/json`
  - `Authorization: Bearer <sanctum_personal_access_token>` (for authenticated routes)

### Standard Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

---

## 2. Authentication Endpoints

### `POST /auth/register`
Create a new student account.
- **Payload:**
  ```json
  {
    "name": "Ahmad Fauzi",
    "email": "ahmad@polindra.ac.id",
    "password": "password123",
    "password_confirmation": "password123",
    "campus_id": 1,
    "nim": "2104005",
    "major": "Teknik Informatika"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": { "id": 5, "name": "Ahmad Fauzi", "email": "ahmad@polindra.ac.id" },
    "token": "1|ra_sec_..."
  }
  ```

### `POST /auth/login`
Authenticate with email and password.
- **Payload:**
  ```json
  {
    "email": "budi@polindra.ac.id",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": { "id": 1, "name": "Budi Santoso", "global_role": "student" },
    "token": "2|ra_sec_..."
  }
  ```

### `GET /auth/me`
Retrieve authenticated user and profile context.

### `POST /auth/logout`
Revoke current Sanctum token.

---

## 3. Project Endpoints

### `GET /projects`
Retrieve paginated projects within the user's campus scope.
- **Query Params:**
  - `category` (optional): `academic`, `personal`, `startup`, `research`
  - `search` (optional): keyword match on title/description
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "Sistem Monitoring IoT Pertanian Indramayu",
        "category": "academic",
        "status": "recruiting",
        "max_members": 5,
        "leader": { "name": "Budi Santoso" },
        "recruitment": { "roles": [...] },
        "skills": ["IoT", "Laravel", "React"]
      }
    ]
  }
  ```

### `GET /projects/{id}`
Retrieve complete project details including open recruitment positions and team membership.

### `POST /projects`
Create a new collaboration project (Requires authenticated student).

### `POST /projects/{id}/apply`
Submit an application for an open recruitment role.
- **Payload:**
  ```json
  {
    "recruitment_role_id": 1,
    "cover_letter": "Saya menguasai Flutter dan ingin berkontribusi pada pengembangan mobile client sistem IoT ini."
  }
  ```

---

## 4. Competition Endpoints

### `GET /competitions`
List all verified competitions and hackathons.
- **Query Params:**
  - `level`: `campus`, `regional`, `national`, `international`
  - `search`: string

### `GET /competitions/{id}`
Retrieve competition timeline, guidelines, eligibility rules, and registered teams.

---

## 5. Matching Engine Endpoints

### `GET /matching/recommendations`
Query explainable collaborator recommendations based on candidate profiles.
- **Query Params:**
  - `project_id` (optional): target project
  - `recruitment_role_id` (optional): specific open role
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "candidate": { "id": 2, "name": "Siti Nurhaliza" },
        "total_score": 87.5,
        "breakdown": {
          "skill_score": 90.0,
          "role_score": 85.0,
          "availability_score": 80.0,
          "interest_score": 100.0
        },
        "matched_skills": ["Flutter", "UI/UX", "REST API"],
        "missing_skills": ["Docker"],
        "explanation": "Kecocokan sangat tinggi pada keahlian mobile development dan ketersediaan waktu 15 jam/minggu."
      }
    ]
  }
  ```

---

## 6. Workspace & Kanban Endpoints

### `GET /teams/{teamId}/workspace`
Retrieve team workspace data, active milestones, and task boards.

### `PATCH /teams/{teamId}/tasks/{taskId}/status`
Update task status (drag-and-drop Kanban transition).
- **Payload:**
  ```json
  {
    "status": "in_progress"
  }
  ```

### `POST /teams/{teamId}/tasks`
Create a new task under a team milestone.

---

## 7. Profile & Portfolio Endpoints

### `GET /profile`
Retrieve full student profile, verified skills, and experience items.

### `PUT /profile`
Update headline, bio, contact links, and availability hours.

### `GET /portfolio`
Showcase verified public portfolio items and project accomplishments.
