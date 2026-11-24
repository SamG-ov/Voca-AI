import edge_tts

# 2 female and 2 male French voices
# The multilingual ones sound better in English, but they are often slower (up to 10s)
VOICES = {
    "denise": "fr-FR-DeniseNeural",  # female
    "vivienne": "fr-FR-VivienneMultilingualNeural",  # female
    "henri": "fr-FR-HenriNeural",  # male
    "remy": "fr-FR-RemyMultilingualNeural",  # male
}


async def synthesize(text, voice="denise", speed="-10%"):
    communicate = edge_tts.Communicate(text, VOICES[voice], rate=speed)

    audio = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]

    return audio
