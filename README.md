Here's a beautiful and comprehensive `README.md` file for your YouTube Comment Sentiment Analyzer Chrome Extension. It's designed to be clear, easy to follow, and visually appealing using standard Markdown.

-----

# SentimentPulse: YouTube Comment Sentiment Analyzer 📊💬

## Empowering Insights from YouTube Comments

[](https://www.google.com/search?q=LICENSE)
[](https://www.python.org/)
[](https://flask.palletsprojects.com/en/latest/)
[](https://chrome.google.com/webstore/) ---

## ✨ Introduction

**SentimentPulse** is a powerful Chrome Extension designed to provide instant sentiment analysis of YouTube video comments. Ever wondered how your audience truly feels about your content, or a specific video? This tool fetches YouTube comments, processes them through a custom Flask backend utilizing advanced natural language processing (NLP) for sentiment classification, and visualizes the results directly in your browser.

Gain actionable insights into audience reactions, identify emotional trends over time, and understand the core sentiments driving discussions around any YouTube video.

-----

## 🚀 Features

  * **Real-time Sentiment Analysis:** Get an immediate breakdown of comments into various sentiment categories (e.g., Joy, Anger, Sadness, Neutral, Surprise, Fear, Disgust).
  * **Dynamic Visualizations:**
      * **Sentiment Distribution Pie Chart:** Understand the overall emotional landscape at a glance.
      * **Comment Word Cloud:** Identify trending keywords and topics within the comments.
      * **Sentiment-Specific Comment Summaries:** Dive deeper into frequently used phrases and key comments for each sentiment.
      * **Engaging Comments Display:** See the comments that generated the most likes and replies, along with their sentiment.
      * *(Optional: Sentiment Trend Over Time Graph - If you re-enable this, it visually tracks how audience sentiment evolves throughout the comment timeline.)*
  * **Key Metrics:** View total comments, unique commenters, average comment length, and a normalized average sentiment score.
  * **Top Comments List:** Quickly review the first 25 analyzed comments with their classified sentiments.
  * **User-Friendly Interface:** A clean, modern, and intuitive popup design for a seamless experience.

-----

## 🏗️ How It Works

SentimentPulse operates on a client-server architecture:

1.  **Frontend (Chrome Extension - `popup.html`, `popup.js`, `style.css`):**

      * When activated on a YouTube video page, it extracts the `videoId`.
      * It uses the **YouTube Data API v3** to fetch the latest comments, including their timestamps and engagement metrics (likes, replies).
      * It sends these comments to the custom Flask backend for sentiment analysis.
      * It receives processed data and generated visualizations (charts, word clouds) from the Flask backend.
      * It then renders all the analysis results and interactive charts within the extension popup.

2.  **Backend (Flask Application - `app.py`):**

      * A lightweight Flask server provides RESTful API endpoints.
      * It uses a pre-trained NLP model (e.g., a Hugging Face Transformer model for sentiment classification) to analyze the sentiment of incoming comments.
      * It generates various visualizations (Pie Chart, Word Cloud, Trend Graph) using libraries like `matplotlib` or `seaborn` based on the sentiment data.
      * It identifies and extracts key phrases or summaries for sentiment-specific insights.

3.  **Tunneling (Ngrok):**

      * Since Chrome Extensions cannot directly access `localhost` resources due to security restrictions, `ngrok` is used to create a secure public URL for your local Flask server. This URL is then used by the Chrome Extension to communicate with your backend.

-----

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

  * **Python 3.8+**: [Download Python](https://www.python.org/downloads/)
  * **pip**: Python package installer (usually comes with Python).
  * **Git**: For cloning the repository. [Download Git](https://git-scm.com/downloads)
  * **Google Chrome Browser**: Or any Chromium-based browser.
  * **YouTube Data API v3 Key**:
      * Go to the [Google Cloud Console](https://console.cloud.google.com/).
      * Create a new project.
      * Enable the "YouTube Data API v3" for your project.
      * Go to "Credentials" -\> "Create Credentials" -\> "API Key".
      * **Secure your API Key**: Restrict it to only allow requests from `www.googleapis.com` and your Chrome Extension ID (after installation).
  * **ngrok**: For tunneling your local Flask server. [Download ngrok](https://ngrok.com/download)
      * Sign up for a free ngrok account to get an auth token.

-----

## 🚀 Setup & Installation

Follow these steps to get SentimentPulse up and running on your system.

### 1\. Clone the Repository

```bash
git clone https://github.com/your-username/SentimentPulse.git # Replace with your repo URL
cd SentimentPulse
```

### 2\. Backend Setup (Flask API)

Navigate to the `backend` directory (assuming your Flask app is in a folder named `backend` within your project root).

```bash
cd backend # Adjust if your Flask app is directly in the project root
```

#### a. Create a Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### b. Install Dependencies

```bash
pip install -r requirements.txt
```

*(You'll need a `requirements.txt` file in your backend directory containing `flask`, `scikit-learn`, `numpy`, `pandas`, `matplotlib`, `seaborn`, `wordcloud`, `transformers`, `torch` or `tensorflow`, `ngrok` (if using `pyngrok` in app.py) etc.)*

#### c. Configure your API Key

Open your Flask application file (e.g., `app.py`). You'll likely need to load your YouTube Data API Key or ensure it's not hardcoded in the backend.

**Note:** The YouTube Data API Key is used by the Chrome Extension to fetch comments, NOT directly by the Flask backend for *fetching* comments. It's important for `popup.js` to have it.

#### d. Run ngrok and your Flask Server

You need two separate terminal windows for this.

**Terminal 1: Run Ngrok**

Start ngrok to expose your Flask server on a public URL. Your Flask app typically runs on port `5000`.

```bash
ngrok http 5000
```

Ngrok will display a URL like `https://xxxx-xxxx-xxxx-xxxx.ngrok-free.app`. **Copy this URL.** You'll need it for the Chrome Extension.
*(Make sure to run `ngrok authtoken <your_auth_token>` once after installing ngrok.)*

**Terminal 2: Run Flask Server**

Ensure your Flask app is running.

```bash
python app.py
```

Verify that your Flask app indicates it's running on `http://127.0.0.1:5000` or similar.

### 3\. Frontend Setup (Chrome Extension)

Navigate back to your project root (where `manifest.json`, `popup.html`, `popup.js`, `style.css` are located).

#### a. Update `popup.js` with Ngrok URL and YouTube API Key

Open `popup.js` in a text editor.

1.  **`apiKey`**: Replace `"AIzaSyBg9EJswKXfJfIC3XE7YwKKzkZjJj7pG_8"` with your actual **YouTube Data API Key**.
2.  **`baseFlaskUrl`**: Replace `"https://5c8c9a18d26e.ngrok-free.app"` with the **ngrok URL you copied** from Terminal 1.
      * **IMPORTANT:** This URL changes every time you restart ngrok. You'll need to update `popup.js` each time.

<!-- end list -->

```javascript
// popup.js

const apiKey = "YOUR_YOUTUBE_DATA_API_KEY"; // Replace with your actual key
const baseFlaskUrl = "YOUR_CURRENT_NGROK_URL"; // PASTE YOUR NGROK URL HERE
// ... rest of your code
```

#### b. Load the Extension in Chrome

1.  Open Chrome.
2.  Go to `chrome://extensions`.
3.  Enable **"Developer mode"** in the top right corner.
4.  Click the **"Load unpacked"** button.
5.  Select the **root folder** of your cloned project (the one containing `manifest.json`).

The "SentimentPulse: YouTube Comment Sentiment Analyzer" extension should now appear in your list. You can click the puzzle piece icon in your Chrome toolbar and pin it for easy access.

-----

## 🎬 Usage

1.  **Navigate to a YouTube Video:** Open any YouTube video in your Chrome browser.
2.  **Click the Extension Icon:** Click on the SentimentPulse icon in your Chrome toolbar.
3.  **Click "Analyze Comments":** The popup will appear. Click the prominent "Analyze Comments" button.
4.  **View Results:** The extension will fetch comments, send them to your Flask backend for analysis, and display the sentiment breakdown, charts, summaries, and popular comments right in the popup.

-----

## ⚙️ Configuration

  * **`popup.js`**:
      * `apiKey`: Your YouTube Data API Key.
      * `baseFlaskUrl`: Your active ngrok public URL for the Flask backend.
      * `maxCommentsToFetch`: Adjust the number of comments to fetch from YouTube (default is 50, maximum is 1000 per your code).
      * `mapSentimentToNumericalScore`: Customize the numerical weighting for different sentiments if you want to change how the average sentiment score is calculated.
  * **Flask Backend (`app.py`)**:
      * Sentiment model used (e.g., if you switch to a different pre-trained model).
      * Parameters for chart generation (colors, titles, etc.).
      * Logic for comment summarization (e.g., number of keywords to extract).

-----

## 💡 Troubleshooting

  * **"❌ Analysis failed: ... Check your API key, Flask server..."**

      * **Ngrok URL Mismatch:** This is the most common issue. Ensure the `baseFlaskUrl` in `popup.js` is **exactly** the URL currently displayed in your ngrok terminal. Ngrok free URLs change on every restart.
      * **Flask Server Down:** Make sure your Flask app is running in Terminal 2 (`python app.py`).
      * **Ngrok Tunnel Down:** Ensure your ngrok tunnel is active in Terminal 1 (`ngrok http 5000`).
      * **YouTube API Key Invalid/Quota Exceeded:** Double-check your `apiKey` in `popup.js`. Verify your Google Cloud project has the YouTube Data API v3 enabled and you haven't exceeded your daily quota. Check your Google Cloud Console metrics.
      * **CORS Issues:** Ensure your Flask app has CORS enabled correctly (e.g., `CORS(app)` in `app.py`).

  * **Charts/Wordcloud Not Appearing:**

      * Check your Flask terminal for any errors during chart generation (e.g., `matplotlib` issues, `wordcloud` library problems).
      * Ensure the data sent to Flask for charts (`sentimentCounts`, `datedCommentsForFlaskTrend`, `commentsForFlaskPredict`) is in the expected format.

  * **Extension Not Loading:**

      * Verify `manifest.json` syntax.
      * Ensure all files (`popup.html`, `popup.js`, `style.css`, `manifest.json`, and the `icons` folder) are in the correct root directory.

-----

## 🤝 Contributing

Contributions are welcome\! If you have suggestions for improvements, new features, or bug fixes, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add AmazingFeature'`).
5.  Push to the branch (`git push origin feature/AmazingFeature`).
6.  Open a Pull Request.

-----

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

-----

## ✉️ Contact

## Your Name - [your.email@example.com](mailto:your.email@example.com) Project Link: [https://github.com/your-username/SentimentPulse](https://www.google.com/search?q=https://github.com/your-username/SentimentPulse) --- **Enjoy gaining deeper insights from YouTube comments with SentimentPulse\!**