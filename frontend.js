// frontend.js
export class Frontend {
    constructor() {
        this.sessionId = this.extractSessionId();
    }

    extractSessionId() {
        const hash = window.location.hash.substring(1);
        return hash ? hash : null;
    }

    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }

    async sendRequest(endpoint, method = 'GET', data = null, isFileUpload = false) {
        try {
            const headers = new Headers();
            headers.append('Session-Id', this.sessionId);

            const options = {
                method: method,
                headers: headers,
            };

            if (isFileUpload && data) {
                const formData = new FormData();
                formData.append('sessionId', this.sessionId);

                for (const [key, file] of Object.entries(data)) {
                    formData.append(key, file);
                }

                options.body = formData;
            } else if (data) {
                headers.append('Content-Type', 'application/json');
                options.body = JSON.stringify(data);
            }

            const response = await fetch(endpoint, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            return { error: error.message };
        }
    }

    async checkLoginStatus() {
        const response = await this.sendRequest('/api.php', 'POST', { action: 'checkLoginStatus' });
        if (response.error) {
            this.showLoginModal();
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = 'block';
    }
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
    const frontend = new Frontend();
    frontend.checkLoginStatus();

    document.getElementById('sendJsonRequest').addEventListener('click', () => {
        frontend.sendRequest('/api.php', 'POST', { key: 'value' })
            .then(response => console.log(response));
    });

    document.getElementById('uploadFile').addEventListener('click', () => {
        const fileInput = document.getElementById('fileInput');
        const files = { file: fileInput.files[0] };
        frontend.sendRequest('/api.php', 'POST', files, true)
            .then(response => console.log(response));
    });
});