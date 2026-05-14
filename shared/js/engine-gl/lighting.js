// Three-point lighting setup for the visual standard.
export const KEY = { dir: [0.5, 0.8, 0.3], color: [1.0, 0.95, 0.8], intensity: 1.0 };
export const FILL = { dir: [-0.4, -0.3, 0.2], color: [0.6, 0.7, 0.9], intensity: 0.3 };
export const RIM = { dir: [0.0, -0.2, -1.0], color: [0.7, 0.85, 1.0], intensity: 0.6 };

// Blinn-Phong contribution shader snippet.
export const blinnPhongGLSL = `
struct Light { vec3 dir; vec3 color; float intensity; };
vec3 blinnPhong(vec3 normal, vec3 viewDir, vec3 albedo, float roughness, Light L) {
  vec3 lightDir = normalize(L.dir);
  vec3 halfDir = normalize(lightDir + viewDir);
  float diff = max(0.0, dot(normal, lightDir));
  float spec = pow(max(0.0, dot(normal, halfDir)), max(2.0, 64.0 * (1.0 - roughness)));
  return L.color * L.intensity * (albedo * diff + vec3(spec) * (1.0 - roughness));
}
`;
