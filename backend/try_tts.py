# Make audio files with each tutor voice so I can listen to them
# Run from the backend folder: python try_tts.py
# The files are saved in the samples folder

import asyncio
import time
from app.tts import VOICES, synthesize

TEXT = "Ah, tu es allé au marché hier, c'est sympa ! Est-ce que tu vas souvent au marché ?"
ENGLISH_TEXT = "Sorry, I asked if you go to the market often. Essaie de répondre en français !"


async def make_file(file_name, text, voice, speed):
    start = time.time()
    audio = await synthesize(text, voice, speed)
    seconds = time.time() - start

    with open("samples/" + file_name, "wb") as f:
        f.write(audio)

    print(f"{file_name}: {len(audio) // 1024} KB in {seconds:.2f}s")


async def main():
    for voice in VOICES:
        await make_file(f"tts_{voice}.mp3", TEXT, voice, "-10%")
        await make_file(f"tts_{voice}_english.mp3", ENGLISH_TEXT, voice, "-10%")

    await make_file("tts_vivienne_normal_speed.mp3", TEXT, "vivienne", "+0%")
    await make_file("tts_vivienne_slow.mp3", TEXT, "vivienne", "-25%")


asyncio.run(main())
