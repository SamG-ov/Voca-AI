import base64
import json
import time

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.stt import transcribe  # loads the whisper model when the server starts
from app.tutor import MODES, get_reply
from app.tts import VOICES, synthesize

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/turn")
async def turn(
    audio: UploadFile = File(...),
    history: str = Form("[]"),
    mode: str = Form("free_talk"),
    voice: str = Form("denise"),
    speed: str = Form("-10%", pattern=r"^[+-]\d{1,2}%$"),
):
    if mode not in MODES:
        raise HTTPException(400, "Unknown mode: " + mode)
    if voice not in VOICES:
        raise HTTPException(400, "Unknown voice: " + voice)

    try:
        history = json.loads(history)
    except json.JSONDecodeError:
        raise HTTPException(400, "History is not valid JSON")

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(400, "The recording is empty")

    # 1. Speech to text
    start = time.time()
    try:
        user_text = transcribe(audio_bytes)
    except Exception:
        raise HTTPException(400, "Could not read the audio file")
    stt_time = time.time() - start

    if user_text == "":
        raise HTTPException(422, "I didn't hear anything, try again")

    # 2. Tutor reply
    start = time.time()
    try:
        answer, usage = get_reply(history, user_text, mode)
    except Exception as error:
        print("Tutor error:", error)
        raise HTTPException(502, "The tutor is not available right now")
    tutor_time = time.time() - start

    # 3. Text to speech
    start = time.time()
    try:
        reply_audio = await synthesize(answer.reply, voice, speed)
    except Exception as error:
        print("TTS error:", error)
        raise HTTPException(502, "Could not create the tutor's voice")
    tts_time = time.time() - start

    print(f"STT {stt_time:.2f}s | tutor {tutor_time:.2f}s | TTS {tts_time:.2f}s")

    return {
        "transcript": user_text,
        "reply": answer.reply,
        "corrections": answer.corrections,
        "new_vocab": answer.new_vocab,
        "audio": base64.b64encode(reply_audio).decode(),
    }
