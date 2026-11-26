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

- [x] Set up the Anthropic SDK with the key from `.env`
- [x] Write the system prompt: A2-B1 level, simple French, repeat my sentence back correctly instead of stopping the conversation, explanations in English
- [x] Have it return structured JSON:
  ```json
  {
    "corrections": [{ "original": "...", "corrected": "...", "explanation": "..." }],
    "reply": "...",
    "new_vocab": [{ "word": "...", "translation": "..." }]
  }
  ```
- [x] Write `get_reply(history, user_text, mode)`
- [x] Keep costs down: cache the system prompt, only send the last few turns, cap the response length
- [x] Try it from the terminal by typing French sentences

Finished when I type a sentence with a mistake and get back a natural reply plus a correction for it.

Notes from testing:
- At first the tutor sometimes repeated my mistake in its own reply ("si il fait beau"). Putting `corrections` before `reply` in the JSON fixed it, because now it finds the mistakes before it writes the answer.
- Low effort is faster (~2s instead of ~3-5s) and was just as good, even better, at catching mistakes.
- A turn costs about $0.0001, so a 20 minute session is well under 1 cent.

## 4. Text to speech

- [x] Install edge-tts
- [x] Write `synthesize(text, voice, speed) -> mp3`
- [x] Pick 2 female and 2 male French voices to choose from
- [x] Default to a slightly slower speed

Finished when a French sentence comes out as clear, natural-sounding audio.

Notes:
- Voices: Denise and Vivienne (female), Henri and Remy (male). Denise is the default.
- Vivienne and Remy are multilingual, so they also sound right when the tutor explains something in English. But they're often much slower (up to 10s), which is why Denise is the default.
- Default speed is -10%. With Denise or Henri, each sentence takes about 1 second to generate.

## 5. Putting the pipeline together

One endpoint that does all three steps.

- [x] `POST /api/turn`: takes the audio, conversation history, mode and settings
- [x] Returns the transcript, the reply, corrections, new vocab and the reply audio
- [x] Validate the request with Pydantic
- [x] Handle the obvious failures: empty recording, no speech, API errors
- [x] Allow requests from the local frontend (CORS)
- [x] Log how long each step takes so I know where the delay is

Finished when I can send an audio file to `/api/turn` from the FastAPI docs page and get a full response back.

Notes:
- A normal turn takes about 4-5 seconds: speech to text ~1.1s, tutor ~1.5s, text to speech ~1-2s, plus the upload.
- The first request after starting the server is a bit slower because Whisper is warming up.

## 6. Frontend basics

Talk to the tutor from the browser.

- [x] Three pages: home, session, review
- [x] Dark theme with one accent colour
- [x] Microphone recording with `MediaRecorder`
- [x] Hold space to record, release to send. Ignore key repeat, and don't trigger when typing in an input.
- [x] Call `/api/turn` and play the audio that comes back

Finished when I can hold space, say something, and hear the tutor answer.

Notes:
- The microphone is turned on once when a session starts, so the first word of each recording doesn't get cut off.
- A tap shorter than half a second is ignored, and space does nothing while the tutor is thinking or speaking.
- I kept the pages as a simple `page` state in `App.jsx` instead of adding a router.

## 7. Conversation screen

Make it look good. I want it minimal, but a bit futuristic.

- [x] An animated orb in the middle with different states: idle, listening, thinking, speaking
- [x] Have the orb react to my voice volume while I'm talking
- [x] Chat-style transcript
- [x] Correction cards that slide in on the side
- [x] Small hints like "Hold space to talk" and "Thinking..."
- [x] Make sure the layout works at different window sizes

Finished when a full conversation feels smooth and looks finished.

Notes:
- Animations use the `motion` library (the new name of Framer Motion).
- The mic volume comes from a Web Audio `AnalyserNode`, and the orb grows up to 1.5x when I talk louder.
- On big screens the corrections are a panel on the right. On small screens they move under the chat, and the orb gets smaller.

