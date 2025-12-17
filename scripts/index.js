// ================================
// Terminal Portfolio - Pablo Lagger
// Data loaded from data.js
// ================================

// Profile window manager instance
let profileWindowManager = null;

// ================================
// DOM Cache - Pre-store references to avoid repeated queries
// ================================
const domCache = {
    desktop: {},
    mobile: {}
};

/**
 * Initialize DOM cache with all element references
 * Called once on DOMContentLoaded to avoid repeated getElementById calls
 */
function initDomCache() {
    // Desktop elements
    domCache.desktop = {
        name: document.getElementById('profile-name'),
        title: document.getElementById('profile-title'),
        location: document.getElementById('profile-location'),
        bio: document.getElementById('profile-bio'),
        skills: document.getElementById('skills-container'),
        experience: document.getElementById('experience-container'),
        education: document.getElementById('education-container'),
        certifications: document.getElementById('certifications-container'),
        contact: document.getElementById('contact-container')
    };

    // Mobile elements
    domCache.mobile = {
        name: document.getElementById('mobile-name'),
        title: document.getElementById('mobile-title'),
        location: document.getElementById('mobile-location'),
        bio: document.getElementById('mobile-bio'),
        skills: document.getElementById('mobile-skills'),
        experience: document.getElementById('mobile-experience'),
        education: document.getElementById('mobile-education'),
        certifications: document.getElementById('mobile-certifications'),
        contact: document.getElementById('mobile-contact')
    };
}

// ================================
// Render Helpers
// ================================

/**
 * Render a list of items to an element using a template function
 * @param {HTMLElement} element - Target element
 * @param {Array} items - Array of items to render
 * @param {Function} templateFn - Function that returns HTML string for each item
 */
function renderList(element, items, templateFn) {
    if (!element) return;
    element.innerHTML = items.map(templateFn).join('');
}

/**
 * Set text content of an element if it exists
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content
 */
function setText(element, text) {
    if (element) element.textContent = text;
}

