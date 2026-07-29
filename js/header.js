// Unified header for all pages
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = getCurrentPage();
    const headerElement = document.querySelector('header');
    const mainElement = document.querySelector('main');

    if (headerElement) {
        headerElement.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to content</a>
            <a href="index.html" class="logo" aria-label="Omega-Roll home">Omega-Roll</a>
            <nav aria-label="Primary">
                <a href="index.html" ${currentPage === 'index' ? 'class="active"' : ''}>Home</a>
                <a href="explore.html" ${currentPage === 'explore' ? 'class="active"' : ''}>Explore</a>
                <a href="search.html" ${currentPage === 'search' ? 'class="active"' : ''}>Search</a>
                <a href="genres.html" ${currentPage === 'genres' ? 'class="active"' : ''}>Genres</a>
                <a href="watch-later.html" ${currentPage === 'watch-later' ? 'class="active"' : ''}>Watch Later</a>
                <a href="about.html" ${currentPage === 'about' ? 'class="active"' : ''}>About</a>
            </nav>
            <div class="header-actions">
                <button type="button" class="header-action-btn" id="shortcut-help-btn" aria-expanded="false" aria-controls="shortcut-help">Shortcuts</button>
            </div>
            <div id="shortcut-help" class="shortcut-help" role="dialog" aria-label="Keyboard shortcuts"></div>
        `;
    }

    if (mainElement) {
        mainElement.id = mainElement.id || 'main-content';
        mainElement.setAttribute('tabindex', '-1');
    }

    attachKeyboardSupport();
});

function attachKeyboardSupport() {
    const helpButton = document.getElementById('shortcut-help-btn');
    const shortcutHelp = document.getElementById('shortcut-help');

    if (shortcutHelp) {
        shortcutHelp.innerHTML = `
            <strong>Keyboard shortcuts</strong>
            <ul>
                <li><kbd>/</kbd> focus search</li>
                <li><kbd>H</kbd> open Home</li>
                <li><kbd>E</kbd> open Explore</li>
                <li><kbd>S</kbd> open Search</li>
                <li><kbd>G</kbd> open Genres</li>
                <li><kbd>L</kbd> open Watch Later</li>
                <li><kbd>A</kbd> open About</li>
                <li><kbd>?</kbd> toggle this help</li>
            </ul>
        `;
    }

    const pageMap = {
        h: 'index.html',
        e: 'explore.html',
        s: 'search.html',
        g: 'genres.html',
        l: 'watch-later.html',
        a: 'about.html'
    };

    const isTypingTarget = (target) => {
        return !!target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable
        );
    };

    const focusSearch = () => {
        const searchField = document.querySelector('input[type="search"], .search-input, input[name="search"], #search-input, input[placeholder*="Search" i]');

        if (searchField) {
            searchField.focus();
            if (typeof searchField.select === 'function') {
                searchField.select();
            }
            return true;
        }

        return false;
    };

    const focusContent = () => {
        const mainContent = document.getElementById('main-content');

        if (mainContent) {
            mainContent.focus();
            return true;
        }

        return false;
    };

    const toggleShortcutHelp = (forceOpen) => {
        if (!shortcutHelp) return;

        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !shortcutHelp.classList.contains('open');
        shortcutHelp.classList.toggle('open', shouldOpen);

        if (helpButton) {
            helpButton.setAttribute('aria-expanded', String(shouldOpen));
        }
    };

    if (helpButton) {
        helpButton.addEventListener('click', () => toggleShortcutHelp());
    }

    document.addEventListener('keydown', (event) => {
        const target = event.target;
        const key = event.key;
        const lowerKey = key.toLowerCase();

        if (event.altKey || event.metaKey || event.ctrlKey) {
            return;
        }

        if (key === 'Escape') {
            if (shortcutHelp && shortcutHelp.classList.contains('open')) {
                event.preventDefault();
                toggleShortcutHelp(false);
            }
            return;
        }

        if (key === '?' || (event.shiftKey && lowerKey === '/')) {
            if (!isTypingTarget(target)) {
                event.preventDefault();
                toggleShortcutHelp();
            }
            return;
        }

        if (isTypingTarget(target) && !['/', '?'].includes(lowerKey)) {
            return;
        }

        if (lowerKey === 'c') {
            event.preventDefault();
            focusContent();
            return;
        }

        if (lowerKey === '/') {
            event.preventDefault();
            focusSearch();
            return;
        }

        const page = pageMap[lowerKey];
        if (page) {
            event.preventDefault();
            window.location.href = page;
        }
    });
}

function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';

    // Handle special cases
    if (filename === 'watch.html') return 'watch';
    if (filename === 'anime.html') return 'anime';
    if (filename === '' || filename === '/') return 'index';

    // Extract the page name from filename (remove .html)
    return filename.replace('.html', '');
}
