// popup.js

const apiKey = "AIzaSyBg9EJswKXfJfIC3XE7YwKKzkZjJj7pG_8"; // Replace with your actual YouTube Data API Key
// CRITICAL: Update this with your current ngrok URL every time you restart ngrok
const baseFlaskUrl = "https://5c8c9a18d26e.ngrok-free.app";

document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const outputDiv = document.getElementById("results");
    outputDiv.innerHTML = "<p class='loading-message'>⏳ Initializing...</p>";

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (!tabs[0]) {
            showError("No active tab found.");
            return;
        }

        const url = tabs[0].url;
        const youtubeRegex = /^https:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/;
        const match = url.match(youtubeRegex);

        if (!match || !match[1]) {
            showError("⚠️ This is not a valid YouTube URL.");
            return;
        }

        const videoId = match[1];
        showLoading(`⏳ Fetching comments for video ID: ${videoId}...`);

        try {
            const fetchedComments = await fetchYouTubeComments(videoId);
            if (fetchedComments.length === 0) {
                outputDiv.innerHTML = "<p class='info-message'>⚠️ No comments found for this video.</p>";
                return;
            }

            outputDiv.innerHTML = `
                <div class="section">
                    <div class="section-title">📹 YouTube Video ID</div>
                    <p class="video-id">${videoId}</p>
                    <p class="info-message">✅ Fetched ${fetchedComments.length} comments. Performing sentiment analysis...</p>
                </div>
            `;

            const commentsForFlaskPredict = fetchedComments.map(c => c.text);
            const predictions = await analyzeSentiments(commentsForFlaskPredict);

            if (!predictions || predictions.length === 0) {
                showError("❌ Failed to get sentiment predictions from API.");
                return;
            }

            // Combine predictions with original metadata for other Flask endpoints and local metrics
            const combinedData = predictions.map((pred, index) => ({
                original_comment_text: fetchedComments[index].text, // original raw comment
                flask_processed_comment: pred.comment, // The comment Flask received after its own preprocessing
                sentiment_label: pred.sentiment, // The sentiment label (e.g., "joy")
                timestamp: fetchedComments[index].timestamp, // From YouTube API
                authorId: fetchedComments[index].authorId // From YouTube API
            }));

            // --- Compute metrics ---
            const sentimentCounts = {}; // For /generate_chart (expects label: count)
            const datedCommentsForFlaskTrend = []; // For /sentiment_over_time (expects {comment: "...", timestamp: "..."})
            let totalSentimentScore = 0; // For average numerical sentiment score
            const commenterSet = new Set();
            let totalWords = 0;

            combinedData.forEach((item) => {
                // Populate sentimentCounts for the pie chart
                sentimentCounts[item.sentiment_label] = (sentimentCounts[item.sentiment_label] || 0) + 1;

                // Prepare data for the Flask /sentiment_over_time endpoint
                datedCommentsForFlaskTrend.push({
                    comment: item.original_comment_text, // Flask will preprocess this comment again
                    timestamp: item.timestamp,
                });

                // For numerical average sentiment, map string labels to a score
                totalSentimentScore += mapSentimentToNumericalScore(item.sentiment_label);

                if (item.authorId) commenterSet.add(item.authorId);
                totalWords += item.original_comment_text.split(/\s+/).filter(w => w.length > 0).length;
            });

            const totalComments = combinedData.length;
            const uniqueCommenters = commenterSet.size;
            const avgWordLength = (totalWords / totalComments).toFixed(2);
            const avgSentimentScore = (totalSentimentScore / totalComments).toFixed(2);
            // Normalize sentiment score for display (e.g., from a scale of -2 to 2, map to 0-10)
            // Adjust the denominator (4) and offset (2) based on your mapSentimentToNumericalScore range
            const normalizedSentimentScore = (((parseFloat(avgSentimentScore) + 2) / 4) * 10).toFixed(2);

            outputDiv.innerHTML += `
                <div class="section summary-section">
                    <div class="section-title">📊 Comment Analysis Summary</div>
                    <div class="metrics-grid">
                        <div class="metric"><span class="metric-title">Total Comments</span><span class="metric-value">${totalComments}</span></div>
                        <div class="metric"><span class="metric-title">Unique Commenters</span><span class="metric-value">${uniqueCommenters}</span></div>
                        <div class="metric"><span class="metric-title">Avg Comment Length</span><span class="metric-value">${avgWordLength} words</span></div>
                        <div class="metric"><span class="metric-title">Avg Sentiment Score</span><span class="metric-value">${normalizedSentimentScore}/10</span></div>
                    </div>
                </div>
                <div class="section chart-section">
                    <div class="section-title">📈 Sentiment Distribution</div>
                    <div id="chart-container" class="chart-container"></div>
                </div>
              
                <div class="section chart-section">
                    <div class="section-title">☁️ Comment Wordcloud</div>
                    <div id="wordcloud-container" class="chart-container"></div>
                </div>
                <div class="section comment-list-section">
                    <div class="section-title">📝 Top 25 Comments with Sentiments</div>
                    <ul class="comment-list">
                        ${combinedData.slice(0, 25).map((item, index) => `
                            <li class="comment-item">
                                <span class="comment-text">${index + 1}. ${item.original_comment_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                                <span class="comment-sentiment sentiment-${item.sentiment_label.toLowerCase()}">Sentiment: ${item.sentiment_label}</span>
                            </li>`).join('')}
                    </ul>
                </div>
            `;

            // --- Visualizations ---
            await Promise.all([
                fetchAndDisplayChart(sentimentCounts),
                // fetchAndDisplayTrendGraph(datedCommentsForFlaskTrend),
                fetchAndDisplayWordCloud(commentsForFlaskPredict), // Send original comments for word cloud
            ]);

            outputDiv.innerHTML += "<p class='success-message'> Analysis complete!</p>";
            document.getElementById("analyzeBtn").textContent = "Re-analyze Comments";

        } catch (error) {
            console.error("Analysis Error:", error);
            showError(` Analysis failed: ${error.message}. Please check your API key, Flask server, or console for details.`);
            document.getElementById("analyzeBtn").textContent = "Analyze Comments";
        }
    });
});

