// ═══════════════════════════════════════════════════════════════
// 🛡️ SENTINEL SHIELD — BACKGROUND SERVICE WORKER
// Handles: URL scanning, Download scanning, Blocked site enforcement
// ═══════════════════════════════════════════════════════════════

// ─── URL SCANNING (existing) ───
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {

        // Check if the site is blocked first
        chrome.storage.local.get(['blockedSites'], (result) => {
            const blockedSites = result.blockedSites || [];
            let domain = '';
            try { domain = new URL(tab.url).hostname.toLowerCase(); } catch { return; }

            if (blockedSites.some(d => domain === d || domain.endsWith('.' + d))) {
                // Site is blocked — inject ACCESS DENIED
                chrome.tabs.sendMessage(tabId, {
                    type: 'SITE_BLOCKED',
                    domain: domain
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Message not delivered:', chrome.runtime.lastError.message);
                    }
                });
                return;
            }

            // Normal URL scan
            chrome.storage.local.get(['apiUrl', 'authToken'], (settings) => {
                const apiUrl = settings.apiUrl || 'http://localhost:3000';
                const authToken = settings.authToken;

                if (!authToken) {
                    console.warn('Sentinel Shield: No auth token found.');
                    return;
                }

                fetch(`${apiUrl}/api/scan`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ type: 'url', content: tab.url })
                })
                    .then(res => {
                        if (!res.ok) throw new Error(`API returned status ${res.status}`);
                        return res.json();
                    })
                    .then(data => {
                        console.log('Sentinel Shield Scan:', data);
                        if (data && data.threat) {
                            chrome.tabs.get(tabId, (currentTab) => {
                                if (chrome.runtime.lastError) return;
                                if (currentTab && currentTab.url && currentTab.url.startsWith('http')) {
                                    chrome.tabs.sendMessage(tabId, {
                                        type: 'THREAT_API_RESPONSE',
                                        threat: data.threat,
                                        apiUrl: apiUrl
                                    }, () => {
                                        if (chrome.runtime.lastError) {
                                            console.log('Message not delivered:', chrome.runtime.lastError.message);
                                        }
                                    });
                                }
                            });
                        }
                    })
                    .catch(err => {
                        console.error('Sentinel Shield: Error scanning URL:', err);
                    });
            });
        });
    }
});


// ═══════════════════════════════════════════════════════════════
// 📥 DOWNLOAD SCANNER
// Intercepts downloads, scans them via backend, auto-deletes unsafe files
// ═══════════════════════════════════════════════════════════════

// Track downloads being scanned to avoid double-processing
const scanningDownloads = new Set();

