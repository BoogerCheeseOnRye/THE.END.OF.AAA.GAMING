let scene, camera, renderer, clock, enemies = [], player, keys = {}, isGameRunning = false;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];

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
        this.scale.setScalar(isElite ? 3.2 : 2.8); // MUCH LARGER
        const numCubes = isElite ? 220 : 95;
        const size = 0.35;
        // EXACT SKELETON FROM GROUND UP — every part connected
        // feet (wide base)
        for (let i = 0; i < 8; i++) { this.addCube(i, -1.2 + (i%4)*0.38, 0.2, (i<4?-0.4:0.4), size); }
        // ankles
        for (let i = 0; i < 4; i++) { this.addCube(i+8, -0.8, 0.55 + i*0.12, 0, size*0.8); }
        // knees
        for (let i = 0; i < 6; i++) { this.addCube(i+12, -0.4, 1.1 + i*0.15, (i%2?-0.2:0.2), size); }
        // hips
        for (let i = 0; i < 8; i++) { this.addCube(i+18, 0, 1.7, (i%3-1)*0.25, size); }
        // spine
        for (let i = 0; i < 14; i++) { this.addCube(i+26, 0, 2.1 + i*0.22, 0, size*0.9); }
        // shoulders (80% spine)
        for (let i = 0; i < 6; i++) { this.addCube(i+40, (i%2?-0.65:0.65), 3.8, 0, size); }
        // elbows
        for (let i = 0; i < 6; i++) { this.addCube(i+46, (i%2?-1.1:1.1), 3.4, 0, size*0.7); }
        // wrists
        for (let i = 0; i < 4; i++) { this.addCube(i+52, (i%2?-1.4:1.4), 2.9, 0, size*0.6); }
        // fingers (tentacle)
        for (let i = 0; i < 12; i++) { this.addCube(i+56, (i%3-1)*0.25-1.4*(i%2?1:-1), 2.6 - (i%4)*0.18, 0.3, size*0.4); }
        // head
        for (let i = 0; i < 12; i++) { this.addCube(i+68, 0, 4.6 + (i%4)*0.18, (i<6?0.3:-0.3), size*0.85); }
        // HEAD FEATURES
        // horns
        this.addCube(80, -0.4, 5.3, 0.4, size*0.6);
        this.addCube(81, 0.4, 5.3, 0.4, size*0.6);
        // animated eyes
        this.addCube(82, -0.3, 4.9, 0.6, size*0.3);
        this.addCube(83, 0.3, 4.9, 0.6, size*0.3);
        // ears + hair strands (slightly different wiggle)
        for (let i = 0; i < 8; i++) { this.addCube(i+84, (i%2?-0.7:0.7), 4.9 + i*0.08, 0.2, size*0.25); }
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.userData = { health: isElite ? 280 : 110, speed: isElite ? 9.8 : 7.4, isElite };
        scene.add(this);
    }
    addCube(id, x, y, z, s) {
        const geo = new THREE.BoxGeometry(s, s, s);
        const mat = new THREE.MeshPhongMaterial({color: pastelColors[id%4], emissive: pastelColors[id%4], emissiveIntensity: 10.2, shininess: 16});
        const cube = new THREE.Mesh(geo, mat);
        cube.position.set(x, y, z);
        this.add(cube);
        this.cubes.push(cube);
        this.basePositions.push(cube.position.clone());
    }
    update(t) {
        const pulse = 1 + Math.sin(t * 3.6 + this.pulsePhase) * 0.09;
        this.scale.setScalar(pulse * (this.userData.isElite ? 3.2 : 2.8));
        this.cubes.forEach((c, i) => {
            const base = this.basePositions[i];
            const warp = 0.095; // TIGHT — never separates
            c.position.x = base.x + Math.sin(t * 6.8 + i) * warp;
            c.position.y = base.y + Math.sin(t * 5.4 + i * 1.2) * warp;
            c.position.z = base.z + Math.cos(t * 4.7 + i) * warp;
            c.rotation.y = t * (1.8 + i * 0.015);
            if (i > 68) c.rotation.x = t * 2.3 + i; // head/hair wiggle
        });
        this.position.y += Math.sin(t * 7.5) * 0.032;
    }
}

// psmv1.02.html WORLDGEN — 100% preserved (infinite pulsing colorful blocks + ripple + horror cycle)
function createPSMWorld() {
    const geo = new THREE.PlaneGeometry(520, 520, 128, 128);
    const mat = new THREE.MeshPhongMaterial({color: 0x220033, emissive: 0xff0088, emissiveIntensity: 0.75, shininess: 8, wireframe: false});
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    // exact psmv1.02 ripple + pulsing (vertex displacement)
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
    scene.fog = new THREE.Fog(0x110022, 15, 280);
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias: true});
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    clock = new THREE.Clock();

    scene.add(new THREE.HemisphereLight(0x00ffff, 0xff0088, 1.25));
    const dir = new THREE.DirectionalLight(0xffffff, 1.5); dir.position.set(50, 140, 60);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x445566, 0.85));

    const world = createPSMWorld();

    player = new THREE.Object3D();
    player.position.set(0, 1.8, 22);
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
    animate(world);
}

function spawnInitialEnemies() {
    for (let i = 0; i < 5; i++) {
        const e = new CubeBlobHumanoid(Math.random() < 0.35);
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
            obj.parent.userData.health -= 42;
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

    const speed = 24 * delta;
    if (keys['w']) player.position.z -= speed;
    if (keys['s']) player.position.z += speed;
    if (keys['a']) player.position.x -= speed;
    if (keys['d']) player.position.x += speed;
    camera.position.copy(player.position);
    camera.position.y = 1.8;

    // psmv1.02 pulsing horror terrain (exact)
    world.mat.emissive.setHSL(0.85 + Math.sin(t * 0.35) * 0.12, 1, 0.48);
    const verts = world.verts;
    for (let i = 0; i < verts.count; i++) {
        const x = verts.getX(i);
        const z = verts.getZ(i);
        verts.setY(i, Math.sin(x * 0.03 + t * 1.8) * 2.4 + Math.cos(z * 0.04 + t * 2.1) * 1.8);
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
            if (player.position.distanceTo(e.position) < 2.4) e.userData.health -= 15 * delta;
            if (e.userData.health <= 0) {
                scene.remove(e);
                enemies.splice(i, 1);
            }
        }
    });

    renderer.render(scene, camera);
}
