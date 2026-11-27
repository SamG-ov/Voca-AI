import os
from dotenv import load_dotenv

load_dotenv("../.env")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# "local" runs Whisper on my laptop's GPU, "groq" uses Groq's Whisper API (for the server)
STT_MODE = os.getenv("STT_MODE", "local")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# if this is set, the app asks for this password before it can be used
APP_PASSWORD = os.getenv("APP_PASSWORD", "")
