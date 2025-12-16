// ================================
// macOS Dock
// Dock con iconos de apps
// ================================

(function() {
    'use strict';

    // ================================
    // DOM Elements
    // ================================
    let dockContainer = null;
    let dockProfile = null;
    let dockTerminal = null;
    let terminalPanel = null;
    let panelOutput = null;
    let panelInput = null;

    // Window Manager instance
    let terminalWindowManager = null;

    // ================================
    // Terminal State
    // ================================
    let panelCommandHistory = [];
    let panelHistoryIndex = -1;
    const MAX_HISTORY = 50;

    // ================================
    // Initialize
    // ================================
    function init() {
        dockContainer = document.getElementById('dock-container');
        dockProfile = document.getElementById('dock-profile');
        dockTerminal = document.getElementById('dock-terminal');

        createTerminalPanel();
        attachEventListeners();
        waitForLoginComplete();
    }

    // ================================
    // Wait for Login
    // ================================
    function waitForLoginComplete() {
        const loginScreen = document.getElementById('login-screen');

        if (!loginScreen) {
            showDock();
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.id === 'login-screen') {
                        observer.disconnect();
                        setTimeout(showDock, 300);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true });
    }

    // ================================
    // Show Dock
    // ================================
    function showDock() {
        if (dockContainer) {
            dockContainer.classList.add('visible');
            // Profile esta activo por defecto
            dockProfile.classList.add('active');
        }
    }

    // ================================
    // Create Terminal Panel
    // ================================
    function createTerminalPanel() {
        terminalPanel = document.createElement('div');
        terminalPanel.className = 'terminal-panel';
        terminalPanel.id = 'terminal-panel';
        terminalPanel.innerHTML = `
            <div class="terminal-panel-titlebar">
                <div class="traffic-lights">
                    <span class="light red" id="panel-close"></span>
                    <span class="light yellow" id="panel-minimize"></span>
                    <span class="light green" id="panel-maximize"></span>
                </div>
                <span class="terminal-panel-title">pablo@portfolio — terminal</span>
            </div>
            <div class="terminal-panel-content">
                <div class="panel-output" id="panel-output">
                    <div class="panel-line">
                        <span class="output-text">Welcome to interactive portfolio!</span>
                    </div>
                    <div class="panel-line">
                        <span class="output-text">Type <span class="cmd-highlight">help</span> to see available commands.</span>
                    </div>
                    <div class="panel-line">
                        <span class="output-text">&nbsp;</span>
                    </div>
                </div>
                <div class="panel-input-line">
                    <span class="prompt">pablo@portfolio:~$</span>
                    <input type="text" id="panel-input" autocomplete="off" spellcheck="false" aria-label="Terminal command input">
                </div>
            </div>
        `;

        document.body.appendChild(terminalPanel);
        panelOutput = document.getElementById('panel-output');
        panelInput = document.getElementById('panel-input');
    }

    // ================================
    // Event Listeners
    // ================================
    function attachEventListeners() {
        // Dock Profile click - restaurar ventana
        dockProfile.addEventListener('click', () => {
            // Use global profileWindowManager from index.js
            if (typeof profileWindowManager !== 'undefined' && profileWindowManager) {
                profileWindowManager.restore();
            }
            dockProfile.classList.add('active');
        });

        // Dock Terminal click - abrir terminal
        dockTerminal.addEventListener('click', () => {
            openTerminal();
        });

        // Close with Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && terminalPanel.classList.contains('active')) {
                closeTerminal();
            }
        });

        // Terminal input
        panelInput.addEventListener('keydown', handlePanelInput);

        // Initialize Window Manager for terminal
        initTerminalWindow();
    }

    // ================================
    // Terminal Window Manager
    // ================================
    function initTerminalWindow() {
        const titlebar = terminalPanel.querySelector('.terminal-panel-titlebar');
        const lights = terminalPanel.querySelectorAll('.light');

        terminalWindowManager = new WindowManager({
            element: terminalPanel,
            titlebar: titlebar,
            preventDragOn: ['.traffic-lights'],
            trafficLights: {
                close: lights[0],
                minimize: lights[1],
                maximize: lights[2]
            },
            onClose: () => {
                // Reset position on close
                terminalWindowManager.resetPosition();
                terminalPanel.classList.remove('active');
                dockTerminal.classList.remove('active');
            },
            onMinimize: () => {
                // No dock update needed for minimize
            },
            onMaximize: () => {
                panelInput.focus();
            },
            onRestore: () => {
                panelInput.focus();
            }
        });
    }

    // ================================
    // Terminal Open/Close
    // ================================
    function openTerminal() {
        if (terminalWindowManager && terminalWindowManager.isMinimized()) {
            terminalWindowManager.restore();
        }
        terminalPanel.classList.add('active');
        dockTerminal.classList.add('active');
        // Delay focus to ensure panel is visible after CSS transition
        setTimeout(() => panelInput.focus(), 50);
    }

    function closeTerminal() {
        if (terminalWindowManager) {
            terminalWindowManager.close();
        }
    }

    // ================================
    // Terminal Input
    // ================================
    function handlePanelInput(e) {
        if (e.key === 'Enter') {
            processCommand(panelInput.value);
            panelInput.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (panelHistoryIndex > 0) {
                panelHistoryIndex--;
                panelInput.value = panelCommandHistory[panelHistoryIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (panelHistoryIndex < panelCommandHistory.length - 1) {
                panelHistoryIndex++;
                panelInput.value = panelCommandHistory[panelHistoryIndex];
            } else {
                panelHistoryIndex = panelCommandHistory.length;
                panelInput.value = '';
            }
        }
    }

    function processCommand(input) {
        const cmd = input.trim().toLowerCase();
        if (cmd === '') return;

        panelCommandHistory.push(input);
        if (panelCommandHistory.length > MAX_HISTORY) {
            panelCommandHistory.shift();
        }
        panelHistoryIndex = panelCommandHistory.length;

        addLine(`<span class="output-prompt">pablo@portfolio:~$</span> <span class="output-command">${escapeHtml(input)}</span>`);

        const commands = getCommands();
        if (commands[cmd]) {
            const output = commands[cmd]();
            if (output) addLine(output);
        } else {
            addLine(`<span class="output-error">Command not found: ${escapeHtml(cmd)}</span>\nType <span class="cmd-highlight">help</span> for available commands.`);
        }

        addLine('&nbsp;');
    }

    function addLine(html) {
        const line = document.createElement('div');
        line.className = 'panel-line';
        line.innerHTML = `<span class="output-text">${html}</span>`;
        panelOutput.appendChild(line);
        panelOutput.scrollTop = panelOutput.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatAsTree(items, indent = '  ') {
        return items.map((item, i) => {
            const isLast = i === items.length - 1;
            const branch = isLast ? '└──' : '├──';
            return `${indent}${branch} ${item}`;
        }).join('\n');
    }

    // ================================
    // Commands
    // ================================
    function getCommands() {
        const data = typeof portfolioData !== 'undefined' ? portfolioData : {};

        return {
            help: () => `
<span class="output-title">Available Commands:</span>

  <span class="cmd-highlight">about</span>      - About me
  <span class="cmd-highlight">skills</span>     - Technical skills
  <span class="cmd-highlight">experience</span> - Work experience
  <span class="cmd-highlight">education</span>  - Education & certifications
  <span class="cmd-highlight">contact</span>    - Contact information
  <span class="cmd-highlight">clear</span>      - Clear terminal
  <span class="cmd-highlight">help</span>       - Show this help message
`,
            about: () => {
                const { profile } = data;
                if (!profile) return '<span class="output-error">Data not available</span>';
                return `
<span class="output-title">${profile.name}</span>
<span class="output-subtitle">${profile.title} | ${profile.location}</span>

${profile.bio}
`;
            },
            skills: () => {
                const { skills } = data;
                if (!skills) return '<span class="output-error">Data not available</span>';
                let output = '\n<span class="output-title">Technical Skills</span>\n';
                for (const [category, items] of Object.entries(skills)) {
                    output += `\n<span class="output-subtitle">${category}:</span>\n`;
                    output += formatAsTree(items) + '\n';
                }
                return output;
            },
            experience: () => {
                const { experience } = data;
                if (!experience) return '<span class="output-error">Data not available</span>';
                let output = '\n<span class="output-title">Professional Experience</span>\n';
                experience.forEach(job => {
                    output += `\n<span class="output-subtitle">${job.company}</span> <span class="output-muted">(${job.tenure})</span>\n`;
                    job.roles.forEach(role => {
                        output += `\n  <span class="output-text">${role.title}</span> <span class="output-muted">| ${role.period}</span>\n`;
                        output += formatAsTree(role.responsibilities, '    ') + '\n';
                    });
                });
                return output;
            },
            education: () => {
                const { education, certifications } = data;
                if (!education) return '<span class="output-error">Data not available</span>';
                let output = '\n<span class="output-title">Education</span>\n';
                const eduItems = education.map(edu =>
                    `${edu.institution} - ${edu.degree} <span class="output-muted">(${edu.period})</span>`
                );
                output += formatAsTree(eduItems) + '\n';
                if (certifications) {
                    output += '\n<span class="output-title">Certifications</span>\n';
                    output += formatAsTree(certifications);
                }
                return output;
            },
            contact: () => {
                const { contact } = data;
                if (!contact) return '<span class="output-error">Data not available</span>';
                return `
<span class="output-title">Contact</span>

  LinkedIn: <a href="${contact.linkedin.url}" target="_blank" rel="noopener noreferrer">${contact.linkedin.display}</a>
`;
            },
            clear: () => {
                panelOutput.innerHTML = '';
                return null;
            }
        };
    }

    // ================================
    // Start
    // ================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