// Helper function to fetch YouTube comments with timestamps and author IDs
async function fetchYouTubeComments(videoId) {
    const comments = [];
    let nextPageToken = "";
    const maxCommentsToFetch = 1000; // Limit to 50 comments per request

    while (comments.length < maxCommentsToFetch) {
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}&maxResults=50&pageToken=${nextPageToken}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            // Handle YouTube API errors (e.g., quota exceeded, invalid API key)
            throw new Error(`YouTube API error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const topLevelComment = item.snippet.topLevelComment.snippet;
                comments.push({
                    text: topLevelComment.textDisplay,
                    timestamp: topLevelComment.publishedAt, // ISO 8601 format
                    authorId: topLevelComment.authorChannelId?.value // Optional: get author ID
                });
            });
        }

        if (!data.nextPageToken || comments.length >= maxCommentsToFetch) {
            break; // No more pages or reached max comments
        }
        nextPageToken = data.nextPageToken;
    }

    console.log("✅ Fetched comments with metadata:", comments.slice(0, maxCommentsToFetch));
    return comments.slice(0, maxCommentsToFetch);
}

async function analyzeSentiments(comments) {
    const response = await fetch(`${baseFlaskUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
    });

    if (!response.ok) {
        let errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            errorText = errorJson.error || errorText;
        } catch (e) { /* not JSON */ }
        throw new Error(`Flask /predict error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Sentiment predictions from Flask:", data);
    return data; // [{comment, sentiment}]
}

// Function to map string sentiment labels to numerical scores for averaging
// Adjust these values to fit your desired scoring system
function mapSentimentToNumericalScore(sentimentLabel) {
    switch (sentimentLabel) {
        case "joy": return 2;
        case "surprise": return 1.5;
        case "neutral": return 0;
        case "sadness": return -1.5;
        case "fear": return -1.8;
        case "anger": return -2;
        case "disgust": return -2;
        default: return 0; // Default to neutral if unknown
    }
}

async function fetchAndDisplayChart(sentimentCounts) {
    const container = document.getElementById("chart-container");
    container.innerHTML = "<p class='loading-message'>Generating chart...</p>";
    try {
        const response = await fetch(`${baseFlaskUrl}/generate_chart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentiment_counts: sentimentCounts })
        });

        if (!response.ok) {
            let errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                errorText = errorJson.error || errorText;
            } catch (e) { /* not JSON */ }
            throw new Error(`Chart generation failed: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        const imgUrl = URL.createObjectURL(blob);

        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = "Sentiment Pie Chart";
        img.className = "chart-image";
        container.innerHTML = '';
        container.appendChild(img);
    } catch (error) {
        console.error("Error displaying chart:", error);
        container.innerHTML = `<p class='error-message'>❌ Failed to load sentiment chart: ${error.message}</p>`;
    }
}



async function fetchAndDisplayWordCloud(comments) {
    const container = document.getElementById("wordcloud-container");
    container.innerHTML = "<p class='loading-message'>Generating word cloud...</p>";
    try {
        const response = await fetch(`${baseFlaskUrl}/generate_wordcloud`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comments })
        });

        if (!response.ok) {
            let errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                errorText = errorJson.error || errorText;
            } catch (e) { /* not JSON */ }
            throw new Error(`Word cloud generation failed: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        const imgUrl = URL.createObjectURL(blob);

        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = "Word Cloud";
        img.className = "chart-image";
        container.innerHTML = '';
        container.appendChild(img);
    } catch (error) {
        console.error("Error displaying word cloud:", error);
        container.innerHTML = `<p class='error-message'>❌ Failed to load word cloud: ${error.message}</p>`;
    }
}

function showLoading(message) {
    const outputDiv = document.getElementById("results");
    outputDiv.innerHTML = `<p class="loading-message">⏳ ${message}</p>`;
}

function showError(message) {
    const outputDiv = document.getElementById("results");
    outputDiv.innerHTML = `<p class="error-message">❌ ${message}</p>`;
    document.getElementById("analyzeBtn").textContent = "Analyze Comments"; // Reset button text on error
}