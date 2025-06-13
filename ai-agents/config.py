import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AI Configuration
AI_PROVIDER = "claude"  # Options: "claude", "openai"
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = "claude-sonnet-4-20250514"  # Using Claude 2 model

# Service Configuration
COMPANY_SERVICE_URL = "http://host.docker.internal:8081"  # This allows Docker to access the host machine
VECTOR_DB_DIR = "./data"

# API Configuration
API_HOST = "0.0.0.0"
API_PORT = 8000 