// ================================
// Login Screen - Pablo Lagger
// Login manager (macOS Sequoia style)
// ================================

// Login Manager (macOS Sequoia style)
(function() {
    const PASSWORD = 'pablo';

    const loginScreen = document.getElementById('login-screen');
    const loginTime = document.getElementById('login-time');
    const loginDate = document.getElementById('login-date');
    const passwordInput = document.getElementById('password-input');
    const passwordPill = document.getElementById('password-pill');
    const rememberCheckbox = document.getElementById('remember-me');

    // Store interval ID for cleanup
    let clockIntervalId = null;

    // Always initialize starfield as global background
    Starfield.init('starfield');

    // Check if user chose to be remembered OR mobile device - skip login
    const isMobile = window.innerWidth <= 768;
    if (localStorage.getItem('rememberLogin') || isMobile) {
        loginScreen?.remove();
        document.querySelector('.iterm-window')?.classList.add('visible');
        return; // Exit early, skip login screen
    }

    function updateClock() {
        const now = new Date();
        loginTime.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: false
        });
        loginDate.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric'
        });
    }

    function tryLogin() {
        if (!passwordInput.value) return;

        if (passwordInput.value.toLowerCase() === PASSWORD) {
            // Save remember preference
            if (rememberCheckbox?.checked) {
                localStorage.setItem('rememberLogin', 'true');
            }

            // 1. Ocultar password row y remember checkbox
            document.querySelector('.login-password-row').style.display = 'none';
            document.querySelector('.login-remember').style.display = 'none';

            // 2. Mostrar loading spinner
            document.getElementById('login-loading').classList.add('visible');

            // 3. Después de 1.5s, transición a terminal
            setTimeout(() => {
                loginScreen.classList.add('hidden');
                document.querySelector('.iterm-window').classList.add('visible');

                // Remove login screen after animation (canvas keeps running)
                setTimeout(() => {
                    // Cleanup clock interval to prevent memory leak
                    if (clockIntervalId) {
                        clearInterval(clockIntervalId);
                        clockIntervalId = null;
                    }
                    loginScreen.remove();
                }, 500);
            }, 1500);
        } else {
            passwordPill.classList.add('shake');
            passwordInput.value = '';
            setTimeout(() => {
                passwordPill.classList.remove('shake');
                passwordInput.focus();
            }, 400);
        }
    }

    updateClock();
    clockIntervalId = setInterval(updateClock, 1000);
    setTimeout(() => passwordInput?.focus(), 100);

    passwordInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryLogin();
    });
})();
