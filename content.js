// Prevent multiple injections and ensure proper initialization
(function() {
  'use strict';
  
  console.log('Content script starting...');
  
  // Check if already initialized
  if (window.screenshotSelectorInitialized) {
    console.log('ScreenshotSelector already exists, reusing...');
    return;
  }
  
  // Mark as initializing
  window.screenshotSelectorInitialized = true;

  class ScreenshotSelector {
    constructor() {
      this.isActive = false;
      this.isSelecting = false;
      this.startX = 0;
      this.startY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.overlay = null;
      this.selectionBox = null;
      
      console.log('ScreenshotSelector constructor called');
      this.createOverlay();
      this.bindEvents();
      console.log('ScreenshotSelector initialized successfully');
    }
    
    createOverlay() {
      // Remove existing overlay if present
      const existing = document.getElementById('screenshot-overlay');
      if (existing) {
        existing.remove();
      }
      
      this.overlay = document.createElement('div');
      this.overlay.id = 'screenshot-overlay';
      this.overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.3) !important;
        z-index: 2147483647 !important;
        cursor: crosshair !important;
        display: none !important;
        pointer-events: auto !important;
      `;
      
      this.selectionBox = document.createElement('div');
      this.selectionBox.id = 'screenshot-selection';
      this.selectionBox.style.cssText = `
        position: absolute !important;
        border: 2px dashed #007bff !important;
        background: rgba(0, 123, 255, 0.1) !important;
        display: none !important;
        pointer-events: none !important;
      `;
      
      this.overlay.appendChild(this.selectionBox);
      document.body.appendChild(this.overlay);
      console.log('Overlay created and added to DOM');
    }
    
    bindEvents() {
      this.overlay.addEventListener('mousedown', this.startSelection.bind(this));
      this.overlay.addEventListener('mousemove', this.updateSelection.bind(this));
      this.overlay.addEventListener('mouseup', this.endSelection.bind(this));
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isActive) {
          this.toggle(false);
        }
      });
      
      console.log('Events bound successfully');
    }
    
    toggle(active) {
      console.log('Toggling capture mode:', active);
      this.isActive = active;
      this.overlay.style.display = active ? 'block' : 'none';
      
      if (!active) {
        this.selectionBox.style.display = 'none';
        this.isSelecting = false;
      }
      
      if (active) {
        this.showInstructions();
      } else {
        this.hideInstructions();
      }
    }
    
    showInstructions() {
      const existing = document.getElementById('screenshot-instruction');
      if (existing) existing.remove();
      
      const instruction = document.createElement('div');
      instruction.id = 'screenshot-instruction';
      instruction.textContent = 'Click and drag to select an area for AI analysis. Press ESC to cancel.';
      instruction.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: rgba(0, 0, 0, 0.8) !important;
        color: white !important;
        padding: 10px 20px !important;
        border-radius: 5px !important;
        z-index: 2147483648 !important;
        font-family: Arial, sans-serif !important;
        font-size: 14px !important;
      `;
      document.body.appendChild(instruction);
    }
    
    hideInstructions() {
      const instruction = document.getElementById('screenshot-instruction');
      if (instruction) {
        instruction.remove();
      }
    }
    
    startSelection(e) {
      console.log('Starting selection');
      this.isSelecting = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.selectionBox.style.display = 'block';
      this.selectionBox.style.left = this.startX + 'px';
      this.selectionBox.style.top = this.startY + 'px';
      this.selectionBox.style.width = '0px';
      this.selectionBox.style.height = '0px';
    }
    
    updateSelection(e) {
      if (!this.isSelecting) return;
      
      this.currentX = e.clientX;
      this.currentY = e.clientY;
      
      const left = Math.min(this.startX, this.currentX);
      const top = Math.min(this.startY, this.currentY);
      const width = Math.abs(this.currentX - this.startX);
      const height = Math.abs(this.currentY - this.startY);
      
      this.selectionBox.style.left = left + 'px';
      this.selectionBox.style.top = top + 'px';
      this.selectionBox.style.width = width + 'px';
      this.selectionBox.style.height = height + 'px';
    }
    
    async endSelection(e) {
      if (!this.isSelecting) return;
      
      console.log('Ending selection');
      
      const left = Math.min(this.startX, this.currentX);
      const top = Math.min(this.startY, this.currentY);
      const width = Math.abs(this.currentX - this.startX);
      const height = Math.abs(this.currentY - this.startY);
      
      if (width < 10 || height < 10) {
        this.toggle(false);
        return;
      }
      
      const coordinates = {
        x: left,
        y: top,
        width: width,
        height: height
      };
      
      this.toggle(false);
      this.showLoadingIndicator();
      
      try {
        console.log('Sending capture request with coordinates:', coordinates);
        
        const response = await chrome.runtime.sendMessage({
          action: 'captureScreenshot',
          coordinates: coordinates
        });
        
        if (response && response.success) {
          console.log('Screenshot captured successfully');
          
          const analysisResult = await chrome.runtime.sendMessage({
            action: 'analyzeWithGroq',
            imageData: response.imageData,
            prompt: 'Analyze this image and provide detailed insights about what you see.'
          });
          
          if (analysisResult && analysisResult.success) {
            chrome.runtime.sendMessage({
              action: 'openChatWindow',
              imageData: response.imageData,
              analysis: analysisResult.analysis
            });
          } else {
            this.showError('Failed to analyze image: ' + (analysisResult.error || 'Unknown error'));
          }
        } else {
          console.error('Screenshot capture failed:', response.error);
          this.showError('Failed to capture screenshot: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error processing screenshot:', error);
        this.showError('Error processing screenshot: ' + error.message);
      } finally {
        this.hideLoadingIndicator();
      }
    }
    
    showLoadingIndicator() {
      const existing = document.getElementById('screenshot-loader');
      if (existing) existing.remove();
      
      const loader = document.createElement('div');
      loader.id = 'screenshot-loader';
      loader.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span>Analyzing screenshot with AI...</span>
        </div>
      `;
      loader.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: rgba(0, 0, 0, 0.8) !important;
        color: white !important;
        padding: 15px 20px !important;
        border-radius: 5px !important;
        z-index: 2147483648 !important;
        font-family: Arial, sans-serif !important;
        font-size: 14px !important;
      `;
      
      if (!document.head.querySelector('#spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      document.body.appendChild(loader);
    }
    
    hideLoadingIndicator() {
      const loader = document.getElementById('screenshot-loader');
      if (loader) {
        loader.remove();
      }
    }
    
    showError(message) {
      const error = document.createElement('div');
      error.textContent = message;
      error.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: rgba(220, 53, 69, 0.9) !important;
        color: white !important;
        padding: 10px 20px !important;
        border-radius: 5px !important;
        z-index: 2147483648 !important;
        font-family: Arial, sans-serif !important;
        font-size: 14px !important;
      `;
      document.body.appendChild(error);
      
      setTimeout(() => error.remove(), 3000);
    }
  }

  // Initialize immediately when script loads
  function initializeScreenshotSelector() {
    console.log('Initializing ScreenshotSelector...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM ready, creating ScreenshotSelector');
        window.screenshotSelector = new ScreenshotSelector();
      });
    } else {
      console.log('DOM already ready, creating ScreenshotSelector immediately');
      window.screenshotSelector = new ScreenshotSelector();
    }
  }

  // Initialize right away
  initializeScreenshotSelector();

})();
