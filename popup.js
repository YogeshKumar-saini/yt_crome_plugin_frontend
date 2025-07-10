document.getElementById("analyze").addEventListener("click", async () => {
    document.getElementById("status").textContent = "Analyzing comments...";
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            window.location.reload();
        },
    });

    document.getElementById("status").textContent = "Please wait, then reopen to view results.";
});
