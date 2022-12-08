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
    this.mesh_array = []
    this.position = new THREE.Vector3();
    const urlParams = new URLSearchParams(window.location.search);
    this.version = urlParams.get("version");

    const loader = new FontLoader();
    loader.load(
      "./font/false_Book.json",
      (font) => {
        this.font = font;
        this.init();
      }
    );

  }

  async init() {
    this.data = await this.loadJSON("./JSON/RoyalWithCheese.json");
    this.audio = await this.loadAudio("./audio/RoyalWithCheese.mp3");
    this.prepare("RoyalWithCheese", this.data);
    this.initThree();
    this.createMap();
    if (this.version == 1) this.initStartButton();
  }

  initStartButton() {
    const button = document.createElement("button");
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

  initThree() {
    this.angle = 0;
    this.counter = 0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
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
    // this.camera.position.z = 110;
    // this.camera.goal = this.position;
    // this.camera.position.y = 40;
    // this.camera.position.x = 20;
    this.camera.rotation.x = -Math.PI / 2;
    // this.camera.lookAt(0, 0, 0);

    // this.scene.fog = new THREE.Fog(0x000000, 0.005, 50);

    // add light
    const light = new THREE.AmbientLight(0xffffff);
    this.scene.add(light);

    this.directionalLight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 4, 1);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 10, 8);
    // this.scene.add(this.directionalLight);

    //add "endless" grey plane as ground
    const planeGeometry = new THREE.PlaneGeometry(1200, 1200);
    let planeColor = 0xcccccc;
    if(this.version==1){
      planeColor = 0xccccff;
    }
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: planeColor,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.rotateX(-Math.PI / 2);
    //set plane double sided
    plane.material.side = THREE.DoubleSide;

    this.scene.add(plane);

    this.firebase = new Firebase();
    setTimeout(() => {
      this.firebase.addEventListener(
        "TYPE_CITY/time",
        this.onSyncTime.bind(this)
      );

      // this.firebase.addEventListener("ECAL/MID", (data) => {
      //   console.log(data);
      // });

      // }
    }, 1000);
    this.firebase.send("TYPE_CITY/time", -1);

    this.animate();
  }

  createMap() {
    let x = 0;
    let z = 0;
    let prevX = 0;
    let prevZ = 0;
    let angle = 0;
    let group = new THREE.Group();
    this.scene.add(group);
    // console.log(this.scene)
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
        if(word['person'] === undefined){
        }else{
          this.pperson = word['person'] 
        }
        this.allWords.push({
          person : this.pperson,
          text: word["word"],
          start: word["start_time"],
          end: word["start_end"],
          property: property,
        });
      });
    });
    console.log(this.allWords)
  }

  start() {
    this.audio.play();
    // this.shiftWords(0);
    this.person = this.allWords[0].person
    this.pperson = this.allWords[0].person
    this.firebase.send("TYPE_CITY/time", 0);
  }

  shiftWords(previousTime = 0) {
    const word = this.allWords.shift();
    // console.log("shift words", word);
    if (word) {
      console.log(word)
      setTimeout(() => {
        // console.log("send");
        this.firebase.send("TYPE_CITY/time", word.start);

        this.counterShift(word.start,word);
        // console.log(previousTime + " Counter: " + this.counter);
      }, (word.start - previousTime) * 1000);
    }
  }

  counterShift(previousTime,word){
    for (var i = this.mesh_array.length - 1; i >= 0; i--) {
      this.mesh_array[i].material.color.setHex( 0xff44ff )
    }
      if(word.person == this.version){
        this.mesh_array[this.counter].material.color.setHex( 0xFF4500 )
      }
    this.counter++;
  }

  // createText(text, previousTime, property) {
  //   //counter to randomize disposition
  //   this.shiftWords(previousTime);
  //   // if (this.version == 1) this.firebase.send("TYPE_CITY/time", previousTime);
  //   // add text on scene
  //   const loader = new FontLoader();
  //   loader.load(
  //     "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json",
  //     (font) => {
  //       const geometry = new TextGeometry(text, {
  //         font: font,
  //         size: property ? property["height"] : 1,
  //         height: 0.1,
  //         curveSegments: 12,
  //         bevelEnabled: true,
  //         bevelThickness: 0.8,
  //         bevelSize: 0.001,
  //         bevelOffset: 0,
  //         bevelSegments: 1,
  //       });
  //       const material = new THREE.MeshPhongMaterial({
  //         color: property ? parseInt(property["color"], 16) : 0xffffff,
  //         flatShading: false,
  //       });
  //       this.text = new THREE.Mesh(geometry, material);
  //       this.text.geometry.computeBoundingBox();
  //       if (this.counter % 3 == 0) this.text.rotateZ(Math.PI / 2);
  //       this.position += 3;
  //       this.camera.goal = this.position + 5;
  //       this.text.castShadow = true;
  //       this.text.receiveShadow = true;
  //       this.text.position.z = this.position;
  //       this.text.position.x = this.position % 2 == 0 ? -1 : 1;
  //       this.text.position.y = 0;

  //       this.scene.add(this.text);
  //     } //end of load callback
  //   );
  // }

  createTextForMap(text, x, z, group) {

    const geometry = new TextGeometry(text, {
      font: this.font,
      size: 1,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.001,
      bevelOffset: 0,
      bevelSegments: 1,
    });

    const material = new THREE.MeshPhongMaterial({
      color: 0xff44ff,
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
    this.mesh_array.push(this.text)

    group.add(this.text);
    this.scene.updateMatrixWorld(true);
    return this.text.geometry.boundingBox.max.x + newX + 0.5;
  }

  animate() {
    if(this.mesh_array[this.counter]){
        const camx = this.mesh_array[this.counter].getWorldPosition(this.position).x
        const camy = this.mesh_array[this.counter].getWorldPosition(this.position).y
        const camz = this.mesh_array[this.counter].getWorldPosition(this.position).z
        this.posX = this.lerp(
          this.posX,
          camx,
          0.05
        );
        this.posY = this.lerp(
          this.posY,
          camy,
          0.05
        );
        this.posZ = this.lerp(
          this.posZ,
          camz,
          0.05
        );
        this.camera.position.x = this.posX
        this.camera.position.y = this.posY + 50
        this.camera.position.z = this.posZ
    // console.log(this.mesh_array[this.counter].parent)
      // if(this.mesh_array[this.counter].geometry.boundingSphere.center.x){
      // }

        // const camx = (this.mesh_array[this.counter].geometry.boundingBox.min.x+ this.mesh_array[this.counter].geometry.boundingBox.max.x)/2
        // const camy = (this.mesh_array[this.counter].geometry.boundingBox.min.y+ this.mesh_array[this.counter].geometry.boundingBox.max.y)/2
        // const camz = (this.mesh_array[this.counter].geometry.boundingBox.min.z+ this.mesh_array[this.counter].geometry.boundingBox.max.z)/2


      }

    const pos = [
      [300, 50, 100 - 50],
      [-100, 100, -100 - 50],
      [-200, 50, 100 - 50],
    ];
    const lookAt = [
      [300, 50, 100],
      [-100, 100, -100],
      [-200, 50, 100],
    ];

    this.lookAtX = this.lerp(
      this.lookAtX,
      lookAt[this.counter % 3][0],
      0.05
    );
    this.lookAtY = this.lerp(
      this.lookAtY,
      lookAt[this.counter % 3][1],
      0.05
    );
    this.lookAtZ = this.lerp(
      this.lookAtZ,
      lookAt[this.counter % 3][2],
      0.05
    );

    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t;
  }
}
