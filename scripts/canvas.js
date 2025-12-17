// ================================
// Starfield Animation
// Subtle space effect with nebula and parallax stars
// Compatible with GitHub Pages (vanilla JS)
// ================================

(function() {
    'use strict';

    // ================================
    // CONFIGURATION
    // Named constants replacing magic numbers
    // ================================
    const CONFIG = {
        // Particle counts
        PARTICLES: {
            STARS: 350,
            DUST: 400
        },

        // Animation speeds (pixels per frame)
        ANIMATION: {
            STAR_SPEED: 5,                  // Slower for subtle effect
            DUST_SPEED_FACTOR: 0.2          // 20% of star speed (more subtle)
        },

        // Rendering parameters
        RENDERING: {
            TRAIL_OPACITY: 1.0,             // No trails - clean stars
            NEBULA_RADIUS_FACTOR: 0.6,      // Nebula size relative to viewport
            STAR_MAX_SIZE: 3,               // Maximum star radius
            DUST_Z_MULTIPLIER: 1.5          // Depth range for dust particles
        },

        // Color palettes
        COLORS: {
            STARS: ['#a8d4ff', '#ffffff', '#ffffff', '#fff4e0', '#ffe4c4'],
            DUST: '#888',
            NEBULA_GRADIENT: [
                { stop: 0, color: 'rgba(25, 15, 50, 0.12)' },
                { stop: 0.3, color: 'rgba(20, 10, 40, 0.08)' },
                { stop: 0.6, color: 'rgba(10, 5, 25, 0.04)' },
                { stop: 1, color: 'transparent' }
            ]
        }
    };

    // ================================
    // STATE
    // Private module state
    // ================================
    let canvas = null;
    let ctx = null;
    let stars = [];
    let dust = [];
    let animationFrameId = null;
    let isAnimating = false;

    // Derived speeds
    const dustSpeed = CONFIG.ANIMATION.STAR_SPEED * CONFIG.ANIMATION.DUST_SPEED_FACTOR;

    // ================================
    // INITIALIZATION
    // ================================

    /**
     * Resize canvas to match viewport dimensions
     */
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /**
     * Initialize star particles with random positions and properties
     * Each star has: x, y (relative to center), z (depth), color, brightness
     */
    function initStars() {
        stars = [];
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const colors = CONFIG.COLORS.STARS;

        for (let i = 0; i < CONFIG.PARTICLES.STARS; i++) {
            stars.push({
                x: Math.random() * canvas.width - cx,
                y: Math.random() * canvas.height - cy,
                z: Math.random() * canvas.width,
                color: colors[Math.floor(Math.random() * colors.length)],
                brightness: 0.4 + Math.random() * 0.6
            });
        }
    }

    /**
     * Initialize cosmic dust particles (slower parallax layer)
     * Each dust has: x, y (relative to center), z (deeper range), size, opacity
     */
    function initDust() {
        dust = [];
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const zMultiplier = CONFIG.RENDERING.DUST_Z_MULTIPLIER;

        for (let i = 0; i < CONFIG.PARTICLES.DUST; i++) {
            dust.push({
                x: Math.random() * canvas.width - cx,
                y: Math.random() * canvas.height - cy,
                z: Math.random() * canvas.width * zMultiplier,
                size: 0.3 + Math.random() * 0.7,
                opacity: 0.2 + Math.random() * 0.3
            });
        }
    }

    // ================================
    // RENDERING HELPERS
    // ================================

    /**
     * Project a 3D particle position to 2D screen coordinates
     * Formula: screen = (position / depth) * viewportSize + center
     * @param {Object} particle - Particle with x, y, z properties
     * @param {number} cx - Center X coordinate
     * @param {number} cy - Center Y coordinate
     * @returns {Object} Screen coordinates {sx, sy}
     */
    function projectParticle(particle, cx, cy) {
        return {
            sx: (particle.x / particle.z) * canvas.width + cx,
            sy: (particle.y / particle.z) * canvas.height + cy
        };
    }

    // ================================
    // RENDERING
    // ================================

    /**
     * Draw nebula background effect
     * Creates a radial gradient from center, giving depth to the scene
     */
    function drawNebula() {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.max(canvas.width, canvas.height) * CONFIG.RENDERING.NEBULA_RADIUS_FACTOR;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        CONFIG.COLORS.NEBULA_GRADIENT.forEach(function(item) {
            gradient.addColorStop(item.stop, item.color);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Render cosmic dust layer (slow parallax)
     */
    function renderDust(cx, cy) {
        const zMax = canvas.width * CONFIG.RENDERING.DUST_Z_MULTIPLIER;

        dust.forEach(function(particle) {
            // Move particle toward camera
            particle.z -= dustSpeed;

            // Reset particle when it reaches camera
            if (particle.z <= 0) {
                particle.x = Math.random() * canvas.width - cx;
                particle.y = Math.random() * canvas.height - cy;
                particle.z = zMax;
            }

            // 3D to 2D projection
            const pos = projectParticle(particle, cx, cy);

            // Render dust particle
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = CONFIG.COLORS.DUST;
            ctx.beginPath();
            ctx.arc(pos.sx, pos.sy, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
    }

    /**
     * Render star layer (colorful, variable brightness)
     * Stars have depth-based size scaling
     */
    function renderStars(cx, cy) {
        const colors = CONFIG.COLORS.STARS;
        const maxSize = CONFIG.RENDERING.STAR_MAX_SIZE;

        stars.forEach(function(star) {
            // Move star toward camera
            star.z -= CONFIG.ANIMATION.STAR_SPEED;

            // Reset star when it reaches camera
            if (star.z <= 0) {
                star.x = Math.random() * canvas.width - cx;
                star.y = Math.random() * canvas.height - cy;
                star.z = canvas.width;
                star.color = colors[Math.floor(Math.random() * colors.length)];
                star.brightness = 0.4 + Math.random() * 0.6;
            }

            // 3D to 2D projection
            const pos = projectParticle(star, cx, cy);

            // Size based on depth (closer = larger) and brightness
            const size = (1 - star.z / canvas.width) * maxSize * star.brightness;

            // Render star
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(pos.sx, pos.sy, size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
    }

    // ================================
    // ANIMATION LOOP
    // ================================

    /**
     * Main animation frame
     * Renders layers in order: trail effect, nebula, dust, stars
     */
    function animate() {
        // Trail effect (motion blur) - semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, ' + CONFIG.RENDERING.TRAIL_OPACITY + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Render layers (back to front)
        drawNebula();       // Layer 1: Background nebula
        renderDust(cx, cy); // Layer 2: Slow dust particles
        renderStars(cx, cy);// Layer 3: Fast stars

        // Continue animation loop
        if (isAnimating) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    /**
     * Handle window resize
     * Resizes canvas without reinitializing particles (they recycle naturally)
     */
    function handleResize() {
        resize();
        // Note: Particles are not reinitialized - they will
        // naturally recycle with new dimensions during animation
    }

    // ================================
    // PUBLIC API
    // Exposed on window.Starfield
    // ================================
    window.Starfield = {
        /**
         * Initialize and start the starfield animation
         * @param {string} canvasId - ID of the canvas element
         */
        init: function(canvasId) {
            canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn('Starfield: Canvas element "' + canvasId + '" not found');
                return;
            }

            ctx = canvas.getContext('2d');

            // Initialize
            resize();
            initStars();
            initDust();

            // Start animation
            isAnimating = true;
            animate();

            // Bind resize handler
            window.addEventListener('resize', handleResize);

            // Pause animation when tab is not visible (saves CPU)
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    window.Starfield.stop();
                } else {
                    window.Starfield.start();
                }
            });
        },

        /**
         * Stop the animation (can be resumed with start)
         */
        stop: function() {
            isAnimating = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        },

        /**
         * Resume animation after stop
         */
        start: function() {
            if (!canvas || isAnimating) return;
            isAnimating = true;
            animate();
        },

        /**
         * Clean up and remove event listeners
         */
        destroy: function() {
            this.stop();
            window.removeEventListener('resize', handleResize);
            canvas = null;
            ctx = null;
            stars = [];
            dust = [];
        }
    };
})();
