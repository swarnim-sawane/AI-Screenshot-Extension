// Edge-compatible background service worker
let captureMode = false;

chrome.runtime.onInstalled.addListener(() => {
    console.log('Visual AI Screenshot Analyzer installed on Edge');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    switch (message.action) {
        case 'toggleCaptureMode':
            handleToggleCaptureMode(message.tabId || sender.tab?.id)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        case 'captureScreenshot':
            handleCaptureScreenshot(message.coordinates, sender.tab.id)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ error: error.message }));
            return true;

        case 'analyzeWithGroq':
            analyzeImageWithGroq(message.imageData, message.prompt)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ error: error.message }));
            return true;

        case 'openChatWindow':
            openChatWindow(message.imageData, message.analysis);
            sendResponse({ success: true });
            break;
    }
});

async function handleToggleCaptureMode(tabId) {
    console.log('Toggling capture mode for tab:', tabId);

    if (!tabId) {
        throw new Error('No tab ID provided');
    }

    captureMode = !captureMode;

    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab) {
            throw new Error('Tab not found');
        }

        console.log('Tab found, sending toggle message to content script...');

        // Simply send the toggle command - don't try to re-inject scripts
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: function (isActive) {
                console.log('Executing toggle with active:', isActive);

                // Direct toggle without complex retry logic
                if (window.screenshotSelector) {
                    console.log('Found screenshotSelector, toggling...');
                    window.screenshotSelector.toggle(isActive);
                } else {
                    console.log('ScreenshotSelector not found immediately, waiting for initialization...');

                    // Simple wait for initialization
                    let attempts = 0;
                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (window.screenshotSelector) {
                            console.log('ScreenshotSelector found after', attempts, 'attempts');
                            window.screenshotSelector.toggle(isActive);
                            clearInterval(checkInterval);
                        } else if (attempts >= 10) {
                            console.error('ScreenshotSelector not found after 10 attempts');
                            clearInterval(checkInterval);

                            // Show simple error message
                            const errorDiv = document.createElement('div');
                            errorDiv.textContent = 'Extension not ready. Please refresh the page and try again.';
                            errorDiv.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: rgba(220, 53, 69, 0.9) !important;
                color: white !important;
                padding: 15px 25px !important;
                border-radius: 5px !important;
                z-index: 2147483648 !important;
                font-family: Arial, sans-serif !important;
                font-size: 14px !important;
                max-width: 300px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
              `;
                            document.body.appendChild(errorDiv);
                            setTimeout(() => errorDiv.remove(), 5000);
                        }
                    }, 500);
                }
            },
            args: [captureMode]
        });

        console.log('Toggle command sent successfully');
    } catch (error) {
        console.error('Failed to toggle capture mode:', error);
        throw error;
    }
}

async function handleCaptureScreenshot(coordinates, tabId) {
  try {
    console.log('Capturing screenshot with precise coordinates:', coordinates);
    
    // Capture at maximum quality
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100  // Maximum quality for PNG (though PNG ignores this, it's good practice)
    });
    
    console.log('Full screenshot captured successfully');
    
    // Crop with pixel-perfect precision
    const croppedImage = await cropImageInServiceWorker(dataUrl, coordinates);
    
    return { success: true, imageData: croppedImage };
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    throw new Error('Failed to capture screenshot: ' + error.message);
  }
}


async function cropImageInServiceWorker(dataUrl, coordinates) {
  return new Promise((resolve, reject) => {
    try {
      console.log('PRECISE CROP with scroll-adjusted coordinates:', coordinates);
      
      // Apply device pixel ratio scaling to coordinates
      const dpr = coordinates.devicePixelRatio || 1;
      const scaledCoords = {
        x: Math.round(coordinates.x * dpr),
        y: Math.round(coordinates.y * dpr),
        width: Math.round(coordinates.width * dpr),
        height: Math.round(coordinates.height * dpr)
      };
      
      console.log('SCALED coordinates for crop:', scaledCoords);
      
      const canvas = new OffscreenCanvas(scaledCoords.width, scaledCoords.height);
      const ctx = canvas.getContext('2d');
      
      // Disable smoothing for pixel-perfect results
      ctx.imageSmoothingEnabled = false;
      
      fetch(dataUrl)
        .then(response => response.blob())
        .then(blob => createImageBitmap(blob))
        .then(imageBitmap => {
          console.log('Screenshot image size:', imageBitmap.width, 'x', imageBitmap.height);
          
          // Safe crop function to prevent out-of-bounds
          function safeCrop(imageWidth, imageHeight, x, y, w, h) {
            const safeX = Math.max(0, Math.min(x, imageWidth - 1));
            const safeY = Math.max(0, Math.min(y, imageHeight - 1));
            const safeW = Math.min(w, imageWidth - safeX);
            const safeH = Math.min(h, imageHeight - safeY);
            return { safeX, safeY, safeW, safeH };
          }
          
          const { safeX, safeY, safeW, safeH } = safeCrop(
            imageBitmap.width, 
            imageBitmap.height,
            scaledCoords.x, 
            scaledCoords.y, 
            scaledCoords.width, 
            scaledCoords.height
          );
          
          console.log('SAFE CROP coordinates:', { safeX, safeY, safeW, safeH });
          
          // Update canvas size to actual crop size
          canvas.width = safeW;
          canvas.height = safeH;
          
          // Draw the exact selected area
          ctx.drawImage(
            imageBitmap,
            safeX, safeY, safeW, safeH,  // Source rectangle (from screenshot)
            0, 0, safeW, safeH           // Destination rectangle (to canvas)
          );
          
          // Convert to PNG (uncompressed) - Groq limit is 4MB for base64[1]
          canvas.convertToBlob({ type: 'image/png' })
            .then(blob => {
              console.log('Cropped image size:', blob.size, 'bytes');
              
              // Check if image exceeds Groq's 4MB base64 limit
              if (blob.size > 4 * 1024 * 1024) {
                console.warn('Image over 4MB, compressing for Groq API...');
                // Compress to JPEG if too large
                return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
              }
              return blob;
            })
            .then(finalBlob => {
              const reader = new FileReader();
              reader.onload = () => {
                console.log('PRECISE CROP COMPLETED - Final size:', finalBlob.size, 'bytes');
                resolve(reader.result);
              };
              reader.onerror = () => reject(new Error('Failed to read cropped image'));
              reader.readAsDataURL(finalBlob);
            })
            .catch(reject);
        })
        .catch(reject);
    } catch (error) {
      console.error('Error in precise crop operation:', error);
      reject(error);
    }
  });
}




async function analyzeImageWithGroq(imageData, prompt = "Analyze this image and provide insights") {
    try {
        const result = await chrome.storage.sync.get(['groqApiKey']);
        const apiKey = result.groqApiKey;

        if (!apiKey) {
            throw new Error('Groq API key not configured');
        }

        console.log('Sending request to Groq API with Llama 4 Scout model...');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Updated to full model name
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageData } }
                    ]
                }],
                max_tokens: 1500, // Increased for better responses
                temperature: 0.7
            })
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API request failed:', response.status, errorText);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Groq API response received successfully:', data);

        return {
            success: true,
            analysis: data.choices[0].message.content,
            usage: data.usage
        };
    } catch (error) {
        console.error('Groq API error:', error);
        throw new Error('Failed to analyze image: ' + error.message);
    }
}


async function openChatWindow(imageData, analysis) {
    try {
        await chrome.storage.local.set({
            currentImageData: imageData,
            currentAnalysis: analysis,
            timestamp: Date.now()
        });

        console.log('Opening chat window...');

        const window = await chrome.windows.create({
            url: chrome.runtime.getURL('chat.html'),
            type: 'popup',
            width: 450,
            height: 650,
            focused: true
        });

        console.log('Chat window opened:', window.id);
    } catch (error) {
        console.error('Failed to open chat window:', error);
    }
}

// Handle keyboard shortcuts
// Add this to your existing background.js

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Keyboard command received:', command);
  
  if (command === 'start-capture') {
    // Get the currently active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        console.log('Starting capture from keyboard shortcut on tab:', tabs[0].id);
        handleToggleCaptureMode(tabs[0].id);
      }
    });
  }
});



// Production optimizations
const RATE_LIMIT = {
  maxRequests: 50,
  timeWindow: 3600000, // 1 hour
  currentCount: 0,
  resetTime: Date.now() + 3600000
};

function checkRateLimit() {
  if (Date.now() > RATE_LIMIT.resetTime) {
    RATE_LIMIT.currentCount = 0;
    RATE_LIMIT.resetTime = Date.now() + RATE_LIMIT.timeWindow;
  }
  
  if (RATE_LIMIT.currentCount >= RATE_LIMIT.maxRequests) {
    throw new Error('Rate limit exceeded. Please try again in an hour.');
  }
  
  RATE_LIMIT.currentCount++;
}


// Add to background.js
function trackUsage(action, metadata = {}) {
  chrome.storage.local.get(['usageStats'], (result) => {
    const stats = result.usageStats || {};
    const today = new Date().toISOString().split('T')[0];
    
    if (!stats[today]) stats[today] = {};
    stats[today][action] = (stats[today][action] || 0) + 1;
    
    chrome.storage.local.set({ usageStats: stats });
  });
}

// Track key events
trackUsage('screenshot_captured');
trackUsage('ai_analysis_success');
trackUsage('chat_message_sent');

