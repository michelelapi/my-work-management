# Self-Employed Work Management Platform

A comprehensive work management platform for self-employed professionals with React frontend, Spring Boot microservices backend, Python AI agent, and full Docker containerization.

## Project Structure

```
MyWorkManagement/
├── frontend/           # React TypeScript frontend application
├── backend/           # Spring Boot microservices
│   ├── company-service/
│   ├── project-service/
│   ├── task-service/
│   └── analytics-service/
├── ai-agent/          # Python FastAPI AI agent
├── docker/            # Docker configuration files
└── docs/             # Project documentation
```

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Axios
- Chart.js/Recharts

### Backend
- Spring Boot 3
- Spring Data JPA
- PostgreSQL
- Spring Cloud OpenFeign
- Spring Validation

### AI Agent
- Python 3.11
- FastAPI
- OpenAI API
- SQLAlchemy
- Pandas
- NumPy

## Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- Python 3.11+
- Docker and Docker Compose
- PostgreSQL


### Create docker container
- Create Authentication container
- run this command
docker-compose -f .\docker-compose.auth.yml up -d

- Create Application container
- run this command
docker-compose -f .\docker-compose.dev.yml up -d

### Create database in the containers
- Create db in Authentication container
- run these commands
    # Copy the script into the container
    docker cp ../backend/auth-service/src/main/resources/db/init.sql auth-service-db:/tmp/init.sql

    # Execute the script
    docker exec -it  auth-service-db psql -U postgres -d auth_service_db -f /tmp/init.sql

- Create db in Application container
- run these commands
    # Copy the script into the container
    docker cp ../backend/company-service/src/main/resources/db/init.sql company-service-db:/tmp/init.sql

    # Execute the script
    docker exec -it company-service-db psql -U postgres -d company_service_db -f /tmp/init.sql
