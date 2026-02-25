// ─── LANGUAGE LOADER ───
let ssLang = 'en';
try {
  chrome.storage.local.get(['ssLanguage'], (result) => {
    ssLang = result.ssLanguage || 'en';
  });
} catch (e) { /* fallback to en */ }

// Listen for language changes
try {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.ssLanguage) {
      ssLang = changes.ssLanguage.newValue || 'en';
    }
  });
} catch (e) { /* ignore */ }

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'THREAT_API_RESPONSE') {
    injectThreatWidget(request.threat, request.apiUrl);
  }
  if (request.type === 'DOWNLOAD_SCANNING') {
    showDownloadScanOverlay(request.fileName);
  }
  if (request.type === 'DOWNLOAD_SAFE') {
    showDownloadSafeOverlay(request.fileName, request.score, request.explanation, request.categories);
  }
  if (request.type === 'DOWNLOAD_UNSAFE') {
    showDownloadUnsafeOverlay(request.fileName, request.score, request.explanation, request.categories, request.blockedDomain);
  }
  if (request.type === 'DOWNLOAD_SCAN_ERROR') {
    removeDownloadOverlay();
  }
  if (request.type === 'SITE_BLOCKED') {
    showBlockedSiteOverlay(request.domain);
  }
});

// ─── MICRO-TIPS LIBRARY (translation-aware) ───
function getMicroTips() {
  return {
    'Phishing': [
      { id: 'phish-1', titleKey: 'tip_phish1_title', tipKey: 'tip_phish1' },
      { id: 'phish-2', titleKey: 'tip_phish2_title', tipKey: 'tip_phish2' },
      { id: 'phish-3', titleKey: 'tip_phish3_title', tipKey: 'tip_phish3' },
    ],
    'Malware': [
      { id: 'malw-1', titleKey: 'tip_malw1_title', tipKey: 'tip_malw1' },
      { id: 'malw-2', titleKey: 'tip_malw2_title', tipKey: 'tip_malw2' },
    ],
    'Suspicious Link': [
      { id: 'susp-1', titleKey: 'tip_susp1_title', tipKey: 'tip_susp1' },
      { id: 'susp-2', titleKey: 'tip_susp2_title', tipKey: 'tip_susp2' },
    ],
    'Suspicious Domain': [
      { id: 'dom-1', titleKey: 'tip_dom1_title', tipKey: 'tip_dom1' },
      { id: 'dom-2', titleKey: 'tip_dom2_title', tipKey: 'tip_dom2' },
    ],
    'Credential Harvesting Risk': [
      { id: 'cred-1', titleKey: 'tip_cred1_title', tipKey: 'tip_cred1' },
    ],
    'Clean': [
      { id: 'clean-1', titleKey: 'tip_clean1_title', tipKey: 'tip_clean1' },
      { id: 'clean-2', titleKey: 'tip_clean2_title', tipKey: 'tip_clean2' },
    ],
  };
}

function getUnseenTip(category) {
  const allTips = getMicroTips();
  const tips = allTips[category] || allTips['Clean'];
  const dismissedRaw = localStorage.getItem('ss_ext_dismissed_tips');
  const dismissed = dismissedRaw ? JSON.parse(dismissedRaw) : [];
  const tipData = tips.find(t => !dismissed.includes(t.id)) || null;
  if (tipData) {
    return {
      id: tipData.id,
      title: ssT(tipData.titleKey, ssLang),
      tip: ssT(tipData.tipKey, ssLang),
    };
  }
  return null;
}

function dismissTip(tipId) {
  const dismissedRaw = localStorage.getItem('ss_ext_dismissed_tips');
  const dismissed = dismissedRaw ? JSON.parse(dismissedRaw) : [];
  if (!dismissed.includes(tipId)) {
    dismissed.push(tipId);
    localStorage.setItem('ss_ext_dismissed_tips', JSON.stringify(dismissed));
  }
}

