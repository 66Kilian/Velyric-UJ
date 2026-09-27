"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { LOGO_VIEWBOX, logoPaths, type LogoPart } from "@/components/brand/logoPaths";

/* ============================================================
   A Velyric 3D logó-jelenete.
   - A V jel három része (V + két szárny) külön 3D testként
   - Gradiens + fény + perem-fény shader (márkaszínek)
   - Mögötte élő hanghullám-vonalak és „hang-gyűrűk”
   - A görgetés (stage) vezérli: forgás, szárnyak szétválása, átadás
   ============================================================ */

export type SceneInput = {
  /** 0 = hero, 1–4 = a „Hogyan működik” lépései (tört érték = átmenet) */
  stage: number;
  /** Egér-pozíció -1..1 (enyhe parallaxhoz) */
  px: number;
  py: number;
};

type Pose = {
  x: number; y: number; z: number;
  rx: number; ry: number;
  s: number;
  explode: number; handoff: number;
  voice: number; glow: number;
};

const LOGO_WIDTH = 4; // világ-egységben
const SCALE = LOGO_WIDTH / LOGO_VIEWBOX.width;
const SIZE = new THREE.Vector2(LOGO_WIDTH, LOGO_VIEWBOX.height * SCALE);

// Márkaszínek a shaderhez (sRGB, 0..1)
const hex = (h: string) => {
  const c = new THREE.Color(h);
  return new THREE.Vector3(c.r, c.g, c.b);
};
const COLORS = {
  c0: hex("#a62bea"),
  c1: hex("#e5237e"),
  c2: hex("#f2335a"),
  c3: hex("#ff8a4a"),
};
// A Color konstruktor sRGB→lineáris konverziót végez; a shader közvetlenül
// a kijelzőre ír, ezért visszaalakítunk sRGB-re.
for (const v of Object.values(COLORS)) {
  const c = new THREE.Color(v.x, v.y, v.z).convertLinearToSRGB();
  v.set(c.r, c.g, c.b);
}

/* ---------- Kulcspózok lépésenként ---------- */

function keyframes(desktop: boolean, vw: number, vh: number, phone: boolean): Pose[] {
  if (desktop) {
    const x = vw * 0.22;
    const s = THREE.MathUtils.clamp(vw * 0.085, 0.72, 1.0);
    return [
      { x, y: 0.45, z: 0, rx: 0.12, ry: -0.42, s, explode: 0, handoff: 0, voice: 0.55, glow: 0.7 },
      { x: x * 0.92, y: 0, z: 0, rx: 0.04, ry: 0.22, s: s * 1.06, explode: 0, handoff: 0, voice: 1, glow: 1 },
      { x: x * 0.92, y: 0, z: 0, rx: 0.32, ry: -0.8, s, explode: 1, handoff: 0, voice: 0.35, glow: 0.6 },
      { x: x * 0.92, y: 0, z: 0, rx: 0.08, ry: Math.PI * 2 - 0.3, s: s * 1.06, explode: 0.2, handoff: 0, voice: 0.6, glow: 0.9 },
      { x: x * 0.92, y: 0, z: 0, rx: 0.1, ry: Math.PI * 2 + 0.28, s: s * 0.98, explode: 0, handoff: 1, voice: 0.75, glow: 1 },
    ];
  }
  // Mobil/tablet: a logó fent, középen; a szöveg alul olvasható
  const s = THREE.MathUtils.clamp(vw * 0.14, 0.4, 0.8);
  // Telefonon a heróban a szövegé a hely: a logó a képernyő fölött vár,
  // és forogva „berepül”, amikor a történethez görgetsz
  const hero: Pose = phone
    ? { x: 0, y: vh / 2 + 1.8, z: 0, rx: 0.6, ry: -1.4, s, explode: 0.6, handoff: 0, voice: 0, glow: 0.4 }
    : { x: 0, y: 1.85, z: 0, rx: 0.1, ry: -0.3, s, explode: 0, handoff: 0, voice: 0.5, glow: 0.7 };
  return [
    hero,
    { x: 0, y: 1.3, z: 0, rx: 0.04, ry: 0.2, s: s * 1.1, explode: 0, handoff: 0, voice: 1, glow: 1 },
    { x: 0, y: 1.3, z: 0, rx: 0.3, ry: -0.7, s: s * 1.05, explode: 1, handoff: 0, voice: 0.35, glow: 0.6 },
    { x: 0, y: 1.3, z: 0, rx: 0.08, ry: Math.PI * 2 - 0.3, s: s * 1.1, explode: 0.2, handoff: 0, voice: 0.6, glow: 0.9 },
    { x: -0.25, y: 1.3, z: 0, rx: 0.1, ry: Math.PI * 2 + 0.28, s, explode: 0, handoff: 1, voice: 0.75, glow: 1 },
  ];
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function samplePose(frames: Pose[], stage: number): Pose {
  const clamped = THREE.MathUtils.clamp(stage, 0, frames.length - 1);
  const i = Math.min(Math.floor(clamped), frames.length - 2);
  const t = smooth(clamped - i);
  const a = frames[i];
  const b = frames[i + 1];
  const out = {} as Pose;
  for (const k of Object.keys(a) as (keyof Pose)[]) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

/* ---------- Geometria a vektoros logóból ---------- */

function buildGeometry(d: string) {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
  const shapes = data.paths.flatMap((p) => p.toShapes());
  const depth = 70;
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: 16,
    bevelSize: 10,
    bevelSegments: 5,
    curveSegments: 10,
  });
  // SVG (y lefelé) → 3D (y felfelé): 180°-os forgatás az x tengely körül, középre igazítva
  geo.translate(-LOGO_VIEWBOX.width / 2, -LOGO_VIEWBOX.height / 2, -depth / 2);
  geo.scale(SCALE, -SCALE, -SCALE);
  geo.computeVertexNormals();
  return geo;
}

