import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import './style.css';

const BEST_KEY = 'neonRush3DBest';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function App() {
  const mountRef = useRef(null), gameRef = useRef(null);
  const [screen, setScreen] = useState('ready');
  const [hud, setHud] = useState({ distance: 0, best: Number(localStorage.getItem(BEST_KEY) || 0), nitro: 100, speed: 0 });
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const host = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080d17);
    scene.fog = new THREE.FogExp2(0x111b27, 0.013);
    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 240);
    camera.position.set(0, 6.2, 13.8); camera.lookAt(0, 1.1, -8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7)); renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.13;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xa6c9ff, 0x11131d, 1.5));
    const moon = new THREE.DirectionalLight(0xadd8ff, 2.3); moon.position.set(-8, 17, 9); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); scene.add(moon);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x202734, roughness: .88 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(13, 300), roadMat); road.rotation.x = -Math.PI / 2; road.position.set(0, -.04, -115); road.receiveShadow = true; scene.add(road);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 300), new THREE.MeshStandardMaterial({ color: 0x101c20, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.16, -115); ground.receiveShadow = true; scene.add(ground);
    const laneMarks = [];
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0x9ba9bb });
    for (let lane = -1; lane <= 1; lane += 2) for (let i = 0; i < 32; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(.11, .018, 2.05), whiteMat); m.position.set(lane * 2.16, -.012, 9 - i * 8); scene.add(m); laneMarks.push(m);
    }
    const railMat = new THREE.MeshStandardMaterial({ color: 0xff4c91, emissive: 0xf51f70, emissiveIntensity: 1.9 });
    [-6.55, 6.55].forEach(x => { const rail = new THREE.Mesh(new THREE.BoxGeometry(.09, .12, 300), railMat); rail.position.set(x, .08, -115); scene.add(rail); });
    const lamps = [];
    for (let i = 0; i < 16; i++) for (const side of [-1, 1]) {
      const group = new THREE.Group(); group.position.set(side * (8.2 + Math.random() * 5), 0, -i * 18 - 4); scene.add(group);
      const post = new THREE.Mesh(new THREE.BoxGeometry(.11, 3.7, .11), new THREE.MeshStandardMaterial({ color: 0x344050, metalness: .65, roughness: .4 })); post.position.y = 1.85; group.add(post);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), new THREE.MeshBasicMaterial({ color: side < 0 ? 0x5af7ef : 0xff4f91 })); bulb.position.y = 3.75; group.add(bulb);
      const halo = new THREE.PointLight(side < 0 ? 0x40dcd8 : 0xff3e82, 9, 10, 2); halo.position.y = 3.65; group.add(halo); lamps.push(group);
    }
    // Distant skyline silhouettes
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x172230, roughness: 1 });
    for (let i = 0; i < 45; i++) {
      const side = i % 2 ? -1 : 1, x = side * (12 + Math.random() * 24), z = -Math.random() * 220;
      const box = new THREE.Mesh(new THREE.BoxGeometry(3 + Math.random() * 7, 5 + Math.random() * 20, 4 + Math.random() * 7), buildingMat);
      box.position.set(x, box.geometry.parameters.height / 2 - .1, z); scene.add(box);
    }

    function makeCar(color, player = false) {
      const root = new THREE.Group();
      const paint = new THREE.MeshStandardMaterial({ color, metalness: .55, roughness: .28, emissive: color, emissiveIntensity: player ? .19 : .03 });
      const glass = new THREE.MeshStandardMaterial({ color: 0x182a3c, metalness: .4, roughness: .18 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, .48, 3.05), paint); body.position.y = .62; body.castShadow = true; root.add(body);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.42, .22, 1.05), paint); hood.position.set(0, .85, - .82); hood.castShadow = true; root.add(hood);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.12, .48, 1.3), glass); cabin.position.set(0, .99, .18); cabin.castShadow = true; root.add(cabin);
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.5, .2, .24), paint); bumper.position.set(0, .38, -1.52); root.add(bumper);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x080a0e, roughness: .8 });
      for (const x of [-.79, .79]) for (const z of [-.96, .96]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.31, .31, .19, 14), tireMat); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .34, z); wheel.castShadow = true; root.add(wheel);
      }
      const lampMat = new THREE.MeshBasicMaterial({ color: player ? 0x8ffff6 : 0xffe5ad });
      for (const x of [-.48, .48]) { const lamp = new THREE.Mesh(new THREE.BoxGeometry(.25, .12, .07), lampMat); lamp.position.set(x, .72, -1.54); root.add(lamp); }
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xff315e });
      for (const x of [-.5, .5]) { const tail = new THREE.Mesh(new THREE.BoxGeometry(.27, .12, .07), tailMat); tail.position.set(x, .63, 1.54); root.add(tail); }
      if (player) {
        const glow = new THREE.PointLight(0x31e6ff, 0, 5, 2); glow.position.set(0, .35, 2); root.add(glow); root.userData.boostLight = glow;
        const flameMat = new THREE.MeshBasicMaterial({ color: 0x44fff0 });
        for (const x of [-.42, .42]) { const flame = new THREE.Mesh(new THREE.ConeGeometry(.13, .8, 9), flameMat); flame.rotation.x = Math.PI / 2; flame.position.set(x, .48, 1.9); flame.visible = false; root.add(flame); root.userData.flames ??= []; root.userData.flames.push(flame); }
      }
      scene.add(root); return root;
    }
    const playerCar = makeCar(0x31dacf, true); playerCar.position.set(0, 0, 5.4);
    const traffic = [], colors = [0xffa64d, 0xa271ff, 0x4d96ff, 0xff4775, 0xe8ddc0];
    const clock = new THREE.Clock();
    const state = { running: false, over: false, x: 0, target: 0, nitro: 100, distance: 0, spawn: .8, speed: 25, boosting: false, keys: new Set(), lastHud: 0, sound: false, audio: null };
    const audioCtx = () => { if (!state.audio) state.audio = new (window.AudioContext || window.webkitAudioContext)(); if (state.audio.state === 'suspended') state.audio.resume(); return state.audio; };
    function beep(freq = 480, duration = .11, type = 'sine') { if (!state.sound) return; try { const a = audioCtx(), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(.07, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + duration); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + duration); } catch {} }
    function startGame() { traffic.forEach(v => scene.remove(v.mesh)); traffic.length = 0; state.running = true; state.over = false; state.x = 0; state.target = 0; state.nitro = 100; state.distance = 0; state.speed = 25; state.spawn = .8; state.boosting = false; clock.getDelta(); setScreen('playing'); setHud(v => ({ ...v, distance: 0, nitro: 100, speed: 25 })); beep(640, .16); }
    function endGame() { state.running = false; state.over = true; state.boosting = false; const score = Math.floor(state.distance), old = Number(localStorage.getItem(BEST_KEY) || 0), best = Math.max(old, score); localStorage.setItem(BEST_KEY, best); setHud(v => ({ ...v, distance: score, best })); setScreen('over'); beep(150, .35, 'sawtooth'); }
    function addTraffic() { const lane = [-3.8, 0, 3.8][Math.floor(Math.random() * 3)]; const mesh = makeCar(colors[Math.floor(Math.random() * colors.length)]); mesh.position.set(lane, 0, -100); const v = { mesh, lane, z: -100, speed: 11 + Math.random() * 7 }; traffic.push(v); }
    function onKeyDown(e) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
      const k = e.key.toLowerCase(); state.keys.add(k);
      if (k === ' ' && state.running && state.nitro > 1) { state.boosting = true; }
      if ((k === 'enter' || k === ' ') && !state.running) startGame();
    }
    function onKeyUp(e) { state.keys.delete(e.key.toLowerCase()); if (e.key === ' ') state.boosting = false; }
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    function resize() { if (!host) return; const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    const ro = new ResizeObserver(resize); ro.observe(host); resize();
    let raf = 0;
    function animate() {
      const dt = Math.min(clock.getDelta(), .04), t = clock.elapsedTime;
      if (state.running) {
        if (state.keys.has('arrowleft') || state.keys.has('a')) state.target -= dt * 8;
        if (state.keys.has('arrowright') || state.keys.has('d')) state.target += dt * 8;
        state.target = clamp(state.target, -4.4, 4.4); state.x += (state.target - state.x) * Math.min(1, dt * 7.5);
        state.boosting = state.boosting && state.nitro > 0;
        state.speed = Math.min(62, 25 + state.distance * .012) * (state.boosting ? 1.5 : 1);
        state.distance += state.speed * dt * .92;
        if (state.boosting) state.nitro = Math.max(0, state.nitro - dt * 23); else state.nitro = Math.min(100, state.nitro + dt * 5.5);
        playerCar.userData.boostLight.intensity = state.boosting ? 4 : 0; playerCar.userData.flames.forEach(f => { f.visible = state.boosting; f.scale.setScalar(.7 + Math.random() * .7); });
        state.spawn -= dt; if (state.spawn <= 0) { addTraffic(); state.spawn = Math.max(.52, 1.22 - state.distance * .00006) * (.75 + Math.random() * .55); }
        laneMarks.forEach(m => { m.position.z += state.speed * dt; if (m.position.z > 11) m.position.z -= 256; });
        lamps.forEach(l => { l.position.z += state.speed * dt; if (l.position.z > 14) l.position.z -= 288; });
        playerCar.position.x = state.x; playerCar.rotation.z = (state.x - state.target) * -.055; playerCar.rotation.y = (state.x - state.target) * -.035;
        camera.position.x += (state.x * .22 - camera.position.x) * dt * 1.5; camera.position.y = 6.2 + (state.boosting ? Math.sin(t * 29) * .07 : 0); camera.lookAt(state.x * .2, 1.15, -8);
        for (let i = traffic.length - 1; i >= 0; i--) {
          const v = traffic[i]; v.z += (state.speed - v.speed) * dt; v.mesh.position.z = v.z;
          if (Math.abs(v.z - playerCar.position.z) < 2.7 && Math.abs(v.mesh.position.x - state.x) < 1.35) { endGame(); break; }
          if (v.z > 16) { scene.remove(v.mesh); traffic.splice(i, 1); }
        }
        if (Math.abs(state.x) > 4.1) state.speed = Math.max(15, state.speed - dt * 17);
        if (t - state.lastHud > .08) { state.lastHud = t; setHud(v => ({ ...v, distance: Math.floor(state.distance), nitro: state.nitro, speed: Math.round(state.speed * 3.1) })); }
      } else { camera.position.x += (0 - camera.position.x) * dt; playerCar.position.x = Math.sin(t * .55) * .18; playerCar.rotation.z = Math.sin(t * .55) * .016; }
      renderer.render(scene, camera); raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    gameRef.current = { startGame, state, audioCtx };
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); renderer.dispose(); host.removeChild(renderer.domElement); };
  }, []);

  const begin = () => { if (gameRef.current) gameRef.current.startGame(); };
  const toggleSound = () => { const next = !soundOn; setSoundOn(next); if (gameRef.current) { gameRef.current.state.sound = next; if (next) { try { gameRef.current.audioCtx(); } catch {} } } };
  const steer = (direction, down) => { if (!gameRef.current) return; const s = gameRef.current.state; if (down) s.target = clamp(s.target + direction * .85, -4.4, 4.4); };
  const boost = (down) => { if (gameRef.current) gameRef.current.state.boosting = down && gameRef.current.state.nitro > 1; };

  return <main className="app"><div className="scene" ref={mountRef} />
    <header className="topbar"><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="mark">NR</span><span><small>ENDLESS NIGHT DRIVE</small><strong>NEON <i>RUSH</i></strong></span></a><div className="top-stats"><div className="stat"><small>DISTANCE</small><strong>{String(hud.distance).padStart(5, '0')}<em> m</em></strong></div><div className="divider"/><div className="stat"><small>PERSONAL BEST</small><strong>{String(hud.best).padStart(5, '0')}<em> m</em></strong></div></div><button className="sound" onClick={toggleSound} aria-label="Toggle sound">{soundOn ? '♫' : '♪'} <span>{soundOn ? 'SOUND ON' : 'SOUND OFF'}</span></button></header>
    <div className="left-hud"><div className="chip"><span className={`live ${screen === 'playing' ? 'on' : ''}`}/>{screen === 'playing' ? 'IN THE FAST LANE' : 'NIGHT CIRCUIT · 01'}</div><div className="speed"><strong>{hud.speed}</strong><small>KM/H</small></div><div className="nitro"><div className="nitro-label"><span>⚡ &nbsp;NITRO</span><b>{Math.ceil(hud.nitro)}%</b></div><div className="bar"><i style={{ width: `${hud.nitro}%` }}/></div></div></div>
    <div className="right-hud"><div>01 <span>—</span> ENDLESS</div><div className="coordinates">NEON DISTRICT <b>◉</b></div></div>
    {screen !== 'playing' && <div className="overlay"><div className="modal"><div className="kicker"><span/> {screen === 'ready' ? 'MIDNIGHT CIRCUIT // ARCADE' : 'RUN COMPLETE // NIGHT DRIVER'}</div><h1>{screen === 'ready' ? <>OWN THE<br/><i>NIGHT.</i></> : <>NICE<br/><i>DRIVE.</i></>}</h1><p>{screen === 'ready' ? 'Thread through traffic, hit the boost and chase your next high score.' : `You covered ${hud.distance.toLocaleString()} meters. The city is still waiting.`}</p><button className="start" onClick={begin}>{screen === 'ready' ? 'START YOUR ENGINE' : 'RACE AGAIN'} <span>↗</span></button><div className="controls"><kbd>←</kbd><kbd>→</kbd><span>STEER</span><kbd>SPACE</kbd><span>BOOST</span></div></div></div>}
    <div className="mobile-controls"><div className="steer-controls"><button onPointerDown={() => steer(-1, true)} aria-label="Steer left">‹</button><button onPointerDown={() => steer(1, true)} aria-label="Steer right">›</button></div><button className="boost-button" onPointerDown={() => boost(true)} onPointerUp={() => boost(false)} onPointerLeave={() => boost(false)}>⚡ BOOST</button></div>
    <footer><span><i className="legend-car"/> YOU</span><span><i className="legend-traffic"/> TRAFFIC</span><span className="desktop-hint">ARROWS / A D TO STEER <b>·</b> SPACE TO BOOST</span><span className="build-tag">THREE.JS · NIGHT SHIFT</span></footer>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
