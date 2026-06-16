// --- Global State ---
let feedData = null; // Store fetched data
let currentFilter = 'all';
let searchQuery = '';

// --- DOM Elements ---
const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
const exportCsvBtn = document.getElementById('export-csv-btn');
const refreshBtn = document.getElementById('refresh-btn');
const spinnerIcon = document.getElementById('spinner-icon');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const filterTabs = document.querySelectorAll('.filter-tab');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const emptyState = document.getElementById('empty-state');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const notesTimeline = document.getElementById('notes-timeline');

// Tweet Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const tweetPreviewText = document.getElementById('tweet-preview-text');
const charCount = document.getElementById('char-count');
const charWarning = document.getElementById('char-warning');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const copyBtnText = document.getElementById('copy-btn-text');
const shareTweetBtn = document.getElementById('share-tweet-btn');
const toast = document.getElementById('toast');

// --- Toast Utility ---
function showToast(message) {
    toast.querySelector('span').textContent = message;
    toast.className = 'toast show';
    setTimeout(() => {
        toast.className = 'toast';
    }, 2000);
}

// --- Theme Management ---
const darkThemeVariables = {
    '--bg-primary': '#080c16',
    '--bg-secondary': '#0f172a',
    '--bg-card': '#151f32',
    '--bg-header': 'rgba(15, 23, 42, 0.8)',
    '--text-primary': '#f8fafc',
    '--text-secondary': '#94a3b8',
    '--border-color': 'rgba(255, 255, 255, 0.07)',
    '--border-color-hover': 'rgba(255, 255, 255, 0.15)',
    '--card-shadow': '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(255, 255, 255, 0.02)',
    '--input-bg': '#0f172a',
    '--modal-bg': 'rgba(21, 31, 50, 0.9)',
    '--modal-backdrop': 'rgba(4, 7, 15, 0.8)',
    '--glow-opacity': '0.15',
    '--x-bg': '#000000',
    '--x-border': '#2f3336',
    '--x-text': '#e7e9ea',
    '--x-text-muted': '#71767b'
};

const lightThemeVariables = {
    '--bg-primary': '#f8fafc',
    '--bg-secondary': '#f1f5f9',
    '--bg-card': '#ffffff',
    '--bg-header': 'rgba(255, 255, 255, 0.8)',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--border-color': 'rgba(0, 0, 0, 0.08)',
    '--border-color-hover': 'rgba(0, 0, 0, 0.15)',
    '--card-shadow': '0 8px 30px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)',
    '--input-bg': '#ffffff',
    '--modal-bg': 'rgba(255, 255, 255, 0.9)',
    '--modal-backdrop': 'rgba(15, 23, 42, 0.5)',
    '--glow-opacity': '0.05',
    '--x-bg': '#ffffff',
    '--x-border': '#eff3f4',
    '--x-text': '#0f172a',
    '--x-text-muted': '#536471'
};