/* ---------- Shaderek ---------- */

const logoVertex = /* glsl */ `
  uniform vec2 uSize;
  varying vec3 vN;
  varying vec3 vView;
  varying vec2 vUv;
  varying float vCap;
  void main() {
    vUv = position.xy / uSize + 0.5;
    vCap = abs(normal.z);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const logoFragment = /* glsl */ `
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
  uniform float uTime;
  uniform float uGlow;
  varying vec3 vN;
  varying vec3 vView;
  varying vec2 vUv;
  varying float vCap;

  vec3 grad(float t) {
    t = clamp(t, 0.0, 1.0);
    if (t < 0.45) return mix(uC0, uC1, t / 0.45);
    if (t < 0.8) return mix(uC1, uC2, (t - 0.45) / 0.35);
    return mix(uC2, uC3, (t - 0.8) / 0.2);
  }

  void main() {
    // Gradiens: bal-felül (lila) → jobb-alul (narancs)
    float t = vUv.x * 0.55 + (1.0 - vUv.y) * 0.45;
    vec3 base = grad(t);

    vec3 N = normalize(vN);
    vec3 V = normalize(vView);
    vec3 L = normalize(vec3(-0.45, 0.65, 0.75));
    float diff = 0.58 + 0.42 * max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, normalize(L + V)), 0.0), 56.0);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // Lassan végigfutó fényes csík a felületen
    float band = fract(t * 0.8 - uTime * 0.07);
    float sheen = smoothstep(0.08, 0.0, abs(band - 0.5)) * vCap;

    vec3 col = base * diff;
    col *= mix(0.5, 1.0, vCap);               // az oldalfalak sötétebbek → mélység
    col += spec * 0.5 * vec3(1.0, 0.92, 0.96);
    col += fres * mix(uC1, uC3, 0.55) * 0.95;  // meleg perem-fény
    col += sheen * 0.14;
    col *= 1.0 + uGlow * 0.25;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const planeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Puha, színes fényudvar a logó mögött
const glowFragment = /* glsl */ `
  uniform vec3 uC0; uniform vec3 uC1;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p * vec2(1.0, 1.25));
    float a = exp(-r * r * 3.2) * uIntensity;
    vec3 col = mix(uC1, uC0, smoothstep(0.0, 1.0, r));
    gl_FragColor = vec4(col * a, a);
  }
`;

