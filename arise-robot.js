import * as THREE from 'three';
import URDFLoader from './vendor/urdf/URDFLoader.js';
import { loadPackedModels } from './robot-packed-model.js';

const stage = document.querySelector('.arise-robot');
const entry = document.querySelector('#arise-entry');
if (stage && entry) {
  let renderer;
  let camera;
  let scene;
  let robot;
  let shadow;
  let loading = false;
  let ready = false;
  let scheduled = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

  function progress() {
    const box = entry.getBoundingClientRect();
    if (innerWidth <= 720) {
      return clamp((innerHeight * 0.9 - box.top) / (innerHeight * 0.95 + box.height));
    }
    return clamp((innerWidth * 0.9 - box.left) / (innerWidth * 0.8 + box.width));
  }

  function draw() {
    scheduled = false;
    if (!ready || document.hidden) return;
    const p = reducedMotion.matches ? 0.64 : progress();
    const walkProgress = clamp((p - 0.22) / 0.3);
    const gait = smooth((p - 0.22) / 0.07) * (1 - smooth((p - 0.44) / 0.09));
    const travel = walkProgress * Math.PI * 4;
    const sit = smooth((p - 0.5) / 0.15);
    const wave = smooth((p - 0.64) / 0.07) * (1 - smooth((p - 0.88) / 0.06));
    const waveSwing = wave * Math.sin((p - 0.64) * Math.PI * 12);

    robot.position.set(mix(-0.08, 0.02, smooth(walkProgress)), 0,
      mix(0.32, 0.18, sit) + 0.012 * gait * Math.sin(travel * 2));
    robot.rotation.order = 'ZYX';
    robot.rotation.set(0, -0.4 * sit, mix(-0.75, -1.08, sit));
    shadow.material.opacity = mix(0.42, 0.6, sit);
    shadow.position.x = robot.position.x;
    for (const leg of ['FL', 'FR', 'RL', 'RR']) {
      const rear = leg.startsWith('R');
      const waving = leg === 'FL';
      const phase = travel + (leg === 'FL' || leg === 'RR' ? 0 : Math.PI);
      const stride = 0.065 * Math.cos(phase) * gait;
      const height = 0.285 - 0.065 * Math.max(0, Math.sin(phase)) * gait;
      const knee = -Math.acos(clamp((stride * stride + height * height - 2 * 0.213 ** 2) /
        (2 * 0.213 ** 2), -1, 1));
      const thigh = Math.atan2(-stride, height) - knee / 2;
      robot.setJointValue(`${leg}_hip_joint`, waving ? wave * 0.22 + waveSwing * 0.65 : 0);
      robot.setJointValue(`${leg}_thigh_joint`, waving
        ? mix(mix(thigh, 0.9, sit), -1.05 + waveSwing * 0.5, wave)
        : mix(thigh, rear ? 0.6 : 0.9, sit));
      robot.setJointValue(`${leg}_calf_joint`, waving
        ? mix(mix(knee, -1.6, sit), -1.5 + waveSwing * 0.42, wave)
        : mix(knee, rear ? -2.35 : -1.6, sit));
    }
    renderer.render(scene, camera);
  }

  function schedule() {
    if (!scheduled && ready) {
      scheduled = true;
      requestAnimationFrame(draw);
    }
  }

  function resize() {
    if (!renderer) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    const span = 0.88;
    camera.left = -span * width / height / 2;
    camera.right = -camera.left;
    camera.top = span / 2;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    schedule();
  }

  async function load() {
    if (loading) return;
    loading = true;
    stage.dataset.modelState = 'loading';
    try {
      THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 30);
      camera.position.set(0, -3, 0.84);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0.25);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x90949b, 2));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(-2, -3, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 1.2);
      rim.position.set(2, 2, 3);
      scene.add(rim);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = shadowCanvas.height = 128;
      const shadowContext = shadowCanvas.getContext('2d');
      const gradient = shadowContext.createRadialGradient(64, 64, 5, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(20,24,30,.28)');
      gradient.addColorStop(1, 'rgba(20,24,30,0)');
      shadowContext.fillStyle = gradient;
      shadowContext.fillRect(0, 0, 128, 128);
      shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.7),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false })
      );
      shadow.position.z = -0.005;
      scene.add(shadow);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setClearColor(0xffffff, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      stage.append(renderer.domElement);
      resize();

      const manager = new THREE.LoadingManager();
      const loader = new URDFLoader(manager);
      loader.packages = { go2_description: new URL('./assets/go2_description/', import.meta.url).href };
      const meshes = loadPackedModels();
      let ticket = 0;
      loader.loadMeshCb = (url, assetManager, done) => {
        const name = `arise-mesh-${++ticket}`;
        assetManager.itemStart(name);
        meshes.then((parts) => {
          const part = parts.get(url.split('/').pop());
          if (!part) throw new Error(`Missing Go2 part: ${url}`);
          done(part.clone(true));
        }).catch((error) => {
          assetManager.itemError(name);
          done(null, error);
        }).finally(() => assetManager.itemEnd(name));
      };
      manager.onError = () => { stage.dataset.modelState = 'error'; };
      manager.onLoad = () => {
        if (!robot || stage.dataset.modelState === 'error') return;
        ready = true;
        stage.dataset.modelState = 'ready';
        schedule();
      };
      loader.load('./assets/go2_description/urdf/go2_description.urdf', (model) => {
        robot = model;
        scene.add(robot);
        if (manager.itemsLoaded === manager.itemsTotal) {
          ready = true;
          stage.dataset.modelState = 'ready';
          schedule();
        }
      }, undefined, (error) => {
        stage.dataset.modelState = 'error';
        console.error('ARISE robot could not load', error);
      });
      renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        ready = false;
        stage.dataset.modelState = 'error';
      });
    } catch (error) {
      stage.dataset.modelState = 'error';
      console.error('ARISE robot could not initialize', error);
    }
  }

  function nearViewport() {
    const box = entry.getBoundingClientRect();
    const horizontal = innerWidth > 720;
    return horizontal
      ? box.left < innerWidth * 1.6 && box.right > -innerWidth * 0.6
      : box.top < innerHeight * 1.6 && box.bottom > -innerHeight * 0.6;
  }

  function update() {
    if (!loading && nearViewport()) load();
    schedule();
  }
  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  addEventListener('resize', () => { resize(); update(); });
  addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  update();
}
