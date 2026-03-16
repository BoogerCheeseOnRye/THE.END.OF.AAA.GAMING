import runOnboarding from '../neon-crystal-loader.js';
import { MultiverseSky } from './multiverse-sky.js';
import { AcidDreamEnemy } from './acid-dream-enemy.js';
import { InputManager } from './input-manager.js';

export async function initGame() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const sky = new MultiverseSky(scene);
  const enemies = [];
  for (let i = 0; i < 5; i++) enemies.push(new AcidDreamEnemy(scene, new THREE.Vector3(Math.random()*400-200, 0, Math.random()*400-200)));
  const input = new InputManager(camera);
  const clock = new THREE.Clock();

  await runOnboarding();  // fires the refined loader now

  function animate() {
    const delta = clock.getDelta();
    sky.update(delta, camera);
    enemies.forEach(e => e.update(delta, camera.position));
    input.update(delta, camera.position);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  window.startGame = () => { animate(); };
}
