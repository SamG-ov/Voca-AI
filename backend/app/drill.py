import difflib
import random
import string
import unicodedata

# Sentences for "Repeat after me", around A2-B1 level.
# No numbers, because speech recognition might write "3" instead of "trois".
SENTENCES = [
    "Je voudrais un café et un croissant, s'il vous plaît.",
    "Hier soir, je suis allé au cinéma avec mes amis.",
    "Est-ce que tu peux parler un peu plus lentement ?",
    "Nous allons visiter Paris le mois prochain.",
    "Quand j'étais petit, j'habitais dans une grande maison.",
    "Il fait très beau aujourd'hui, on va à la plage ?",
    "Je ne comprends pas, tu peux répéter ?",
    "Ma sœur travaille dans un hôpital depuis deux ans.",
    "Qu'est-ce que tu as fait ce week-end ?",
    "J'ai besoin d'acheter du pain et du fromage.",
    "Le train pour Lyon part à huit heures.",
    "Je suis désolé, je suis un peu en retard.",
    "Où est la gare, s'il vous plaît ?",
    "J'aime beaucoup lire avant de dormir.",
    "Tu veux venir dîner chez moi samedi soir ?",
    "Il faut que je finisse mon travail avant demain.",
    "Nous sommes partis en vacances en Espagne l'été dernier.",
    "Je pense que c'est une très bonne idée.",
    "Mon frère est plus grand que moi.",
    "Elle a mal à la tête depuis ce matin.",
    "Il y a beaucoup de monde dans le métro le matin.",
    "Je vais apprendre à cuisiner des plats français.",
    "Tu as déjà mangé des escargots ?",
    "Quand il pleut, je préfère rester à la maison.",
    "Je cherche un appartement près du centre-ville.",
    "On se retrouve devant le café à midi ?",
    "J'ai oublié mes clés dans la voiture.",
    "Le musée est fermé le lundi.",
    "Je n'ai jamais visité la Tour Eiffel.",
    "Si j'avais plus de temps, je voyagerais plus souvent.",
]

PUNCTUATION = string.punctuation + "«»…"


def random_sentence(current=""):
    choices = [sentence for sentence in SENTENCES if sentence != current]
    return random.choice(choices)


def clean_word(word, ignore_accents):
    word = word.lower().replace("’", "'")
    word = word.strip(PUNCTUATION)

    if ignore_accents:
        # "é" becomes "e" + an accent mark, then we drop the accent mark
        word = unicodedata.normalize("NFD", word)
        word = "".join(letter for letter in word if unicodedata.category(letter) != "Mn")

    return word


def compare(target, heard, ignore_accents=True):
    target_words = target.split()

    # the words we actually compare (skip things like "?" that are only punctuation)
    target_clean = []
    target_positions = []
    for i, word in enumerate(target_words):
        cleaned = clean_word(word, ignore_accents)
        if cleaned != "":
            target_clean.append(cleaned)
            target_positions.append(i)

    heard_clean = []
    for word in heard.split():
        cleaned = clean_word(word, ignore_accents)
        if cleaned != "":
            heard_clean.append(cleaned)

    # find which target words were said in the right order
    matcher = difflib.SequenceMatcher(None, target_clean, heard_clean, autojunk=False)
    matched = set()
    for block in matcher.get_matching_blocks():
        for i in range(block.size):
            matched.add(target_positions[block.a + i])

    words = []
    for i, word in enumerate(target_words):
        is_punctuation = clean_word(word, ignore_accents) == ""
        words.append({"word": word, "correct": is_punctuation or i in matched})

    score = round(len(matched) / len(target_clean) * 100)
    return words, score