// Initialize Profile Window using WindowManager
function initProfileWindow() {
    // No habilitar en móviles
    if (window.innerWidth <= 768) return;

    const windowEl = document.querySelector('.iterm-window');
    const titlebar = document.querySelector('.iterm-titlebar');
    const lights = document.querySelectorAll('.iterm-window .light');

    if (!windowEl || !titlebar) return;

    profileWindowManager = new WindowManager({
        element: windowEl,
        titlebar: titlebar,
        windowId: 'profile',
        preventDragOn: ['.traffic-lights'],
        trafficLights: {
            close: lights[0],
            minimize: lights[1],
            maximize: lights[2]
        },
        onClose: () => {
            // Position reset automatically by close()
            // Dock indicator updated automatically via window:close event
            // Update menubar - check if Terminal is active
            if (typeof MenubarManager !== 'undefined') {
                const terminalActive = document.querySelector('.terminal-panel.active');
                MenubarManager.setActiveApp(terminalActive ? 'Terminal' : 'Pablo Lagger');
            }
        },
        onMinimize: () => {
            // Position kept (not reset) - user expects window to restore where it was
            // Dock indicator stays active via window:minimize event
            // Update menubar - check if Terminal is active
            if (typeof MenubarManager !== 'undefined') {
                const terminalActive = document.querySelector('.terminal-panel.active');
                MenubarManager.setActiveApp(terminalActive ? 'Terminal' : 'Pablo Lagger');
            }
        },
        onRestore: () => {
            // Dock indicator updated automatically via window:restore event
            // Update menubar
            if (typeof MenubarManager !== 'undefined') {
                MenubarManager.setActiveApp('Profile');
            }
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Initialize profile window manager
    initProfileWindow();

    // Initialize DOM cache
    initDomCache();

    // Easter egg: Tuki meme
    console.log(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣶⠀⢀⣴⣶⡄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣞⣿⢠⡟⣿⣿⠇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣨⣿⣿⣼⣿⣟⠏⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⣀⣠⣤⣤⠶⠶⣿⣿⣿⢛⣿⣿⣿⣷⡟⠏⠿⡄⠀⠀⠀⠀
⠀⣀⣠⣤⣤⣼⣿⣟⢛⠠⡀⢄⡸⠄⣿⢿⣿⣇⣼⢿⣿⣟⠣⡘⠸⢿⠀⠀⠀⠀
⣸⣿⣿⣿⣿⣿⣿⣿⡌⠱⣈⠒⡄⢣⠘⠾⠟⡠⠘⠞⡿⢋⠔⢡⠃⣿⡆⠀⠀⠀
⣿⣿⣿⣿⣿⣿⣿⣿⡇⠡⠄⢃⠌⠄⢣⠘⠤⡁⢍⠒⡐⠌⣂⠦⣉⣿⡇⠀⠀⠀
⢿⣿⣿⣿⣿⣿⣿⣿⡇⢡⠊⠔⡨⠘⢄⠊⡔⢁⠊⡔⢁⠎⣐⠺⢅⣾⡇⠀⠀⠀
⠘⣿⣿⣿⣿⣿⣿⣿⠃⡐⠌⡂⠥⢑⡈⢒⠨⠄⡃⢄⢃⢎⡱⢃⠎⣾⠇⠀⠀⠀
⠀⠈⠛⢿⣿⣿⡿⠋⡐⢀⠢⢡⠘⡠⠘⡄⢃⣜⣠⣮⡿⠷⡂⢍⢂⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⠙⠓⠶⠶⠤⢾⣄⠂⡱⣌⡜⣻⣋⣯⡕⡘⠤⡑⢪⡰⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣶⣤⣔⣸⣨⣍⣍⣱⣬⣶⣽⣶⡿⠟⠢⡄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⡷⠈⠙⠛⠿⠯⠽⠿⠿⠟⠛⠋⠉⣄⣇⠀⠹⡄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⢃⡇⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠄⠀⣹⡄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⠻⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣶⣾⠃⠘⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣆⣿⣄⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⣴⡏⠀⠀⠀⣼⠇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⡉⠻⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⣷⣤⣀⣼⠏⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⡇⠀⠘⠿⢿⣿⣯⣽⣻⠟⠁⠐⢤⡯⢙⣿⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⠀⠀⠀⠀⠘⣿⠀⠀⠀⠀⠀⠀⠀⢸⣿⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡆⠲⢶⣄⠀⢻⡆⠀⣤⣀⠀⠀⠀⢸⣿⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣽⡄⠀⠀⠀⠘⣿⠀⠈⠛⠃⠀⠀⢸⣿⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢣⠉⠛⠓⠒⠒⠻⡟⠒⠶⠦⠶⠶⠞⢿⡆⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡤⠬⣷⣶⢶⣦⣤⣄⣷⣄⣀⣄⣀⣀⣠⣾⠇⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡏⠀⡄⡀⠙⢾⣟⢯⣿⡿⠿⠿⢿⣿⣿⡿⣿⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⣤⣤⣤⣤⣼⣿⣿⡇⠈⠠⠄⠀⠙⣿⣿⡿⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠁⠀⠀⠀⠘⠿⣭⣉⣉⣩⡵⠋⠀⠀⠀
                Pablo Lagger
`);

    // Render profile
    renderProfile();
});

// ================================
// Profile Tab Rendering
// ================================

function renderProfile() {
    const { profile, skills, experience, education, certifications, contact } = portfolioData;
    const { desktop, mobile } = domCache;

    // ================================
    // Desktop (Word Style)
    // ================================

    // Header
    setText(desktop.name, profile.name);
    setText(desktop.title, profile.title);
    setText(desktop.location, profile.location);
    setText(desktop.bio, profile.bio);

    // Skills - formato Word
    const skillsFlat = Object.values(skills).flat();
    renderList(desktop.skills, skillsFlat, skill =>
        `<span class="word-skill-tag">${skill}</span>`
    );

    // Experience - formato documento Word
    renderList(desktop.experience, experience, job => `
        <div class="word-job-entry">
            <p><strong>${job.company}</strong> - ${job.tenure}</p>
            ${job.roles.map(role => `
                <p style="margin-left: 0.2in;">
                    <strong>${role.title}</strong> - <em>${role.period}</em>
                </p>
                <ul style="margin: 4px 0 12px; padding-left: 0.4in;">
                    ${role.responsibilities.map(resp =>
                        `<li>${resp}</li>`
                    ).join('')}
                </ul>
            `).join('')}
        </div>
    `);

    // Education
    renderList(desktop.education, education, edu => `
        <p><strong>${edu.institution}</strong><br>
        ${edu.degree} - ${edu.period}</p>
    `);

    // Certifications
    renderList(desktop.certifications, certifications, cert =>
        `<li>${cert}</li>`
    );

    // Contact
    if (desktop.contact) {
        desktop.contact.innerHTML = `
            <p><a href="${contact.linkedin.url}" target="_blank" rel="noopener noreferrer">${contact.linkedin.display}</a></p>
        `;
    }

    // ================================
    // Mobile (Terminal Style)
    // ================================
    renderMobileProfile(profile, skills, experience, education, certifications, contact, mobile);
}

// ================================
// Mobile Profile Rendering
// ================================
function renderMobileProfile(profile, skills, experience, education, certifications, contact, mobile) {
    // Header
    setText(mobile.name, profile.name);
    setText(mobile.title, profile.title);
    setText(mobile.location, profile.location);
    setText(mobile.bio, profile.bio);

    // Skills
    const skillsFlat = Object.values(skills).flat();
    renderList(mobile.skills, skillsFlat, skill =>
        `<span class="mobile-skill-tag">${skill}</span>`
    );

    // Experience - Timeline style
    renderList(mobile.experience, experience, (job, index) => `
        <div class="mobile-job${index === 0 ? ' current' : ''}">
            <div class="mobile-job-node"></div>
            <h3 class="mobile-job-company">${job.company}</h3>
            <p class="mobile-job-tenure">${job.tenure}</p>
            ${job.roles.map(role => `
                <div class="mobile-role">
                    <p class="mobile-role-title">${role.title}</p>
                    <p class="mobile-role-period">${role.period}</p>
                    <ul class="mobile-role-responsibilities">
                        ${role.responsibilities.map(resp =>
                            `<li>${resp}</li>`
                        ).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    `);

    // Education
    renderList(mobile.education, education, edu => `
        <p><strong>${edu.institution}</strong><br>
        ${edu.degree} - ${edu.period}</p>
    `);

    // Certifications
    renderList(mobile.certifications, certifications, cert =>
        `<li>${cert}</li>`
    );

    // Contact
    if (mobile.contact) {
        mobile.contact.innerHTML = `
            <p><a href="${contact.linkedin.url}" target="_blank" rel="noopener noreferrer">${contact.linkedin.display}</a></p>
        `;
    }
}
