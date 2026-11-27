import base64

import pytest
from fastapi.testclient import TestClient

from app import main
from app.tutor import Review, TutorReply

client = TestClient(main.app)

ANSWER = TutorReply(
    corrections=[{"original": "une café", "corrected": "un café", "explanation": "Café is masculine."}],
    reply="Très bien, un café !",
    new_vocab=[{"word": "tout de suite", "translation": "right away"}],
)


@pytest.fixture(autouse=True)
def fake_services(monkeypatch):
    """Replace speech to text, the tutor and text to speech with fakes"""
    calls = {}

    def fake_transcribe(audio_bytes, file_name):
        return "Je voudrais une café"

    def fake_get_reply(history, user_text, mode, option):
        calls["history"] = history
        calls["user_text"] = user_text
        return ANSWER, None

    async def fake_synthesize(text, voice, speed):
        calls["voice"] = voice
        return b"fake mp3"

    monkeypatch.setattr(main, "transcribe", fake_transcribe)
    monkeypatch.setattr(main, "get_reply", fake_get_reply)
    monkeypatch.setattr(main, "synthesize", fake_synthesize)
    return calls


def send_turn(audio=b"some audio", **form):
    return client.post("/api/turn", files={"audio": ("recording.webm", audio)}, data=form)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_turn_returns_everything(fake_services):
    res = send_turn(history='[{"role": "assistant", "content": "Bonjour !"}]', voice="henri")
    data = res.json()

    assert res.status_code == 200
    assert data["transcript"] == "Je voudrais une café"
    assert data["reply"] == "Très bien, un café !"
    assert data["corrections"][0]["corrected"] == "un café"
    assert data["new_vocab"][0]["word"] == "tout de suite"
    assert base64.b64decode(data["audio"]) == b"fake mp3"

    assert fake_services["history"] == [{"role": "assistant", "content": "Bonjour !"}]
    assert fake_services["voice"] == "henri"


def test_empty_recording():
    res = send_turn(audio=b"")
    assert res.status_code == 400
    assert res.json()["detail"] == "The recording is empty"


def test_nothing_heard(monkeypatch):
    monkeypatch.setattr(main, "transcribe", lambda audio, file_name: "")
    res = send_turn()
    assert res.status_code == 422


def test_unreadable_audio(monkeypatch):
    def broken_transcribe(audio, file_name):
        raise ValueError("not audio")

    monkeypatch.setattr(main, "transcribe", broken_transcribe)
    res = send_turn()
    assert res.status_code == 400


def test_bad_settings():
    assert send_turn(mode="karaoke").status_code == 400
    assert send_turn(voice="bob").status_code == 400
    assert send_turn(speed="fast").status_code == 422
    assert send_turn(history="not json").status_code == 400


def test_tutor_error(monkeypatch):
    def broken_get_reply(history, user_text, mode, option):
        raise Exception("API is down")

    monkeypatch.setattr(main, "get_reply", broken_get_reply)
    res = send_turn()
    assert res.status_code == 502


def test_start_lets_the_tutor_speak_first(fake_services):
    res = client.post("/api/start", data={"mode": "scenario", "option": "cafe"})
    assert res.status_code == 200
    assert res.json()["reply"] == "Très bien, un café !"
    assert fake_services["user_text"] == "Start the conversation."


def test_modes_list():
    data = client.get("/api/modes").json()
    assert "cafe" in data["scenarios"]
    assert "travel" in data["topics"]


def test_drill_check(monkeypatch):
    monkeypatch.setattr(main, "transcribe", lambda audio, file_name: "Le musée est fermé le mardi")
    res = client.post(
        "/api/drill/check",
        files={"audio": ("recording.webm", b"some audio")},
        data={"sentence": "Le musée est fermé le lundi."},
    )
    data = res.json()
    assert data["score"] == 83
    assert data["words"][-1] == {"word": "lundi.", "correct": False}


def test_review_needs_something_to_review():
    res = client.post("/api/review", json={"messages": [{"role": "assistant", "text": "Bonjour"}], "corrections": []})
    assert res.status_code == 400


def test_review(monkeypatch):
    def fake_get_review(messages, corrections):
        return Review(summary="Good job.", good_points=["Nice"], tips=["Practise être"])

    monkeypatch.setattr(main, "get_review", fake_get_review)
    res = client.post("/api/review", json={"messages": [{"role": "user", "text": "Bonjour"}], "corrections": []})
    assert res.status_code == 200
    assert res.json()["tips"] == ["Practise être"]


def test_password_is_needed_when_set(monkeypatch):
    monkeypatch.setattr(main, "APP_PASSWORD", "secret")

    assert client.get("/api/login").status_code == 401
    assert client.get("/api/login", headers={"X-App-Password": "wrong"}).status_code == 401
    assert client.get("/api/login", headers={"X-App-Password": "secret"}).status_code == 200
    assert client.get("/api/modes").status_code == 401
    assert client.get("/api/health").status_code == 200


def test_no_password_needed_when_not_set():
    assert client.get("/api/login").status_code == 200