function applyTheme(themeName) {
    const variables = themeName === 'light' ? lightThemeVariables : darkThemeVariables;
    for (const [key, value] of Object.entries(variables)) {
        document.documentElement.style.setProperty(key, value);
    }
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    
    if (themeToggleCheckbox) {
        themeToggleCheckbox.checked = (themeName === 'light');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
}

themeToggleCheckbox.addEventListener('change', (e) => {
    const newTheme = e.target.checked ? 'light' : 'dark';
    applyTheme(newTheme);
});

// --- API Fetch ---
async function fetchReleaseNotes() {
    // Show loading UI
    loadingState.style.display = 'block';
    notesTimeline.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    spinnerIcon.classList.add('spinning');
    refreshBtn.disabled = true;

    try {
        const response = await fetch('/api/release-notes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        feedData = await response.json();
        renderTimeline();
    } catch (error) {
        console.error('Fetch error:', error);
        errorMessage.textContent = error.message || 'Failed to fetch the BigQuery release notes feed.';
        errorState.style.display = 'flex';
        loadingState.style.display = 'none';
    } finally {
        spinnerIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// --- Filtering Logic ---
function getFilteredData() {
    if (!feedData || !feedData.entries) return [];

    const query = searchQuery.toLowerCase().trim();
    
    // Map entries and filter their sub-items
    return feedData.entries.map(entry => {
        const filteredItems = entry.items.filter(item => {
            // Check Type filter
            const matchesType = (currentFilter === 'all') || 
                                (item.type.toLowerCase() === currentFilter.toLowerCase());
            
            // Check Search query
            const matchesSearch = !query || 
                                 item.type.toLowerCase().includes(query) || 
                                 item.text_content.toLowerCase().includes(query) ||
                                 entry.title.toLowerCase().includes(query);
            
            return matchesType && matchesSearch;
        });

        // Only return the entry if it contains matching items
        return {
            ...entry,
            items: filteredItems
        };
    }).filter(entry => entry.items.length > 0);
}

// --- Render Timeline ---
function renderTimeline() {
    const filteredEntries = getFilteredData();
    
    loadingState.style.display = 'none';
    
    if (filteredEntries.length === 0) {
        notesTimeline.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';
    notesTimeline.style.display = 'block';
    notesTimeline.innerHTML = '';

    filteredEntries.forEach(entry => {
        const entryGroup = document.createElement('div');
        entryGroup.className = 'date-entry-group';

        // Header (Date and Link)
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        
        const dateTitle = document.createElement('h2');
        dateTitle.className = 'date-title';
        dateTitle.textContent = entry.title;
        
        const dateLink = document.createElement('a');
        dateLink.className = 'date-link';
        dateLink.href = entry.link;
        dateLink.target = '_blank';
        dateLink.rel = 'noopener noreferrer';
        dateLink.title = 'View official release notes';
        dateLink.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
        `;
        
        dateHeader.appendChild(dateTitle);
        dateHeader.appendChild(dateLink);
        entryGroup.appendChild(dateHeader);

        // Render each update item under this date
        entry.items.forEach(item => {
            const card = document.createElement('div');
            // Classify cards for styling borders (e.g. type-feature, type-issue)
            const typeClass = `type-${item.type.toLowerCase()}`;
            card.className = `note-item-card ${typeClass}`;

            // Header (Badge)
            const cardHeader = document.createElement('div');
            cardHeader.className = 'note-card-header';
            
            const badge = document.createElement('span');
            badge.className = 'type-badge';
            badge.textContent = item.type;
            
            cardHeader.appendChild(badge);
            card.appendChild(cardHeader);

            // Body content
            const cardBody = document.createElement('div');
            cardBody.className = 'note-card-body';
            cardBody.innerHTML = item.content;
            card.appendChild(cardBody);

            // Footer (Copy and Tweet buttons)
            const cardFooter = document.createElement('div');
            cardFooter.className = 'note-card-footer';
            
            // Copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn-copy-card';
            copyBtn.title = 'Copy this update to clipboard';
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
            `;
            copyBtn.addEventListener('click', async () => {
                const textToCopy = `[${item.type}] ${item.text_content}`;
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    const span = copyBtn.querySelector('span');
                    span.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    showToast('Copied update to clipboard!');
                    setTimeout(() => {
                        span.textContent = 'Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy card content:', err);
                }
            });
            
            const tweetBtn = document.createElement('button');
            tweetBtn.className = 'btn-tweet-share';
            tweetBtn.title = 'Tweet this update';
            tweetBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Tweet</span>
            `;
            
            tweetBtn.addEventListener('click', () => openTweetModal(item, entry.title, entry.link));
            
            cardFooter.appendChild(copyBtn);
            cardFooter.appendChild(tweetBtn);
            card.appendChild(cardFooter);

            entryGroup.appendChild(card);
        });

        notesTimeline.appendChild(entryGroup);
    });
}

// --- Tweet Generation & Modal ---
let activeTweetText = '';

function generateDefaultTweet(item, dateTitle, link) {
    const header = `Google Cloud BigQuery Update (${dateTitle})\n[${item.type}]: `;
    const footer = `\n\nRead more: ${link} #GoogleCloud #BigQuery`;
    
    // Compute character limits (280 standard limit for Twitter)
    const maxLen = 280;
    const reservedLen = header.length + footer.length;
    const availableLen = maxLen - reservedLen;
    
    let content = item.text_content;
    
    if (content.length > availableLen) {
        // Truncate text content if it exceeds the limit
        content = content.substring(0, availableLen - 3) + "...";
    }
    
    return `${header}${content}${footer}`;
}

function openTweetModal(item, dateTitle, link) {
    activeTweetText = generateDefaultTweet(item, dateTitle, link);
    tweetTextarea.value = activeTweetText;
    updateTweetPreview();
    
    // Show modal with transition
    tweetModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Stop background scrolling
}

function closeTweetModal() {
    tweetModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore background scrolling
}

function updateTweetPreview() {
    const text = tweetTextarea.value;
    tweetPreviewText.textContent = text;
    
    const count = text.length;
    charCount.textContent = count;
    
    if (count > 280) {
        charCount.classList.add('warning');
        charWarning.style.display = 'block';
    } else {
        charCount.classList.remove('warning');
        charWarning.style.display = 'none';
    }
}

// Update preview during typing
tweetTextarea.addEventListener('input', updateTweetPreview);

// Copy Tweet Text
copyTweetBtn.addEventListener('click', async () => {
    const text = tweetTextarea.value;
    try {
        await navigator.clipboard.writeText(text);
        
        // Show Toast
        toast.querySelector('span').textContent = 'Copied to clipboard!';
        toast.className = 'toast show';
        
        // Temporarily change button state
        copyBtnText.textContent = 'Copied!';
        const copyIcon = copyTweetBtn.querySelector('svg');
        const oldSVG = copyIcon.innerHTML;
        // Checkmark svg path
        copyIcon.innerHTML = `<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        
        setTimeout(() => {
            toast.className = 'toast';
            copyBtnText.textContent = 'Copy Post';
            copyIcon.innerHTML = oldSVG;
        }, 2000);
        
    } catch (err) {
        console.error('Clipboard copy failed:', err);
    }
});

// Share on X (Twitter) Web Intent
shareTweetBtn.addEventListener('click', () => {
    const text = tweetTextarea.value;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeTweetModal();
});

// Close Modal Events
closeModalBtn.addEventListener('click', closeTweetModal);
tweetModal.addEventListener('click', (e) => {
    if (e.target === tweetModal) {
        closeTweetModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tweetModal.style.display === 'flex') {
        closeTweetModal();
    }
});

// --- Search and Filters Event Listeners ---
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery) {
        clearSearchBtn.style.display = 'block';
    } else {
        clearSearchBtn.style.display = 'none';
    }
    renderTimeline();
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderTimeline();
    searchInput.focus();
});

filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        filterTabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        
        currentFilter = tab.getAttribute('data-filter');
        renderTimeline();
    });
});

resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    
    filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        if (t.getAttribute('data-filter') === 'all') {
            t.classList.add('active');
            t.setAttribute('aria-selected', 'true');
        }
    });
    
    currentFilter = 'all';
    renderTimeline();
});

retryBtn.addEventListener('click', fetchReleaseNotes);
refreshBtn.addEventListener('click', fetchReleaseNotes);
exportCsvBtn.addEventListener('click', exportToCSV);

// --- Export CSV Logic ---
function exportToCSV() {
    const filteredEntries = getFilteredData();
    if (!filteredEntries || filteredEntries.length === 0) {
        showToast('No data to export!');
        return;
    }

    // CSV Headers
    const rows = [['Date', 'Link', 'Type', 'Content']];

    // Populate rows
    filteredEntries.forEach(entry => {
        entry.items.forEach(item => {
            rows.push([
                entry.title,
                entry.link,
                item.type,
                item.text_content
            ]);
        });
    });

    // Build CSV string
    const csvContent = rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\r\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_release_notes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Exported CSV!');
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchReleaseNotes();
});
