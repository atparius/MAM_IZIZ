export default class Camera {
  constructor() {
    //-----------------------this.scene-----------------------
    this.scene = new THREE.Scene();

    //-----------------------this.camera-----------------------
    //this.camera setting
    // var fov = 75;
    // var aspect = window.innerWidth / window.innerHeight;
    // var near = 0.1;
    // var far  = 1000;
    // var this.camera = new THREE.Perspectivethis.camera(fov, aspect, near, far);
    // this.camera.position.set(0, -400, 400);

    this.camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      -5000,
      5000
    );
    this.camera.position.set(0, 10, 10);
    // this.camera.rotation.x = -45

    this.scene.add(this.camera);
  }
}