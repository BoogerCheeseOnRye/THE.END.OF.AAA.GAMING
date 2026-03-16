let scene, camera, renderer, clock, enemies = [], player, keys = {}, isGameRunning = false;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];

function createNeonCrystalLoader(parent) {
    const container = document.createElement('div'); container.id = 'rings-container';
    parent.appendChild(container);
    const crystal = document.createElement('div'); crystal.id = 'central-crystal';
    container.appendChild(crystal);
    const ringConfigs = [
        {className:'ring-inner', radius:78, count:7, color:'#00f0ff'},
        {className:'ring-mid', radius:154, count:9, color:'#ff00cc'},
        {className:'ring-outer', radius:235, count:11, color:'#ccff00'}
    ];
    ringConfigs.forEach(cfg => {
        const ring = document.createElement('div'); ring.className = `loading-ring ${cfg.className}`;
        container.appendChild(ring);
        for (let i = 0; i < cfg.count; i++) {
            const shape = document.createElement('div'); shape.className = 'loading-shape';
            shape.style.setProperty('--start-angle', `${(i * (360 / cfg.count)) + (Math.random() * 18 - 9)}deg`);
            shape.style.setProperty('--orbit-radius', `${cfg.radius}px`);
            shape.style.color = cfg.color;
            ring.appendChild(shape);
        }
    });
}

class CubeBlobHumanoid extends THREE.Group {
    constructor(isElite) {
        super();
        this.cubes = [];
        this.basePositions = [];
        const num = isElite ? 180 : 68;
        const size = 0.18;
        // tight connected humanoid mesh (every cube touches 2+ others)
        for (let i = 0; i < num; i++) {
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshPhongMaterial({
                color: pastelColors[i % 4],
                emissive: pastelColors[i % 4],
                emissiveIntensity: 9.8,
                shininess: 14
            });
            const cube = new THREE.Mesh(geo, mat);
            // connected grid positions
            let x = ((i % 6) - 2.5) * 0.19;
            let y = 0.6 + Math.floor(i / 6) * 0.19;
            let z = (Math.random() - 0.5) * 0.12;
            if (i < 36) y += 0.9; // dense torso
            else if (i < 54) { x = (i % 2 ? -0.75 : 0.75); y = 1.4 + (i % 9) * 0.19; } // arms
            else if (i < 72) { x = (i % 2 ? -0.55 : 0.55); y = 0.4 + (i % 9) * 0.19; } // legs
            else if (i < 90) y = 2.2; // head cluster
            cube.position.set(x, y, z);
            this.basePositions.push(cube.position.clone());
            this.add(cube);
            this.cubes.push(cube);
        }
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.userData = { health: isElite ? 240 : 95, maxHealth: isElite ? 240 : 95, speed: isElite ? 9.2 : 7.1, isElite };
        scene.add(this);
    }
    update(t) {
        const pulse = 1 + Math.sin(t * 3.8 + this.pulsePhase) * 0.095;
        this.scale.setScalar(pulse);
        this.cubes.forEach((c, i) => {
            const base = this.basePositions[i];
            const warp = 0.085; // tight so cubes never separate
            c.position.x = base.x + Math.sin(t * 7.2 + i) * warp;
            c.position.y = base.y + Math.sin(t * 5.9 + i * 1.3) * warp;
            c.position.z = base.z + Math.cos(t * 4.4 + i) * warp;
            c.rotation.y = t * (2.1 + i * 0.02);
            if (i > 90) c.rotation.x = t * 2.7 + i;
        });
        this.position.y += Math.sin(t * 8) * 0.028;
    }
}

function createTerrain() {
    const geo = new THREE.PlaneGeometry(420, 420, 92, 92);
    const mat = new THREE.MeshPhongMaterial({
        color: 0x220033,
        emissive: 0xff0088,
        emissiveIntensity: 0.65,
        shininess: 6
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    return {floor, mat, geo};
}

function startGame() {
    document.getElementById('menu-screen').classList.add('hidden');
    isGameRunning = true;
    document.body.requestPointerLock();
    initGameCore();
}

function initGameCore() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x110022, 12, 260);
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias: true});
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    clock = new THREE.Clock();

    scene.add(new THREE.HemisphereLight(0x00ffff, 0xff0088, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.45); dir.position.set(40, 130, 50);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x445566, 0.8));

    const terrain = createTerrain();

    player = new THREE.Object3D();
    player.position.set(0, 1.65, 18);
    camera.position.copy(player.position);
    scene.add(player);

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    document.addEventListener('mousedown', shoot);

    spawnInitialEnemies();
    animate(terrain);
}

function spawnInitialEnemies() {
    for (let i = 0; i < 6; i++) {
        const e = new CubeBlobHumanoid(Math.random() < 0.3);
        e.position.set((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80);
        enemies.push(e);
    }
}

function shoot() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = ray.intersectObjects(enemies, true);
    if (hits.length) {
        let obj = hits[0].object;
        while (obj && !(obj.parent instanceof CubeBlobHumanoid)) obj = obj.parent;
        if (obj && obj.parent.userData.health) {
            obj.parent.userData.health -= 38;
            if (obj.parent.userData.health <= 0) {
                scene.remove(obj.parent);
                enemies.splice(enemies.indexOf(obj.parent), 1);
            }
        }
    }
}

function animate(terrain) {
    requestAnimationFrame(() => animate(terrain));
    if (!isGameRunning) return;
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    // player move
    const speed = 23 * delta;
    if (keys['w']) player.position.z -= speed;
    if (keys['s']) player.position.z += speed;
    if (keys['a']) player.position.x -= speed;
    if (keys['d']) player.position.x += speed;
    camera.position.copy(player.position);
    camera.position.y = 1.65;

    // horror terrain pulse
    terrain.mat.emissive.setHSL(0.82 + Math.sin(t * 0.4) * 0.08, 1, 0.5);

    // enemies
    enemies.forEach((e, i) => {
        if (e instanceof CubeBlobHumanoid) {
            e.update(t);
            const dir = player.position.clone().sub(e.position);
            dir.y = 0; dir.normalize();
            e.position.x += dir.x * e.userData.speed * delta;
            e.position.z += dir.z * e.userData.speed * delta;
            if (player.position.distanceTo(e.position) < 2.1) e.userData.health -= 14 * delta;
            if (e.userData.health <= 0) {
                scene.remove(e);
                enemies.splice(i, 1);
            }
        }
    });

    renderer.render(scene, camera);
}