// Hanghullám: több, fénylő szinuszvonal, a hang erősségével (uVoice) mozog
const waveFragment = (lines: number) => /* glsl */ `
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC3;
  uniform float uTime;
  uniform float uVoice;
  varying vec2 vUv;
  void main() {
    float x = vUv.x;
    float env = smoothstep(0.0, 0.3, x) * smoothstep(1.0, 0.7, x);
    float y = (vUv.y - 0.5) * 2.0;
    float acc = 0.0;
    for (int i = 0; i < ${lines}; i++) {
      float fi = float(i);
      float amp = (0.22 + 0.5 * uVoice) * env * (0.55 + 0.45 * sin(fi * 1.7 + uTime * 0.6));
      float w = sin(x * 9.0 + uTime * 1.1 + fi * 0.75) * amp
              + sin(x * 17.0 - uTime * 1.6 + fi * 1.3) * amp * 0.35;
      float d = abs(y - w);
      acc += 0.0035 / (d + 0.004) * env;
    }
    acc = min(acc, 2.0);
    vec3 col = x < 0.5 ? mix(uC0, uC1, x * 2.0) : mix(uC1, uC3, (x - 0.5) * 2.0);
    float a = acc * 0.32;
    gl_FragColor = vec4(col * a, a);
  }
`;

// Kifelé táguló „hang-gyűrűk” (mintha a logó beszélne)
const ringsFragment = /* glsl */ `
  uniform vec3 uC1; uniform vec3 uC3;
  uniform float uTime;
  uniform float uVoice;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float acc = 0.0;
    for (int i = 0; i < 3; i++) {
      float ph = fract(uTime * 0.28 + float(i) / 3.0);
      float radius = mix(0.32, 1.0, ph);
      float fade = (1.0 - ph) * (1.0 - ph);
      acc += smoothstep(0.012, 0.0, abs(r - radius)) * fade;
    }
    float a = acc * uVoice * 0.55;
    vec3 col = mix(uC1, uC3, r);
    gl_FragColor = vec4(col * a, a);
  }
`;

/* ---------- A jelenet ---------- */

// Szárnyak eltolása a „szétválás” (explode) és az „átadás” (handoff) állapotban
const PART_OFFSETS: Record<LogoPart, { explode: THREE.Vector3; handoff: THREE.Vector3 }> = {
  v: { explode: new THREE.Vector3(-0.15, -0.05, -0.35), handoff: new THREE.Vector3(0, 0, 0) },
  upperWing: { explode: new THREE.Vector3(0.45, 0.35, 0.95), handoff: new THREE.Vector3(0.8, 0.4, 0.35) },
  lowerWing: { explode: new THREE.Vector3(0.7, -0.05, 0.5), handoff: new THREE.Vector3(0.25, -0.1, 0.1) },
};
const PARTS = Object.keys(logoPaths) as LogoPart[];

// A háttér-effektek (fény, hullám, gyűrűk) uniformjai
const fxUniforms = () => ({
  uC0: { value: COLORS.c0 }, uC1: { value: COLORS.c1 }, uC3: { value: COLORS.c3 },
  uTime: { value: 0 }, uVoice: { value: 0.5 }, uIntensity: { value: 0.7 },
});