function injectThreatWidget(threat, apiUrl) {
  if (document.getElementById('sentinel-shield-wrapper')) return;

  const severityColors = {
    low: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399', icon: 'shield-check' },
    medium: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24', icon: 'exclamation-circle' },
    high: { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.4)', text: '#fb923c', icon: 'exclamation-triangle' },
    critical: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.5)', text: '#f87171', icon: 'x-circle' }
  };

  const scheme = severityColors[threat.severity] || severityColors.low;
  const categoriesHtml = threat.categories.map(cat => `<span class="ss-category">${cat}</span>`).join('');

  const category = threat.categories?.[0] || 'Clean';
  const tip = getUnseenTip(category);

  const tipHtml = tip ? `
    <div class="ss-tip-card" id="ss-tip-card">
      <div class="ss-tip-header">
        <span class="ss-tip-badge">${ssT('cyberTip', ssLang)}</span>
      </div>
      <div class="ss-tip-title">${tip.title}</div>
      <p class="ss-tip-text">${tip.tip}</p>
      <button id="ss-tip-dismiss" class="ss-tip-btn" data-tip-id="${tip.id}">${ssT('gotIt', ssLang)}</button>
    </div>
  ` : '';

  const wrapper = document.createElement('div');
  wrapper.id = 'sentinel-shield-wrapper';

  const htmlContent = `
    <div class="ss-widget-container" style="--severity-bg: ${scheme.bg}; --severity-border: ${scheme.border}; --severity-text: ${scheme.text};">
      <div class="ss-widget-glow"></div>
      
      <div class="ss-widget-header">
        <div class="ss-widget-title">
          <svg class="ss-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10a9 9 0 110 18 9 9 0 010-18z" />
          </svg>
          <span>${ssT('sentinelShield', ssLang)}</span>
        </div>
        <button id="ss-close-btn" class="ss-close-btn">&times;</button>
      </div>

      <div class="ss-widget-body">
        <div class="ss-score-circle">
          <svg viewBox="0 0 36 36" class="ss-circular-chart">
            <path class="ss-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="ss-circle ss-score-${threat.severity}" stroke-dasharray="${threat.riskScore}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <text x="18" y="20.35" class="ss-percentage">${threat.riskScore}</text>
          </svg>
        </div>
        
        <div class="ss-details">
          <div class="ss-severity-badge" style="color: ${scheme.text}; background: ${scheme.bg}; border: 1px solid ${scheme.border}">
            ${ssT(threat.severity + 'Risk', ssLang)}
          </div>
          <p class="ss-reason">${threat.explanation || 'URL analyzed by Sentinel Shield.'}</p>
          <div class="ss-categories">
            ${categoriesHtml}
          </div>
        </div>
      </div>
      ${tipHtml}
    </div>
  `;

  wrapper.innerHTML = htmlContent;
  document.body.appendChild(wrapper);

  setTimeout(() => {
    wrapper.classList.add('ss-visible');
  }, 100);

  document.getElementById('ss-close-btn').addEventListener('click', () => {
    wrapper.classList.remove('ss-visible');
    setTimeout(() => {
      if (document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    }, 300);
  });

  const tipDismissBtn = document.getElementById('ss-tip-dismiss');
  if (tipDismissBtn) {
    tipDismissBtn.addEventListener('click', () => {
      const tipId = tipDismissBtn.getAttribute('data-tip-id');
      if (tipId) dismissTip(tipId);
      const tipCard = document.getElementById('ss-tip-card');
      if (tipCard) {
        tipCard.style.opacity = '0';
        tipCard.style.transform = 'translateY(10px)';
        setTimeout(() => tipCard.remove(), 300);
      }
    });
  }
}


// ═══════════════════════════════════════════════════════════════
// 📥 DOWNLOAD SCANNER OVERLAYS
// Shows scanning progress, safe/unsafe verdicts, and blocked site pages
// ═══════════════════════════════════════════════════════════════

function removeDownloadOverlay() {
  const existing = document.getElementById('ss-download-overlay');
  if (existing) {
    existing.classList.remove('ss-overlay-visible');
    setTimeout(() => { if (document.body.contains(existing)) existing.remove(); }, 400);
  }
}

