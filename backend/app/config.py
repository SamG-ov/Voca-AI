import os
from dotenv import load_dotenv

load_dotenv("../.env")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
