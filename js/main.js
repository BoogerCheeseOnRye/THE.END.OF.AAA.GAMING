import { MultiverseSky } from './multiverse-sky.js';
import { AcidDreamEnemy } from './acid-dream-enemy.js';
import { InputManager } from './input-manager.js';
import { createStartScreen } from './ui-start-screen.js';

export function initGame() {
    createStartScreen();
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth, innerHeight); document.body.appendChild(renderer.domElement);

    const sky = new MultiverseSky(scene);
    const enemies = [];
    for (let i = 0; i < 5; i++) enemies.push(new AcidDreamEnemy(scene, new THREE.Vector3(Math.random()*400,0,Math.random()*400)));

    const input = new InputManager(camera, camera.position);
    const clock = new THREE.Clock();

    function animate() {
        const delta = clock.getDelta();
        sky.update(delta, camera);
        enemies.forEach(e => e.update(delta, camera.position));
        input.update(delta, camera.position);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    window.startGame = () => { document.getElementById('start-screen').classList.add('hidden'); animate(); };
}
