# AI Agent Service

This service provides an AI-powered interface to interact with the company service API using natural language.

## Features

- Natural language processing of user requests using Claude AI
- Automatic endpoint discovery and vector storage
- Intelligent field extraction from user input
- Direct API calls to the company service

## Setup

1. Create a `.env` file in the project root with the following content:
```
CLAUDE_API_KEY=your_claude_api_key
```

2. Build and run the Docker container:
```bash
docker build -t ai-agent-service .
docker run -p 8000:8000 --env-file .env ai-agent-service
```

## Usage

Send a POST request to `/process-request` with a JSON body containing the natural language request:

```bash
curl -X POST http://localhost:8000/process-request \
  -H "Content-Type: application/json" \
  -d '{"text": "I want to create a new company called Acme Corp with email contact@acme.com"}'
```

The service will:
1. Search for the relevant endpoint in the vector database
2. If not found, fetch and process the Swagger documentation
3. Extract required fields from the request using Claude AI
4. Make the appropriate API call to the company service

## Configuration

You can modify the `config.py` file to adjust various settings:
- AI model selection and configuration
- Service URLs and ports
- Vector database settings

## Requirements

- Python 3.9+
- Docker
- Claude API key
- Access to the company service API (running on localhost:8081) 