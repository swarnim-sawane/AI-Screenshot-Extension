// chat.js with markdown rendering and dynamic copy button for every AI message
let currentImageData = null;

document.addEventListener('DOMContentLoaded', async () => {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    // Focus and select input for better UX
    chatInput.focus();
    chatInput.select();

    // Visual: Disable send button if input is blank
    function updateSendBtnState() {
        if (chatInput.value.trim() === '') {
            sendBtn.disabled = true;
            sendBtn.style.opacity = 0.5;
            sendBtn.style.cursor = 'not-allowed';
        } else {
            sendBtn.disabled = false;
            sendBtn.style.opacity = 1;
            sendBtn.style.cursor = 'pointer';
        }
    }
    chatInput.addEventListener('input', updateSendBtnState);
    updateSendBtnState();

    // Configure marked for better rendering
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    // Helper: Add copy button to AI messages
    function addCopyButton(messageDiv) {
        // Remove old button, just in case
        const oldBtn = messageDiv.querySelector('.copy-btn');
        if (oldBtn) oldBtn.remove();

        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerHTML = '📋 Copy';
        btn.addEventListener('click', () => {
            // Find the message content (excluding images, buttons)
            const contentDiv = messageDiv.querySelector('.message-content');
            // Make a clone to remove images/buttons before getting text
            const selection = document.createElement('div');
            selection.innerHTML = contentDiv.innerHTML;
            // Remove images and buttons from copied text
            selection.querySelectorAll('img, button').forEach(el => el.remove());
            const text = selection.innerText.trim();
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = '📋 Copy', 1200);
            });
        });
        messageDiv.appendChild(btn);
    }

    // Helper: Add copy button to all existing AI messages in DOM (used after DOMContentLoaded)
    function addCopyToAllAIMessages() {
        document.querySelectorAll('.message.ai-message').forEach(addCopyButton);
    }

    // --- Load the current image and analysis ---
    const data = await chrome.storage.local.get(['currentImageData', 'currentAnalysis']);

    if (data.currentImageData && data.currentAnalysis) {
        currentImageData = data.currentImageData;
        const renderedAnalysis = renderMarkdown(data.currentAnalysis);
        chatMessages.innerHTML = `
            <div class="message ai-message fade-in">
                <img src="${data.currentImageData}" alt="Analyzed screenshot" class="screenshot-image">
                <div class="message-content">${renderedAnalysis}</div>
            </div>
        `;
        // Add copy
        addCopyToAllAIMessages();
    } else if (data.currentImageData) {
        currentImageData = data.currentImageData;

        chatMessages.innerHTML = `
            <div class="message ai-message fade-in">
                <img src="${data.currentImageData}" alt="Analyzed screenshot" class="screenshot-image">
                <div class="loading">Analyzing image with AI...</div>
            </div>
        `;
        addCopyToAllAIMessages();

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'analyzeWithGroq',
                imageData: currentImageData,
                prompt: 'Analyze this image and provide detailed insights about what you see.'
            });

            if (response.success) {
                const renderedAnalysis = renderMarkdown(response.analysis);
                chatMessages.innerHTML = `
                    <div class="message ai-message fade-in">
                        <img src="${currentImageData}" alt="Analyzed screenshot" class="screenshot-image">
                        <div class="message-content">${renderedAnalysis}</div>
                    </div>
                `;
                addCopyToAllAIMessages();
            } else {
                chatMessages.innerHTML = `
                    <div class="message ai-message message-error fade-in">
                        <img src="${currentImageData}" alt="Analyzed screenshot" class="screenshot-image">
                        <div class="message-content">Error: ${response.error}</div>
                    </div>
                `;
                addCopyToAllAIMessages();
            }
        } catch (error) {
            chatMessages.innerHTML = `
                <div class="message ai-message message-error fade-in">
                    <img src="${currentImageData}" alt="Analyzed screenshot" class="screenshot-image">
                    <div class="message-content">Failed to analyze image: ${error.message}</div>
                </div>
            `;
            addCopyToAllAIMessages();
        }
    } else {
        chatMessages.innerHTML = `
            <div class="message ai-message message-error fade-in">
                <div class="message-content">No image data found. Please try capturing a screenshot again.</div>
            </div>
        `;
        addCopyToAllAIMessages();
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || !currentImageData) return;

        // User message
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message fade-in';
        userMessage.innerHTML = `<div class="message-content">${escapeHtml(message)}</div>`;
        chatMessages.appendChild(userMessage);

        chatInput.value = '';
        updateSendBtnState();

        // Loading message with animated spinner (no copy button for loading message)
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'message ai-message fade-in';
        loadingMessage.innerHTML = '<div class="loading">AI is thinking...</div>';
        chatMessages.appendChild(loadingMessage);

        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        document.body.style.cursor = 'wait';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'analyzeWithGroq',
                imageData: currentImageData,
                prompt: message
            });
            loadingMessage.remove();
            if (response.success) {
                const aiMessage = document.createElement('div');
                aiMessage.className = 'message ai-message fade-in';
                const renderedResponse = renderMarkdown(response.analysis);
                aiMessage.innerHTML = `<div class="message-content">${renderedResponse}</div>`;
                addCopyButton(aiMessage); // Add copy button to this message
                chatMessages.appendChild(aiMessage);
            } else {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'message ai-message message-error fade-in';
                errorMessage.innerHTML = `<div class="message-content">Error: ${response.error}</div>`;
                addCopyButton(errorMessage);
                chatMessages.appendChild(errorMessage);
            }
        } catch (error) {
            loadingMessage.remove();
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message ai-message message-error fade-in';
            errorMessage.innerHTML = `<div class="message-content">Error: ${error.message}</div>`;
            addCopyButton(errorMessage);
            chatMessages.appendChild(errorMessage);
        }
        document.body.style.cursor = '';
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    }

    // Function to render markdown
    function renderMarkdown(text) {
        if (typeof marked !== 'undefined') {
            return marked.parse(text);
        } else {
            // Fallback: basic markdown rendering if marked is not available
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/### (.*?)$/gm, '<h3>$1</h3>')
                .replace(/## (.*?)$/gm, '<h2>$1</h2>')
                .replace(/# (.*?)$/gm, '<h1>$1</h1>')
                .replace(/^\* (.*?)$/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                .replace(/\n/g, '<br>');
        }
    }
    // Function to escape HTML for user messages
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add copy button to any static initial .ai-message already in DOM
    addCopyToAllAIMessages();
});