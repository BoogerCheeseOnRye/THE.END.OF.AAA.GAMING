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
        this.scale.setScalar(isElite ? 4.2 : 3.8); // MUCH LARGER
        const numCubes = isElite ? 920 : 420;
        const size = 0.52; // bigger cubes to fill gaps
        // dense connected skeleton + hair/spikes/weapon
        for (let i = 0; i < numCubes; i++) {
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshPhongMaterial({color: pastelColors[i % 4], emissive: pastelColors[i % 4], emissiveIntensity: 10.5, shininess: 18});
            const cube = new THREE.Mesh(geo, mat);
            let x = ((i % 8) - 3.5) * 0.22;
            let y = 0.4 + Math.floor(i / 8) * 0.22;
            let z = (Math.random() - 0.5) * 0.09;
            // skeleton build (tight spacing)
            if (i < 32) y = 0.1; // feet
            else if (i < 48) { x *= 0.6; y = 0.7; } // ankles
            else if (i < 68) y = 1.3; // knees
            else if (i < 92) y = 1.9; // hips
            else if (i < 160) y = 2.4 + (i % 18) * 0.19; // spine
            else if (i < 200) { x = (i % 2 ? -0.85 : 0.85); y = 4.1; } // shoulders
            else if (i < 260) { x = (i % 2 ? -1.3 : 1.3); y = 3.6; } // arms
            else if (i < 300) { x = (i % 2 ? -1.6 : 1.6); y = 2.9; } // wrists
            else if (i < 380) { x = (i % 4 - 1.5) * 0.3; y = 2.6; z += 0.4; } // fingers + weapon staff
            else if (i < 440) y = 5.1; // head
            else if (i < 520) { x = (i % 2 ? -0.9 : 0.9); y = 5.4; } // horns/spikes
            else if (i < 620) { x = (i % 3 - 1) * 0.25; y = 5.6 + i % 8 * 0.08; } // hair strands
            cube.position.set(x, y, z);
            this.basePositions.push(cube.position.clone());
            this.add(cube);
            this.cubes.push(cube);
        }
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.userData = { health: isElite ? 320 : 120, speed: isElite ? 9.4 : 7.1, isElite, walkPhase: Math.random() * Math.PI * 2 };
        scene.add(this);
    }
    update(t) {
        const pulse = 1 + Math.sin(t * 3.4 + this.pulsePhase) * 0.085;
        this.scale.setScalar(pulse * (this.userData.isElite ? 4.2 : 3.8));
        this.cubes.forEach((c, i) => {
            const base = this.basePositions[i];
            const warp = 0.078; // tight fill
            c.position.x = base.x + Math.sin(t * 6.4 + i) * warp;
            c.position.y = base.y + Math.sin(t * 5.1 + i * 1.1) * warp;
            c.position.z = base.z + Math.cos(t * 4.2 + i) * warp;
            c.rotation.y = t * (1.6 + i * 0.012);
            if (i > 380) c.rotation.x = t * 2.1 + i; // hair/spikes wiggle
            // rainbow cycling on every cube
            c.material.emissive.setHSL((t * 1.2 + i * 0.3) % 1, 1, 0.85);
            // smooth walking stride
            if (i < 68 && i > 32) c.position.y += Math.sin(t * 12 + this.userData.walkPhase) * 0.09; // legs
        });
        this.position.y += Math.sin(t * 7.2) * 0.035;
    }
}

// psmv1.02 WORLDGEN — 100% untouched + forced visible
function createPSMWorld() {
    const geo = new THREE.PlaneGeometry(520, 520, 128, 128);
    const mat = new THREE.MeshPhongMaterial({color: 0x220033, emissive: 0xff0088, emissiveIntensity: 1.35, shininess: 10});
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
    scene.fog = new THREE.Fog(0x110022, 12, 260);
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias: true});
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    clock = new THREE.Clock();

    scene.add(new THREE.HemisphereLight(0x00ffff, 0xff0088, 1.35));
    const dir = new THREE.DirectionalLight(0xffffff, 1.6); dir.position.set(50, 140, 60);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x445566, 0.9));

    const world = createPSMWorld();

    player = new THREE.Object3D();
    player.position.set(0, 1.85, 24);
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
        e.position.set((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100);
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

    const speed = 25 * delta;
    if (keys['w']) player.position.z -= speed;
    if (keys['s']) player.position.z += speed;
    if (keys['a']) player.position.x -= speed;
    if (keys['d']) player.position.x += speed;
    camera.position.copy(player.position);
    camera.position.y = 1.85;

    // psmv1.02 pulsing terrain — exact + visible
    world.mat.emissive.setHSL(0.84 + Math.sin(t * 0.38) * 0.11, 1, 0.52);
    const verts = world.verts;
    for (let i = 0; i < verts.count; i++) {
        const x = verts.getX(i);
        const z = verts.getZ(i);
        verts.setY(i, Math.sin(x * 0.028 + t * 1.9) * 2.8 + Math.cos(z * 0.035 + t * 2.3) * 2.1);
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
