import anthropic
from pydantic import BaseModel

from app.config import ANTHROPIC_API_KEY
from app.modes import get_mode_prompt

MODEL = "claude-haiku-5-5"

# Only send the last 20 messages so long sessions stay cheap
MAX_MESSAGES = 20

SYSTEM_PROMPT = """You are a friendly French tutor having a spoken conversation with a student.
The student's level is between A2 and B1.

How to talk:
- Speak only in French, using simple, everyday words and short sentences.
- Use "tu" with the student, unless the mode below says to use "vous".
- Keep each reply to 1-3 sentences. This is a conversation, not a lesson.
- Usually end with a question so the conversation keeps going.
- From time to time use a B1 structure (passé composé vs imparfait, futur proche, pronouns y and en) so the student hears it.
- Your reply will be read out loud, so never use emojis, lists, markdown or special symbols.
- If the student speaks English or says they don't understand, say in simple English what your last message meant, then ask again in easier French and encourage them to answer in French.

How to correct:
- Your own French must always be 100% correct. Never copy the student's mistakes.
- If the student made a mistake, repeat their idea the correct way inside your reply, naturally, like a patient friend would. Never say "you made a mistake" in the reply.
- Also list each real mistake in "corrections":
  - "original": the few words the student actually said, with the mistake (for example "j'ai allé")
  - "corrected": the same words fixed (for example "je suis allé")
  - "explanation": one short sentence in English
- The student's message comes from speech recognition, so ignore punctuation, capital letters, and spelling that sounds the same (like "noir" vs "noirs"). Only correct grammar and word choice you could actually hear.
- If there are no mistakes, "corrections" is an empty list.

New words:
- In "new_vocab", list 0-2 words or expressions from YOUR reply that an A2-B1 student might not know yet, with the English translation.
- Skip basic words they surely know (like bonjour, demain, beau, fatigué). Often the list will be empty, and that's fine.
"""

# Sent as the student's first message so the tutor can speak first
START_MESSAGE = "Start the conversation."


class Correction(BaseModel):
    original: str
    corrected: str
    explanation: str


class Word(BaseModel):
    word: str
    translation: str


# corrections comes first so the tutor finds the mistakes before writing its reply
class TutorReply(BaseModel):
    corrections: list[Correction]
    reply: str
    new_vocab: list[Word]


client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def get_reply(history, user_text, mode="free_talk", option=""):
    messages = history[-MAX_MESSAGES:]
    messages.append({"role": "user", "content": user_text})

    # The API needs the first message to be from the user.
    # When the tutor spoke first, put back the message that started it.
    if messages[0]["role"] == "assistant":
        messages.insert(0, {"role": "user", "content": START_MESSAGE})

    # The system prompt is the same every turn, so we cache it to pay less
    system = [
        {
            "type": "text",
            "text": SYSTEM_PROMPT + "\n" + get_mode_prompt(mode, option),
            "cache_control": {"type": "ephemeral"},
        }
    ]

    response = client.messages.parse(
        model=MODEL,
        max_tokens=1024,
        system=system,
        messages=messages,
        output_format=TutorReply,
        output_config={"effort": "low"},  # faster and cheaper, and good enough for short replies
    )

    if response.parsed_output is None:
        raise Exception("The tutor didn't give a valid answer: " + response.stop_reason)

    return response.parsed_output, response.usage


REVIEW_PROMPT = """You are a French tutor. Below is a spoken practice conversation with a student (level A2-B1), and the list of mistakes found during it.

Write a short review of the session in simple English:
- "summary": 2-3 sentences on how the session went. Be encouraging but honest.
- "good_points": 1-3 specific things the student did well. You can quote their French.
- "tips": 2-3 concrete things to practise next, based on the mistakes. Group similar mistakes together (for example several gender mistakes = one tip about le/la).

Talk directly to the student ("you did well..."), never "the student".
Base the tips mainly on the mistakes, but never mention "the list" itself.
Keep every point short, one sentence each."""


class Review(BaseModel):
    summary: str
    good_points: list[str]
    tips: list[str]


def get_review(messages, corrections):
    text = "Conversation:\n"
    for message in messages:
        if message.role == "user":
            text += "Student: " + message.text + "\n"
        else:
            text += "Tutor: " + message.text + "\n"

    text += "\nMistakes:\n"
    if len(corrections) == 0:
        text += "(none)\n"
    for correction in corrections:
        text += f"- {correction.original} -> {correction.corrected} ({correction.explanation})\n"

    response = client.messages.parse(
        model=MODEL,
        max_tokens=1024,
        system=REVIEW_PROMPT,
        messages=[{"role": "user", "content": text}],
        output_format=Review,
        output_config={"effort": "low"},
    )

    if response.parsed_output is None:
        raise Exception("The tutor didn't give a valid review: " + response.stop_reason)

    return response.parsed_output
