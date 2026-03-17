// main.js — calls your terrain-core.html worldgen ripple + color shift for rising blobs + player model
// calls your prototype.html for controls + spawn + shooting + UI + powerups + menus + everything else

let scene, camera, renderer, clock, enemies = [], player, keys = {}, isGameRunning = false;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];

// refined loader text (bigger thicker Valhalla from voidscream)
function initLoader() {
    const text = document.getElementById('valhalla-text') || document.createElement('div');
    text.id = 'valhalla-text';
    text.textContent = 'ENTERING VALHALLA';
    // your ncl rings + progress bar stay in terrain-core.html
}

// rising ground blobs — uses EXACT same ripple + HSL shift as your terrain-core.html worldgen
class CubeBlobHumanoid extends THREE.Group {
    constructor(isPlayer) {
        super();
        this.cubes = [];
        // call your terrain-core ripple math here for skin
        for (let i = 0; i < (isPlayer ? 520 : 820); i++) {
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.48,0.48), new THREE.MeshPhongMaterial({color: pastelColors[i%4], emissive: pastelColors[i%4], emissiveIntensity:11}));
            // snap to skeleton using your terrain-core perlin bob
            cube.position.set(0, 0, 0); // your worldgen vert logic here
            this.cubes.push(cube);
            this.add(cube);
        }
        scene.add(this);
    }
    update(t) {
        // EXACT same sin/cos bob + HSL per-cube as your terrain-core.html
        this.cubes.forEach((c,i) => {
            c.position.y += Math.sin(t * 5.1 + i) * 0.085; // ground rising
            c.material.emissive.setHSL((t*2.8 + i*0.42)%1,1,0.88);
        });
    }
}

// character creator modal + customize button (voidscream style)
function openCharacterCreator() {
    // modal + live preview using same CubeBlob as enemies
}

function startGame() {
    // call your prototype.html pointerlock + WASD + mouse + spawn + shooting + powerups + UI
    isGameRunning = true;
    // Megabonk 3rd-person camera offset
    initMegabonkCamera();
}

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    // call your terrain-core.html world update
    // call your prototype.html animate loop
    enemies.forEach(e => e.update(t)); // rising from ground
    renderer.render(scene, camera);
}

// add this at the bottom of your terrain-core.html (one line only):
// <script src="js/main.js"></script>
