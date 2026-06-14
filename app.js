document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const imagePreview = document.getElementById("imagePreview");
    const promptZone = document.querySelector(".drop-zone-prompt");
    const scanBtn = document.getElementById("scanBtn");
    const resultDisplay = document.getElementById("resultDisplay");
    const resTitle = document.getElementById("resTitle");
    const resMeta = document.getElementById("resMeta");
    const confidenceVal = document.getElementById("confidenceVal");
    const filenameVal = document.getElementById("filenameVal");

    let activeFile = null;

    // Trigger file selection window
    dropZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) handleFileSelection(e.target.files[0]);
    });

    // Drag over styling elements
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
        if (e.dataTransfer.files.length > 0) handleFileSelection(e.dataTransfer.files[0]);
    });

    function handleFileSelection(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid inspection image file.");
            return;
        }
        activeFile = file;
        filenameVal.textContent = file.name;
        
        // Show file image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.hidden = false;
            promptZone.hidden = true;
        };
        reader.readAsDataURL(file);
        
        scanBtn.disabled = false;
        resetUiToReady();
    }

    function resetUiToReady() {
        resultDisplay.className = "result-display IDLE";
        resTitle.textContent = "READY TO SCAN";
        resMeta.textContent = "Click button below to execute AI classification layers.";
        confidenceVal.textContent = "--%";
    }

    // Hit the live FastAPI Endpoint
    scanBtn.addEventListener("click", async () => {
        if (!activeFile) return;

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
                renderResults(data);
            } else {
                renderError(`Server Error: ${response.status}`);
            }
        } catch (error) {
            renderError("Backend Offline");
        } finally {
            scanBtn.disabled = false;
            scanBtn.textContent = "Analyze Labeled Batch";
        }
    });

    function renderResults(data) {
        resultDisplay.className = `result-display ${data.status}`;
        resTitle.textContent = `${data.status} - ${data.prediction}`;
        resMeta.textContent = data.status === "PASSED" ? "Pipe conforms to verified manufacturing rules." : "Pipe flagged as defective / counterfeit.";
        confidenceVal.textContent = `${data.confidence_percentage}%`;
    }

    function renderError(message) {
        resultDisplay.className = "result-display REJECTED";
        resTitle.textContent = message.toUpperCase();
        resMeta.textContent = "Ensure 'uvicorn main:app' terminal is active on port 8000.";
        confidenceVal.textContent = "00.00%";
    }
});
