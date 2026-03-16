import { MultiverseSky } from './multiverse-sky.js';
import { AcidDreamEnemy } from './acid-dream-enemy.js';
import { InputManager } from './input-manager.js';
import { UIManager } from './ui-manager.js';
import neonCrystalLoader from '../neon-crystal-loader.js'; // your original loader

export async function initGame() {
    const ui = new UIManager();
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({canvas:document.getElementById('game-canvas'), antialias:true});
    renderer.setSize(innerWidth, innerHeight);

    const sky = new MultiverseSky(scene);
    const enemies = [];
    const input = new InputManager(camera);
    const clock = new THREE.Clock();

    // start sequence exactly like OG
    ui.showLoading();
    await neonCrystalLoader(); // your original loader
    ui.hideLoading();
    ui.overlay.innerHTML = `<!-- exact OG start screen HTML from your index.html -->`;
    // buttons call ui.startGame(hardcoreFlag, tipsFlag, musicFlag)

    function animate() {
        const delta = clock.getDelta();
        sky.update(delta, camera);
        enemies.forEach(e => e.update(delta, camera.position));
        input.update(delta, camera.position);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    window.startGame = (hardcore, tips, music) => { ui.startGame(hardcore, tips, music); animate(); };
}
