var scene, camera, renderer, clock, enemies = [], player, keys = {}, isGameRunning = false;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];

class CubeBlobHumanoid extends THREE.Group {
    constructor() {
        super();
        this.cubes = [];
        const num = 820;
        for (let i = 0; i < num; i++) {
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.48,0.48), new THREE.MeshPhongMaterial({color: pastelColors[i%4], emissive: pastelColors[i%4], emissiveIntensity: 11}));
            cube.position.y = -3 + Math.random() * 1;
            this.cubes.push(cube);
            this.add(cube);
        }
        scene.add(this);
    }
    update(t) {
        this.cubes.forEach((c, i) => {
            c.position.y += Math.sin(t * 5.1 + i) * 0.085;
            c.material.emissive.setHSL((t * 2.8 + i * 0.42) % 1, 1, 0.88);
        });
    }
}

function createNeonCrystalLoader() {
    const container = document.createElement('div'); container.id = 'rings-container';
    document.getElementById('ncl-crystal-loader').appendChild(container);
}

function startGame() {
    document.getElementById('menu-screen').classList.add('hidden');
    isGameRunning = true;
    document.body.requestPointerLock();
    initGame();
}

function openCharacterCreator() {
    document.getElementById('creator-modal').classList.remove('hidden');
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
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias: true});
    renderer.setSize(innerWidth, innerHeight);
    clock = new THREE.Clock();

    const ambient = new THREE.AmbientLight(0x404040, 0.6); scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2); dirLight.position.set(50,100,50); scene.add(dirLight);

    player = new THREE.Object3D();
    player.position.set(0, 2, 30);
    camera.position.set(0, 8, 40);
    scene.add(player);

    for (let i = 0; i < 5; i++) {
        const e = new CubeBlobHumanoid();
        e.position.set((Math.random()-0.5)*80, 0, (Math.random()-0.5)*80);
        enemies.push(e);
    }
    initWorld();

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (!isGameRunning) return;
    const t = clock.getElapsedTime();
    enemies.forEach(e => e.update(t));
    updateChunks();
    renderer.render(scene, camera);
}

createNeonCrystalLoader();
let progress = 0;
const bar = document.getElementById('progress-fill');
const interval = setInterval(() => {
    progress += 4.2;
    bar.style.width = `${progress}%`;
    if (progress >= 100) {
        clearInterval(interval);
        document.getElementById('ncl-crystal-loader').style.opacity = '0';
        setTimeout(() => document.getElementById('menu-screen').classList.remove('hidden'), 600);
    }
}, 28);
