# Chat with the tutor in the terminal by typing French sentences
# Run from the backend folder: python try_tutor.py
# Type "quit" to stop

import time
from app.tutor import get_reply

# Haiku prices in dollars per million tokens
INPUT_PRICE = 0.10
CACHE_WRITE_PRICE = 0.125
CACHE_READ_PRICE = 0.01
OUTPUT_PRICE = 0.50

history = []
total_cost = 0

while True:
    user_text = input("\nYou: ")
    if user_text == "quit":
        break

    start = time.time()
    answer, usage = get_reply(history, user_text)
    seconds = time.time() - start

    print("Tutor:", answer.reply)
    for correction in answer.corrections:
        print(f"  [fix] {correction.original} -> {correction.corrected} ({correction.explanation})")
    for word in answer.new_vocab:
        print(f"  [new] {word.word} = {word.translation}")

    cost = (
        usage.input_tokens * INPUT_PRICE
        + usage.cache_creation_input_tokens * CACHE_WRITE_PRICE
        + usage.cache_read_input_tokens * CACHE_READ_PRICE
        + usage.output_tokens * OUTPUT_PRICE
    ) / 1_000_000
    total_cost += cost
    print(f"  ({seconds:.1f}s, cached tokens: {usage.cache_read_input_tokens}, cost: ${cost:.5f})")

    history.append({"role": "user", "content": user_text})
    history.append({"role": "assistant", "content": answer.reply})

print(f"\nTotal cost: ${total_cost:.5f}")
