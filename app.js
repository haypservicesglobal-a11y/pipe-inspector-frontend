document.addEventListener("DOMContentLoaded", () => {
    // 1. Map layout elements cleanly
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

    // 2. Track when an operator manually selects a file via browsing
    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processSelectedFile(e.target.files[0]);
        }
    });

    // 3. Track drag and drop gestures
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
            processSelectedFile(e.dataTransfer.files[0]);
            // Sync files list back to hidden input element to prevent state drops
            fileInput.files = e.dataTransfer.files;
        }
    });

    // 4. Central image validation engine
    function processSelectedFile(file) {
        if (!file.type.startsWith("image/")) {
            alert("⚠️ Please upload a valid inspection image file (JPG, PNG, WEBP).");
            return;
        }

        // Lock file object into system memory
        activeFile = file;
        filenameVal.textContent = file.name;
        
        // Render image onto screen canvas preview container
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.hidden = false;
            promptText.style.display = "none"; // Hide upload text prompt cleanly
        };
        reader.readAsDataURL(file);
        
        // CRUCIAL: Force-enable the faded button layout state instantly
        scanBtn.removeAttribute("disabled");
        scanBtn.disabled = false;
        
        // Reset analysis HUD window text
        resultDisplay.className = "result-display IDLE";
        resTitle.textContent = "READY TO SCAN";
        resMeta.textContent = "Click button below to execute AI classification layers.";
        confidenceVal.textContent = "--%";
    }

    // 5. Connect network execution to button trigger
    scanBtn.addEventListener("click", async () => {
        if (!activeFile) return;

        // Briefly lock button during active streaming request
        scanBtn.disabled = true;
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
                
                // Render outputs onto UI dashboards
                resultDisplay.className = `result-display ${data.status}`;
                resTitle.textContent = `${data.status} - ${data.prediction}`;
                resMeta.textContent = data.status === "PASSED" ? "Pipe conforms to verified manufacturing rules." : "Pipe flagged as defective / counterfeit.";
                confidenceVal.textContent = `${data.confidence_percentage}%`;
            } else {
                showNetworkError(`Server Error: ${response.status}`);
            }
        } catch (error) {
            console.error("Network Fetch Failure:", error);
            showNetworkError("Connection Blocked / Offline");
        } finally {
            // Restore interactive buttons state
            scanBtn.disabled = false;
            scanBtn.textContent = "Analyze Labeled Batch";
        }
    });

    function showNetworkError(message) {
        resultDisplay.className = "result-display REJECTED";
        resTitle.textContent = message.toUpperCase();
        resMeta.textContent = "Ensure your local uvicorn server window is active on port 8000.";
        confidenceVal.textContent = "0.00%";
    }
});
