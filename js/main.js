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
        this.scale.setScalar(isElite ? 4.1 : 3.7);
        const numCubes = isElite ? 1100 : 620;
        const size = 0.58;
        // skeleton vertices first (tight line segments)
        const skeletonPoints = [];
        for (let i = 0; i < 28; i++) skeletonPoints.push(new THREE.Vector3(0, 0.1 + i * 0.22, 0)); // spine/feet to head
        // add limbs
        for (let side = -1; side <= 1; side += 2) {
            for (let j = 0; j < 8; j++) skeletonPoints.push(new THREE.Vector3(side * 0.7, 2.8 + j * 0.18, 0));
        }
        for (let i = 0; i < numCubes; i++) {
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshPhongMaterial({color: pastelColors[i % 4], emissive: pastelColors[i % 4], emissiveIntensity: 10.8, shininess: 18});
            const cube = new THREE.Mesh(geo, mat);
            // snap to nearest skeleton line
            const nearest = skeletonPoints.reduce((a, b) => a.distanceTo(new THREE.Vector3((i % 12) * 0.12 - 0.7, 0.4 + Math.floor(i / 12) * 0.22, 0)) < b.distanceTo(new THREE.Vector3((i % 12) * 0.12 - 0.7, 0.4 + Math.floor(i / 12) * 0.22, 0)) ? a : b);
            cube.position.copy(nearest);
            cube.position.x += (Math.random() - 0.5) * 0.08;
            cube.position.z += (Math.random() - 0.5) * 0.08;
            this.basePositions.push(cube.position.clone());
            this.add(cube);
            this.cubes.push(cube);
        }
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.userData = { health: isElite ? 320 : 120, speed: isElite ? 9.4 : 7.1, isElite };
        scene.add(this);
    }
    update(t) {
        const pulse = 1 + Math.sin(t * 3.4 + this.pulsePhase) * 0.085;
        this.scale.setScalar(pulse * (this.userData.isElite ? 4.1 : 3.7));
        this.cubes.forEach((c, i) => {
            const base = this.basePositions[i];
            const warp = 0.052; // TIGHT cohesive wrap
            c.position.x = base.x + Math.sin(t * 6.4 + i) * warp;
            c.position.y = base.y + Math.sin(t * 5.1 + i * 1.1) * warp;
            c.position.z = base.z + Math.cos(t * 4.2 + i) * warp;
            // independent rainbow shift like terrain cubes
            c.material.emissive.setHSL((t * 2.8 + i * 0.4) % 1, 1, 0.88);
            c.rotation.y = t * (1.6 + i * 0.012);
            if (i % 48 < 12) c.position.y += Math.sin(t * 12) * 0.085; // smooth limb walk
        });
        this.position.y += Math.sin(t * 7.2) * 0.035;
    }
}

function createPSMWorld() {
    const geo = new THREE.PlaneGeometry(520, 520, 128, 128);
    const mat = new THREE.MeshPhongMaterial({color: 0x220033, emissive: 0xff0088, emissiveIntensity: 2.8, shininess: 10});
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const verts = floor.geometry.attributes.position;
    return {floor, mat, verts};
}

function startGame() {
    document.getElementById('menu-screen').classList.add('hidden');
    isGameRunning = true;
    document.body.requestPointerLock();
    initGameCore();
}

function initGameCore() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x110022, 8, 280);
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias: true});
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    clock = new THREE.Clock();

    // strong lights for visible terrain
    scene.add(new THREE.HemisphereLight(0x00ffff, 0xff0088, 2.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.8); dir.position.set(50, 140, 60);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x445566, 1.1));

    const world = createPSMWorld();

    player = new THREE.Object3D();
    player.position.set(0, 1.85, 24);
    camera.position.copy(player.position);
    scene.add(player);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    document.addEventListener('mousedown', shoot);

    window.addEventListener('gamepadconnected', e => gamepad = e.gamepad);

    spawnInitialEnemies();
    animate(world);
}

function onMouseMove(e) {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-1.5, Math.min(1.5, pitch));
        camera.rotation.set(pitch, yaw, 0);
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

    // Xbox support
    if (gamepad) {
        const x = gamepad.axes[0];
        const z = gamepad.axes[1];
        player.position.x += x * 12 * delta;
        player.position.z += z * 12 * delta;
    }

    // WASD relative to camera yaw
    const speed = 25 * delta;
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);
    if (keys['w']) player.position.addScaledVector(forward, speed);
    if (keys['s']) player.position.addScaledVector(forward, -speed);
    if (keys['a']) player.position.addScaledVector(right, -speed);
    if (keys['d']) player.position.addScaledVector(right, speed);
    camera.position.copy(player.position);
    camera.position.y = 1.85;

    // psmv1.02 visible pulsing terrain
    world.mat.emissive.setHSL(0.84 + Math.sin(t * 0.38) * 0.11, 1, 0.52);
    const verts = world.verts;
    for (let i = 0; i < verts.count; i++) {
        const x = verts.getX(i);
        const z = verts.getZ(i);
        verts.setY(i, Math.sin(x * 0.028 + t * 1.9) * 3.5 + Math.cos(z * 0.035 + t * 2.3) * 2.8);
    }
    verts.needsUpdate = true;
    world.floor.geometry.computeVertexNormals();

    enemies.forEach((e, i) => {
        if (e instanceof CubeBlobHumanoid) {
            e.update(t);
            const dir = player.position.clone().sub(e.position).normalize();
            dir.y = 0;
            e.position.x += dir.x * e.userData.speed * delta;
            e.position.z += dir.z * e.userData.speed * delta;
            if (player.position.distanceTo(e.position) < 2.8) e.userData.health -= 16 * delta;
            if (e.userData.health <= 0) {
                scene.remove(e);
                enemies.splice(i, 1);
            }
        }
    });

    renderer.render(scene, camera);
}

function spawnInitialEnemies() {
    for (let i = 0; i < 5; i++) {
        const e = new CubeBlobHumanoid(Math.random() < 0.35);
        e.position.set((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100);
        enemies.push(e);
    }
}
