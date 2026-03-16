export class AcidDreamEnemy {
    constructor(scene, pos) {
        this.group = new THREE.Group(); this.group.position.copy(pos); scene.add(this.group);
        this.instancedCubes = new THREE.InstancedMesh(new THREE.BoxGeometry(3.5,3.5,3.5), new THREE.MeshPhongMaterial({color:0x8800ff, emissive:0x4400aa}), 220);
        this.group.add(this.instancedCubes);
        // matrix updates for morphing + ground merge in update()
    }
    update(delta, playerPos) {
        // shamble toward player + acid morph on instanced matrices + leg sink into terrain
    }
}
