document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const imagePreview = document.getElementById("imagePreview");
    const promptText = document.getElementById("promptText");
    const scanBtn = document.getElementById("scanBtn");
    const dropZone = document.getElementById("dropZone");
    
    const resultDisplay = document.getElementById("resultDisplay");
    const resTitle = document.getElementById("resTitle");
    const resMeta = document.getElementById("resMeta");
    const confidenceVal = document.getElementById("confidenceVal");
    const filenameVal = document.getElementById("filenameVal");

    let activeFile = null;

    // Trigger the hidden file selector when the drop zone is clicked
    dropZone.addEventListener("click", () => {
        fileInput.click();
    });

    // Handle file selection from file dialog
    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    });

    // Handle drag and drop events
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "#00d2ff";
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.style.borderColor = "#2c2c35";
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "#2c2c35";
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            fileInput.files = e.dataTransfer.files; // Keep input element synchronized
        }
    });

    function processFile(file) {
        if (!file.type.startsWith("image/")) {
            alert("⚠️ Please select a valid image file (JPG, PNG, WEBP).");
            return;
        }

        activeFile = file;
        filenameVal.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.hidden = false;
            if (promptText) promptText.style.display = "none";
        };
        reader.readAsDataURL(file);
        
        // Dynamic UI style update to make the button fully clickable
        scanBtn.style.opacity = "1";
        scanBtn.style.cursor = "pointer";
        
        // Reset status message boxes
        resultDisplay.className = "result-display IDLE";
        resTitle.textContent = "READY TO SCAN";
        resMeta.textContent = "Click button below to execute AI classification layers.";
        confidenceVal.textContent = "--%";
    }

    // Process API inference execution on button click
    scanBtn.addEventListener("click", async () => {
        if (!activeFile) return;

        scanBtn.textContent = "PROCESSING AI INFERENCE...";
        resTitle.textContent = "SCANNING...";

        const formData = new FormData();
        formData.append("file", activeFile);

        try {
            const response = await fetch("http://127.0.0", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                resultDisplay.className = `result-display ${data.status}`;
                resTitle.textContent = `${data.status} - ${data.prediction}`;
                resMeta.textContent = data.status === "PASSED" ? "Pipe conforms to verified manufacturing rules." : "Pipe flagged as defective / counterfeit.";
                confidenceVal.textContent = `${data.confidence_percentage}%`;
            } else {
                showError(`Server Error: ${response.status}`);
            }
        } catch (error) {
            console.error("Fetch API error detail:", error);
            showError("Connection Blocked / Offline");
        } finally {
            scanBtn.textContent = "Analyze Labeled Batch";
        }
    });

    function showError(message) {
        resultDisplay.className = "result-display REJECTED";
        resTitle.textContent = message.toUpperCase();
        resMeta.textContent = "Verify your local uvicorn server window is active on port 8000.";
        confidenceVal.textContent = "0.00%";
    }
});
