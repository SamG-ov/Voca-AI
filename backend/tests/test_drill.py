from app.drill import SENTENCES, compare, random_sentence

SENTENCE = "Est-ce que tu peux parler un peu plus lentement ?"


def missed_words(words):
    return [word["word"] for word in words if not word["correct"]]


def test_same_sentence_is_100():
    words, score = compare(SENTENCE, "Est-ce que tu peux parler un peu plus lentement?")
    assert score == 100
    assert missed_words(words) == []


def test_missing_words_are_marked():
    words, score = compare(SENTENCE, "Est-ce que tu peux parler plus lentement")
    assert missed_words(words) == ["un", "peu"]
    assert score == 78


def test_wrong_word_is_marked():
    words, score = compare("Hier soir, je suis allé au cinéma.", "Hier soir j'ai allé au cinéma")
    assert missed_words(words) == ["je", "suis"]


def test_accents_and_punctuation_are_ignored():
    words, score = compare("Où est la gare, s'il vous plaît ?", "ou est la gare s'il vous plait")
    assert score == 100


def test_curly_apostrophe_counts_as_normal():
    words, score = compare("Je voudrais un café, s'il vous plaît.", "Je voudrais un café s’il vous plaît")
    assert score == 100


def test_question_mark_is_not_counted_as_a_word():
    words, score = compare(SENTENCE, "bonjour")
    assert words[-1] == {"word": "?", "correct": True}
    assert score == 0


def test_extra_words_dont_lower_the_score():
    words, score = compare("Le musée est fermé le lundi.", "Le musée est fermé le lundi le lundi")
    assert score == 100


def test_random_sentence_is_never_the_same_twice_in_a_row():
    for _ in range(50):
        assert random_sentence(SENTENCES[0]) != SENTENCES[0]


def test_sentences_have_no_numbers():
    for sentence in SENTENCES:
        assert not any(letter.isdigit() for letter in sentence)
