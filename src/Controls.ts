import * as THREE from 'three';

export class Controls {
  camera: THREE.Camera
  canvas: HTMLElement

  inertia = new THREE.Vector2(0,0);
  dragging = false;
  enabled = true;

  constructor(camera : THREE.Camera, canvas : HTMLElement) {
    this.camera = camera
    this.canvas = canvas

    document.addEventListener('touchstart', this.moveDrag.bind(this));
    document.addEventListener('mousedown', this.moveDrag.bind(this));
  }

  update() {
    if(this.inertia.length() < .001) return;


    this.inertia.multiplyScalar(.9);
    if (!this.dragging){
      const cameraRotationEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion);
      const cameraRotationMatrix = new THREE.Matrix4().makeRotationFromEuler(cameraRotationEuler);
      const cameraForward = new THREE.Vector3(0, 0, -1).applyMatrix4(cameraRotationMatrix);
      
      this.camera.rotation.y += this.inertia.x;
      this.camera.position.add(cameraForward.clone().multiplyScalar(this.inertia.y));
    }

    if(this.inertia.length() < .001) this.inertia.set(0,0);
  }

  moveDrag(ev: TouchEvent | MouseEvent) {
    if (!this.enabled) return true;
    this.dragging = true;
    // Get clientX for either TouchEvent or MouseEvent:
    let lastPosition = this.getScreenPosition(ev);

    const listener = (ev: MouseEvent | TouchEvent) => {
      if (!this.enabled) return;

      const cameraRotationEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion);
      const cameraRotationMatrix = new THREE.Matrix4().makeRotationFromEuler(cameraRotationEuler);
      const cameraForward = new THREE.Vector3(0, 0, -1).applyMatrix4(cameraRotationMatrix);
  
      const position = this.getScreenPosition(ev);

      const diffX = position.x - lastPosition.x;  
      const diffY = position.y - lastPosition.y;

      lastPosition.set(position.x, position.y);

      // Figure out the horizontal FOV based on vFov and aspect ratio:
      let vFov = 80;
      let aspect = window.innerWidth / window.innerHeight;
      const hFov = aspect * vFov + 25;

      const dist = diffY * .008 / aspect;
      this.camera.position.add(cameraForward.clone().multiplyScalar(dist));

      let pixelsPerRotation = window.innerWidth / hFov;
      let diffDegX = (diffX / pixelsPerRotation) * Math.PI / 180;
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y += diffDegX;

      this.inertia.x = diffDegX;
      this.inertia.y = dist;

      // this.camera.rotation.x += diffDegY * .8;
      // this.camera.rotation.x = THREE.MathUtils.clamp(this.camera.rotation.x, this.minPhi, this.maxPhi);
    };
    document.body.addEventListener('touchmove', listener);
    document.body.addEventListener('mousemove', listener);

    document.body.addEventListener('mouseup', (ev) => {
      this.dragging = false;
      document.body.removeEventListener('mousemove', listener);
      document.body.removeEventListener('touchmove', listener);
    }, { once: true });
    document.body.addEventListener('touchend', (ev) => {
      this.dragging = false;
      document.body.removeEventListener('mousemove', listener);
      document.body.removeEventListener('touchmove', listener);
    }, { once: true });

    //ev.preventDefault();
    return true;
  }

  getScreenPosition(ev: MouseEvent | TouchEvent) {
    let clientX, clientY;
    if(ev instanceof TouchEvent) {
      if( ev.touches && ev.touches.length > 0) {
        clientX = ev.touches[0].clientX;
        clientY = ev.touches[0].clientY;
      } else if( ev.changedTouches && ev.changedTouches.length > 0) {
        clientX = ev.changedTouches[0].clientX;
        clientY = ev.changedTouches[0].clientY;
      } else {
        console.error("Got a touch event with no touches or changedTouches!")
      }
    } else {
      clientX = ev.clientX;
      clientY = ev.clientY;
    }

    return new THREE.Vector2(clientX, clientY);
  }
}