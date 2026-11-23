# Build plan

This is how I'm planning to build Voca-AI, split into phases. The idea is that every phase ends with something I can actually run and test before moving on. Backend pieces come first so I can test each one on its own before there's any UI on top.

I'll tick things off as I go.

1. Project setup
2. Speech to text
3. The tutor
4. Text to speech
5. Putting the pipeline together
6. Frontend basics
7. Conversation screen
8. Conversation modes
9. Repeat after me
10. Session review
11. Polish and tests
12. Demo and final README

---

## 1. Project setup

Get both halves of the project running, even if they don't do anything yet.

- [x] Check versions: Python 3.11+, Node.js 20+, NVIDIA driver / CUDA
- [x] Create `backend/` and `frontend/` folders
- [x] `.gitignore` for Python, Node, `.env` and model/audio files
- [x] `.env.example` with `ANTHROPIC_API_KEY=`
- [x] FastAPI app with a `/api/health` route
- [x] React app with Vite and Tailwind
- [x] Add the MIT license
- [ ] Set a $5/month spending limit in the Anthropic console

Finished when the backend answers on `/api/health` and the frontend loads in the browser.

## 2. Speech to text

Turn a recording of me speaking French into text, locally.

- [x] Install faster-whisper and load the model once when the server starts
- [x] Compare `small`, `medium` and `large-v3-turbo` on my GPU (4 GB VRAM) and pick the best tradeoff between speed and accuracy
- [x] Fall back to CPU if CUDA isn't available
- [x] Set the language to French instead of auto-detecting it
- [x] Write `transcribe(audio) -> text`
- [x] Test with a few recordings, including some with deliberate mistakes. Whisper tends to "fix" grammar on its own, which would hide exactly the mistakes I want corrected.

Finished when a short recording comes back as an accurate transcript in a second or two.

Notes from testing:
- `large-v3-turbo` won. It was about as fast as `small` (~0.7s per sentence) and got the most words right. `medium` was twice as slow.
- Mistakes like "j'ai allé", "une café" and "un baguette" come through as said, which is what I want.
- Mistakes you can't hear (like "noir" vs "noirs") can't be caught from audio anyway.
- On Windows the GPU needs the cuBLAS and cuDNN pip packages, and `av` has to stay on version 18 for now.

## 3. The tutor

The part that actually responds and corrects.

- [ ] Set up the Anthropic SDK with the key from `.env`
- [ ] Write the system prompt: A2-B1 level, simple French, repeat my sentence back correctly instead of stopping the conversation, explanations in English
- [ ] Have it return structured JSON:
  ```json
  {
    "reply": "...",
    "corrections": [{ "original": "...", "corrected": "...", "explanation": "..." }],
    "new_vocab": [{ "word": "...", "translation": "..." }]
  }
  ```
- [ ] Write `get_reply(history, user_text, mode)`
- [ ] Keep costs down: cache the system prompt, only send the last few turns, cap the response length
- [ ] Try it from the terminal by typing French sentences

Finished when I type a sentence with a mistake and get back a natural reply plus a correction for it.

## 4. Text to speech

- [ ] Install edge-tts
- [ ] Write `synthesize(text, voice, speed) -> mp3`
- [ ] Pick a default female and male French voice
- [ ] Default to a slightly slower speed

Finished when a French sentence comes out as clear, natural-sounding audio.

## 5. Putting the pipeline together

One endpoint that does all three steps.

- [ ] `POST /api/turn`: takes the audio, conversation history, mode and settings
- [ ] Returns the transcript, the reply, corrections, new vocab and the reply audio
- [ ] Validate the request with Pydantic
- [ ] Handle the obvious failures: empty recording, no speech, API errors
- [ ] Allow requests from the local frontend (CORS)
- [ ] Log how long each step takes so I know where the delay is

Finished when I can send an audio file to `/api/turn` from the FastAPI docs page and get a full response back.

## 6. Frontend basics

Talk to the tutor from the browser.

- [ ] Three pages: home, session, review
- [ ] Dark theme with one accent colour
- [ ] Microphone recording with `MediaRecorder`
- [ ] Hold space to record, release to send. Ignore key repeat, and don't trigger when typing in an input.
- [ ] Call `/api/turn` and play the audio that comes back

Finished when I can hold space, say something, and hear the tutor answer.

## 7. Conversation screen

Make it look good. I want it minimal, but a bit futuristic.

- [ ] An animated orb in the middle with different states: idle, listening, thinking, speaking
- [ ] Have the orb react to my voice volume while I'm talking
- [ ] Chat-style transcript
- [ ] Correction cards that slide in on the side
- [ ] Small hints like "Hold space to talk" and "Thinking..."
- [ ] Make sure the layout works at different window sizes

Finished when a full conversation feels smooth and looks finished.

## 8. Conversation modes

- [ ] Mode picker on the home page
- [ ] Separate prompt instructions for each mode
- [ ] Free talk: the tutor opens with a greeting and a question
- [ ] Scenarios: 6-8 situations (café, boulangerie, hotel, doctor, train station, job interview...), each with a goal and a role for the tutor
- [ ] Topic discussion: a list of topics plus a random option
- [ ] The tutor speaks first when a session starts

Finished when each mode starts a different kind of conversation that makes sense.

## 9. Repeat after me

- [ ] Sentences at my level, either generated or from a list
- [ ] The tutor reads the sentence, with the option to hide the text
- [ ] I repeat it with space, and the transcript is compared word by word
- [ ] `drill.py`: normalise case, punctuation and accents, then diff the words
- [ ] Show which words matched, which didn't, and a score
- [ ] Buttons for listen again, try again and next sentence

Finished when I can do a full round and clearly see what I got wrong.

## 10. Session review

- [ ] "End session" button
- [ ] `POST /api/review` builds a summary from the whole conversation
- [ ] Review page with mistakes, new words, a few tips and drill scores
- [ ] Download the review as a Markdown file

Finished when ending a session gives me a review I'd actually want to read.

## 11. Polish and tests

- [ ] Settings for voice and speaking speed
- [ ] Proper messages for denied mic access, no speech, backend down and API errors
- [ ] Loading states, and no double submits
- [ ] pytest tests for the drill comparison, parsing the tutor's response, and `/api/turn` with the three services mocked
- [ ] Check the real cost per session
- [ ] Clean up the code and run formatters (ruff, prettier)

Finished when tests pass and I can get through a 20 minute session without problems.

## 12. Demo and final README

- [ ] Record a 1-2 minute demo video and a short GIF
- [ ] Screenshots, setup instructions and the architecture diagram in the README
- [ ] Write up why I picked this architecture and what it costs to run
- [ ] Double-check that no keys or secrets ever got committed

Finished when someone can open the repo and understand what it is and how it works in a couple of minutes.

---

## Maybe later

- Streaming each step so the reply starts sooner
- Real pronunciation scoring
- Hands-free mode instead of push-to-talk
- Interrupting the tutor while it's speaking
- Spaced-repetition vocab review
- A mobile version
