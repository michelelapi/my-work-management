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

### Development Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd MyWorkManagement
```

2. Start the development environment:
```bash
docker-compose -f docker/docker-compose.dev.yml up
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend Services: 
  - Company Service: http://localhost:8081
  - Project Service: http://localhost:8082
  - Task Service: http://localhost:8083
  - Analytics Service: http://localhost:8084
- AI Agent: http://localhost:8000

## Features

- Company management
- Project management with tariff settings
- Task management with time tracking
- Billing and payment tracking
- Time reports and analytics
- AI-powered natural language commands
- Responsive design with modern UI/UX

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 