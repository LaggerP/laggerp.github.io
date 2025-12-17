// ================================
// Menubar - macOS Style
// Theme toggle + Clock
// ================================

(function() {
    'use strict';

    // ================================
    // Constants
    // ================================
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';

    // ================================
    // State
    // ================================
    let menubarContainer = null;
    let menubarClock = null;
    let menubarThemeToggle = null;
    let clockIntervalId = null;
    let userOverride = false; // True if user manually changed theme this session

    // ================================
    // Theme Management
    // ================================
    function getSystemPreference() {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            return THEME_LIGHT;
        }
        return THEME_DARK;
    }

    function getCurrentTheme() {
        const html = document.documentElement;
        return html.getAttribute('data-theme') === 'light' ? THEME_LIGHT : THEME_DARK;
    }

    function applyTheme(theme) {
        const html = document.documentElement;

        if (theme === THEME_LIGHT) {
            html.setAttribute('data-theme', 'light');
        } else {
            html.removeAttribute('data-theme');
        }

        updateThemeIcon(theme);
    }

    function toggleTheme() {
        userOverride = true; // User manually changed, stop following system
        const current = getCurrentTheme();
        const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        applyTheme(next);
    }

    function updateThemeIcon(theme) {
        if (!menubarThemeToggle) return;

        const icon = menubarThemeToggle.querySelector('.menubar-icon');
        if (!icon) return;

        // Show sun in dark mode (click to go light), moon in light mode (click to go dark)
        if (theme === THEME_DARK) {
            // Sun icon
            icon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>`;
        } else {
            // Moon icon
            icon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>`;
        }
    }

    // ================================
    // Clock
    // ================================
    function updateClock() {
        if (!menubarClock) return;

        const now = new Date();
        const time = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const date = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        menubarClock.textContent = `${date}  ${time}`;
    }

    function startClock() {
        updateClock();
        if (clockIntervalId) clearInterval(clockIntervalId);
        clockIntervalId = setInterval(updateClock, 1000);
    }

    function stopClock() {
        if (clockIntervalId) {
            clearInterval(clockIntervalId);
            clockIntervalId = null;
        }
    }

    // ================================
    // Create Menubar DOM
    // ================================
    function createMenubar() {
        menubarContainer = document.createElement('div');
        menubarContainer.className = 'menubar-container';
        menubarContainer.innerHTML = `
            <div class="menubar">
                <div class="menubar-left">
                    <svg class="menubar-logo" viewBox="0 0 100 120" fill="currentColor" aria-label="Pear logo">
                        <!-- Stem -->
                        <path d="M50 0 C50 0, 48 8, 50 18 C51 22, 54 26, 54 26 C54 26, 52 18, 51 10 C50.5 5, 50 0, 50 0Z"/>
                        <!-- Leaf -->
                        <path d="M54 12 C62 6, 78 8, 82 18 C85 26, 80 34, 70 34 C62 34, 54 26, 54 18 C54 14, 54 12, 54 12Z"/>
                        <!-- Pear body -->
                        <path d="M50 30 C32 30, 20 42, 16 56 C12 72, 14 90, 26 102 C36 112, 50 116, 50 116 C50 116, 64 112, 74 102 C86 90, 88 72, 84 56 C80 42, 68 30, 50 30Z"/>
                    </svg>
                    <span class="menubar-name">Profile</span>
                </div>
                <div class="menubar-center">
                    <span class="menubar-clock" id="menubar-clock">Loading...</span>
                </div>
                <div class="menubar-right">
                    <button class="menubar-theme-toggle" id="menubar-theme-toggle" aria-label="Toggle theme">
                        <span class="menubar-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="4"/>
                                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        `;

        document.body.insertBefore(menubarContainer, document.body.firstChild);
    }

    // ================================
    // Initialize Menubar
    // ================================
    function initMenubar() {
        // Only on desktop
        if (window.innerWidth <= 768) return;

        createMenubar();

        // Cache DOM references
        menubarClock = document.getElementById('menubar-clock');
        menubarThemeToggle = document.getElementById('menubar-theme-toggle');

        // Apply system theme preference
        const theme = getSystemPreference();
        applyTheme(theme);

        // Start clock
        startClock();

        // Theme toggle click handler
        if (menubarThemeToggle) {
            menubarThemeToggle.addEventListener('click', toggleTheme);
        }

        // Show menubar with animation
        requestAnimationFrame(() => {
            menubarContainer.classList.add('visible');
        });

        // Listen to system theme changes
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addEventListener('change', (e) => {
            // Only apply if user hasn't manually changed theme this session
            if (!userOverride) {
                const newTheme = e.matches ? THEME_DARK : THEME_LIGHT;
                applyTheme(newTheme);
            }
        });
    }

    // ================================
    // Wait for Login Complete
    // ================================
    function waitForLoginComplete() {
        const loginScreen = document.getElementById('login-screen');

        if (!loginScreen) {
            // Login already removed (mobile or remembered), init immediately
            initMenubar();
            return;
        }

        // Watch for login-screen removal
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.id === 'login-screen') {
                        observer.disconnect();
                        // Small delay for smooth transition
                        setTimeout(initMenubar, 300);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true });
    }

    // ================================
    // Cleanup
    // ================================
    window.addEventListener('beforeunload', () => {
        stopClock();
    });

    // ================================
    // Start
    // ================================
    function init() {
        waitForLoginComplete();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ================================
    // App Name Management
    // ================================
    let menubarName = null;

    function setActiveApp(appName) {
        if (!menubarName) {
            menubarName = document.querySelector('.menubar-name');
        }
        if (menubarName) {
            menubarName.textContent = appName;
        }
    }

    // ================================
    // Export API
    // ================================
    window.MenubarManager = {
        toggleTheme,
        getCurrentTheme,
        getSystemPreference,
        setActiveApp
    };
})();
