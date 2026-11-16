# Keyflow — Typing Speed Test

Responsive typing speed test built with HTML5, CSS3 and Vanilla JavaScript. No framework or npm packages are required.

## Features
- 15, 30, 60 and 120-second sessions
- Easy, medium and hard passages
- Live WPM, accuracy, character count and countdown
- Correct/incorrect character highlighting
- Restart, finish and load-new-text controls
- Online random quote API with offline fallback
- LocalStorage session history, average WPM and personal best
- Optional REST API endpoint for remote score syncing
- Responsive desktop, tablet and mobile layout

## Windows setup

### Quick start
1. Download and extract the ZIP file.
2. Open the `typing-speed-test` folder.
3. Double-click `index.html` to open it in your browser.

### Recommended: VS Code + Live Server
1. Install Visual Studio Code.
2. Open VS Code → **File → Open Folder** → select `typing-speed-test`.
3. Press `Ctrl + Shift + X`, search for **Live Server**, and install it.
4. Right-click `index.html` → **Open with Live Server**.
5. The site opens in your browser, usually at `http://127.0.0.1:5500`.

### Alternative: Python local server
If Python is installed, open Command Prompt in the project folder and run:
```bash
python -m http.server 5500
```
Then visit `http://localhost:5500`.

## How to use
1. Choose a duration and difficulty.
2. Click the passage area and start typing. The timer starts with your first character.
3. The test finishes when the countdown reaches zero or you complete the passage.
4. Review WPM, accuracy, correct characters and errors.
5. Your results appear in Recent sessions and are saved in this browser.

## Data storage and API
- **LocalStorage:** session history and personal best are stored in this browser/device. Clearing browser data can remove them.
- **Online quote API:** `https://dummyjson.com/quotes/random` supplies a new passage when you click New text. If offline or unavailable, a built-in passage is used.
- **Remote score API (optional):** in `script.js`, set `API_CONFIG.scoreEndpoint` to your own REST API URL. It must accept a JSON `POST` request. Leave it empty to use local storage only. No backend or API key is included.

Example remote score payload:
```json
{
  "id": "KF-1234567",
  "date": "2026-11-15T12:00:00.000Z",
  "duration": 30,
  "difficulty": "medium",
  "wpm": 52,
  "accuracy": 96,
  "correct": 130,
  "errors": 5
}
```

## WPM calculation
WPM = (correct characters ÷ 5) ÷ elapsed minutes.
Accuracy = (correct characters ÷ typed characters) × 100.

## Project structure
```text
typing-speed-test/
├── index.html
├── styles.css
├── script.js
└── README.md
```

## Important
This is a frontend-only project. Typing tests and local history work without an account. The quote API needs internet access. Cloud score storage only works after you configure your own backend endpoint.
