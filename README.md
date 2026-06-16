# BigQuery Release Explorer

An elegant, modern, responsive web application for fetching, parsing, filtering, and sharing official Google Cloud BigQuery release notes. 

Built with a **Python Flask** backend and a **Vanilla HTML/CSS/JS** frontend.

---

## 🚀 Key Features

* **Auto-fetching & Intelligent Parsing**: Automatically pulls the official Google Cloud BigQuery XML feed, cleans HTML tags, and splits release entries by their `<h3>` category headers.
* **Interactive Filtering & Search**: Filter updates instantly by type (`Feature`, `Changed`, `Issue`, `Deprecated`) or perform global keyword searches across titles, categories, and descriptions.
* **Social Sharing Integration**: View a custom mock card preview of X (formerly Twitter) posts, edit content with real-time character counting (and a 280-character limit warning), and post directly to X or copy to the clipboard.
* **Modern Premium UI**:
  * Shimmering skeleton screens during load states.
  * Theme switching (smooth transitions between Dark and Light mode) persisted via `localStorage`.
  * Dynamic micro-animations, glassmorphism headers, and glowing background gradients.

---

## 🛠️ Tech Stack & Libraries

### Backend (Python)
* **[Flask](https://flask.palletsprojects.com/)**: Serves index routes and the JSON API.
* **[Requests](https://requests.readthedocs.io/)**: Handles HTTP GET requests to retrieve the remote XML feed.
* **[feedparser](https://feedparser.readthedocs.io/)**: Parses RSS/Atom feed content.
* **[BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/)**: Parses, sanitizes, and chunks entry summaries.

### Frontend
* **HTML5**: Structured semantic markup.
* **CSS3**: Vanilla CSS with custom properties (CSS variables), CSS grid, flexbox, keyframe animations, and custom scrollbars.
* **JavaScript**: Modern ES6 with async/await fetch calls, event-driven state updates, and clipboard/window integration.

---

## 📂 Project Structure

```bash
├── app.py              # Flask backend server & XML parser logic
├── static/
│   ├── css/
│   │   └── styles.css  # Modern UI styling & Theme CSS variables
│   └── js/
│       └── app.js      # Frontend state, filters, theme, and tweet modals
├── templates/
│   └── index.html      # Main application page template
└── README.md           # Project documentation
```

* **[app.py](file:///Users/fred/Dev/google/agy_cli/app.py)**: Defines routes `/` and `/api/release-notes` and splits raw summaries into categories.
* **[templates/index.html](file:///Users/fred/Dev/google/agy_cli/templates/index.html)**: Main HTML content, includes skeleton elements and share modal.
* **[static/js/app.js](file:///Users/fred/Dev/google/agy_cli/static/js/app.js)**: Orchestrates UI interactions, theme switching, filtering, and sharing.
* **[static/css/styles.css](file:///Users/fred/Dev/google/agy_cli/static/css/styles.css)**: Implements visual style, glow gradients, responsive design, and transition delays.

---

## ⚙️ Getting Started

### 1. Prerequisites

Ensure you have Python 3.7+ installed. 

### 2. Install Dependencies

You can install the required packages using pip:

```bash
pip install Flask requests feedparser beautifulsoup4
```

### 3. Run the App

Start the Flask development server:

```bash
python app.py
```

By default, the application runs on **port 5005**. Open your browser and navigate to:
[http://localhost:5005](http://localhost:5005)

---

## 🔄 How It Works (Request-Response Flow)

1. **User loads the app**: The user requests `GET /`, and [app.py](file:///Users/fred/Dev/google/agy_cli/app.py) responds with [index.html](file:///Users/fred/Dev/google/agy_cli/templates/index.html).
2. **Fetch release notes**: The frontend [app.js](file:///Users/fred/Dev/google/agy_cli/static/js/app.js) executes `fetchReleaseNotes()` which hits the backend API `/api/release-notes`.
3. **Parse & Package**: The server fetches the XML feed from Google Cloud, parses entries, and processes HTML elements via BeautifulSoup before returning a clean JSON array.
4. **Client-side Filter & Search**: The user inputs text or clicks tabs to filter the list instantly. The JS filters the stored in-memory array and updates the DOM, removing the need for extra network calls.
5. **Share Update**: Clicking "Tweet" launches a customizable preview dialog that generates Twitter Web Intents prefilled with the chosen update.
