import * as THREE from 'three';
import { MapControls, TransformControls } from 'three-stdlib';
import { picking, ThreeSetup } from '../types/useThreeSetupTypes';

export function createThreeSetup(
  containerId: string,
  onSpotlightPause: (v: boolean) => void,
): {
  setup: ThreeSetup;
  dispose: () => void;
} {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById(containerId)?.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100_000,
  );
  camera.up.set(0, 0, 1);

  const controls = new MapControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    onSpotlightPause(true);
  });
  controls.addEventListener('end', () => {
    onSpotlightPause(false);
  });

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.addEventListener(
    'dragging-changed' as never,
    (e: Event & { value: boolean }) => {
      controls.enabled = !e.value;
    },
  );
  scene.add(transformControls);

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  scene.add(light);
  scene.add(light.target);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  const dispose = () => {
    window.removeEventListener('resize', onResize);
    controls.dispose();
    transformControls.dispose();
    Object.values(picking.textures).forEach((t) => t.dispose());
    Object.values(picking.materials).forEach((m) => m.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };

  return {
    setup: {
      renderer,
      scene,
      camera,
      controls,
      transformControls,
      light,
      picking,
    },
    dispose,
  };
}
