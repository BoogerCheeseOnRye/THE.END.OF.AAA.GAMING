// ====================== PERLIN NOISE ======================
        (function(global){
            var module = global.noise = {};
            function Grad(x, y, z) { this.x = x; this.y = y; this.z = z; }
            Grad.prototype.dot2 = function(x, y) { return this.x*x + this.y*y; };
            var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
                        new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
                        new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];
            var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
                     23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
                     174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
                     133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
                     18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,
                     38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,
                     2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,
                     112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,
                     49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,
                     67,29,24,72,243,141,128,195,78,66,215,61,156,180];
            var perm = new Array(512), gradP = new Array(512);
            module.seed = function(seed) {
                if(seed > 0 && seed < 1) seed *= 65536;
                seed = Math.floor(seed);
                if(seed < 256) seed |= seed << 8;
                for(var i = 0; i < 256; i++) {
                    var v = i & 1 ? p[i] ^ (seed & 255) : p[i] ^ ((seed>>8) & 255);
                    perm[i] = perm[i + 256] = v;
                    gradP[i] = gradP[i + 256] = grad3[v % 12];
                }
            };
            module.seed(42);
            var F2 = 0.5*(Math.sqrt(3)-1), G2 = (3-Math.sqrt(3))/6;
            module.simplex2 = function(xin, yin) {
                var n0,n1,n2; var s = (xin+yin)*F2; var i = Math.floor(xin+s), j = Math.floor(yin+s);
                var t = (i+j)*G2; var x0 = xin-i+t, y0 = yin-j+t;
                var i1,j1 = x0>y0 ? (i1=1,j1=0) : (i1=0,j1=1);
                var x1 = x0-i1+G2, y1 = y0-j1+G2, x2 = x0-1+2*G2, y2 = y0-1+2*G2;
                i&=255; j&=255;
                var gi0 = gradP[i+perm[j]], gi1 = gradP[i+i1+perm[j+j1]], gi2 = gradP[i+1+perm[j+1]];
                var t0 = 0.5 - x0*x0-y0*y0; n0 = t0<0 ? 0 : (t0*=t0, t0*t0*gi0.dot2(x0,y0));
                var t1 = 0.5 - x1*x1-y1*y1; n1 = t1<0 ? 0 : (t1*=t1, t1*t1*gi1.dot2(x1,y1));
                var t2 = 0.5 - x2*x2-y2*y2; n2 = t2<0 ? 0 : (t2*=t2, t2*t2*gi2.dot2(x2,y2));
                return 70 * (n0 + n1 + n2);
            };
        })(this);

        // ====================== CONSTANTS ======================
        const BLOCK_SIZE = 1;
        const CHUNK_SIZE = 16;
        const VIEW_DISTANCE = 6;
        const WORLD_HEIGHT = 3;
        const GRAVITY = -28;
        const JUMP = 12;
        const BASE_SPEED = 11;
        const SPRINT_SPEED = 22;
        const CROUCH_SPEED = 7;
        const NORMAL_HEIGHT = 1.8;
        const CROUCH_HEIGHT = 1.0;
        const AMPLITUDE = 0.35;

        // ====================== POWERUP DEFINITIONS ======================
        const POWERUPS = {
            megabonk: { name: "MEGABONK", baseHue: 0.85, meshType: "tetra", effect: "jump", multiplier: 2.8, duration: 10000 },
            neonrush: { name: "NEON RUSH", baseHue: 0.55, meshType: "cube", effect: "speed", multiplier: 2.2, duration: 9000 },
            chromaleap: { name: "CHROMA LEAP", baseHue: 0.15, meshType: "octa", effect: "jump", multiplier: 2.0, duration: 11000 }
        };

        // ====================== FIXED POWERUP SPOTS ======================
        const FIXED_SPAWN_OFFSETS = [
            {x: 22, z: 18},
            {x: -25, z: 32},
            {x: 38, z: -15},
            {x: -12, z: -28},
            {x: 45, z: 45}
        ];

        let powerupSpots = [];

        // ====================== THREE.JS SETUP ======================
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0022, 20, 110);

        const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 200);
        camera.position.set(8, 12, 8);

        const renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio,2));
        document.body.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0x4040ff, 0.7));
        const sun = new THREE.DirectionalLight(0xff40ff, 1.4);
        sun.position.set(50, 80, 30);
        scene.add(sun);

        // ====================== MOUSE LOCK ======================
        const overlay = document.getElementById('overlay');
        let yaw = -2.3, pitch = -0.4;
        let locked = false;

        function startGame() { renderer.domElement.requestPointerLock(); }
        overlay.addEventListener('click', startGame);
        document.addEventListener('click', () => { if (!locked) startGame(); });
        document.addEventListener('pointerlockchange', () => {
            locked = document.pointerLockElement === renderer.domElement;
            if (locked) overlay.classList.add('hidden');
            else overlay.classList.remove('hidden');
        });
        document.addEventListener('mousemove', e => {
            if (!locked) return;
            yaw -= e.movementX * 0.0018;
            pitch -= e.movementY * 0.0018;
            pitch = Math.max(-1.4, Math.min(1.3, pitch));
        });

        // ====================== KEYBOARD ======================
        const keys = {};
        window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

        // ====================== SHADER ======================
        const blockMaterial = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `
                attribute vec3 instanceColor;
                attribute float instanceOffset;
                uniform float uTime;
                varying vec3 vColor;
                void main() {
                    float pulse = 0.75 + 0.25 * sin(uTime * 3.0 + instanceOffset * 4.0);
                    vColor = instanceColor * pulse;
                    float bob = sin(uTime * 2.0 + instanceOffset) * ${AMPLITUDE};
                    vec3 pos = position + vec3(0.0, bob, 0.0);
                    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `varying vec3 vColor; void main(){ gl_FragColor = vec4(vColor, 1.0); }`
        });

        // ====================== CHUNKS ======================
        const chunks = new Map();
        function getKey(cx, cz) { return cx + ',' + cz; }
        function generateChunk(cx, cz) {
            const count = CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT;
            const geo = new THREE.BoxGeometry(1,1,1);
            const offsets = new Float32Array(count);
            const colors = new Float32Array(count * 3);
            const mesh = new THREE.InstancedMesh(geo, blockMaterial, count);
            let idx = 0;
            for (let x = 0; x < CHUNK_SIZE; x++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const wx = cx * CHUNK_SIZE + x;
                    const wz = cz * CHUNK_SIZE + z;
                    const h = Math.floor((noise.simplex2(wx*0.05, wz*0.05) + 1) * 1.8 + 1);
                    for (let y = 0; y < h; y++) {
                        const matrix = new THREE.Matrix4().makeTranslation(wx + 0.5, y + 0.5, wz + 0.5);
                        mesh.setMatrixAt(idx, matrix);
                        const baseHue = (noise.simplex2(wx*0.035, wz*0.035) + 1) * 0.5;
                        const extra = noise.simplex2(wx*0.12, wz*0.12) * 0.4;
                        const hue = (baseHue + extra + (wx + wz) * 0.008) % 1;
                        const col = new THREE.Color().setHSL(hue, 1.0, 0.78);
                        colors[idx*3] = col.r; colors[idx*3+1] = col.g; colors[idx*3+2] = col.b;
                        offsets[idx] = Math.random() * Math.PI * 2;
                        idx++;
                    }
                }
            }
            mesh.count = idx;
            mesh.geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets, 1));
            mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
            scene.add(mesh);
            return {mesh, cx, cz};
        }
        function updateChunks() {
            const cx = Math.floor(camera.position.x / CHUNK_SIZE);
            const cz = Math.floor(camera.position.z / CHUNK_SIZE);
            for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
                for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
                    const key = getKey(cx+dx, cz+dz);
                    if (!chunks.has(key)) chunks.set(key, generateChunk(cx+dx, cz+dz));
                }
            }
            for (const [key, chunk] of chunks) {
                if (Math.abs(chunk.cx - cx) > VIEW_DISTANCE + 1 || Math.abs(chunk.cz - cz) > VIEW_DISTANCE + 1) {
                    scene.remove(chunk.mesh);
                    chunks.delete(key);
                }
            }
        }

        // ====================== POWERUP SYSTEM (DEEP BLACK BODY + NEON GLOW) ======================
        function createPowerupMesh(type) {
            const def = POWERUPS[type];
            let geo;
            if (def.meshType === "tetra") geo = new THREE.TetrahedronGeometry(1.3, 0);
            else if (def.meshType === "cube") geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
            else geo = new THREE.OctahedronGeometry(1.3, 0);

            // DEEP BLACK BODY (explicit RGB near-black — no white ever)
            const darkBase = new THREE.Color(0.03, 0.03, 0.03);

            // BRIGHT NEON EMISSIVE
            const neonEmissive = new THREE.Color().setHSL(def.baseHue, 1.0, 0.95);

            const mat = new THREE.MeshPhongMaterial({
                color: darkBase,
                emissive: neonEmissive,
                emissiveIntensity: 9.5,
                shininess: 30,
                specular: 0x111111
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.userData.type = type;
            mesh.userData.baseHue = def.baseHue;

            // Strong neon edge halo (bright)
            const halo = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
                color: neonEmissive,
                transparent: true,
                opacity: 0.48,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            }));
            halo.scale.set(1.25, 1.25, 1.25);
            mesh.add(halo);
            mesh.userData.halo = halo;

            return mesh;
        }

        function spawnAtSpot(spot) {
            if (spot.mesh) return;
            const types = Object.keys(POWERUPS);
            const type = types[Math.floor(Math.random() * types.length)];
            const mesh = createPowerupMesh(type);
            mesh.position.copy(spot.basePos);
            scene.add(mesh);
            spot.mesh = mesh;
            spot.type = type;
            spot.velY = 0;
            spot.bounceCount = 0;
            spot.lastSin = 0;
        }

        let activePowerups = [];

        function updatePowerupUI() {
            const container = document.getElementById('powerup-ui');
            container.innerHTML = '';
            activePowerups.forEach(p => {
                const def = POWERUPS[p.type];
                const div = document.createElement('div');
                div.className = 'powerup-icon';
                div.style.borderColor = new THREE.Color().setHSL(def.baseHue, 1, 0.7).getStyle();
                div.style.boxShadow = `0 0 30px ${new THREE.Color().setHSL(def.baseHue, 1, 0.7).getStyle()}`;
                div.textContent = def.name[0];
                container.appendChild(div);
            });
        }

        // ====================== PLAYER PHYSICS ======================
        let velY = 0;
        let onGround = false;

        function updatePlayer(dt, t) {
            if (!locked) return;

            velY -= 38 * dt;
            camera.position.y += velY * dt;

            let speedMult = 1;
            let jumpMult = 1;
            activePowerups = activePowerups.filter(p => p.endTime > t);
            activePowerups.forEach(p => {
                const def = POWERUPS[p.type];
                if (def.effect === "speed") speedMult *= def.multiplier;
                if (def.effect === "jump") jumpMult *= def.multiplier;
            });

            const currentSpeed = (keys['shift'] ? SPRINT_SPEED : (keys['control'] ? CROUCH_SPEED : BASE_SPEED)) * speedMult;
            const playerHeight = keys['control'] ? CROUCH_HEIGHT : NORMAL_HEIGHT;
            const currentJump = JUMP * jumpMult;

            onGround = false;
            const px = Math.floor(camera.position.x);
            const pz = Math.floor(camera.position.z);
            const feetY = camera.position.y - playerHeight;

            for (const chunk of chunks.values()) {
                for (let i = 0; i < chunk.mesh.count; i++) {
                    const mat = new THREE.Matrix4();
                    chunk.mesh.getMatrixAt(i, mat);
                    const pos = new THREE.Vector3();
                    pos.setFromMatrixPosition(mat);
                    if (Math.abs(pos.x - px) > 3 || Math.abs(pos.z - pz) > 3) continue;
                    const bob = Math.sin(t * 2 + (i % 37)) * AMPLITUDE;
                    const blockTop = pos.y + 0.5 + bob;
                    if (Math.abs(camera.position.x - pos.x) < 0.8 && Math.abs(camera.position.z - pos.z) < 0.8 &&
                        feetY < blockTop + 0.05 && feetY > blockTop - 0.6) {
                        camera.position.y = blockTop + playerHeight;
                        velY = 0;
                        onGround = true;
                    }
                }
            }

            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0; forward.normalize();
            const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), forward);

            let dx = 0, dz = 0;
            if (keys['w']) { dx += forward.x; dz += forward.z; }
            if (keys['s']) { dx -= forward.x; dz -= forward.z; }
            if (keys['a']) { dx -= right.x; dz -= right.z; }
            if (keys['d']) { dx += right.x; dz += right.z; }
            const len = Math.hypot(dx, dz);
            if (len > 0) { dx /= len; dz /= len; }

            camera.position.x += dx * currentSpeed * dt;
            camera.position.z += dz * currentSpeed * dt;

            if (onGround && keys[' ']) velY = currentJump;
            if (camera.position.y < -10) camera.position.set(8, 12, 8);

            // ====================== POWERUP GLOW + COLOR SHIFT + ROTATION ======================
            for (let i = 0; i < powerupSpots.length; i++) {
                const spot = powerupSpots[i];
                if (!spot.mesh) continue;

                spot.mesh.rotation.x = t * 1.4;
                spot.mesh.rotation.y = t * 2.1;
                spot.mesh.rotation.z = t * 0.9;

                // COLOR GRADIENT WASH (only on emissive + halo — base stays dark black)
                const shift = Math.sin(t * 1.8) * 0.12;
                const hue = (POWERUPS[spot.type].baseHue + shift + 1) % 1;
                const col = new THREE.Color().setHSL(hue, 1.0, 0.95);

                spot.mesh.material.emissive.copy(col);
                if (spot.mesh.userData.halo) {
                    spot.mesh.userData.halo.material.color.copy(col);
                }

                // Bounce
                const sinVal = Math.sin(t * 2 + (spot.basePos.x + spot.basePos.z) * 0.3);
                if (sinVal > 0.82 && spot.lastSin <= 0.82) {
                    spot.velY = 11.5;
                    spot.bounceCount = 0;
                }
                spot.lastSin = sinVal;

                if (spot.velY !== 0 || spot.mesh.position.y > spot.basePos.y + 2.8) {
                    spot.velY -= 38 * dt;
                    spot.mesh.position.y += spot.velY * dt;
                    const floor = spot.basePos.y + Math.sin(t * 2 + (spot.basePos.x + spot.basePos.z) * 0.3) * AMPLITUDE + 2.8;
                    if (spot.mesh.position.y < floor) {
                        spot.mesh.position.y = floor;
                        spot.velY = -spot.velY * 0.74;
                        spot.bounceCount++;
                        if (spot.bounceCount >= 2) spot.velY *= 0.4;
                    }
                } else {
                    const floor = spot.basePos.y + Math.sin(t * 2 + (spot.basePos.x + spot.basePos.z) * 0.3) * AMPLITUDE + 2.8;
                    spot.mesh.position.y = floor;
                }
            }

            // collection
            for (let i = 0; i < powerupSpots.length; i++) {
                const spot = powerupSpots[i];
                if (spot.mesh) {
                    const dist = camera.position.distanceTo(spot.mesh.position);
                    if (dist < 1.0) {
                        const def = POWERUPS[spot.type];
                        activePowerups.push({type: spot.type, endTime: t + def.duration});
                        scene.remove(spot.mesh);
                        spot.mesh = null;
                        spot.type = null;
                        spot.respawnAt = t + 18000;
                        updatePowerupUI();
                    }
                }
                if (!spot.mesh && t > spot.respawnAt && spot.respawnAt > 0) {
                    spawnAtSpot(spot);
                }
            }
        }

        // ====================== MAIN LOOP ======================
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1);
            const t = clock.getElapsedTime();

            blockMaterial.uniforms.uTime.value = t;

            if (locked) updatePlayer(dt, t);
            updateChunks();

            if (powerupSpots.length === 0 && chunks.size > 8) {
                FIXED_SPAWN_OFFSETS.forEach(offset => {
                    let y = 0;
                    for (const chunk of chunks.values()) {
                        for (let i = 0; i < chunk.mesh.count; i++) {
                            const mat = new THREE.Matrix4();
                            chunk.mesh.getMatrixAt(i, mat);
                            const pos = new THREE.Vector3();
                            pos.setFromMatrixPosition(mat);
                            if (Math.abs(pos.x - offset.x) < 1 && Math.abs(pos.z - offset.z) < 1 && pos.y > y) y = pos.y;
                        }
                    }
                    const basePos = new THREE.Vector3(offset.x, y + 2.8, offset.z);
                    powerupSpots.push({ basePos, mesh: null, type: null, respawnAt: 0, velY: 0, bounceCount: 0, lastSin: 0 });
                });
                powerupSpots.forEach(spot => spawnAtSpot(spot));
            }

            camera.rotation.order = 'YXZ';
            camera.rotation.y = yaw;
            camera.rotation.x = pitch;

            const bg = 0.04 + 0.06 * Math.sin(t * 0.7);
            scene.background = new THREE.Color(bg, 0, bg * 1.6);
            scene.fog.color.copy(scene.background);

            renderer.render(scene, camera);
        }

        function spawnAtSpot(spot) {
            const types = Object.keys(POWERUPS);
            const type = types[Math.floor(Math.random() * types.length)];
            const mesh = createPowerupMesh(type);
            mesh.position.copy(spot.basePos);
            scene.add(mesh);
            spot.mesh = mesh;
            spot.type = type;
            spot.velY = 0;
            spot.bounceCount = 0;
            spot.lastSin = 0;
        }

        window.addEventListener('resize', () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        });

        animate();
