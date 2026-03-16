let scene, camera, renderer, clock, enemies = [], player, keys = {}, isGameRunning = false, yaw = 0, pitch = 0;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];
let gamepad = null;

function createNeonCrystalLoader(parent) {
    const container = document.createElement('div'); container.id = 'rings-container';
    parent.appendChild(container);
    const crystal = document.createElement('div'); crystal.id = 'central-crystal';
    container.appendChild(crystal);
    const ringConfigs = [{className:'ring-inner', radius:78, count:7, color:'#00f0ff'},{className:'ring-mid', radius:154, count:9, color:'#ff00cc'},{className:'ring-outer', radius:235, count:11, color:'#ccff00'}];
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
        this.scale.setScalar(1.8); // 1:1 with player
        const numCubes = isElite ? 920 : 620;
        const size = 0.48;
        const skeleton = [];
        for (let i = 0; i < 32; i++) skeleton.push(new THREE.Vector3(0, 0.2 + i * 0.18, 0)); // spine
        for (let s = -1; s <= 1; s += 2) for (let j = 0; j < 12; j++) skeleton.push(new THREE.Vector3(s * 0.6, 2.1 + j * 0.16, 0)); // limbs
        for (let i = 0; i < numCubes; i++) {
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshPhongMaterial({color: pastelColors[i % 4], emissive: pastelColors[i % 4], emissiveIntensity: 11, shininess: 20});
            const cube = new THREE.Mesh(geo, mat);
            const nearest = skeleton[Math.floor(Math.random() * skeleton.length)];
            cube.position.copy(nearest);
            cube.position.x += (Math.random() - 0.5) * 0.09;
            cube.position.z += (Math.random() - 0.5) * 0.09;
            this.basePositions.push(cube.position.clone());
            this.add(cube);
            this.cubes.push(cube);
        }
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.userData = { health: isElite ? 280 : 95, speed: isElite ? 9.8 : 7.3, isElite, variant: Math.random() };
        scene.add(this);
    }
    update(t) {
        const pulse = 1 + Math.sin(t * 3.4 + this.pulsePhase) * 0.085;
        this.scale.setScalar(pulse * 1.8);
        this.cubes.forEach((c, i) => {
            const base = this.basePositions[i];
            const warp = 0.062;
            c.position.x = base.x + Math.sin(t * 6.4 + i) * warp;
            c.position.y = base.y + Math.sin(t * 5.1 + i * 1.1) * warp; // IDENTICAL terrain bob
            c.position.z = base.z + Math.cos(t * 4.2 + i) * warp;
            c.material.emissive.setHSL((t * 2.8 + i * 0.42) % 1, 1, 0.88); // same as terrain color shift
            c.rotation.y = t * (1.6 + i * 0.012);
        });
        this.position.y += Math.sin(t * 7.2) * 0.035;
    }
}

function createPSMWorld() {
    const chunks = [];
    for (let cx = -2; cx <= 2; cx++) for (let cz = -2; cz <= 2; cz++) {
        const geo = new THREE.BoxGeometry(1 + Math.random() * 0.6, 1 + Math.random() * 0.6, 1 + Math.random() * 0.6); // different sized cubes
        const mat = new THREE.MeshPhongMaterial({color: 0x220033, emissive: 0xff0088, emissiveIntensity: 3.2, shininess: 12});
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx * 28, 0, cz * 28);
        scene.add(mesh);
        chunks.push({mesh, mat});
    }
    return chunks;
}

function startGame() {
    document.getElementById('menu-screen').classList.add('hidden');
    isGameRunning = true;
    document.body.requestPointerLock();
    initGameCore();
}

function initGameCore() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0022, 15, 280);
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias: true});
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    clock = new THREE.Clock();

    scene.add(new THREE.HemisphereLight(0x00ffff, 0xff0088, 2.4));
    const dir = new THREE.DirectionalLight(0xffffff, 1.9); dir.position.set(50, 140, 60);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x445566, 1.3));

    const world = createPSMWorld();

    player = new THREE.Object3D();
    player.position.set(0, 1.85, 24);
    camera.position.copy(player.position);
    scene.add(player);

    document.addEventListener('mousemove', e => {
        if (document.pointerLockElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
            camera.rotation.set(pitch, yaw, 0);
        }
    });
    document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    document.addEventListener('mousedown', shoot);
    window.addEventListener('gamepadconnected', e => gamepad = e.gamepad);

    spawnInitialEnemies();
    animate(world);
}

function spawnInitialEnemies() {
    for (let i = 0; i < 6; i++) {
        const e = new CubeBlobHumanoid(Math.random() < 0.3);
        e.position.set((Math.random() - 0.5) * 90, 0, (Math.random() - 0.5) * 90);
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
            obj.parent.userData.health -= 48;
            if (obj.parent.userData.health <= 0) {
                scene.remove(obj.parent);
                enemies.splice(enemies.indexOf(obj.parent), 1);
            }
        }
    }
}

function animate(world) {
    requestAnimationFrame(() => animate(world));
    if (!isGameRunning) return;
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    if (gamepad) {
        player.position.x += gamepad.axes[0] * 14 * delta;
        player.position.z += gamepad.axes[1] * 14 * delta;
    }
    const speed = 26 * delta;
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);
    if (keys['w']) player.position.addScaledVector(forward, speed);
    if (keys['s']) player.position.addScaledVector(forward, -speed);
    if (keys['a']) player.position.addScaledVector(right, -speed);
    if (keys['d']) player.position.addScaledVector(right, speed);
    camera.position.copy(player.position);
    camera.position.y = 1.85;

    world.forEach(chunk => {
        chunk.mat.emissive.setHSL(0.84 + Math.sin(t * 0.38) * 0.11, 1, 0.52);
    });

    enemies.forEach((e, i) => {
        if (e instanceof CubeBlobHumanoid) {
            e.update(t);
            const dir = player.position.clone().sub(e.position).normalize();
            dir.y = 0;
            e.position.x += dir.x * e.userData.speed * delta;
            e.position.z += dir.z * e.userData.speed * delta;
            if (player.position.distanceTo(e.position) < 2.4) e.userData.health -= 16 * delta;
            if (e.userData.health <= 0) {
                scene.remove(e);
                enemies.splice(i, 1);
            }
        }
    });

    renderer.render(scene, camera);
}
