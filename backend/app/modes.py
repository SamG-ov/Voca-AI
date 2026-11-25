# The three conversation modes: free talk, scenarios and topics

SCENARIOS = {
    "cafe": {
        "title": "At the café",
        "tutor_role": "a friendly waiter in a small Parisian café",
        "goal": "Order a drink and something to eat, make small talks, and then ask for the bill.",
    },
    "boulangerie": {
        "title": "At the bakery",
        "tutor_role": "the baker at a boulangerie",
        "goal": "Buy bread and a pastry, and ask what the baker recommends for breakfast, then ask for the price at the end total.",
    },
    "hotel": {
        "title": "Hotel check-in",
        "tutor_role": "the receptionist at a hotel in Lyon",
        "goal": "Check in, ask about the price at the hotel, ask what is included in the room (shower, breakfast, etc), ask about breakfast time and ask where to visit in the city, where they recommend to eat and what is the best way to get around the city.",
    },
    "doctor": {
        "title": "At the doctor",
        "tutor_role": "a general doctor (médecin généraliste)",
        "goal": "Explain what's wrong with you and understand the doctor's advice.",
    },
    "train_station": {
        "title": "At the train station",
        "tutor_role": "a ticket seller at the Gare de Lyon in Paris",
        "goal": "Buy a train ticket to Marseille for tomorrow morning, ask about the price and the train schedule, and ask for directions to the platform.",
    },
    "apartment": {
        "title": "Visiting an apartment",
        "tutor_role": "the owner showing an apartment for rent",
        "goal": "Ask about the price, the rooms and the neighbourhood, what is included in the rent, is there a deposit, and when the apartment is available.",
    },
    "job_interview": {
        "title": "Job interview",
        "tutor_role": "a manager interviewing the student for a job in an office",
        "goal": "Introduce yourself, talk about your experience and ask questions about the job., and ask about the salary and benefits, and the next steps in the hiring process.",
    },
    "airport": {
        "title": "At the airport",
        "tutor_role": "an airport employee at the check-in counter",
        "goal": "Check in for your flight, ask about the baggage allowance and the boarding gate, and ask about the flight schedule",
    },
    "supermarket": {
        "title": "At the supermarket",
        "tutor_role": "a cashier at a supermarket",
        "goal": "Buy groceries, ask about the price and the total, and ask about any discounts or promotions available.",
    },
    "pharmacy": {
        "title": "At the pharmacy",
        "tutor_role": "a pharmacist at a pharmacy",
        "goal": "Buy medicine, ask about the price and the dosage, and ask for advice on how to take the medicine and any side effects.",
    },
    "museum": {
        "title": "At the museum",
        "tutor_role": "a museum guide at the Louvre",
        "goal": "Ask about the museum's opening hours, ticket prices, and the best way to get there, and ask for recommendations on what to see and do in the museum.",
    },
    "restaurant": {
        "title": "At the restaurant",
        "tutor_role": "a waiter at a restaurant",
        "goal": "Order food and drinks, ask about the menu and the specials, and ask for recommendations on what to eat and drink, and ask for the bill at the end.",
    },
}

TOPICS = {
    "weekend": "Le week-end (the weekend)",
    "family": "La famille (family)",
    "travel": "Les voyages (travel)",
    "food": "La cuisine (food and cooking)",
    "work": "Le travail et les études (work and studies)",
    "hobbies": "Les loisirs (hobbies)",
    "movies": "Les films et les séries (movies and TV shows)",
    "city": "Ta ville (the city you live in)",
    "sport": "Le sport (sport)",
    "technology": "La technologie et les réseaux sociaux (technology and social media)",
    "future": "Les projets pour l'avenir (plans for the future)",
    "childhood": "Les souvenirs d'enfance (childhood memories)",
    "music": "La musique (music)",
    "books": "Les livres et la lecture (books and reading)",
    "fashion": "La mode et le style (fashion and style)",
    "environment": "L'environnement et le changement climatique (the environment and climate change)",
    "culture": "La culture et les traditions (culture and traditions)",
    "education": "L'éducation et l'apprentissage (education and learning)",
    "health": "La santé et le bien-être (health and well-being)",
    "politics": "La politique et l'actualité (politics and current events)",
}


def is_valid(mode, option):
    if mode == "free_talk":
        return True
    if mode == "scenario":
        return option in SCENARIOS
    if mode == "topic":
        return option in TOPICS
    return False


def get_mode_prompt(mode, option):
    if mode == "scenario":
        scenario = SCENARIOS[option]
        return f"""Mode: role-play.
You play {scenario["tutor_role"]}. The student plays a customer or visitor.
The student's goal: {scenario["goal"]}
Stay in your role the whole time and react like a real person would, but keep correcting mistakes as usual.
Like in real life, use "vous" with the student (never "tu"), and the student should use "vous" with you too. If they use "tu", correct it.
When the student says "Start the conversation.", greet them as your character and start the scene."""

    if mode == "topic":
        return f"""Mode: topic discussion.
The topic is: {TOPICS[option]}
Ask the student for their opinion and experiences on this topic, and share small opinions of your own to keep it interesting.
When the student says "Start the conversation.", introduce the topic in one simple sentence and ask your first question."""

    return """Mode: free conversation.
Talk about anything the student wants, and ask about their life, hobbies and plans.
When the student says "Start the conversation.", greet them warmly and ask a simple question to get things going."""
