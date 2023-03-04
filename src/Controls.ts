import * as THREE from 'three';

export class Controls {
  camera: THREE.Camera
  canvas: HTMLElement

  constructor(camera : THREE.Camera, canvas : HTMLElement) {
    this.camera = camera
    this.canvas = canvas

    // Set up the orbit controls
    this.initControls();
  }

  maxSpeed = .8;
  thrust = .01;
  enabled = true;
  minPhi = -Math.PI / 2;
  maxPhi = Math.PI / 2;
  thrustVector = new THREE.Vector3();

  keyState = {
    "W":false,
    "A":false,
    "S":false,
    "D":false,
    "Q":false,
    "E":false,
  };


  initControls() {
    document.addEventListener('touchstart', this.moveDrag.bind(this));
    document.addEventListener('mousedown', this.moveDrag.bind(this));
    document.addEventListener('keydown', this.keydown.bind(this));

    document.body.addEventListener('keyup', (ev) => {
        this.keyState[ev.key.toUpperCase()] = false;  
    });
  }

  keydown(ev: KeyboardEvent) : void{
    // Move using WASD keys:
    if (!this.enabled) return;
    const key = ev.key;
    this.keyState[key.toUpperCase()] = true;
  }

  update() {
    const cameraRotation = this.camera.quaternion;
    const cameraRotationEuler = new THREE.Euler().setFromQuaternion(cameraRotation);
    const cameraRotationMatrix = new THREE.Matrix4().makeRotationFromEuler(cameraRotationEuler);
    const cameraForward = new THREE.Vector3(0, 0, -1).applyMatrix4(cameraRotationMatrix);
    const cameraRight = new THREE.Vector3(1, 0, 0).applyMatrix4(cameraRotationMatrix);
    const cameraUp = new THREE.Vector3(0, 1, 0).applyMatrix4(cameraRotationMatrix);
    if (this.keyState["W"]) {
      this.thrustVector.addScaledVector(cameraForward, this.thrust);
    }
    if (this.keyState['S']) {
      this.thrustVector.addScaledVector(cameraForward, -this.thrust);
    }
    if (this.keyState['A']) {
      this.thrustVector.addScaledVector(cameraRight, -this.thrust);
    }
    if (this.keyState['D']) {
      this.thrustVector.addScaledVector(cameraRight, this.thrust);
    }
    if (this.keyState['Q']) {
      this.thrustVector.addScaledVector(cameraUp, -this.thrust);
    }
    if (this.keyState['E']) {
      this.thrustVector.addScaledVector(cameraUp, this.thrust);
    }
    const cameraPosition = this.camera.position;
    this.thrustVector.multiplyScalar(.85);
    this.thrustVector.clampLength(0, .06);
    if(this.thrustVector.length() < .007) {
      this.thrustVector.set(0,0,0);
    }
    cameraPosition.add(this.thrustVector);
  }

  moveDrag(ev: TouchEvent | MouseEvent) {
    if (!this.enabled) return true;

    // Get clientX for either TouchEvent or MouseEvent:
    let lastX = (ev as TouchEvent).touches ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
    let lastY = (ev as TouchEvent).touches ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY;

    const listener = (ev: MouseEvent | TouchEvent) => {
      if (!this.enabled) return;

      const cameraRotationEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion);
      const cameraRotationMatrix = new THREE.Matrix4().makeRotationFromEuler(cameraRotationEuler);
      const cameraForward = new THREE.Vector3(0, 0, -1).applyMatrix4(cameraRotationMatrix);
  
      let clientX = (ev as TouchEvent).touches ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
      const diffX = clientX - lastX;
      lastX = clientX;

      let clientY = (ev as TouchEvent).touches ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY;
      const diffY = clientY - lastY;
      this.camera.position.add(cameraForward.clone().multiplyScalar(diffY * .01));

      lastY = clientY;
      // It takes a window width to rotate 120 degrees:
      let pixelsPerRotation = window.innerWidth / 180;
      let diffDegX = (diffX / pixelsPerRotation) * Math.PI / 180;
      let diffDegY = (diffY / pixelsPerRotation) * Math.PI / 180;
      this.camera.rotation.order = 'YXZ';

      this.camera.rotation.y += diffDegX;
      // this.camera.rotation.x += diffDegY * .8;
      // this.camera.rotation.x = THREE.MathUtils.clamp(this.camera.rotation.x, this.minPhi, this.maxPhi);
    };
    document.body.addEventListener('touchmove', listener);
    document.body.addEventListener('mousemove', listener);

    document.body.addEventListener('mouseup', (ev) => {
      document.body.removeEventListener('mousemove', listener);
      document.body.removeEventListener('touchmove', listener);
    }, { once: true });
    document.body.addEventListener('touchend', (ev) => {
      document.body.removeEventListener('mousemove', listener);
      document.body.removeEventListener('touchmove', listener);
    }, { once: true });

    //ev.preventDefault();
    return true;
  }
}