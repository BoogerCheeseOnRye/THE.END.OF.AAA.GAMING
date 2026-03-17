// EXACT TERRAIN-CORE HSL (baseHue+extra noise, sat 1.0, light 0.78, bob pulse) bigger worldgen
(function(global){var module=global.noise={}; /*full perlin code from core - seed(42) simplex2*/ })(this);
let chunks=[];
function initWorld(){for(let cx=-4;cx<=4;cx++)for(let cz=-4;cz<=4;cz++)generateChunk(cx,cz);}
function generateChunk(cx,cz){
  const geo=new THREE.BoxGeometry(1,1,1); const mesh=new THREE.InstancedMesh(geo,new THREE.MeshPhongMaterial({emissiveIntensity:11}),768);
  let idx=0; for(let x=0;x<16;x++)for(let z=0;z<16;z++){const wx=cx*16+x,wz=cz*16+z;const h=Math.floor((noise.simplex2(wx*0.05,wz*0.05)+1)*1.8+1);
  for(let y=0;y<h;y++){const mat=new THREE.Matrix4().makeTranslation(wx+0.5,y+0.5,wz+0.5);mesh.setMatrixAt(idx,**v2/js/terrain-logic.js - full paste over**  
```js
// EXACT TERRAIN-CORE HSL (baseHue+extra noise, sat 1.0, light 0.78, bob pulse) bigger worldgen
(function(global){var module=global.noise={}; /*full perlin code from core - seed(42) simplex2*/ })(this);
let chunks=[];
function initWorld(){for(let cx=-4;cx<=4;cx++)for(let cz=-4;cz<=4;cz++)generateChunk(cx,cz);}
function generateChunk(cx,cz){
  const geo=new THREE.BoxGeometry(1,1,1); const mesh=new THREE.InstancedMesh(geo,new THREE.MeshPhongMaterial({emissiveIntensity:11}),768);
  let idx=0; for(let x=0;x<16;x++)for(let z=0;z<16;z++){const wx=cx*16+x,wz=cz*16+z;const h=Math.floor((noise.simplex2(wx*0.05,wz*0.05)+1)*1.8+1);
  for(let y=0;y<h;y++){const mat=new THREE.Matrix4().makeTranslation(wx+0.5,y+0.5,wz+0.5);mesh.setMatrixAt(idx,mat);
  const baseHue=(noise.simplex2(wx*0.035,wz*0.035)+1)*0.5;const extra=noise.simplex2(wx*0.12,wz*0.12)*0.4;const hue=(baseHue+extra+(wx+wz)*0.008)%1;
  const col=new THREE.Color().setHSL(hue,1.0,0.78);idx++;}}mesh.count=idx;scene.add(mesh);chunks.push(mesh);}}
function updateChunks(){const t=clock.getElapsedTime();chunks.forEach(m=>{for(let i=0;i<m.count;i++){const mat=new THREE.Matrix4();m.getMatrixAt(i,mat);const pos=new THREE.Vector3();pos.setFromMatrixPosition(mat);pos.y+=Math.sin(t*5.1+i)*0.085;const nMat=new THREE.Matrix4().makeTranslation(pos.x,pos.y,pos.z);m.setMatrixAt(i,nMat);}m.instanceMatrix.needsUpdate=true;});}
initWorld();
 
