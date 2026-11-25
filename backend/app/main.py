import base64
import json
import time

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.drill import compare, random_sentence
from app.modes import SCENARIOS, TOPICS, is_valid
from app.stt import transcribe  # loads the whisper model when the server starts
from app.tutor import START_MESSAGE, get_reply
from app.tts import VOICES, synthesize

SPEED_PATTERN = r"^[+-]\d{1,2}%$"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)


def check_settings(mode, option, voice):
    if not is_valid(mode, option):
        raise HTTPException(400, f"Unknown mode or option: {mode} {option}")
    if voice not in VOICES:
        raise HTTPException(400, "Unknown voice: " + voice)


async def listen(audio):
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(400, "The recording is empty")

    try:
        text = transcribe(audio_bytes)
    except Exception:
        raise HTTPException(400, "Could not read the audio file")

    if text == "":
        raise HTTPException(422, "I didn't hear anything, try again")
    return text


def ask_tutor(history, user_text, mode, option):
    try:
        answer, usage = get_reply(history, user_text, mode, option)
    except Exception as error:
        print("Tutor error:", error)
        raise HTTPException(502, "The tutor is not available right now")
    return answer


async def make_voice(text, voice, speed):
    try:
        audio = await synthesize(text, voice, speed)
    except Exception as error:
        print("TTS error:", error)
        raise HTTPException(502, "Could not create the tutor's voice")
    return base64.b64encode(audio).decode()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/modes")
def modes():
    return {"scenarios": SCENARIOS, "topics": TOPICS}


# The tutor says the first line of the session
@app.post("/api/start")
async def start(
    mode: str = Form("free_talk"),
    option: str = Form(""),
    voice: str = Form("denise"),
    speed: str = Form("-10%", pattern=SPEED_PATTERN),
):
    check_settings(mode, option, voice)

    answer = ask_tutor([], START_MESSAGE, mode, option)
    audio = await make_voice(answer.reply, voice, speed)

    return {
        "reply": answer.reply,
        "new_vocab": answer.new_vocab,
        "audio": audio,
    }


@app.post("/api/turn")
async def turn(
    audio: UploadFile = File(...),
    history: str = Form("[]"),
    mode: str = Form("free_talk"),
    option: str = Form(""),
    voice: str = Form("denise"),
    speed: str = Form("-10%", pattern=SPEED_PATTERN),
):
    check_settings(mode, option, voice)

    try:
        history = json.loads(history)
    except json.JSONDecodeError:
        raise HTTPException(400, "History is not valid JSON")

    # 1. Speech to text
    start_time = time.time()
    user_text = await listen(audio)
    stt_time = time.time() - start_time

    # 2. Tutor reply
    start_time = time.time()
    answer = ask_tutor(history, user_text, mode, option)
    tutor_time = time.time() - start_time

    # 3. Text to speech
    start_time = time.time()
    reply_audio = await make_voice(answer.reply, voice, speed)
    tts_time = time.time() - start_time

    print(f"STT {stt_time:.2f}s | tutor {tutor_time:.2f}s | TTS {tts_time:.2f}s")

    return {
        "transcript": user_text,
        "reply": answer.reply,
        "corrections": answer.corrections,
        "new_vocab": answer.new_vocab,
        "audio": reply_audio,
    }


# "Repeat after me": the tutor reads a new sentence
@app.post("/api/drill/next")
async def drill_next(
    current: str = Form(""),
    voice: str = Form("denise"),
    speed: str = Form("-10%", pattern=SPEED_PATTERN),
):
    if voice not in VOICES:
        raise HTTPException(400, "Unknown voice: " + voice)

    sentence = random_sentence(current)
    audio = await make_voice(sentence, voice, speed)
    return {"sentence": sentence, "audio": audio}


# "Repeat after me": compare what I said with the sentence
@app.post("/api/drill/check")
async def drill_check(
    audio: UploadFile = File(...),
    sentence: str = Form(..., min_length=1, max_length=300),
):
    heard = await listen(audio)
    words, score = compare(sentence, heard)
    return {"heard": heard, "words": words, "score": score}
