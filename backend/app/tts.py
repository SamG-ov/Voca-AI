import edge_tts

# 2 female and 2 male French voices
# The multilingual ones also sound right when the tutor switches to English
VOICES = {
    "vivienne": "fr-FR-VivienneMultilingualNeural",  # female
    "denise": "fr-FR-DeniseNeural",  # female
    "remy": "fr-FR-RemyMultilingualNeural",  # male
    "henri": "fr-FR-HenriNeural",  # male
}


async def synthesize(text, voice="vivienne", speed="-10%"):
    communicate = edge_tts.Communicate(text, VOICES[voice], rate=speed)

    audio = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]

    return audio
