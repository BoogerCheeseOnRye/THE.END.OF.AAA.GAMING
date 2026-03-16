// full neon crystal loader (exact from your OG + pastel refs)
function createNeonCrystalLoader(parentElement) {
    console.log('CRYSTAL LOADER STARTED — no more black');
    const container = document.getElementById('rings-container') || document.createElement('div');
    container.id = 'rings-container';
    parentElement.appendChild(container);
    const crystal = document.createElement('div');
    crystal.id = 'central-crystal';
    container.appendChild(crystal);
    const ringConfigs = [
        {className:'ring-inner', radius:78, count:7, color:'#00f0ff'},
        {className:'ring-mid', radius:154, count:9, color:'#ff00cc'},
        {className:'ring-outer', radius:235, count:11, color:'#ccff00'}
    ];
    ringConfigs.forEach(cfg => {
        const ring = document.createElement('div');
        ring.className = `loading-ring ${cfg.className}`;
        container.appendChild(ring);
        for (let i = 0; i < cfg.count; i++) {
            const angle = (i * (360 / cfg.count)) + (Math.random() * 18 - 9);
            const shape = document.createElement('div');
            shape.className = 'loading-shape';
            shape.style.setProperty('--start-angle', `${angle}deg`);
            shape.style.setProperty('--orbit-radius', `${cfg.radius}px`);
            shape.style.color = cfg.color;
            ring.appendChild(shape);
        }
    });
}

// THREE.JS + 4D CUBE BLOB ENEMIES (full working, GPU chill, pastel pulsing exactly as you wanted)
let scene, camera, renderer, clock, enemies = [], player, keys = {}, mouseDown = false;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];

class CubeBlobHumanoid extends THREE.Group {
    constructor(isElite) {
        super();
        this.cubes = [];
        const scale = isElite ? 0.85 : 0.55;
        for (let i = 0; i < 12; i++) {
            const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
            const mat = new THREE.MeshPhongMaterial({color: pastelColors[i % 4], emissive: pastelColors[i % 4], emissiveIntensity: 8.5, shininess: 12});
            const cube = new THREE.Mesh(geo, mat);
            if (i < 3) cube.position.y = 0.8 + i * 0.25;
            else if (i === 3) cube.position.y = 1.4;
            else if (i < 6) cube.position.x = (i % 2 ? -0.4 : 0.4);
            else if (i < 8) cube.position.set((i % 2 ? -0.3 : 0.3), 0.4, 0);
            else cube.position.set((Math.random() - 0.5) * 0.3, 0.9 + Math.random() * 0.4, (Math.random() - 0.5) * 0.3);
            this.add(cube);
            this.cubes.push(cube);
        }
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.userData = { health: 80 * (isElite ? 2.8 : 1), maxHealth: 80 * (isElite ? 2.8 : 1), speed: 8 * (isElite ? 1.15 : 1), isElite, walkPhase: Math.random() * Math.PI * 2 };
        scene.add(this);
    }
    update(delta, t) {
        const pulse = 1 + Math.sin(t * 3.2 + this.pulsePhase) * 0.09;
        this.scale.setScalar(pulse);
        this.cubes.forEach((c, i) => {
            c.position.y += Math.sin(t * 5 + i) * 0.012;
            if (i > 7) c.rotation.y = t * 1.8 + i;
        });
        this.position.y += Math.sin(t * 12) * 0.03;
    }
}

function createTerrain() {
    const terrain = new THREE.Group();
    const floorGeo = new THREE.PlaneGeometry(400, 400, 64, 64);
    const floorMat = new THREE.MeshPhongMaterial({color: 0x112211, shininess: 5});
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    terrain.add(floor);
    scene.add(terrain);
    return terrain;
}

function initGame() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 300);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    clock = new THREE.Clock();

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(50, 100, 50);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 0.6));

    createTerrain();

    player = new THREE.Object3D();
    player.position.set(0, 1.6, 10);
    camera.position.set(0, 1.6, 10);
    scene.add(player);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    document.addEventListener('mousedown', () => mouseDown = true);
    document.addEventListener('mouseup', () => mouseDown = false);

    setTimeout(() => {
        document.getElementById('ncl-crystal-loader').style.opacity = '0';
    }, 1400);

    spawnInitialEnemies();
    animate();
}

function spawnInitialEnemies() {
    for (let i = 0; i < 4; i++) {
        const enemy = new CubeBlobHumanoid(Math.random() < 0.3);
        enemy.position.set((Math.random() - 0.5) * 60, 1, (Math.random() - 0.5) * 60);
        enemies.push(enemy);
    }
}

function spawnEnemies() {
    if (enemies.length < 6 && Math.random() < 0.03) {
        const enemy = new CubeBlobHumanoid(Math.random() < 0.3);
        enemy.position.set(player.position.x + (Math.random() - 0.5) * 40, 1, player.position.z + (Math.random() - 0.5) * 40);
        enemies.push(enemy);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    const speed = 18 * delta;
    if (keys['w']) player.position.z -= speed;
    if (keys['s']) player.position.z += speed;
    if (keys['a']) player.position.x -= speed;
    if (keys['d']) player.position.x += speed;
    camera.position.copy(player.position);
    camera.position.y = 1.6;

    enemies.forEach((e, idx) => {
        if (e instanceof CubeBlobHumanoid) {
            e.update(delta, t);
            const dir = player.position.clone().sub(e.position);
            dir.y = 0;
            dir.normalize();
            e.position.x += dir.x * e.userData.speed * delta;
            e.position.z += dir.z * e.userData.speed * delta;
            if (player.position.distanceTo(e.position) < 1.8) {
                e.userData.health -= 10;
            }
            if (e.userData.health <= 0) {
                scene.remove(e);
                enemies.splice(idx, 1);
            }
        }
    });

    spawnEnemies();
    renderer.render(scene, camera);
}
