document.addEventListener('DOMContentLoaded', () => {
    const apiUrlInput = document.getElementById('apiUrl');
    const authTokenInput = document.getElementById('authToken');
    const saveBtn = document.getElementById('saveBtn');
    const statusEl = document.getElementById('status');
    const downloadToggle = document.getElementById('downloadScanToggle');
    const langSelect = document.getElementById('langSelect');
    const blockedListEl = document.getElementById('blockedList');
    const blockedCountEl = document.getElementById('blockedCount');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // ─── Load saved settings ───
    chrome.storage.local.get(['apiUrl', 'authToken', 'downloadScanEnabled', 'ssLanguage'], (result) => {
        if (result.apiUrl) apiUrlInput.value = result.apiUrl;
        else apiUrlInput.value = 'http://localhost:3000';

        if (result.authToken) authTokenInput.value = result.authToken;

        // Download scan toggle (default: enabled)
        downloadToggle.checked = result.downloadScanEnabled !== false;

        // Language preference (default: en)
        langSelect.value = result.ssLanguage || 'en';
    });

    // ─── Save settings ───
    saveBtn.addEventListener('click', () => {
        const apiUrl = apiUrlInput.value.trim().replace(/\/$/, "");
        const authToken = authTokenInput.value.trim();

        chrome.storage.local.set({
            apiUrl: apiUrl,
            authToken: authToken
        }, () => {
            saveBtn.innerText = 'Saved!';
            saveBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            saveBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            statusEl.classList.add('show');

            setTimeout(() => {
                saveBtn.innerText = 'Connect & Save';
                saveBtn.style.background = '';
                saveBtn.style.boxShadow = '';
                statusEl.classList.remove('show');
            }, 2000);
        });
    });

    // ─── Download scan toggle ───
    downloadToggle.addEventListener('change', () => {
        chrome.storage.local.set({ downloadScanEnabled: downloadToggle.checked });
    });

    // ─── Language selector ───
    langSelect.addEventListener('change', () => {
        chrome.storage.local.set({ ssLanguage: langSelect.value });
    });

    // ─── Load blocked sites ───
    function loadBlockedSites() {
        chrome.runtime.sendMessage({ type: 'GET_BLOCKED_SITES' }, (response) => {
            if (chrome.runtime.lastError) {
                // Fallback: read directly from storage
                chrome.storage.local.get(['blockedSites'], (result) => {
                    renderBlockedSites(result.blockedSites || []);
                });
                return;
            }
            renderBlockedSites(response?.blockedSites || []);
        });
    }

    function renderBlockedSites(sites) {
        blockedCountEl.textContent = sites.length;
        clearAllBtn.style.display = sites.length > 0 ? 'block' : 'none';

        if (sites.length === 0) {
            blockedListEl.innerHTML = '<div class="no-blocked">No sites blocked yet ✨</div>';
            return;
        }

        blockedListEl.innerHTML = sites.map(domain => `
            <div class="blocked-item">
                <span class="blocked-domain">${domain}</span>
                <button class="unblock-btn" data-domain="${domain}">Unblock</button>
            </div>
        `).join('');

        // Attach unblock handlers
        blockedListEl.querySelectorAll('.unblock-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const domain = btn.getAttribute('data-domain');
                chrome.runtime.sendMessage({ type: 'UNBLOCK_SITE', domain }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Fallback: modify storage directly
                        chrome.storage.local.get(['blockedSites'], (result) => {
                            const updated = (result.blockedSites || []).filter(d => d !== domain);
                            chrome.storage.local.set({ blockedSites: updated }, () => {
                                renderBlockedSites(updated);
                            });
                        });
                        return;
                    }
                    renderBlockedSites(response?.blockedSites || []);
                });
            });
        });
    }

    // ─── Clear all blocked ───
    clearAllBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'CLEAR_ALL_BLOCKED' }, () => {
            if (chrome.runtime.lastError) {
                chrome.storage.local.set({ blockedSites: [] }, () => {
                    renderBlockedSites([]);
                });
                return;
            }
            renderBlockedSites([]);
        });
    });

    // Initial load
    loadBlockedSites();
});
