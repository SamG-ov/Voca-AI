# Quick test: transcribe every audio file in the samples folder
# Run from the backend folder: python try_stt.py

import os
import time
from app.stt import transcribe

for file_name in os.listdir("samples"):
    with open("samples/" + file_name, "rb") as f:
        audio = f.read()

    start = time.time()
    text = transcribe(audio)
    seconds = time.time() - start

    print(f"{file_name} ({seconds:.2f}s): {text}")
