let scene, camera, renderer, clock, enemies = [], player, keys = {}, isGameRunning = false;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];

function createNeonCrystalLoader(parentElement) {
    const container = document.createElement('div');
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

class CubeBlobHumanoid extends THREE.Group {
    constructor(isElite) {
        super();
        this.cubes = [];
        this.basePositions = [];
        const numCubes = isElite ? 180 : 68;
        const pastel = pastelColors;
        for (let i = 0; i < numCubes; i++) {
            const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
            const mat = new THREE.MeshPhongMaterial({
                color: pastel[i % 4],
                emissive: pastel[i % 4],
                emissiveIntensity: 9.5,
                shininess: 15
            });
            const cube = new THREE.Mesh(geo, mat);
            let x = (Math.random() - 0.5) * 1.2;
            let y = 0.6 + (i % 18) * 0.22;
            let z = (Math.random() - 0.5) * 1.2;
            if (i < 30) y += 0.8; // torso stack
            else if (i < 45) { x = i % 2 ? -0.7 : 0.7; y = 1.4; } // arms
            else if (i < 60) { x = i % 2 ? -0.5 : 0.5; y = 0.4; } // legs
            else if (i < 70) y = 2.1; // head
            cube.position.set(x, y, z);
            this.basePositions.push(cube.position.clone());
            this.add(cube);
            this.cubes.push(cube);
        }
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.userData = { health: isElite ? 240 : 95, maxHealth: isElite ? 240 : 95, speed: isElite ? 9.5 : 7.2, isElite };
        scene.add(this);
    }
    update(delta, t) {
        const pulse = 1 + Math.sin(t * 4.2 + this.pulsePhase) * 0.11;
        this.scale.setScalar(pulse);
        this.cubes.forEach((c, i) => {
            const base = this.basePositions[i];
            const warpX = Math.sin(t * 6.8 + i) * 0.09;
            const warpY = Math.sin(t * 5.3 + i * 1.4) * 0.13;
            const warpZ = Math.cos(t * 4.1 + i * 0.8) * 0.07;
            c.position.x = base.x + warpX;
            c.position.y = base.y + warpY;
            c.position.z = base.z + warpZ;
            c.rotation.y = t * (1.9 + i * 0.03);
            if (i > 60) c.rotation.x = t * 2.4 + i;
        });
        this.position.y += Math.sin(t * 9) * 0.035;
    }
}

function createTerrain() {
    const terrain = new THREE.Group();
    const floorGeo = new THREE.PlaneGeometry(400, 400, 128, 128);
    const floorMat = new THREE.MeshPhongMaterial({color: 0x112233, emissive: 0x00ffff, emissiveIntensity: 0.3, shininess: 8});
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    terrain.add(floor);
    scene.add(terrain);
    return terrain;
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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas'), antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    clock = new THREE.Clock();

    scene.add(new THREE.HemisphereLight(0x00ffff, 0xff00aa, 0.9));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(30, 120, 40);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x334455, 0.7));

    createTerrain();

    player = new THREE.Object3D();
    player.position.set(0, 1.6, 15);
    camera.position.set(0, 1.6, 15);
    scene.add(player);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    document.addEventListener('mousedown', shoot);

    spawnInitialEnemies();
    animate();
}

function spawnInitialEnemies() {
    for (let i = 0; i < 5; i++) {
        const enemy = new CubeBlobHumanoid(Math.random() < 0.35);
        enemy.position.set((Math.random() - 0.5) * 70, 1, (Math.random() - 0.5) * 70);
        enemies.push(enemy);
    }
}

function spawnEnemies() {
    if (enemies.length < 7 && Math.random() < 0.04) {
        const enemy = new CubeBlobHumanoid(Math.random() < 0.35);
        enemy.position.set(player.position.x + (Math.random() - 0.5) * 50, 1, player.position.z + (Math.random() - 0.5) * 50);
        enemies.push(enemy);
    }
}

function shoot() {
    if (!isGameRunning) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(enemies, true);
    if (intersects.length > 0) {
        let target = intersects[0].object;
        while (target && !(target.parent instanceof CubeBlobHumanoid)) target = target.parent;
        if (target && target.parent.userData.health) {
            target.parent.userData.health -= 35;
            if (target.parent.userData.health <= 0) {
                scene.remove(target.parent);
                enemies.splice(enemies.indexOf(target.parent), 1);
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!isGameRunning) return;
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    const speed = 22 * delta;
    if (keys['w']) player.position.z -= speed;
    if (keys['s']) player.position.z += speed;
    if (keys['a']) player.position.x -= speed;
    if (keys['d']) player.position.x += speed;
    camera.position.copy(player.position);
    camera.position.y = 1.6;

    enemies.forEach((e, idx) => {
        if (e instanceof CubeBlobHumanoid) {
            e.update(delta, t);
            const dir = player.position.clone().sub(e.position).normalize();
            dir.y = 0;
            e.position.x += dir.x * e.userData.speed * delta;
            e.position.z += dir.z * e.userData.speed * delta;
            if (player.position.distanceTo(e.position) < 2.2) e.userData.health -= 12 * delta;
            if (e.userData.health <= 0) {
                scene.remove(e);
                enemies.splice(idx, 1);
            }
        }
    });

    spawnEnemies();
    renderer.render(scene, camera);
}
