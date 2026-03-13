import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < 1200; i++) {
      vertices.push(
        THREE.MathUtils.randFloatSpread(200),
        THREE.MathUtils.randFloatSpread(200),
        THREE.MathUtils.randFloatSpread(200),
      );
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );

    const material = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 0.7,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    camera.position.z = 60;

    const animate = () => {
      requestAnimationFrame(animate);

      particles.rotation.y += 0.0008;
      particles.rotation.x += 0.0003;

      renderer.render(scene, camera);
    };

    animate();
  }, []);

  return <div ref={mountRef} className="absolute inset-0 -z-10"></div>;
}
