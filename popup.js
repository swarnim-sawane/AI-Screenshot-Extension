document.addEventListener('DOMContentLoaded', async function () {
    const startCaptureBtn = document.getElementById('startCapture');
    const openSidePanelBtn = document.getElementById('openSidePanel');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const apiStatus = document.getElementById('apiStatus');

    console.log('Popup loaded in Edge');

    // Load saved API key
    try {
        const result = await chrome.storage.sync.get(['groqApiKey']);
        if (result.groqApiKey) {
            apiKeyInput.value = result.groqApiKey;
            updateApiStatus(true);
        }
    } catch (error) {
        console.error('Error loading API key:', error);
    }

    startCaptureBtn.addEventListener('click', async () => {
        console.log('Start capture clicked in Edge');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Current tab:', tab);

            if (tab.url.startsWith('edge://') || tab.url.startsWith('chrome://') || tab.url.startsWith('extension://')) {
                alert('Cannot capture screenshots on browser internal pages. Please try on a regular website like google.com');
                return;
            }

            // Disable button to prevent multiple clicks
            startCaptureBtn.disabled = true;
            startCaptureBtn.textContent = 'Starting...';

            console.log('Sending toggle message...');

            // Send message and wait for response
            chrome.runtime.sendMessage({
                action: 'toggleCaptureMode',
                tabId: tab.id  // Include tab ID explicitly
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Runtime error:', chrome.runtime.lastError);
                    alert('Error: ' + chrome.runtime.lastError.message);
                    startCaptureBtn.disabled = false;
                    startCaptureBtn.textContent = 'Start Screenshot Selection';
                } else {
                    console.log('Toggle response:', response);
                    // Only close popup after successful response
                    setTimeout(() => {
                        window.close();
                    }, 100);
                }
            });

        } catch (error) {
            console.error('Error starting capture:', error);
            alert('Error: ' + error.message);
            startCaptureBtn.disabled = false;
            startCaptureBtn.textContent = 'Start Screenshot Selection';
        }
    });

    // Hide the side panel button since Edge doesn't support it
    openSidePanelBtn.style.display = 'none';

    saveApiKeyBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            showMessage('Please enter an API key', 'error');
            return;
        }

        if (!apiKey.startsWith('gsk_')) {
            showMessage('Invalid Groq API key format', 'error');
            return;
        }

        try {
            await chrome.storage.sync.set({ groqApiKey: apiKey });
            updateApiStatus(true);
            showMessage('API key saved successfully!', 'success');
        } catch (error) {
            showMessage('Failed to save API key', 'error');
        }
    });

    function updateApiStatus(connected) {
        if (connected) {
            apiStatus.textContent = 'Groq API connected ✓';
            apiStatus.className = 'api-status connected';
        } else {
            apiStatus.textContent = 'Groq API key not configured';
            apiStatus.className = 'api-status disconnected';
        }
    }

    function showMessage(text, type) {
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      ${type === 'success' ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}
    `;

        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }


    // Check if first time user
chrome.storage.sync.get(['hasSeenWelcome'], (result) => {
  if (!result.hasSeenWelcome) {
    showWelcomeGuide();
    chrome.storage.sync.set({ hasSeenWelcome: true });
  }
});

function showWelcomeGuide() {
  // Show helpful tutorial or tips
  const welcomeDiv = document.createElement('div');
  welcomeDiv.innerHTML = `
    <div class="welcome-message">
      <h3>Welcome to Visual AI Analyzer! 🎉</h3>
      <p>1. Enter your Groq API key below</p>
      <p>2. Click "Start Screenshot Selection"</p>
      <p>3. Drag to select any area for AI analysis</p>
      <small>Tip: Use Ctrl+Shift+S for quick access!</small>
    </div>
  `;
  // Add to popup
}

});
