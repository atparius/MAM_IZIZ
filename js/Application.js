// Marius + Isaïa 
// Pulp Fiction 


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//import font loader
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
//add text geometry
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

import Firebase from "./Firebase";

export default class App {
  constructor() {
    this.position = 8;
    this.lookAtX = 0;
    this.lookAtY = 0;
    this.lookAtZ = 0;
    this.posX = 0;
    this.posY = 0;
    this.posZ = 0;
    this.person = 0;
    this.pperson = 0;
    this.counter_cam = 0;
    this.mesh_array = [];
    this.position = new THREE.Vector3();
    const urlParams = new URLSearchParams(window.location.search);
    this.version = urlParams.get("version");
    this.PlaneColor = 0xcccccc;

    const loader = new FontLoader();
    loader.load("./font/false_Book.json", (font) => {
      this.font = font;
      this.init();
    });
  }

  async init() {
    this.data = await this.loadJSON("./JSON/RoyalWithCheese.json");
    this.audio = await this.loadAudio("./audio/RoyalWithCheese.wav");
    this.prepare("RoyalWithCheese", this.data);
    this.initThree();
    this.createMap();
    if (this.version == 1) this.initStartButton();
  }

  initStartButton() {
    const button = document.createElement("button");
    button.classList.add("buttonstyle");
    button.innerHTML = "Start";
    button.style.position = "absolute";
    //center the button in screen
    button.style.left = "50%";
    button.style.top = "50%";
    button.style.transform = "translate(-50%, -50%)";
    button.style.cursor = "pointer";
    button.addEventListener("click", () => {
      document.body.removeChild(button);
      this.start();
    });
    document.body.appendChild(button);
  }

  degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 100);
  }

  initThree() {
    this.angle = 0;
    this.counter = 0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.camera.rotation.x = this.degrees_to_radians(-30);
    this.camera.rotation.z = this.degrees_to_radians(-20);
    this.camera.rotation.y = this.degrees_to_radians(-20);

    this.camera.position.z = 10;
    this.camera.position.y = 20;
    this.camera.position.x = -10;

    // this.camera.rotation.x = -Math.PI / 2;

    // ----------------------------------- add light -----------------------------------

    const ambientlight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientlight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1, 0, Math.PI / 4, 1);
    this.directionalLight.position.set(50, 50, 100);
    this.directionalLight.castShadow = true;

    this.directionalLight.shadow.camera.left = -300;
    this.directionalLight.shadow.camera.right = 300;
    this.directionalLight.shadow.camera.top = 300;
    this.directionalLight.shadow.camera.bottom = -300;

    this.directionalLight.shadow.mapSize.width = 2000;
    this.directionalLight.shadow.mapSize.height = 2000;

    this.directionalLight.right = 100;
    this.scene.add(this.directionalLight);

    // ----------------------------------- end light -----------------------------------

    //add "endless" grey plane as ground
    const planeGeometry = new THREE.PlaneGeometry(1200, 1200);

    planeGeometry.receiveShadow = true;
    planeGeometry.castShadow = true;
    this.planeColor = 0x3f3f3f;
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: this.planeColor,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.rotateX(-Math.PI / 2);
    //set plane double sided
    plane.material.side = THREE.DoubleSide;
    plane.receiveShadow = true;
    this.scene.add(plane);

    this.firebase = new Firebase();
    setTimeout(() => {
      this.firebase.addEventListener(
        "TYPE_CITY2/time",
        this.onSyncTime.bind(this)
      );
    }, 1000);
    this.firebase.send("TYPE_CITY2/time", -1);

    this.animate();
  }

  createMap() {
    let x = 0;
    let z = 0;
    let prevX = 0;
    let prevZ = 0;

    let group = new THREE.Group();
    this.scene.add(group);
    this.allWords.forEach((word, index) => {
      if (word.property.x != prevX || word.property.z != prevZ) {
        x = word.property.x;
        z = word.property.z;
        prevX = x;
        prevZ = z;
        group = new THREE.Group();
        group.rotation.y = word.property.angle * (Math.PI / 180);
        group.position.z = z;
        group.position.x = x;
        this.scene.add(group);
        x = 0;
      }

      x = this.createTextForMap(word.text, x, 0, group);
    });
  }

  onSyncTime(previousTime) {
    if (previousTime > -1) this.shiftWords(previousTime);
  }

  loadJSON(url) {
    return fetch(url).then((response) => response.json());
  }

  loadAudio(url) {
    const audio = new Audio();
    audio.src = url;
    audio.load();
    return audio;
  }

  prepare(name, data) {
    this.allWords = [];
    let property = null;
    data[name].forEach((element) => {
      element["timing"].forEach((word) => {
        if (word["property"]) {
          property = word["property"];
        }
        if (word["person"] === undefined) {
        } else {
          this.pperson = word["person"];
        }
        this.allWords.push({
          person: this.pperson,
          text: word["word"],
          start: word["start_time"],
          end: word["start_end"],
          property: property,
        });
      });
    });
  }

  start() {
    this.audio.play();
    // this.shiftWords(0);
    this.person = this.allWords[0].person;
    this.pperson = this.allWords[0].person;
    this.firebase.send("TYPE_CITY2/time", 0);
  }

  shiftWords(previousTime = 0) {
    const word = this.allWords.shift();
    if (word) {
      setTimeout(() => {
        if(this.version == 1){
        this.firebase.send("TYPE_CITY2/time", word.start);
        }
        this.counterShift(word.start, word);
      }, (word.start - previousTime) * 1000);
    }
  }

  counterShift(previousTime, word) {
    for (var i = this.mesh_array.length-1; i >= 0; i--) {
      this.mesh_array[i].material.color.setHex(0xadadad);
    }
    if (word.person == this.version && this.version == 1) {
      this.mesh_array[this.counter].material.color.setHex(0xFF4343);
    } else if (word.person == this.version && this.version == 2) {
      this.mesh_array[this.counter].material.color.setHex(0x6690FF);
    }
    this.person = word.person;
    this.counter_cam++;
    this.counter++;
  }

  createTextForMap(text, x, z, group) {
    const geometry = new TextGeometry(text, {
      font: this.font,
      size: 1,
      height: 0.5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.03,
      bevelOffset: 0,
      bevelSegments: 4,
    });

    const material = new THREE.MeshPhongMaterial({
      color: 0xadadad,
      flatShading: false,
    });

    this.text = new THREE.Mesh(geometry, material);
    this.text.geometry.computeBoundingBox();
    this.text.castShadow = true;
    this.text.receiveShadow = true;
    this.text.position.z = 0;
    let newX = !x ? 0 : x;
    this.text.position.x = newX;
    this.text.position.z = z;
    this.text.rotation.x = -Math.PI / 2;
    this.mesh_array.push(this.text);

    group.add(this.text);
    this.scene.updateMatrixWorld(true);
    return this.text.geometry.boundingBox.max.x + newX + 0.5;
  }

  animate() {
    if (this.allWords.length !== 0) {
      if (this.mesh_array[this.counter_cam]) {
        var camx = 0;
        var camy = 0;
        var camz = 0;

        if (this.version == this.person && this.allWords[0].text != "Mayonnaise") {
          camx =
            this.mesh_array[this.counter_cam].getWorldPosition(this.position)
              .x - 7;
          camy =
            this.mesh_array[this.counter_cam].getWorldPosition(this.position)
              .y + 7;
          camz =
            this.mesh_array[this.counter_cam].getWorldPosition(this.position)
              .z + 5;
        } 
        if (this.version != this.person && this.allWords[0].text != "Goddamn!" )  {
          camx = this.mesh_array[this.counter_cam].getWorldPosition(
            this.position
          ).x -30;
          camy =
            this.mesh_array[this.counter_cam].getWorldPosition(this.position)
              .y + 40;
          camz = this.mesh_array[this.counter_cam].getWorldPosition(
            this.position
          ).z +50;
        }
        if (this.version == this.person && this.allWords[0].text == "Mayonnaise") {
          console.log("mayo !!!!!!!!!!!");
          camx =
            this.mesh_array[this.counter_cam].getWorldPosition(this.position)
              .x - 7;
          camy =
            this.mesh_array[this.counter_cam].getWorldPosition(this.position)
              .y + 7;
          camz =
            this.mesh_array[this.counter_cam].getWorldPosition(this.position)
              .z + 5;
        }
        
        if(this.allWords[0].text == "Goddamn!" && this.version == 2){
          camx = 20 - 10;
          camy = 7;
          camz = 126.3 + 10;
        }
        if(this.allWords[0].text == "Goddamn!" && this.version == 1){
          camx = 4.5 - 7;
          camy = 7;
          camz = 134 + 12;
        }

       

        this.posX = this.lerp(this.posX, camx, 0.05);
        this.posY = this.lerp(this.posY, camy, 0.05);
        this.posZ = this.lerp(this.posZ, camz, 0.05);

        this.camera.position.x = this.posX;
        this.camera.position.y = this.posY;
        this.camera.position.z = this.posZ;

        
        
      }
    }
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t;
  }
}
