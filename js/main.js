// full ncl loader
function createNeonCrystalLoader(parentElement) {
    if (!parentElement) return null;
    const STYLE_ID = 'neon-crystal-loader-css';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #rings-container { position:absolute; inset:0; overflow:hidden; perspective:1200px; }
            .loading-ring { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); border:2.5px solid rgba(255,255,255,0.12); border-radius:50%; animation:ringOrbit linear infinite; will-change:transform; }
            .ring-inner { width:188px; height:188px; animation-duration:10.8s; }
            .ring-mid { width:355px; height:355px; animation-duration:16.2s; }
            .ring-outer { width:518px; height:518px; animation-duration:23.5s; }
            @keyframes ringOrbit { from {transform:translate(-50%,-50%) rotate(0deg);} to {transform:translate(-50%,-50%) rotate(360deg);} }
            .loading-shape { position:absolute; left:50%; top:50%; width:54px; height:54px; filter:drop-shadow(0 0 22px currentColor); animation:shapeSpin 2.75s linear infinite; will-change:transform; }
            .loading-shape { transform:translate(-50%,-50%) rotate(var(--start-angle)) translateY(calc(-1 * var(--orbit-radius))) rotate(calc(-1 * var(--start-angle))); }
            @keyframes shapeSpin { from {transform:rotate(0deg);} to {transform:rotate(360deg);} }
            .loading-shape { background:conic-gradient(currentColor,#ffffff,currentColor); clip-path:polygon(50% 6%,88% 29%,94% 55%,82% 84%,50% 95%,18% 84%,6% 55%,13% 29%); box-shadow:0 0 12px #fff,0 0 28px currentColor,0 0 62px currentColor,inset 0 0 24px rgba(255,255,255,0.85); }
            #central-crystal { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:92px; height:195px; background:conic-gradient(#ff00ff,#00ffff,#ffff00,#00ff88,#ff0088,#0088ff,#8800ff,#ff00ff); clip-path:polygon(50% 0%,85% 20%,100% 50%,85% 80%,50% 100%,15% 80%,0% 50%,15% 20%); box-shadow:0 0 40px #fff,0 0 90px #00ffff,inset 0 0 60px #ffff00; animation:crystalRotateSmooth 18s linear infinite,crystalGlow 2.2s ease-in-out infinite alternate; z-index:20; will-change:transform,filter; }
            @keyframes crystalRotateSmooth { from {transform:translate(-50%,-50%) rotateY(0deg);} to {transform:translate(-50%,-50%) rotateY(360deg);} }
            @keyframes crystalGlow { from {filter:brightness(1) hue-rotate(0deg); box-shadow:0 0 40px #fff,0 0 90px #00ffff;} to {filter:brightness(2.2) hue-rotate(360deg); box-shadow:0 0 90px #fff,0 0 160px #ffff00,inset 0 0 110px #00ffff;} }
        `;
        document.head.appendChild(style);
    }
    let container = document.getElementById('rings-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'rings-container';
        parentElement.appendChild(container);
    }
    let crystal = document.getElementById('central-crystal');
    if (!crystal) {
        crystal = document.createElement('div');
        crystal.id = 'central-crystal';
        container.appendChild(crystal);
    }
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
    return { destroy: () => container.remove() };
}

// THREE.JS CORE + UPGRADED GAME
let scene, camera, renderer, clock, enemies = [], player, keys = {}, mouseDown = false;
const pastelColors = [0xff99cc, 0x99ffff, 0xffff99, 0xcc99ff];

class CubeBlobHumanoid extends THREE.Group {
    constructor(isElite) {
        super();
        this.cubes = [];
        const scale = isElite ? 0.85 : 0.55;
        for (let i = 0; i < 12; i++) {
            const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
            const mat = new THREE.MeshPhongMaterial({
                color: pastelColors[i % 4],
                emissive: pastelColors[i % 4],
                emissiveIntensity: 8.5,
                shininess: 12
            });
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
        this.userData = {
            health: 80 * (isElite ? 2.8 : 1),
            maxHealth: 80 * (isElite ? 2.8 : 1),
            speed: 8 * (isElite ? 1.15 : 1),
            isElite: isElite,
            walkPhase: Math.random() * Math.PI * 2
        };
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

    const loader = createNeonCrystalLoader(document.getElementById('ncl-crystal-loader'));
    setTimeout(() => {
        if (loader && loader.destroy) loader.destroy();
        document.getElementById('ncl-crystal-loader').style.opacity = '0';
    }, 1200);

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

    // player movement
    const speed = 18 * delta;
    if (keys['w']) player.position.z -= speed;
    if (keys['s']) player.position.z += speed;
    if (keys['a']) player.position.x -= speed;
    if (keys['d']) player.position.x += speed;
    camera.position.copy(player.position);
    camera.position.y = 1.6;

    // enemies update
    enemies.forEach((e, idx) => {
        if (e instanceof CubeBlobHumanoid) {
            e.update(delta, t);
            const dir = player.position.clone().sub(e.position);
            dir.y = 0;
            dir.normalize();
            e.position.x += dir.x * e.userData.speed * delta;
            e.position.z += dir.z * e.userData.speed * delta;
            if (player.position.distanceTo(e.position) < 1.8) {
                // damage logic stub - add your full damagePlayer if needed
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