## 8. Conversation modes

- [x] Mode picker on the home page
- [x] Separate prompt instructions for each mode
- [x] Free talk: the tutor opens with a greeting and a question
- [x] Scenarios: 6-8 situations (café, boulangerie, hotel, doctor, train station, job interview...), each with a goal and a role for the tutor
- [x] Topic discussion: a list of topics plus a random option
- [x] The tutor speaks first when a session starts

Finished when each mode starts a different kind of conversation that makes sense.

Notes:
- Scenarios and topics live in `backend/app/modes.py`. The frontend loads them from `/api/modes`, so adding a new one only means editing that file.
- 7 scenarios (café, bakery, hotel, doctor, train station, apartment visit, job interview) and 12 topics.
- In role-plays the tutor uses "vous", like in real life. At first it kept mixing "tu" and "vous", and once it even "corrected" "s'il vous plaît" to "s'il te plaît" while playing a waiter.
- For the tutor to speak first, `/api/start` sends a hidden "Start the conversation." message. The same message is put back at the start of the history on later turns, because the API needs the first message to come from the user.

## 9. Repeat after me

- [x] Sentences at my level, either generated or from a list
- [x] The tutor reads the sentence, with the option to hide the text
- [x] I repeat it with space, and the transcript is compared word by word
- [x] `drill.py`: normalise case, punctuation and accents, then diff the words
- [x] Show which words matched, which didn't, and a score
- [x] Buttons for listen again, try again and next sentence

Finished when I can do a full round and clearly see what I got wrong.

Notes:
- I went with a fixed list of 30 sentences instead of generating them, so the drill costs nothing and works without the API.
- None of the sentences have numbers, because Whisper might write "8" instead of "huit" and the comparison would fail.
- The comparison uses Python's `difflib.SequenceMatcher`, so a missing or extra word doesn't shift everything after it.
- Accents are ignored when comparing, because "a" and "à" sound the same and that's Whisper's spelling, not my pronunciation.
- Checking a sentence takes about 1 second.

## 10. Session review

- [x] "End session" button
- [x] `POST /api/review` builds a summary from the whole conversation
- [x] Review page with mistakes, new words, a few tips and drill scores
- [x] Download the review as a Markdown file

Finished when ending a session gives me a review I'd actually want to read.

Notes:
- The tutor only writes the summary, what went well and the tips. Mistakes and new words are already known from the session, so they don't need another API call.
- The tips group similar mistakes together (for example all the le/la mistakes become one tip).
- A drill-only session doesn't call the API at all. It shows each attempt with its score and the words I missed.
- The same mistake or word is only listed once, even if it came up several times.
- A review takes about 3 seconds and costs less than a cent.

## 11. Polish and tests

- [x] Settings for voice and speaking speed
- [x] Proper messages for denied mic access, no speech, backend down and API errors
- [x] Loading states, and no double submits
- [x] pytest tests for the drill comparison, parsing the tutor's response, and `/api/turn` with the three services mocked
- [x] Check the real cost per session
- [x] Clean up the code and run formatters (ruff, prettier)

Finished when tests pass and I can get through a 20 minute session without problems.

Notes:
- Settings (voice and speed) are on the home page and saved in the browser's localStorage.
- 29 tests, run with `pytest` from the backend folder. They replace Whisper, Claude and edge-tts with fakes, so they're fast and free and don't need the GPU.
- A longer test session found a real bug: the tutor kept listing mistakes from earlier messages again and again ("j'ai allé" came back 7 times). Telling it to only correct the latest message wasn't enough, so now the code also drops any correction whose words aren't in the latest message.
- Real cost: about $0.005 for a 30-turn session including the review, so around $0.15 a month if I practise every day.
- If I end a session while the tutor is still loading, its reply is ignored and doesn't play on the review page.
- `ruff check .` and `ruff format .` for Python, and `npm run format` for the frontend. Ruff only uses the classic rules (E, F, I).

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
