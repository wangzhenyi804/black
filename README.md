# BlackAd

## Backend (Java Spring Boot)

The backend has been migrated to Java Spring Boot.

### Prerequisites
- Docker & Docker Compose
- Java 17+ (for local development without Docker)
- Maven (for local development without Docker)

### Running with Docker Compose

1.  Make sure Docker is running.
2.  Run the following command in the root directory:
    ```bash
    docker-compose up --build
    ```
    This will start:
    - MySQL (Port 3306)
    - Redis (Port 6379)
    - Backend API (Port 8080)

### API Endpoints
- Base URL: `http://localhost:8080`
- Authentication: `POST /token`
- Users: `/users`
- Media: `/media`
- Code Slots: `/codeslots`
- Stats: `/stats`

### Database
- The database schema is automatically initialized using `schema.sql`.
- Default admin user: `admin` / `admin123`.

## Frontend (React)

The frontend is configured to connect to `http://localhost:8080`.

1.  Navigate to `frontend`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