chrome.downloads.onChanged.addListener((delta) => {
    // Wait until the download is COMPLETE before scanning
    if (!delta.state || delta.state.current !== 'complete') return;
    if (scanningDownloads.has(delta.id)) return;

    scanningDownloads.add(delta.id);

    chrome.downloads.search({ id: delta.id }, (results) => {
        if (!results || results.length === 0) {
            scanningDownloads.delete(delta.id);
            return;
        }

        const download = results[0];
        const fileName = download.filename ? download.filename.split(/[/\\]/).pop() : 'unknown';
        const sourceUrl = download.referrer || download.url || '';
        const fileSize = download.fileSize || download.totalBytes || 0;
        const mimeType = download.mime || 'application/octet-stream';

        // Check if download scanning is enabled
        chrome.storage.local.get(['apiUrl', 'authToken', 'downloadScanEnabled'], (settings) => {
            const scanEnabled = settings.downloadScanEnabled !== false; // Default: enabled
            if (!scanEnabled) {
                scanningDownloads.delete(delta.id);
                return;
            }

            const apiUrl = settings.apiUrl || 'http://localhost:3000';
            const authToken = settings.authToken;

            if (!authToken) {
                console.warn('Sentinel Shield: No auth token for file scan.');
                scanningDownloads.delete(delta.id);
                return;
            }

            // Notify content script that scanning has started
            notifyActiveTab({
                type: 'DOWNLOAD_SCANNING',
                fileName: fileName
            });

            // Send to backend for analysis
            fetch(`${apiUrl}/api/scan/file`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    fileName: fileName,
                    fileSize: fileSize,
                    fileHash: 'browser-extension-scan',
                    sourceUrl: sourceUrl,
                    mimeType: mimeType
                })
            })
                .then(res => {
                    if (!res.ok) throw new Error(`File scan API returned ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    console.log('Sentinel Shield File Scan:', data);

                    if (data.safe) {
                        // ✅ FILE IS SAFE
                        notifyActiveTab({
                            type: 'DOWNLOAD_SAFE',
                            fileName: fileName,
                            score: data.score,
                            explanation: data.explanation,
                            categories: data.categories
                        });
                    } else {
                        // 🚫 FILE IS UNSAFE — Delete file and block source
                        console.warn('Sentinel Shield: UNSAFE file detected! Removing:', fileName);

                        // 1. Delete the downloaded file
                        chrome.downloads.removeFile(delta.id, () => {
                            if (chrome.runtime.lastError) {
                                console.error('Could not remove file:', chrome.runtime.lastError.message);
                            }
                        });

                        // Also erase from download history
                        chrome.downloads.erase({ id: delta.id });

                        // 2. Block the source domain
                        let sourceDomain = '';
                        try {
                            sourceDomain = new URL(sourceUrl).hostname.toLowerCase();
                        } catch {
                            try {
                                sourceDomain = new URL(download.url).hostname.toLowerCase();
                            } catch { /* no domain to block */ }
                        }

                        if (sourceDomain && sourceDomain !== 'localhost' && sourceDomain !== '127.0.0.1') {
                            chrome.storage.local.get(['blockedSites'], (result) => {
                                const blockedSites = result.blockedSites || [];
                                if (!blockedSites.includes(sourceDomain)) {
                                    blockedSites.push(sourceDomain);
                                    chrome.storage.local.set({ blockedSites });
                                    console.log('Sentinel Shield: Blocked source domain:', sourceDomain);
                                }
                            });
                        }

                        // 3. Notify user
                        notifyActiveTab({
                            type: 'DOWNLOAD_UNSAFE',
                            fileName: fileName,
                            score: data.score,
                            explanation: data.explanation,
                            categories: data.categories,
                            blockedDomain: sourceDomain
                        });
                    }

                    scanningDownloads.delete(delta.id);
                })
                .catch(err => {
                    console.error('Sentinel Shield: File scan error:', err);
                    scanningDownloads.delete(delta.id);

                    // On error, notify user but don't block
                    notifyActiveTab({
                        type: 'DOWNLOAD_SCAN_ERROR',
                        fileName: fileName,
                        error: err.message
                    });
                });
        });
    });
});

// ─── HELPER: Send message to the currently active tab ───
function notifyActiveTab(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0 && tabs[0].id) {
            const tab = tabs[0];
            if (tab.url && tab.url.startsWith('http')) {
                chrome.tabs.sendMessage(tab.id, message, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Message not delivered to active tab:', chrome.runtime.lastError.message);
                    }
                });
            }
        }
    });
}

// ─── HANDLE MESSAGES FROM POPUP ───
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_BLOCKED_SITES') {
        chrome.storage.local.get(['blockedSites'], (result) => {
            sendResponse({ blockedSites: result.blockedSites || [] });
        });
        return true; // async sendResponse
    }

    if (request.type === 'UNBLOCK_SITE') {
        chrome.storage.local.get(['blockedSites'], (result) => {
            const blockedSites = (result.blockedSites || []).filter(d => d !== request.domain);
            chrome.storage.local.set({ blockedSites }, () => {
                sendResponse({ success: true, blockedSites });
            });
        });
        return true;
    }

    if (request.type === 'CLEAR_ALL_BLOCKED') {
        chrome.storage.local.set({ blockedSites: [] }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});