function showDownloadScanOverlay(fileName) {
  removeDownloadOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'ss-download-overlay';
  overlay.className = 'ss-download-overlay';
  overlay.innerHTML = `
    <div class="ss-dl-card ss-dl-scanning">
      <div class="ss-dl-glow ss-glow-blue"></div>
      <div class="ss-dl-header">
        <div class="ss-dl-shield-icon ss-pulse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <span class="ss-dl-title">${ssT('sentinelShield', ssLang)}</span>
      </div>
      <div class="ss-dl-body">
        <div class="ss-dl-spinner">
          <div class="ss-spinner-ring"></div>
          <div class="ss-spinner-ring ss-ring-delay"></div>
        </div>
        <div class="ss-dl-status">${ssT('scanningFile', ssLang)}</div>
        <div class="ss-dl-filename">${fileName}</div>
        <div class="ss-dl-substatus">${ssT('analyzingFile', ssLang)}</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('ss-overlay-visible'), 50);
}

function showDownloadSafeOverlay(fileName, score, explanation, categories) {
  removeDownloadOverlay();

  const safeScore = 100 - (score || 0);
  const categoriesHtml = (categories || ['Safe File']).map(c => `<span class="ss-dl-cat">${c}</span>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'ss-download-overlay';
  overlay.className = 'ss-download-overlay';
  overlay.innerHTML = `
    <div class="ss-dl-card ss-dl-safe">
      <div class="ss-dl-glow ss-glow-green"></div>
      <button class="ss-dl-close" id="ss-dl-close">&times;</button>
      <div class="ss-dl-header">
        <div class="ss-dl-shield-icon ss-safe-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <span class="ss-dl-title">${ssT('sentinelShield', ssLang)}</span>
      </div>
      <div class="ss-dl-body">
        <div class="ss-dl-verdict-badge ss-badge-safe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          ${ssT('accessGranted', ssLang)}
        </div>
        <div class="ss-dl-score-ring">
          <svg viewBox="0 0 36 36" class="ss-dl-circle-chart">
            <path class="ss-dl-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="ss-dl-circle ss-circle-safe" stroke-dasharray="${safeScore}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <text x="18" y="20.35" class="ss-dl-score-text ss-text-safe">${safeScore}</text>
          </svg>
          <div class="ss-dl-score-label">${ssT('safetyScore', ssLang)}</div>
        </div>
        <div class="ss-dl-filename">${fileName}</div>
        <div class="ss-dl-reason">${explanation?.reason || 'File is safe to open.'}</div>
        <div class="ss-dl-categories">${categoriesHtml}</div>
        <div class="ss-dl-advice ss-advice-safe">✅ ${explanation?.behavioralRisk || ssT('safeToOpen', ssLang)}</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('ss-overlay-visible'), 50);

  overlay.querySelector('#ss-dl-close').addEventListener('click', removeDownloadOverlay);
  // Auto-dismiss after 8 seconds
  setTimeout(removeDownloadOverlay, 8000);
}

function showDownloadUnsafeOverlay(fileName, score, explanation, categories, blockedDomain) {
  removeDownloadOverlay();

  const categoriesHtml = (categories || ['Malware']).map(c => `<span class="ss-dl-cat ss-cat-danger">${c}</span>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'ss-download-overlay';
  overlay.className = 'ss-download-overlay';
  overlay.innerHTML = `
    <div class="ss-dl-card ss-dl-unsafe">
      <div class="ss-dl-glow ss-glow-red"></div>
      <button class="ss-dl-close" id="ss-dl-close-unsafe">&times;</button>
      <div class="ss-dl-header">
        <div class="ss-dl-shield-icon ss-unsafe-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <span class="ss-dl-title ss-title-danger">${ssT('threatDetected', ssLang)}</span>
      </div>
      <div class="ss-dl-body">
        <div class="ss-dl-verdict-badge ss-badge-unsafe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          ${ssT('accessDenied', ssLang)}
        </div>
        <div class="ss-dl-score-ring">
          <svg viewBox="0 0 36 36" class="ss-dl-circle-chart">
            <path class="ss-dl-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="ss-dl-circle ss-circle-unsafe" stroke-dasharray="${score || 85}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <text x="18" y="20.35" class="ss-dl-score-text ss-text-unsafe">${score || 85}</text>
          </svg>
          <div class="ss-dl-score-label ss-label-danger">${ssT('threatScore', ssLang)}</div>
        </div>
        <div class="ss-dl-filename ss-filename-danger">${fileName}</div>
        <div class="ss-dl-reason">${explanation?.reason || ssT('harmfulRemoved', ssLang)}</div>
        <div class="ss-dl-categories">${categoriesHtml}</div>
        <div class="ss-dl-actions-taken">
          <div class="ss-dl-action-item">
            <span class="ss-action-icon">🗑️</span>
            <span>${ssT('fileDeleted', ssLang)}</span>
          </div>
          <div class="ss-dl-action-item">
            <span class="ss-action-icon">🚫</span>
            <span>${ssT('sourceWebsite', ssLang)} <strong>${blockedDomain || 'unknown'}</strong> ${ssT('sourceBlocked', ssLang)}</span>
          </div>
          <div class="ss-dl-action-item">
            <span class="ss-action-icon">🛡️</span>
            <span>${ssT('tracesRemoved', ssLang)}</span>
          </div>
        </div>
        <div class="ss-dl-advice ss-advice-unsafe">⚠️ ${explanation?.behavioralRisk || ssT('harmfulRemoved', ssLang)}</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('ss-overlay-visible'), 50);

  overlay.querySelector('#ss-dl-close-unsafe').addEventListener('click', removeDownloadOverlay);
  // Auto-dismiss after 15 seconds
  setTimeout(removeDownloadOverlay, 15000);
}

function showBlockedSiteOverlay(domain) {
  // Remove everything on the page and show full ACCESS DENIED
  const existing = document.getElementById('ss-blocked-overlay');
  if (existing) return; // Already showing

  const overlay = document.createElement('div');
  overlay.id = 'ss-blocked-overlay';
  overlay.className = 'ss-blocked-overlay';
  overlay.innerHTML = `
    <div class="ss-blocked-content">
      <div class="ss-blocked-glow"></div>
      <div class="ss-blocked-shield">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="80" height="80">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 class="ss-blocked-title">${ssT('accessDenied', ssLang)}</h1>
      <div class="ss-blocked-domain">${domain}</div>
      <p class="ss-blocked-msg">${ssT('siteBlocked', ssLang)}</p>
      <div class="ss-blocked-details">
        <div class="ss-blocked-detail-item">
          <span>🚫</span> ${ssT('maliciousFiles', ssLang)}
        </div>
        <div class="ss-blocked-detail-item">
          <span>🛡️</span> ${ssT('deviceProtected', ssLang)}
        </div>
        <div class="ss-blocked-detail-item">
          <span>⚠️</span> ${ssT('doNotBypass', ssLang)}
        </div>
      </div>
      <div class="ss-blocked-footer">
        ${ssT('protectedBy', ssLang)}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('ss-blocked-visible'), 50);
}


