/// <reference types="vite/client" />
/// <reference types="@react-three/fiber" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      color: any;
      ambientLight: any;
      instancedMesh: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
    }
  }
}
