async function analyzeComments() {
    const apiUrl = "http://localhost:5000/predict"; // Update if using your server IP

    // Fetch all visible comments
    const commentElements = document.querySelectorAll("#content-text");

    const comments = [];
    commentElements.forEach(el => {
        if (el.innerText.trim() !== "") {
            comments.push(el.innerText.trim());
        }
    });

    console.log("Extracted comments:", comments);

    if (comments.length === 0) {
        console.log("No comments found.");
        return;
    }

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ comments: comments })
        });

        const data = await response.json();
        console.log("Sentiments received:", data);

        // Display sentiments next to each comment
        data.forEach((item, index) => {
            const sentimentSpan = document.createElement("span");
            sentimentSpan.textContent = ` [${item.sentiment}]`;
            sentimentSpan.style.color = "green";
            sentimentSpan.style.fontWeight = "bold";
            sentimentSpan.style.marginLeft = "8px";
            sentimentSpan.style.fontSize = "0.9em";
            
            // Avoid duplicate insertion
            if (!commentElements[index].nextSibling) {
                commentElements[index].parentElement.appendChild(sentimentSpan);
            }
        });

    } catch (error) {
        console.error("Error during API call:", error);
    }
}

// Run when the page fully loads
window.addEventListener("load", () => {
    setTimeout(() => {
        analyzeComments();
    }, 3000); // Delay to allow comments to load
});
