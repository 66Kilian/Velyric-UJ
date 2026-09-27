"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { LOGO_VIEWBOX, logoPaths, type LogoPart } from "@/components/brand/logoPaths";

/* ============================================================
   A Velyric 3D jel (V + két szárny), világos felületre hangolva.
   Mozgása NEM véletlenszerű: a heróból a görgetés pontosan a
   24 órás számlap közepére viszi (a DOM-ból mért helyre), ott a
   számlap 0→24 órás telésével együtt egyszer körbefordul.
   ============================================================ */

export type SceneInput = {
  /** 0 = hero · 0→1 = átrepülés a számlapra · 1→2 = a számlap „telik” (0→24 óra) */
  stage: number;
  /** A számlap középpontja és szélessége világ-koordinátában (a DOM-ból mérve) */
  dock: { x: number; y: number; width: number } | null;
  /** Egér-pozíció -1..1 (enyhe parallax) */
  px: number;
  py: number;
  /** A hero példahívásában épp az ügynök beszél → erősebb „hang” */
  speaking: boolean;
};

type Pose = { x: number; y: number; rx: number; ry: number; s: number; explode: number; voice: number };

const LOGO_WIDTH = 4;
const SCALE = LOGO_WIDTH / LOGO_VIEWBOX.width;
const SIZE = new THREE.Vector2(LOGO_WIDTH, LOGO_VIEWBOX.height * SCALE);

// A márkapaletta sRGB-ben (a shader közvetlenül a kijelzőre ír)
const srgb = (h: string) => {
  const c = new THREE.Color(h).convertLinearToSRGB();
  return new THREE.Vector3(c.r, c.g, c.b);
};
const C = {
  magenta: srgb("#f000ff"),
  pink: srgb("#ff007a"),
  crimson: srgb("#ff174e"),
  coral: srgb("#ff7a59"),
  plum: srgb("#8e0069"),
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// Hero-póz: asztalon jobbra, a hívás-panel fölött; telefonon a képernyő fölött vár
function heroPose(desktop: boolean, phone: boolean, vw: number, vh: number): Pose {
  if (desktop) {
    const s = THREE.MathUtils.clamp(vw * 0.08, 0.7, 0.95);
    return { x: vw * 0.22, y: 0.7, rx: 0.12, ry: -0.42, s, explode: 0, voice: 0.2 };
  }
  const s = THREE.MathUtils.clamp(vw * 0.14, 0.4, 0.8);
  if (phone) return { x: 0, y: vh / 2 + 1.8, rx: 0.5, ry: -1.2, s, explode: 0.4, voice: 0 };
  return { x: 0, y: vh * 0.28, rx: 0.1, ry: -0.3, s, explode: 0, voice: 0.3 };
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

// Magenta → Hot Pink → Crimson → Coral gradiens, Deep Plum oldalfalak, fényes perem
const logoFragment = /* glsl */ `
  uniform vec3 uMagenta; uniform vec3 uPink; uniform vec3 uCrimson; uniform vec3 uCoral; uniform vec3 uPlum;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vView;
  varying vec2 vUv;
  varying float vCap;

  vec3 grad(float t) {
    t = clamp(t, 0.0, 1.0);
    if (t < 0.4) return mix(uMagenta, uPink, t / 0.4);
    if (t < 0.75) return mix(uPink, uCrimson, (t - 0.4) / 0.35);
    return mix(uCrimson, uCoral, (t - 0.75) / 0.25);
  }

  void main() {
    float t = vUv.x * 0.55 + (1.0 - vUv.y) * 0.45;
    vec3 base = grad(t);
    vec3 N = normalize(vN);
    vec3 V = normalize(vView);
    vec3 L = normalize(vec3(-0.45, 0.7, 0.75));
    float diff = 0.72 + 0.28 * max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, normalize(L + V)), 0.0), 60.0);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);

    float band = fract(t * 0.8 - uTime * 0.06);
    float sheen = smoothstep(0.08, 0.0, abs(band - 0.5)) * vCap;

    vec3 side = mix(uPlum, base, 0.35);
    vec3 col = mix(side, base, vCap) * diff;
    col += spec * 0.45;
    col += fres * mix(uPink, uCoral, 0.5) * 0.8; // meleg perem-fény a sötét háttér előtt
    col += sheen * 0.1;
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

// Puha rózsaszín fényudvar – a sötét háttéren additív keveréssel „világít”
const glowFragment = /* glsl */ `
  uniform vec3 uPink; uniform vec3 uMagenta;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p * vec2(1.0, 1.2));
    float a = exp(-r * r * 3.0) * uIntensity;
    float alpha = a * 0.5;
    gl_FragColor = vec4(mix(uPink, uMagenta, r) * alpha, alpha);
  }
`;

// Hanghullám-vonalak (a „hang” erősségével mozognak)
const waveFragment = (lines: number) => /* glsl */ `
  uniform vec3 uMagenta; uniform vec3 uPink; uniform vec3 uCoral;
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
      float amp = (0.2 + 0.5 * uVoice) * env * (0.55 + 0.45 * sin(fi * 1.7 + uTime * 0.6));
      float w = sin(x * 9.0 + uTime * 1.1 + fi * 0.75) * amp + sin(x * 17.0 - uTime * 1.6 + fi * 1.3) * amp * 0.35;
      acc += 0.0028 / (abs(y - w) + 0.004) * env;
    }
    vec3 col = x < 0.5 ? mix(uMagenta, uPink, x * 2.0) : mix(uPink, uCoral, (x - 0.5) * 2.0);
    float alpha = min(acc, 1.6) * 0.32;
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