function Scene({ input, lite }: { input: RefObject<SceneInput>; lite: boolean }) {
  const { viewport, size } = useThree();
  const group = useRef<THREE.Group>(null);
  const partRefs = useRef<Partial<Record<LogoPart, THREE.Mesh>>>({});
  const fxGroup = useRef<THREE.Group>(null);
  const current = useRef<Pose | null>(null);
  // Az anyagokat ref-en át frissítjük (R3F-minta): nincs React újrarenderelés képkockánként
  const logoMat = useRef<THREE.ShaderMaterial>(null);
  const glowMat = useRef<THREE.ShaderMaterial>(null);
  const waveMat = useRef<THREE.ShaderMaterial>(null);
  const ringsMat = useRef<THREE.ShaderMaterial>(null);

  const geometries = useMemo(
    () => Object.fromEntries(PARTS.map((p) => [p, buildGeometry(logoPaths[p])])) as Record<LogoPart, THREE.ExtrudeGeometry>,
    [],
  );
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  // Közös uniform-objektumok (a három logórész ugyanazt használja)
  const logoUniforms = useMemo(
    () => ({
      uSize: { value: SIZE },
      uC0: { value: COLORS.c0 }, uC1: { value: COLORS.c1 },
      uC2: { value: COLORS.c2 }, uC3: { value: COLORS.c3 },
      uTime: { value: 0 },
      uGlow: { value: 0 },
    }),
    [],
  );
  const glowUniforms = useMemo(() => fxUniforms(), []);
  const waveUniforms = useMemo(() => fxUniforms(), []);
  const ringsUniforms = useMemo(() => fxUniforms(), []);
  const waveShader = useMemo(() => waveFragment(lite ? 3 : 6), [lite]);

  const desktop = size.width >= 1024;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 20);
    const { stage, px, py } = input.current;
    const target = samplePose(keyframes(desktop, viewport.width, viewport.height, size.width < 640), stage);

    // Lágy követés: a jelenet „úszik” a cél felé, sosem ugrik
    if (!current.current) current.current = { ...target };
    const c = current.current;
    for (const k of Object.keys(target) as (keyof Pose)[]) {
      c[k] = THREE.MathUtils.damp(c[k], target[k], 5, dt);
    }

    const g = group.current;
    if (g) {
      const idle = Math.sin(t * 0.8) * 0.06;
      g.position.set(c.x, c.y + idle, c.z);
      g.rotation.set(c.rx - py * 0.08, c.ry + Math.sin(t * 0.45) * 0.05 + px * 0.14, 0);
      g.scale.setScalar(c.s);
    }

    for (const p of PARTS) {
      const mesh = partRefs.current[p];
      if (!mesh) continue;
      const o = PART_OFFSETS[p];
      mesh.position.copy(o.explode).multiplyScalar(c.explode).addScaledVector(o.handoff, c.handoff);
    }

    if (fxGroup.current) {
      fxGroup.current.position.set(c.x, c.y, -1.2);
      fxGroup.current.scale.setScalar(c.s);
    }

    if (logoMat.current) {
      logoMat.current.uniforms.uTime.value = t;
      logoMat.current.uniforms.uGlow.value = c.glow;
    }
    if (glowMat.current) {
      glowMat.current.uniforms.uIntensity.value = 0.45 + c.glow * 0.4 + Math.sin(t * 2.2) * 0.05 * c.voice;
    }
    for (const m of [waveMat.current, ringsMat.current]) {
      if (!m) continue;
      m.uniforms.uTime.value = t;
      m.uniforms.uVoice.value = c.voice;
    }
  });

  const fxProps = {
    vertexShader: planeVertex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  } as const;

  return (
    <>
      <group ref={fxGroup}>
        <mesh>
          <planeGeometry args={[9, 7]} />
          <shaderMaterial ref={glowMat} {...fxProps} fragmentShader={glowFragment} uniforms={glowUniforms} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[12, 3.4]} />
          <shaderMaterial key={waveShader} ref={waveMat} {...fxProps} fragmentShader={waveShader} uniforms={waveUniforms} />
        </mesh>
        {!lite && (
          <mesh position={[0.2, 0, 0.2]}>
            <planeGeometry args={[7.5, 7.5]} />
            <shaderMaterial ref={ringsMat} {...fxProps} fragmentShader={ringsFragment} uniforms={ringsUniforms} />
          </mesh>
        )}
      </group>
      <group ref={group}>
        {PARTS.map((p, i) => (
          <mesh
            key={p}
            ref={(m) => {
              if (m) partRefs.current[p] = m;
            }}
            geometry={geometries[p]}
          >
            <shaderMaterial
              ref={i === 0 ? logoMat : undefined}
              vertexShader={logoVertex}
              fragmentShader={logoFragment}
              uniforms={logoUniforms}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

type LogoSceneProps = {
  input: RefObject<SceneInput>;
  /** false → a render szünetel (nem látható a jelenet) */
  active: boolean;
  /** Egyszerűsített mód (mobil): kevesebb hullámvonal, gyűrűk nélkül, alacsonyabb felbontás */
  lite: boolean;
  onReady?: () => void;
};

export default function LogoScene({ input, active, lite, onReady }: LogoSceneProps) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 35 }}
      gl={{ antialias: !lite, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => onReady?.()}
      aria-hidden="true"
    >
      <Scene input={input} lite={lite} />
    </Canvas>
  );
}
