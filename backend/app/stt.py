import io
import os
import sys

# Windows needs to know where the CUDA libraries from pip are
nvidia_folder = os.path.join(sys.prefix, "Lib", "site-packages", "nvidia")
os.environ["PATH"] += ";" + os.path.join(nvidia_folder, "cublas", "bin")
os.environ["PATH"] += ";" + os.path.join(nvidia_folder, "cudnn", "bin")

from faster_whisper import WhisperModel

MODEL_SIZE = "large-v3-turbo"

try:
    model = WhisperModel(MODEL_SIZE, device="cuda", compute_type="int8_float16")
    print("Whisper is running on GPU")
except Exception:
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    print("Whisper is running on CPU")


def transcribe(audio_bytes):
    audio = io.BytesIO(audio_bytes)
    segments, info = model.transcribe(audio, language="fr", beam_size=5, vad_filter=True)

    text = ""
    for segment in segments:
        text += segment.text

    return text.strip()
