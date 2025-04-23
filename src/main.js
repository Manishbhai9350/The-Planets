import { PlanetsData } from "./Planets";
import * as THREE from "three";
import "./style.css";
import "remixicon/fonts/remixicon.css";
import { GetSceneBounds } from "./utils";
import gsap from 'gsap';
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";


console.clear();

const { sin, cos, max, min } = Math;

// Create a scene
const scene = new THREE.Scene();

const canvas = document.querySelector("canvas");

// Create a camera
const camera = new THREE.PerspectiveCamera(
  innerWidth < 800 ? 60 : 30, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);

// Create a renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(min(2, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .8;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Gui.add(renderer,'toneMappingExposure').min(0).max(2).step(.001)


const Planets = new THREE.Group();
let Clouds = []
scene.add(Planets);
Planets.rotation.x = 0.15;
Planets.position.y = -0.3;

let ThetaDX = (Math.PI * 2) / PlanetsData.length;
let Radius = 5.5;

const Loader = new THREE.TextureLoader();

let CurrentPlanetIdx = 1;
let IsAnimating = false

const LoadManager = new THREE.LoadingManager(() => {
  gsap.to('.loader',{
    opacity:0,
    onComplete(){
      gsap.to('.loader',{
        display:'none'
      })
    }
  })
}, (_,n,t) => {
  const Prog = Math.round(n / t * 100)
  let StrProg = Prog < 10 ? '0' + Prog + '%' : Prog + '%' 
  document.querySelector('.loader p').innerHTML = StrProg
}, () => {
  
})


function ShowInfo(i){
  const CurrentTitle = document.querySelector('.planet-name .current')
  const NextTitle = document.querySelector('.planet-name .next')
  NextTitle.innerHTML = PlanetsData[i].name
  gsap.to(CurrentTitle,{
    top:'-100%',
    duration:2,
    ease:"expo.inOut"
  })
  gsap.to(NextTitle,{
    top:'0',
    duration:2,
    ease:"expo.inOut",
    onComplete(){
      CurrentTitle.classList.remove('current')
      CurrentTitle.classList.add('next')
      NextTitle.classList.remove('next')
      NextTitle.classList.add('current')
      gsap.set(CurrentTitle,{
        top:"100%"
      })
    }
  })
}
ShowInfo(CurrentPlanetIdx)

function ShowNextPlanet() {
  if(IsAnimating) return;
  IsAnimating = true 
  CurrentPlanetIdx -= 1 
  if(CurrentPlanetIdx < 0) {
    CurrentPlanetIdx += PlanetsData.length
  }
  CurrentPlanetIdx %= PlanetsData.length
  
  gsap.to(Planets.rotation,{
    y:`-=${ThetaDX}`,
    duration:2,
    ease:'expo.inOut',
    onComplete(){
      IsAnimating = false
    }
  })
  ShowInfo(CurrentPlanetIdx)
  
}

function ShowPrevPlanet(){
  if(IsAnimating) return;
  IsAnimating = true 
  CurrentPlanetIdx += 1 
  CurrentPlanetIdx %= PlanetsData.length
  gsap.to(Planets.rotation,{
    y:`+=${ThetaDX}`,
    duration:2,
    ease:'expo.inOut',
    onComplete(){
      IsAnimating = false
    }
  })
  ShowInfo(CurrentPlanetIdx)
}

PlanetsData.forEach((Item, i) => {
  const { r } = Item;
  let Theta = ThetaDX * i;
  const x = cos(Theta) * Radius;
  const z = sin(Theta) * Radius;

  let map = Loader.load(Item.map);

  map.colorSpace  = THREE.SRGBColorSpace;

  const PlanetGroup = new THREE.Group();

  const Planet = new THREE.Mesh(
    new THREE.SphereGeometry(r, 30, 30),
    new THREE.MeshStandardMaterial({ map })
  );
  PlanetGroup.add(Planet);
  if (Item.clouds) {
    let cloud = Loader.load(Item.clouds);
    cloud.colorSpace = THREE.SRGBColorSpace
    const PlanetClouds = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.01, 30, 30),
      new THREE.MeshStandardMaterial({ alphaMap: cloud, transparent: true })
    );
    PlanetGroup.add(PlanetClouds);
    Clouds.push(PlanetClouds)
  }
  PlanetGroup.position.set(x, 0, z);
  Planet.name = Item.name;
  PlanetGroup.name = Item.name;
  Planets.add(PlanetGroup);
});


// Position the camera
camera.position.z = Radius + 4;

const Cosmos = Loader.load("/stars.jpg");
Cosmos.colorSpace = THREE.SRGBColorSpace;


const SceneBounds = GetSceneBounds(
  camera,
  renderer,
  Radius + camera.position.z + 4
);
const Background = new THREE.Mesh(
  new THREE.SphereGeometry(50,40,40),
  new THREE.MeshStandardMaterial({ map: Cosmos,side:THREE.BackSide })
);
Background.position.z = -Radius - 4;
scene.add(Background);

// ?? Lights

const Hemi = new THREE.HemisphereLight(0xffffff, 0x000000, .8);
const Sun = new THREE.DirectionalLight(0xffffff, 4.3);
Sun.position.set(6, 2.5, Radius - 3);
Sun.lookAt(0, 0, Radius);
scene.add(Hemi, Sun);

const Sun2 = new THREE.DirectionalLight(0xffd700, .4)
Sun2.position.set(-6, 6,0);
Sun2.lookAt(0, 0, Radius);
scene.add(Hemi, Sun2);

// Gui.add(Sun,'intensity').min(0).max(10).step(.001).name('Sun1')
// Gui.add(Sun2,'intensity').min(0).max(10).step(.001).name('Sun2')
// Gui.add(camera,'fov').min(0).max(100).step(.001).name('FOV').onChange(e => {
//   camera.fov = e 
//   camera.updateProjectionMatrix()
// })

const Clock = new THREE.Clock()

// Animation loop
function animate() {
  // Render the scene
  Planets.children.forEach(Planet => {
    Planet.rotation.y = Clock.getElapsedTime() * .04
  })
  Clouds.forEach(Cloud => {
    Cloud.rotation.y = Clock.getElapsedTime() * .02
  })
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

function Resize() {
  renderer.setSize(innerWidth, innerHeight);
  if(innerWidth < 800) {
    camera.fov = 60
  } else {
    camera.fov = 30
  }
  camera.updateProjectionMatrix()
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  Background.geometry.dispose();
  const SceneBounds = GetSceneBounds(
    camera,
    renderer,
    Radius + camera.position.z + 4
  );
  Background.geometry = new THREE.SphereGeometry(
    50,40,40
  );
}

window.addEventListener("resize", Resize);


// document.querySelector('.icon-left').addEventListener('click',() => {
//   ShowPrevPlanet()
// })
// document.querySelector('.icon-right').addEventListener('click',() => {
//   ShowNextPlanet()
// })

document.addEventListener('click',e => {
  if(e.clientX/innerWidth < .5) {
    ShowPrevPlanet()
  } else {
    ShowNextPlanet()
  }
})


window.addEventListener("wheel",e => {
  const Delta = e.deltaY
  if(Delta > 0) {
    ShowNextPlanet()
  } else {
    ShowPrevPlanet()
  }
})