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

    // Direct click trigger wrapper
    dropZone.addEventListener("click", (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processSelectedFile(e.target.files[0]); // 🎯 FIX: Pass the first file object explicitly
        }
    });

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
            processSelectedFile(e.dataTransfer.files[0]); // 🎯 FIX: Pass the first dropped file object explicitly
            fileInput.files = e.dataTransfer.files;
        }
    });

    function processSelectedFile(file) {
        if (!file || !file.type.startsWith("image/")) {
            alert("⚠️ Please upload a valid inspection image file (JPG, PNG, WEBP).");
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
        
        // 🚀 FORCE UNLOCK STATE: Light up button visually and functionally
        scanBtn.disabled = false;
        scanBtn.style.opacity = "1";
        scanBtn.style.cursor = "pointer";
        
        resultDisplay.className = "result-display IDLE";
        resTitle.textContent = "READY TO SCAN";
        resMeta.textContent = "Click button below to execute AI classification layers.";
        confidenceVal.textContent = "--%";
    }

    scanBtn.addEventListener("click", async () => {
        if (!activeFile) {
            alert("Please select or drop an image first!");
            return;
        }

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
