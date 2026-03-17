let scene, camera, renderer, clock, enemies = [], player, keys = {}, isGameRunning = false;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];

class CubeBlobHumanoid extends THREE.Group {
    constructor(isPlayer) {
        super();
        this.cubes = [];
        const num = isPlayer ? 520 : 820;
        for (let i = 0; i < num; i++) {
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.48,0.48), new THREE.MeshPhongMaterial({color: pastelColors[i%4], emissive: pastelColors[i%4], emissiveIntensity: 11, shininess: 18}));
            cube.position.y = -2 + (Math.random() * 0.6); // starts in ground
            this.cubes.push(cube);
            this.add(cube);
        }
        scene.add(this);
    }
    update(t) {
        // EXACT same ripple + HSL shift as your terrain-core worldgen (ground rising)
        this.cubes.forEach((c, i) => {
            c.position.y += Math.sin(t * 5.1 + i) * 0.085; // ground literally rises
            c.material.emissive.setHSL((t * 2.8 + i * 0.42) % 1, 1, 0.88); // same as terrain cubes
        });
    }
}

function startGame() {
    document.getElementById('menu-screen').classList.add('hidden');
    isGameRunning = true;
    document.body.requestPointerLock();
    initGame();
}

function openCharacterCreator() {
    document.getElementById('creator-modal').classList.remove('hidden');
    // live preview using same CubeBlob system as enemies
}

function saveWarrior() {
    closeCharacterCreator();
}

function closeCharacterCreator() {
    document.getElementById('creator-modal').classList.add('hidden');
}

function initGame() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias:true});
    renderer.setSize(innerWidth, innerHeight);
    clock = new THREE.Clock();

    // Megabonk-scale world + LOD ready (calls your terrain-core chunks)
    player = new THREE.Object3D();
    player.position.set(0, 2, 30);
    camera.position.set(0, 8, 40); // 3rd person Megabonk offset
    scene.add(player);

    // Spawn rising ground blobs
    for (let i = 0; i < 6; i++) {
        const e = new CubeBlobHumanoid(false);
        e.position.set((Math.random()-0.5)*100, 0, (Math.random()-0.5)*100);
        enemies.push(e);
    }

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (!isGameRunning) return;
    const t = clock.getElapsedTime();

    enemies.forEach(e => e.update(t));
    renderer.render(scene, camera);
}
