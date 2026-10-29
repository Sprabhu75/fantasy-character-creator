# Fantasy Character Creator — RPG Trading Card Edition

An Ancient Alchemist-themed web application that generates unique fantasy characters and RPG player cards powered by Google Gemini AI.

## Features
- **RPG Trading Player Card**: Formatted as a single bordered collectible player card with antique brass inlays, corner rivets, and stylized fantasy typography.
- **Novel Character Generation**: Summons unique adventurers with distinct names, classes, ancestries, and lore.
- **Attributes (1–100)**: Randomized Health, Mana, and Strength ratings on every summon.
- **Cartoon / Video Game Style Portrait**: Creates and regenerates stylized character art using Gemini's image generation models (`gemini-3.1-flash-lite-image`).
- **Origin Story Generator**: Writes evocative 1–2 sentence backstories tailored to the character's Name and Class using `gemini-3.8-flash`.
- **My Deck**: Save your favorite generated cards into a persistent deck collection with preview cards.
- **Ancient Alchemist Aesthetic**: Weathered dark oak workbench, parchment scrolls, glowing amber philters, and harmonic bell resonance chimes.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` and provide your Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key"
```
*(If no API key is provided, the application automatically uses high-fidelity procedural generation so all features continue to work seamlessly!)*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```
