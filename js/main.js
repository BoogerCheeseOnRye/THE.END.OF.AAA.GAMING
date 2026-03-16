import runOnboarding from '../neon-crystal-loader.js';
import { MultiverseSky } from './multiverse-sky.js';
import { AcidDreamEnemy } from './acid-dream-enemy.js';
import { InputManager } from './input-manager.js';

export async function initGame() {
  const scene = new THREE.Scene(); // ... your camera/renderer/sky/enemies/input same as before

  await runOnboarding();

  // show menu with blood + pulsing letters (exact prototype feel)
  window.showMenuWithBlood = () => {
    const overlay = document.getElementById('overlay');
    overlay.innerHTML = `
      <div id="game-title">THE.END.OF.AAA.GAMING</div>
      <div class="bloody-subtitle">TO VALHALLA</div>
      <div class="title-button" onclick="window.startGame()">ENTER THE MULTIVERSE</div>
    `;
    // spawn blood drips under title like prototype
    for (let i = 0; i < 28; i++) {
      const drop = document.createElement('div');
      drop.className = 'blood-drop';
      drop.style.left = Math.random() * 100 + 'vw';
      drop.style.animationDuration = (0.9 + Math.random() * 1.1) + 's';
      overlay.appendChild(drop);
    }
    overlay.classList.remove('hidden');
  };

  window.startGame = () => { /* hide overlay, start animate loop */ };
}
