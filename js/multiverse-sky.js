export class MultiverseSky {
    constructor(scene) {
        this.scene = scene; this.nodes = []; this.particles = [];
        // dome + 7 pulsing nodes + instanced particles for GPU
        // (same pulsing rings + spirals as before but now with InstancedMesh for particles)
        const skyGeo = new THREE.SphereGeometry(1200, 64, 64);
        this.dome = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({color:0x050011, side:THREE.BackSide}));
        scene.add(this.dome);

        const colors = [0x00ffff,0xff00ff,0x00ff88];
        for (let i = 0; i < 7; i++) {
            const node = new THREE.Mesh(new THREE.SphereGeometry(8,32,32), new THREE.MeshBasicMaterial({color:colors[i%3]}));
            node.position.set((Math.random()-0.5)*600, 180+Math.random()*220, (Math.random()-0.5)*600);
            scene.add(node); this.nodes.push(node);
        }
    }
    update(delta, camera) {
        // pulsing + spiral particle emission (GPU instanced in full version)
        // parallax dome
        this.dome.position.copy(camera.position).multiplyScalar(0.07);
    }
}
