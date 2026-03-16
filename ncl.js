// neon-crystal-loader.js
// Highly optimized single-file JS (offline, CPU-friendly, ~60fps pure CSS transforms)
// Fixes: smooth continuous orbiting (no bunching, no stopping/reset), neon crystal shapes with varied colors/glows,
// shapes stay orbiting as long as container exists. Destroy when not in use.

function createNeonCrystalLoader(parentElement) {
    if (!parentElement) return null;

    const STYLE_ID = 'neon-crystal-loader-css';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #rings-container {
                position: absolute;
                inset: 0;
                overflow: hidden;
                perspective: 1200px;
            }
            .loading-ring {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                border: 2.5px solid rgba(255,255,255,0.12);
                border-radius: 50%;
                animation: ringOrbit linear infinite;
                will-change: transform;
                backface-visibility: hidden;
            }
            .ring-inner  { width: 188px; height: 188px; animation-duration: 10.8s; }
            .ring-mid    { width: 355px; height: 355px; animation-duration: 16.2s; }
            .ring-outer  { width: 518px; height: 518px; animation-duration: 23.5s; }

            @keyframes ringOrbit {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to   { transform: translate(-50%, -50%) rotate(360deg); }
            }

            /* === ORBITING SHAPES (now children of rings) === */
            .loading-shape {
                position: absolute;
                left: 50%;
                top: 50%;
                width: 54px;
                height: 54px;
                filter: drop-shadow(0 0 22px currentColor);
                animation: shapeSpin 2.75s linear infinite;
                will-change: transform;
                backface-visibility: hidden;
            }

            /* True circular orbit + orientation lock */
            .loading-shape {
                transform:
                    translate(-50%, -50%)
                    rotate(var(--start-angle))
                    translateY(calc(-1 * var(--orbit-radius)))
                    rotate(calc(-1 * var(--start-angle)));
            }

            @keyframes shapeSpin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
            }

            /* Neon crystal styling (like central but varied hues + strong glows) */
            .loading-shape {
                background: conic-gradient(currentColor, #ffffff, currentColor);
                clip-path: polygon(50% 6%, 88% 29%, 94% 55%, 82% 84%, 50% 95%, 18% 84%, 6% 55%, 13% 29%);
                box-shadow:
                    0 0 12px #fff,
                    0 0 28px currentColor,
                    0 0 62px currentColor,
                    inset 0 0 24px rgba(255,255,255,0.85);
            }

            /* === CENTRAL CRYSTAL (exact match to your original + tiny polish) === */
            #central-crystal {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 92px;
                height: 195px;
                background: conic-gradient(#ff00ff, #00ffff, #ffff00, #00ff88, #ff0088, #0088ff, #8800ff, #ff00ff);
                clip-path: polygon(50% 0%, 85% 20%, 100% 50%, 85% 80%, 50% 100%, 15% 80%, 0% 50%, 15% 20%);
                box-shadow: 0 0 40px #fff, 0 0 90px #00ffff, inset 0 0 60px #ffff00;
                animation: crystalRotateSmooth 18s linear infinite, crystalGlow 2.2s ease-in-out infinite alternate;
                z-index: 20;
                will-change: transform, filter;
            }
            @keyframes crystalRotateSmooth {
                from { transform: translate(-50%, -50%) rotateY(0deg); }
                to   { transform: translate(-50%, -50%) rotateY(360deg); }
            }
            @keyframes crystalGlow {
                from { filter: brightness(1) hue-rotate(0deg); box-shadow: 0 0 40px #fff, 0 0 90px #00ffff; }
                to   { filter: brightness(2.2) hue-rotate(360deg); box-shadow: 0 0 90px #fff, 0 0 160px #ffff00, inset 0 0 110px #00ffff; }
            }
            #central-crystal::before,
            #central-crystal::after {
                content: '';
                position: absolute;
                inset: 0;
                background: inherit;
                clip-path: inherit;
                animation: facetSwirl 3.1s ease-in-out infinite alternate;
                opacity: 0.55;
                will-change: transform, filter;
            }
            #central-crystal::before { animation-delay: 0.4s; transform: scale(1.12) rotate(12deg); }
            #central-crystal::after  { animation-delay: 0.9s; transform: scale(0.88) rotate(-12deg); }
            @keyframes facetSwirl {
                0%   { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
                100% { transform: scale(1.18) rotate(32deg); filter: hue-rotate(240deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Create container if it doesn't exist
    let container = document.getElementById('rings-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'rings-container';
        parentElement.appendChild(container);
    }

    // Add central crystal (if missing)
    let crystal = document.getElementById('central-crystal');
    if (!crystal) {
        crystal = document.createElement('div');
        crystal.id = 'central-crystal';
        container.appendChild(crystal);
    }

    // Clear old rings (in case re-init)
    container.querySelectorAll('.loading-ring').forEach(r => r.remove());

    // Ring config (inner → outer)
    const ringConfigs = [
        { className: 'ring-inner',  radius: 78,  count: 7,  hueBase: 188, color: '#00f0ff' },
        { className: 'ring-mid',    radius: 154, count: 9,  hueBase: 300, color: '#ff00cc' },
        { className: 'ring-outer',  radius: 235, count: 11, hueBase: 55,  color: '#ccff00' }
    ];

    ringConfigs.forEach(cfg => {
        const ring = document.createElement('div');
        ring.className = `loading-ring ${cfg.className}`;
        container.appendChild(ring);

        // Create crystal shapes evenly spaced
        for (let i = 0; i < cfg.count; i++) {
            const angle = (i * (360 / cfg.count)) + (Math.random() * 18 - 9); // tiny natural offset

            const shape = document.createElement('div');
            shape.className = 'loading-shape';
            shape.style.setProperty('--start-angle', `${angle}deg`);
            shape.style.setProperty('--orbit-radius', `${cfg.radius}px`);
            shape.style.color = cfg.color;

            // Slight shape variety per ring
            if (cfg.className === 'ring-outer' && i % 3 === 0) {
                shape.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
            } else if (cfg.className === 'ring-mid' && i % 2 === 0) {
                shape.style.clipPath = 'polygon(25% 10%, 75% 10%, 95% 50%, 75% 90%, 25% 90%, 5% 50%)';
            }

            ring.appendChild(shape);
        }
    });

    // Return control object so you can pause/stop when container isn't used
    return {
        container,
        pause: () => container.style.animationPlayState = 'paused',
        resume: () => container.style.animationPlayState = 'running',
        destroy: () => {
            container.remove();
            // Optional: remove style if you want to clean up completely
            // document.getElementById(STYLE_ID)?.remove();
        }
    };
}

// === USAGE (copy-paste ready) ===
// document.addEventListener('DOMContentLoaded', () => {
//     const loader = createNeonCrystalLoader(document.body);   // or any parent div
//     // Later when you hide/remove the loader:
//     // loader.destroy();
// });
