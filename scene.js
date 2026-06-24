/**
 * ============================================================
 *  scene.js — Immersive Neural-Network Particle Background
 * ============================================================
 *  Three.js r128 loaded via CDN (global `THREE`).
 *  Renders on <canvas id="hero-canvas">.
 *
 *  Features
 *  --------
 *  • ~200 glowing particles connected by proximity lines
 *  • Floating wireframe icosahedron, octahedron & torus
 *  • Mouse-driven parallax + mobile auto-rotation
 *  • Scroll-based camera shift & opacity fade
 *  • Dynamic point light following cursor
 *  • Performance-aware particle count (halved on mobile)
 *  • Visibility API – pauses when tab is hidden
 *  • Smooth 1 s fade-in after page load
 * ============================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------
   *  Guard — make sure THREE is available
   * ------------------------------------------------------ */
  if (typeof THREE === 'undefined') {
    console.warn('[scene.js] THREE is not defined — skipping 3D scene init.');
    return;
  }

  /* ========================================================
   *  CONSTANTS & CONFIG
   * ====================================================== */
  const CONFIG = {
    // Colors
    CYAN:   0x00d4ff,
    PURPLE: 0x7b61ff,
    WHITE:  0xffffff,

    // Particle system
    PARTICLE_COUNT_DESKTOP: 200,
    PARTICLE_COUNT_MOBILE:  90,
    PARTICLE_SPREAD:        50,         // XYZ range
    PARTICLE_SIZE_BASE:     0.18,
    CONNECTION_DISTANCE:    8,          // max distance to draw a line
    MAX_CONNECTIONS:        300,        // cap total connections per frame

    // Floating shapes
    SHAPE_SCALE:   1.0,
    SHAPE_OPACITY: 0.15,

    // Camera
    CAM_FOV:       60,
    CAM_NEAR:      0.1,
    CAM_FAR:       200,
    CAM_Z:         35,

    // Mouse parallax
    PARALLAX_FACTOR: 2.0,
    PARALLAX_LERP:   0.05,

    // Scroll
    SCROLL_CAMERA_SHIFT: 15,   // how far cam moves on full scroll
    HERO_HEIGHT_VH:      100,  // hero section height in vh

    // Auto-rotation (mobile fallback)
    AUTO_ROTATE_SPEED: 0.0003,

    // Startup
    INIT_DELAY_MS:  300,
    FADE_IN_MS:     1000,
  };

  /* --------------------------------------------------------
   *  Device detection helpers
   * ------------------------------------------------------ */
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  const PARTICLE_COUNT = isMobile
    ? CONFIG.PARTICLE_COUNT_MOBILE
    : CONFIG.PARTICLE_COUNT_DESKTOP;

  /* ========================================================
   *  STATE
   * ====================================================== */
  let renderer, scene, camera;
  let particleSystem, particlePositions, particleVelocities, particleColors;
  let linesMesh, linesGeometry, linesPositions, linesColors;
  let floatingShapes = [];
  let pointLight;

  const mouse  = { x: 0, y: 0 };   // normalised –1 → 1
  const target = { x: 0, y: 0 };    // smoothed mouse
  let scrollProgress = 0;           // 0 → 1 over hero section
  let isTabVisible   = true;
  let clock;

  /* ========================================================
   *  INIT SCENE — renderer, camera, scene, lights
   * ====================================================== */
  function initScene() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) {
      console.warn('[scene.js] #hero-canvas not found.');
      return false;
    }

    // --- Renderer ---
    renderer = new THREE.WebGLRenderer({
      canvas:    canvas,
      antialias: true,
      alpha:     true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // transparent

    // --- Scene ---
    scene = new THREE.Scene();

    // Light fog for depth perception
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.012);

    // --- Camera ---
    camera = new THREE.PerspectiveCamera(
      CONFIG.CAM_FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAM_NEAR,
      CONFIG.CAM_FAR
    );
    camera.position.set(0, 0, CONFIG.CAM_Z);

    // --- Lights ---
    const ambient = new THREE.AmbientLight(0x111122, 0.6);
    scene.add(ambient);

    pointLight = new THREE.PointLight(CONFIG.CYAN, 1.2, 80);
    pointLight.position.set(0, 0, 20);
    scene.add(pointLight);

    const purpleLight = new THREE.PointLight(CONFIG.PURPLE, 0.6, 60);
    purpleLight.position.set(-15, 10, 10);
    scene.add(purpleLight);

    clock = new THREE.Clock();

    return true;
  }

  /* ========================================================
   *  CREATE PARTICLES (neural-network nodes)
   * ====================================================== */
  function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const count    = PARTICLE_COUNT;
    const spread   = CONFIG.PARTICLE_SPREAD;

    // Allocate typed arrays
    particlePositions  = new Float32Array(count * 3);
    particleVelocities = new Float32Array(count * 3);
    particleColors     = new Float32Array(count * 3);

    const cyan   = new THREE.Color(CONFIG.CYAN);
    const purple = new THREE.Color(CONFIG.PURPLE);
    const white  = new THREE.Color(0x8899aa);  // dim white-blue

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random position within a sphere-ish volume
      particlePositions[i3]     = (Math.random() - 0.5) * spread;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * spread;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * spread * 0.6;

      // Slow random drift velocity
      particleVelocities[i3]     = (Math.random() - 0.5) * 0.008;
      particleVelocities[i3 + 1] = (Math.random() - 0.5) * 0.008;
      particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.004;

      // Color: 50 % cyan, 35 % purple, 15 % dim white
      const r = Math.random();
      let col;
      if (r < 0.50)      col = cyan;
      else if (r < 0.85) col = purple;
      else                col = white;

      particleColors[i3]     = col.r;
      particleColors[i3 + 1] = col.g;
      particleColors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(particleColors, 3));

    const material = new THREE.PointsMaterial({
      size:             CONFIG.PARTICLE_SIZE_BASE * (isMobile ? 1.4 : 1),
      vertexColors:     true,
      transparent:      true,
      opacity:          0.85,
      blending:         THREE.AdditiveBlending,
      depthWrite:       false,
      sizeAttenuation:  true,
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
  }

  /* ========================================================
   *  CREATE CONNECTIONS (neural-network edges)
   * ====================================================== */
  function createConnections() {
    // Pre-allocate a large buffer; we'll update vertexCount each frame
    const maxSegments = CONFIG.MAX_CONNECTIONS;
    linesPositions = new Float32Array(maxSegments * 2 * 3); // 2 verts per line
    linesColors    = new Float32Array(maxSegments * 2 * 3);

    linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linesPositions, 3));
    linesGeometry.setAttribute('color',    new THREE.BufferAttribute(linesColors, 3));
    linesGeometry.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      vertexColors:  true,
      transparent:   true,
      opacity:       0.35,
      blending:      THREE.AdditiveBlending,
      depthWrite:    false,
    });

    linesMesh = new THREE.LineSegments(linesGeometry, mat);
    scene.add(linesMesh);
  }

  /** Update connections each frame */
  function updateConnections() {
    const count     = PARTICLE_COUNT;
    const maxDist   = CONFIG.CONNECTION_DISTANCE;
    const maxDistSq = maxDist * maxDist;
    const maxLines  = CONFIG.MAX_CONNECTIONS;
    let   numLines  = 0;

    for (let i = 0; i < count && numLines < maxLines; i++) {
      const ix = particlePositions[i * 3];
      const iy = particlePositions[i * 3 + 1];
      const iz = particlePositions[i * 3 + 2];

      for (let j = i + 1; j < count && numLines < maxLines; j++) {
        const dx = ix - particlePositions[j * 3];
        const dy = iy - particlePositions[j * 3 + 1];
        const dz = iz - particlePositions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistSq) {
          const idx = numLines * 6; // 2 verts × 3 components
          const dist = Math.sqrt(distSq);
          const alpha = 1.0 - dist / maxDist; // closer → brighter

          // Vertex A
          linesPositions[idx]     = ix;
          linesPositions[idx + 1] = iy;
          linesPositions[idx + 2] = iz;
          // Vertex B
          linesPositions[idx + 3] = particlePositions[j * 3];
          linesPositions[idx + 4] = particlePositions[j * 3 + 1];
          linesPositions[idx + 5] = particlePositions[j * 3 + 2];

          // Color — fade between cyan and purple with distance-based brightness
          const cIdx = numLines * 6;
          const brightness = alpha * 0.7;
          // vertex A colour (lean cyan)
          linesColors[cIdx]     = 0.0   * brightness + 0.48 * brightness;
          linesColors[cIdx + 1] = 0.83  * brightness;
          linesColors[cIdx + 2] = 1.0   * brightness;
          // vertex B colour (lean purple)
          linesColors[cIdx + 3] = 0.48  * brightness;
          linesColors[cIdx + 4] = 0.38  * brightness;
          linesColors[cIdx + 5] = 1.0   * brightness;

          numLines++;
        }
      }
    }

    linesGeometry.attributes.position.needsUpdate = true;
    linesGeometry.attributes.color.needsUpdate    = true;
    linesGeometry.setDrawRange(0, numLines * 2);
  }

  /* ========================================================
   *  CREATE GEOMETRIC OBJECTS (floating wireframe shapes)
   * ====================================================== */
  function createGeometricObjects() {
    const s = CONFIG.SHAPE_SCALE;

    const shapes = [
      {
        geo: new THREE.IcosahedronGeometry(2.2 * s, 1),
        pos: new THREE.Vector3(-14, 8, -6),
        color: CONFIG.CYAN,
        rotSpeed: { x: 0.003, y: 0.005, z: 0.002 },
        bobAmp: 1.2,
        bobFreq: 0.4,
      },
      {
        geo: new THREE.OctahedronGeometry(1.8 * s, 0),
        pos: new THREE.Vector3(16, -6, -8),
        color: CONFIG.PURPLE,
        rotSpeed: { x: 0.004, y: 0.003, z: 0.005 },
        bobAmp: 1.0,
        bobFreq: 0.55,
      },
      {
        geo: new THREE.TorusGeometry(1.6 * s, 0.4 * s, 12, 36),
        pos: new THREE.Vector3(-10, -10, -4),
        color: 0x4ecbff,
        rotSpeed: { x: 0.002, y: 0.006, z: 0.003 },
        bobAmp: 0.8,
        bobFreq: 0.65,
      },
      {
        geo: new THREE.TetrahedronGeometry(1.4 * s, 0),
        pos: new THREE.Vector3(12, 10, -10),
        color: 0x9b6dff,
        rotSpeed: { x: 0.005, y: 0.004, z: 0.006 },
        bobAmp: 1.4,
        bobFreq: 0.35,
      },
    ];

    shapes.forEach(function (cfg) {
      const mat = new THREE.MeshPhongMaterial({
        color:        cfg.color,
        wireframe:    true,
        transparent:  true,
        opacity:      CONFIG.SHAPE_OPACITY,
        blending:     THREE.AdditiveBlending,
        depthWrite:   false,
        shininess:    100,
        emissive:     new THREE.Color(cfg.color),
        emissiveIntensity: 0.3,
      });

      const mesh  = new THREE.Mesh(cfg.geo, mat);
      mesh.position.copy(cfg.pos);
      mesh.userData = {
        baseY:    cfg.pos.y,
        rotSpeed: cfg.rotSpeed,
        bobAmp:   cfg.bobAmp,
        bobFreq:  cfg.bobFreq,
      };

      scene.add(mesh);
      floatingShapes.push(mesh);
    });
  }

  /* ========================================================
   *  EVENT HANDLERS
   * ====================================================== */

  /** Mouse tracking — normalised –1 → 1 */
  function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }

  /** Touch tracking for mobile parallax */
  function onTouchMove(e) {
    if (e.touches.length > 0) {
      mouse.x = (e.touches[0].clientX / window.innerWidth)  * 2 - 1;
      mouse.y = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
    }
  }

  /** Responsive resize */
  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /** Scroll tracking (0 → 1 over hero section) */
  function onScroll() {
    const heroH = window.innerHeight * (CONFIG.HERO_HEIGHT_VH / 100);
    scrollProgress = Math.min(window.scrollY / heroH, 1);
  }

  /** Visibility API — pause when hidden */
  function onVisibilityChange() {
    isTabVisible = !document.hidden;
    if (isTabVisible && clock) clock.getDelta(); // reset delta to avoid jump
  }

  /* ========================================================
   *  ANIMATION LOOP
   * ====================================================== */
  function animate() {
    requestAnimationFrame(animate);

    // Don't render if tab is hidden
    if (!isTabVisible) return;

    const dt    = clock.getDelta();
    const time  = clock.getElapsedTime();
    const count = PARTICLE_COUNT;
    const half  = CONFIG.PARTICLE_SPREAD * 0.5;

    /* --- Smooth mouse target (lerp) --- */
    target.x += (mouse.x - target.x) * CONFIG.PARALLAX_LERP;
    target.y += (mouse.y - target.y) * CONFIG.PARALLAX_LERP;

    /* --- Mobile auto-rotation when no touch input --- */
    if (isMobile && mouse.x === 0 && mouse.y === 0) {
      target.x = Math.sin(time * CONFIG.AUTO_ROTATE_SPEED * 1000) * 0.3;
      target.y = Math.cos(time * CONFIG.AUTO_ROTATE_SPEED * 700)  * 0.15;
    }

    /* --- Camera parallax --- */
    camera.position.x = target.x * CONFIG.PARALLAX_FACTOR;
    camera.position.y = -target.y * CONFIG.PARALLAX_FACTOR * 0.6;
    // Scroll: push camera back and down
    camera.position.z = CONFIG.CAM_Z + scrollProgress * CONFIG.SCROLL_CAMERA_SHIFT;
    camera.position.y -= scrollProgress * 5;
    camera.lookAt(0, 0, 0);

    /* --- Point light follows mouse loosely --- */
    pointLight.position.x = target.x * 15;
    pointLight.position.y = -target.y * 10;
    // Gentle colour cycling
    const hue = (time * 0.02) % 1;
    pointLight.color.setHSL(hue * 0.15 + 0.52, 0.9, 0.6); // cyan-ish range

    /* --- Update particle positions (drift) --- */
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      particlePositions[i3]     += particleVelocities[i3];
      particlePositions[i3 + 1] += particleVelocities[i3 + 1];
      particlePositions[i3 + 2] += particleVelocities[i3 + 2];

      // Wrap around boundaries with smooth reversal
      if (Math.abs(particlePositions[i3])     > half) particleVelocities[i3]     *= -1;
      if (Math.abs(particlePositions[i3 + 1]) > half) particleVelocities[i3 + 1] *= -1;
      if (Math.abs(particlePositions[i3 + 2]) > half * 0.6) particleVelocities[i3 + 2] *= -1;

      // Tiny sine wobble for organic feel
      particlePositions[i3]     += Math.sin(time * 0.3 + i * 0.1) * 0.003;
      particlePositions[i3 + 1] += Math.cos(time * 0.25 + i * 0.15) * 0.003;
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;

    /* --- Scroll-based particle fade --- */
    const fadeOpacity = Math.max(1.0 - scrollProgress * 1.5, 0);
    particleSystem.material.opacity = 0.85 * fadeOpacity;
    linesMesh.material.opacity      = 0.35 * fadeOpacity;
    floatingShapes.forEach(function (m) {
      m.material.opacity = CONFIG.SHAPE_OPACITY * fadeOpacity;
    });

    /* --- Update line connections --- */
    updateConnections();

    /* --- Animate floating shapes --- */
    floatingShapes.forEach(function (mesh) {
      const ud = mesh.userData;
      mesh.rotation.x += ud.rotSpeed.x;
      mesh.rotation.y += ud.rotSpeed.y;
      mesh.rotation.z += ud.rotSpeed.z;
      mesh.position.y  = ud.baseY + Math.sin(time * ud.bobFreq) * ud.bobAmp;

      // Subtle parallax for shapes (nearer ones move more)
      const depth = 1.0 - (mesh.position.z + 15) / 30; // 0→1 near→far
      mesh.position.x += target.x * 0.02 * depth;
      mesh.position.y += -target.y * 0.015 * depth;
    });

    /* --- Render --- */
    renderer.render(scene, camera);
  }

  /* ========================================================
   *  STARTUP — wait for window.load, then init with delay
   * ====================================================== */
  function start() {
    // Initialise scene
    if (!initScene()) return;

    // Build scene objects
    createParticles();
    createConnections();
    createGeometricObjects();

    // Bind events
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize',    onResize);
    window.addEventListener('scroll',    onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Apply canvas styling (defensive — in case CSS hasn't set it)
    const c = renderer.domElement;
    c.style.position = 'fixed';
    c.style.top      = '0';
    c.style.left     = '0';
    c.style.width    = '100vw';
    c.style.height   = '100vh';
    c.style.zIndex   = '0';
    c.style.pointerEvents = 'none';

    // Fade-in: start transparent, transition to full opacity
    c.style.opacity    = '0';
    c.style.transition = 'opacity ' + CONFIG.FADE_IN_MS + 'ms ease-out';

    // Trigger initial scroll state
    onScroll();

    // Kick off render loop
    animate();

    // Fade in after a tiny repaint tick
    requestAnimationFrame(function () {
      c.style.opacity = '1';
    });
  }

  /* Listen for full page load, then add a small delay for loader */
  window.addEventListener('load', function () {
    setTimeout(start, CONFIG.INIT_DELAY_MS);
  });
})();