// ═══════════════════════════════════════════════════════════════
// 🔍 DARK PATTERN DETECTOR
// Scans page DOM for manipulative UI patterns and highlights them
// ═══════════════════════════════════════════════════════════════

const DARK_PATTERN_RULES = [
  {
    id: 'urgency',
    name: 'Fake Urgency / Scarcity',
    icon: '⏰',
    patterns: [
      /only \d+ left/i,
      /limited (time|stock|offer|quantity)/i,
      /offer ends in/i,
      /hurry[,!]?\s*(up)?/i,
      /act (now|fast|quickly)/i,
      /don'?t miss (out|this)/i,
      /selling (fast|out)/i,
      /last chance/i,
      /expires? (soon|today|in \d)/i,
      /\d+ (people|others|users) (are )?(viewing|watching|buying)/i,
      /flash sale/i,
      /today only/i,
      /while (supplies|stocks?) last/i,
      /ending soon/i,
      /almost gone/i,
      /going fast/i,
      /before it'?s? (too late|gone)/i,
    ],
    description: 'This creates artificial urgency to pressure you into a quick decision.',
  },
  {
    id: 'guilt',
    name: 'Guilt Tripping',
    icon: '😢',
    patterns: [
      /no thanks?,?\s*i\s*(don'?t|do not)\s*(want|like|need|care)/i,
      /i('?d)?\s*rather\s*(not|stay|keep|remain)/i,
      /no,?\s*i('?ll)?\s*(miss out|pass|skip|lose)/i,
      /i\s*(hate|dislike)\s*(saving|deals|money|discounts)/i,
      /continue (without|unprotected)/i,
      /remind me never/i,
      /i don'?t (care|value) (about )?(my|safety|security|savings)/i,
      /no,?\s*i\s*(prefer|enjoy)\s*(paying|full price|risk)/i,
    ],
    description: 'This uses shame or guilt to manipulate you into clicking the "right" option.',
  },
  {
    id: 'preselected',
    name: 'Pre-ticked Checkbox',
    icon: '☑️',
    selector: 'input[type="checkbox"][checked], input[type="checkbox"]:checked',
    labelPatterns: [
      /share\s*(my)?\s*(data|info|information|email)/i,
      /subscribe/i,
      /newsletter/i,
      /receive\s*(promotional|marketing|special)/i,
      /agree\s*to\s*(receive|share|send)/i,
      /opt[\s-]?in/i,
      /sign[\s-]?up.*offers/i,
      /partners/i,
      /third[\s-]?part(y|ies)/i,
      /promotional/i,
      /I agree to receive/i,
      /send me/i,
    ],
    description: 'This checkbox was pre-selected to trick you into sharing data or subscribing.',
  },
  {
    id: 'hidden',
    name: 'Hidden Cancel / Unsubscribe',
    icon: '🔍',
    description: 'Cancel or unsubscribe options are intentionally made hard to find.',
  },
  {
    id: 'countdown',
    name: 'Fake Countdown Timer',
    icon: '⏱️',
    description: 'This timer may be fake — it often resets on refresh to create false urgency.',
  },
];

function scanForDarkPatterns() {
  if (window.location.protocol === 'chrome-extension:' || window.location.protocol === 'chrome:') return;
  if (document.body && document.body.innerText.length < 200) return;
  if (document.getElementById('ss-dp-badge')) return;

  const detectedPatterns = [];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const textElements = [];
  let textNode;
  while ((textNode = walker.nextNode())) {
    const text = textNode.textContent.trim();
    if (text.length > 3 && text.length < 500) {
      const parent = textNode.parentElement;
      if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'META'].includes(parent.tagName)) {
        textElements.push({ text, parent });
      }
    }
  }

  // 1. URGENCY
  const urgencyRule = DARK_PATTERN_RULES.find(r => r.id === 'urgency');
  textElements.forEach(({ text, parent }) => {
    for (const pattern of urgencyRule.patterns) {
      if (pattern.test(text) && !parent.closest('#sentinel-shield-wrapper') && !parent.closest('.ss-dp-tooltip')) {
        detectedPatterns.push({ type: urgencyRule, element: parent, match: text.substring(0, 60) });
        break;
      }
    }
  });

  // 2. GUILT TRIPPING
  const guiltRule = DARK_PATTERN_RULES.find(r => r.id === 'guilt');
  textElements.forEach(({ text, parent }) => {
    for (const pattern of guiltRule.patterns) {
      if (pattern.test(text) && !parent.closest('#sentinel-shield-wrapper') && !parent.closest('.ss-dp-tooltip')) {
        detectedPatterns.push({ type: guiltRule, element: parent, match: text.substring(0, 60) });
        break;
      }
    }
  });

  // 3. PRE-TICKED CHECKBOXES
  const preselectedRule = DARK_PATTERN_RULES.find(r => r.id === 'preselected');
  document.querySelectorAll(preselectedRule.selector).forEach(checkbox => {
    const label = checkbox.closest('label') || (checkbox.id && document.querySelector(`label[for="${checkbox.id}"]`));
    const textToCheck = (label ? label.textContent : checkbox.parentElement?.textContent || '').trim();
    if (preselectedRule.labelPatterns.some(p => p.test(textToCheck))) {
      detectedPatterns.push({
        type: preselectedRule,
        element: label || checkbox.parentElement || checkbox,
        match: textToCheck.substring(0, 80),
      });
    }
  });

  // 4. HIDDEN CANCEL/UNSUBSCRIBE
  const hiddenRule = DARK_PATTERN_RULES.find(r => r.id === 'hidden');
  document.querySelectorAll('a, button').forEach(el => {
    const text = el.textContent.trim().toLowerCase();
    if (/(unsubscribe|cancel|opt[\s-]?out|remove|deactivate)/.test(text)) {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const opacity = parseFloat(style.opacity);
      if (fontSize < 10 || opacity < 0.5) {
        detectedPatterns.push({ type: hiddenRule, element: el, match: text.substring(0, 60) });
      }
    }
  });

  // 5. FAKE COUNTDOWN TIMERS
  const countdownRule = DARK_PATTERN_RULES.find(r => r.id === 'countdown');
  textElements.forEach(({ text, parent }) => {
    if (/\d{1,2}:\d{2}(:\d{2})?/.test(text) || /\d+\s*(min|sec|hour|hr)s?\s*(and\s*)?\d*/i.test(text)) {
      const nearbyText = parent.parentElement?.textContent || '';
      if (/(offer|deal|sale|discount|expires?|ends?|left|hurry|limited)/i.test(nearbyText)) {
        if (!parent.closest('#sentinel-shield-wrapper') && !parent.closest('.ss-dp-tooltip')) {
          detectedPatterns.push({ type: countdownRule, element: parent, match: text.substring(0, 40) });
        }
      }
    }
  });

  // Deduplicate
  const seen = new Set();
  const unique = detectedPatterns.filter(p => {
    const key = (p.element.outerHTML || '').substring(0, 100) + p.type.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length === 0) return;

  // Highlight detected patterns
  unique.forEach((dp, idx) => {
    try {
      dp.element.classList.add('ss-dp-highlight');

      const tooltip = document.createElement('div');
      tooltip.className = 'ss-dp-tooltip';
      tooltip.innerHTML = `
        <div class="ss-dp-tooltip-icon">${dp.type.icon}</div>
        <div class="ss-dp-tooltip-content">
          <div class="ss-dp-tooltip-title">${dp.type.name}</div>
          <div class="ss-dp-tooltip-desc">${dp.type.description}</div>
        </div>
      `;

      const pos = window.getComputedStyle(dp.element).position;
      if (pos === 'static') dp.element.style.position = 'relative';
      dp.element.appendChild(tooltip);
    } catch (e) { /* skip read-only elements */ }
  });

  // Floating Summary Badge
  const badge = document.createElement('div');
  badge.id = 'ss-dp-badge';
  badge.className = 'ss-dp-badge';

  const categoryCounts = {};
  unique.forEach(dp => { categoryCounts[dp.type.name] = (categoryCounts[dp.type.name] || 0) + 1; });
  const breakdownHtml = Object.entries(categoryCounts)
    .map(([name, count]) => `<div class="ss-dp-badge-item">${name}: <strong>${count}</strong></div>`)
    .join('');

  badge.innerHTML = `
    <div class="ss-dp-badge-header" id="ss-dp-header">
      <span class="ss-dp-badge-icon">🔍</span>
      <span class="ss-dp-badge-title">${ssT('darkPatternsFound', ssLang)}</span>
      <span class="ss-dp-badge-count">${unique.length}</span>
      <button id="ss-dp-badge-close" class="ss-dp-badge-close">&times;</button>
    </div>
    <div class="ss-dp-badge-body" id="ss-dp-badge-body" style="display:none;">
      ${breakdownHtml}
      <div class="ss-dp-badge-footer">${ssT('highlightedOnPage', ssLang)}</div>
    </div>
  `;
  document.body.appendChild(badge);

  document.getElementById('ss-dp-header').addEventListener('click', (e) => {
    if (e.target.id === 'ss-dp-badge-close') return;
    const body = document.getElementById('ss-dp-badge-body');
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('ss-dp-badge-close').addEventListener('click', (e) => {
    e.stopPropagation();
    badge.remove();
    document.querySelectorAll('.ss-dp-highlight').forEach(el => {
      el.classList.remove('ss-dp-highlight');
      el.querySelectorAll('.ss-dp-tooltip').forEach(t => t.remove());
    });
  });

  setTimeout(() => badge.classList.add('ss-dp-visible'), 200);
}

// Run scanner after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(scanForDarkPatterns, 2000));
} else {
  setTimeout(scanForDarkPatterns, 2000);
}

// Re-scan on major DOM changes (for SPAs)
let dpScanTimeout;
const dpObserver = new MutationObserver(() => {
  clearTimeout(dpScanTimeout);
  dpScanTimeout = setTimeout(() => {
    if (!document.getElementById('ss-dp-badge')) {
      scanForDarkPatterns();
    }
  }, 5000);
});
dpObserver.observe(document.documentElement, { childList: true, subtree: true });
