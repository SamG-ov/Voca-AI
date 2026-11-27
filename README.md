# Voca-AI

A voice tutor for practicing spoken French. You talk to it in French, it talks back, and it quietly points out your mistakes along the way.

I'm learning French (somewhere between A2 and B1) and the part I struggle with most is speaking. Apps are great for vocabulary and grammar drills, but they don't really give you a conversation partner. So I'm building one that runs on my own laptop and that I can practice with whenever I want.

**Status:** work in progress. The build plan is in [PHASES.md](PHASES.md).

## What it does

On a computer you hold the spacebar, say something in French, and let go. On a phone you tap the mic, speak, and tap again. The tutor replies out loud, and the conversation keeps going from there.

There are four ways to practice:

- **Free talk** - just a normal conversation. The tutor asks questions and keeps things moving.
- **Scenarios** - role-plays for everyday situations: ordering at a café, buying bread, checking into a hotel, seeing a doctor, asking for a train ticket, a job interview.
- **Topic discussion** - pick a topic (or get a random one) and give your opinion.
- **Repeat after me** - the tutor says a sentence, you repeat it, and you see which words you got right and which ones didn't come through.

### How corrections work

I didn't want the tutor to interrupt every time I make a mistake, because that kills the conversation. So corrections happen in three ways:

1. The tutor repeats what you said the correct way as part of its normal reply, the way a patient friend would.
2. Each mistake also shows up as a small card on the side of the screen with the correction and a short explanation in English.
3. When you end a session you get a review: your mistakes, new words that came up, and a few things to work on.

The tutor speaks simple French adjusted for an A2-B1 level, a little slower than normal, and nudges you toward B1 grammar when it fits.

## How it works

Each turn goes through three steps on the backend:

```
  Browser                         Backend (FastAPI)
  -------                         -----------------
  speak (SPACE/tap) --audio-->   1. speech to text    (faster-whisper, runs locally)
                                  2. tutor reply       (Claude Haiku via the Anthropic API)
  play reply, show   <--json---   3. text to speech    (edge-tts)
  transcript + cards
```

I went with separate speech-to-text, language model, and text-to-speech steps instead of a single speech-to-speech model. It's a bit slower, but having the text at every step is what makes the corrections, transcripts and session review possible.

The tutor returns structured JSON: the spoken reply, a list of corrections, and any new vocabulary. Only the reply gets turned into audio. The rest goes to the UI.

## Stack

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion
- **Backend:** Python, FastAPI
- **Speech to text:** faster-whisper, running on my laptop's GPU (RTX 3050)
- **Tutor:** Claude Haiku through the Anthropic API
- **Text to speech:** edge-tts with French neural voices

### Cost

I wanted this to cost basically nothing to run. Speech recognition runs locally and edge-tts is free, so the only paid part is the API call for the tutor's replies. With a small, fast model, a short system prompt, prompt caching and a trimmed conversation history, a session costs around a cent. I've set a hard limit of $5/month, but I don't expect to get anywhere near that.

## Project structure

This is the layout I'm planning. It'll probably change a bit as I build it.

```
Voca-AI/
├── backend/
│   ├── app/
│   │   ├── main.py        # API routes
│   │   ├── stt.py         # speech to text
│   │   ├── tutor.py       # tutor prompts and replies
│   │   ├── tts.py         # text to speech
│   │   ├── drill.py       # "repeat after me" comparison
│   │   └── modes/         # scenarios and topics
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   └── package.json
├── .env.example
├── PHASES.md
└── README.md
```

## Running it locally

Full instructions will be added once the first version works. Roughly:

You'll need Python 3.11+, Node.js 20+, and an Anthropic API key. An NVIDIA GPU makes speech recognition much faster but isn't required.

```bash
git clone https://github.com/SamG-ov/Voca-AI.git
cd Voca-AI
cp .env.example .env    # add your ANTHROPIC_API_KEY

# backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-local.txt   # includes Whisper for the GPU
uvicorn app.main:app --reload

# frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

### On a phone

Phones only let a website use the microphone over https, so there's a separate command for testing on a phone on the same wifi:

```bash
cd frontend
npm run dev:phone
```

Vite prints a "Network" address like `https://192.168.1.20:5173`. Open it on the phone, accept the certificate warning (it's a self-signed certificate for local testing), and allow the microphone.

### Online

To put it on a server (I use a free Oracle Cloud server), see [DEPLOY.md](DEPLOY.md). The server has no GPU, so there it uses Groq's Whisper API for speech to text (`STT_MODE=groq` in `.env`), and the app asks for a password so nobody else uses up my API credits.

## Privacy

When running locally, everything runs on your own machine. Audio is transcribed locally and isn't saved anywhere. On the server, the audio is sent to Groq for transcription instead. Only the text of the conversation is sent to the API. The API key stays in `.env` on the backend and never goes to the browser.

## Ideas for later

- Streaming the whole pipeline so replies start faster
- Actual pronunciation scoring, not just word matching
- Hands-free mode with voice activity detection instead of push-to-talk
- Being able to interrupt the tutor mid-sentence
- Vocabulary review with spaced repetition

## License

MIT