// Kifelé táguló „hang-gyűrűk”
const ringsFragment = /* glsl */ `
  uniform vec3 uPink; uniform vec3 uCoral;
  uniform float uTime;
  uniform float uVoice;
  varying vec2 vUv;
  void main() {
    float r = length((vUv - 0.5) * 2.0);
    float acc = 0.0;
    for (int i = 0; i < 3; i++) {
      float ph = fract(uTime * 0.28 + float(i) / 3.0);
      acc += smoothstep(0.012, 0.0, abs(r - mix(0.32, 1.0, ph))) * (1.0 - ph) * (1.0 - ph);
    }
    float alpha = acc * uVoice * 0.55;
    gl_FragColor = vec4(mix(uPink, uCoral, r) * alpha, alpha);
  }
`;

/* ---------- A jelenet ---------- */

// A szárnyak repülés közben finoman szétnyílnak, majd összezárnak
const EXPLODE: Record<LogoPart, THREE.Vector3> = {
  v: new THREE.Vector3(-0.1, -0.05, -0.3),
  upperWing: new THREE.Vector3(0.4, 0.3, 0.8),
  lowerWing: new THREE.Vector3(0.6, -0.05, 0.45),
};
const PARTS = Object.keys(logoPaths) as LogoPart[];

const fxUniforms = () => ({
  uMagenta: { value: C.magenta },
  uPink: { value: C.pink },
  uCoral: { value: C.coral },
  uTime: { value: 0 },
  uVoice: { value: 0.3 },
  uIntensity: { value: 0.8 },
});

function Scene({ input, lite }: { input: RefObject<SceneInput>; lite: boolean }) {
  const { viewport, size } = useThree();
  const group = useRef<THREE.Group>(null);
  const fxGroup = useRef<THREE.Group>(null);
  const partRefs = useRef<Partial<Record<LogoPart, THREE.Mesh>>>({});
  const current = useRef<Pose | null>(null);
  const logoMat = useRef<THREE.ShaderMaterial>(null);
  const glowMat = useRef<THREE.ShaderMaterial>(null);
  const waveMat = useRef<THREE.ShaderMaterial>(null);
  const ringsMat = useRef<THREE.ShaderMaterial>(null);

  const geometries = useMemo(
    () => Object.fromEntries(PARTS.map((p) => [p, buildGeometry(logoPaths[p])])) as Record<LogoPart, THREE.ExtrudeGeometry>,
    [],
  );
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  const logoUniforms = useMemo(
    () => ({
      uSize: { value: SIZE },
      uMagenta: { value: C.magenta },
      uPink: { value: C.pink },
      uCrimson: { value: C.crimson },
      uCoral: { value: C.coral },
      uPlum: { value: C.plum },
      uTime: { value: 0 },
    }),
    [],
  );
  const glowUniforms = useMemo(() => fxUniforms(), []);
  const waveUniforms = useMemo(() => fxUniforms(), []);
  const ringsUniforms = useMemo(() => fxUniforms(), []);
  const waveShader = useMemo(() => waveFragment(lite ? 3 : 5), [lite]);

  const desktop = size.width >= 1024;
  const phone = size.width < 640;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 20);
    const { stage, dock, px, py, speaking } = input.current;

    // Cél-póz: hero → (átrepülés) → számlap közepe → egy teljes, lassú fordulat
    const hero = heroPose(desktop, phone, viewport.width, viewport.height);
    const docked: Pose = dock
      ? { x: dock.x, y: dock.y, rx: 0.06, ry: 0, s: (dock.width * 0.5) / LOGO_WIDTH, explode: 0, voice: 0.55 }
      : hero;
    let target: Pose;
    if (stage <= 1) {
      const k = smooth(clamp01(stage));
      target = { ...hero };
      for (const key of Object.keys(hero) as (keyof Pose)[]) target[key] = hero[key] + (docked[key] - hero[key]) * k;
      target.explode = Math.sin(k * Math.PI) * 0.35 + hero.explode * (1 - k);
    } else {
      const p = smooth(clamp01(stage - 1));
      target = { ...docked, ry: p * Math.PI * 2, voice: 0.45 + p * 0.5 };
    }
    if (speaking && stage < 0.5) target.voice = Math.min(1.2, target.voice + 0.6);

    // Lágy követés: sosem ugrik, mindig „úszik” a cél felé
    if (!current.current) current.current = { ...target };
    const c = current.current;
    for (const key of Object.keys(target) as (keyof Pose)[]) c[key] = THREE.MathUtils.damp(c[key], target[key], 6, dt);

    const g = group.current;
    if (g) {
      g.position.set(c.x, c.y + Math.sin(t * 0.8) * 0.05, 0);
      g.rotation.set(c.rx - py * 0.06, c.ry + Math.sin(t * 0.45) * 0.04 + px * 0.1, 0);
      g.scale.setScalar(c.s);
    }
    for (const p of PARTS) partRefs.current[p]?.position.copy(EXPLODE[p]).multiplyScalar(c.explode);

    if (fxGroup.current) {
      fxGroup.current.position.set(c.x, c.y, -1.2);
      fxGroup.current.scale.setScalar(c.s);
    }
    if (logoMat.current) logoMat.current.uniforms.uTime.value = t;
    if (glowMat.current) glowMat.current.uniforms.uIntensity.value = 0.7 + c.voice * 0.3;
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
  active: boolean;
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
