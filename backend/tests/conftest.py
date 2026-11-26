import os
import sys
import types

# The tests should never call the real Anthropic API
os.environ["ANTHROPIC_API_KEY"] = "test-key"

# Loading the real Whisper model is slow and needs the GPU,
# so the tests use a fake speech to text module instead
fake_stt = types.ModuleType("app.stt")
fake_stt.transcribe = lambda audio: "Bonjour"
sys.modules["app.stt"] = fake_stt
