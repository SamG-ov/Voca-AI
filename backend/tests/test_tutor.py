import pytest

from app import tutor
from app.modes import is_valid


class FakeResponse:
    def __init__(self, parsed_output):
        self.parsed_output = parsed_output
        self.usage = None
        self.stop_reason = "refusal"


class FakeMessages:
    """Stands in for client.messages and remembers what it was called with"""

    def __init__(self, answer):
        self.answer = answer
        self.last_call = None

    def parse(self, **kwargs):
        self.last_call = kwargs
        if self.answer is None:
            return FakeResponse(None)
        # give back a copy, because get_reply changes the corrections list
        return FakeResponse(self.answer.model_copy(deep=True))


ANSWER = tutor.TutorReply(
    corrections=[{"original": "j'ai allé", "corrected": "je suis allé", "explanation": "Aller takes être."}],
    reply="Ah, tu es allé au marché !",
    new_vocab=[],
)


@pytest.fixture
def fake_messages(monkeypatch):
    messages = FakeMessages(ANSWER)
    monkeypatch.setattr(tutor.client, "messages", messages)
    return messages


def test_tutor_reply_can_be_read_from_json():
    text = '{"corrections": [], "reply": "Salut !", "new_vocab": [{"word": "salut", "translation": "hi"}]}'
    answer = tutor.TutorReply.model_validate_json(text)
    assert answer.reply == "Salut !"
    assert answer.new_vocab[0].translation == "hi"


def test_get_reply_returns_the_answer(fake_messages):
    answer, usage = tutor.get_reply([], "Hier j'ai allé au marché")
    assert answer.corrections[0].corrected == "je suis allé"

    sent = fake_messages.last_call["messages"]
    assert sent == [{"role": "user", "content": "Hier j'ai allé au marché"}]


def test_start_message_is_added_when_the_tutor_spoke_first(fake_messages):
    history = [{"role": "assistant", "content": "Bonjour !"}]
    tutor.get_reply(history, "Salut")

    sent = fake_messages.last_call["messages"]
    assert sent[0] == {"role": "user", "content": tutor.START_MESSAGE}
    assert sent[1]["role"] == "assistant"
    assert sent[2]["content"] == "Salut"


def test_long_history_is_cut(fake_messages):
    history = []
    for i in range(30):
        history.append({"role": "user", "content": f"message {i}"})
        history.append({"role": "assistant", "content": f"reply {i}"})

    tutor.get_reply(history, "last one")

    sent = fake_messages.last_call["messages"]
    assert len(sent) == tutor.MAX_MESSAGES + 1
    assert sent[-1]["content"] == "last one"
    assert len(history) == 60  # the original history is not changed


def test_scenario_prompt_is_used(fake_messages):
    tutor.get_reply([], "Bonjour", "scenario", "cafe")
    system_text = fake_messages.last_call["system"][0]["text"]
    assert "waiter" in system_text
    assert '"vous"' in system_text


def test_old_and_fake_corrections_are_removed(monkeypatch):
    answer = tutor.TutorReply(
        corrections=[
            {"original": "j'ai allé", "corrected": "je suis allé", "explanation": "from an old message"},
            {"original": "si il", "corrected": "s'il", "explanation": "real mistake"},
            {"original": "beau", "corrected": "beau", "explanation": "nothing changed"},
        ],
        reply="D'accord !",
        new_vocab=[],
    )
    monkeypatch.setattr(tutor.client, "messages", FakeMessages(answer))

    result, usage = tutor.get_reply([], "Je vais à la plage si il fait beau")
    assert [c.original for c in result.corrections] == ["si il"]


def test_error_when_the_tutor_gives_no_answer(monkeypatch):
    monkeypatch.setattr(tutor.client, "messages", FakeMessages(None))
    with pytest.raises(Exception):
        tutor.get_reply([], "Bonjour")


def test_mode_options_are_checked():
    assert is_valid("free_talk", "")
    assert is_valid("scenario", "cafe")
    assert is_valid("topic", "travel")
    assert not is_valid("scenario", "spaceship")
    assert not is_valid("karaoke", "")
