import * as THREE from 'three';

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
const TAU = Math.PI * 2;

/**
 * Creates a Hopf fibration geometry
 * The Hopf fibration is a map from the 3-sphere to the 2-sphere
 * Each fiber is a circle in the 3-sphere that maps to a point in the 2-sphere
 */
export function createHopfFibration(complexity: number = 50, radius: number = 1): THREE.BufferGeometry {
  const points: number[] = [];
  const colors: number[] = [];
  const fibers = complexity;
  const pointsPerFiber = 100;

  // Create fibers
  for (let i = 0; i < fibers; i++) {
    // Parameters for the base point on S²
    const phi = Math.acos(2 * i / fibers - 1);
    const theta = TAU * i / PHI; // Golden angle for even distribution

    // Create the fiber (circle) above this point
    for (let t = 0; t < pointsPerFiber; t++) {
      const phase = (t / pointsPerFiber) * TAU;
      
      // Compute the point on the fiber
      const [x, y, z, w] = hopfToR4(theta, phi, phase);
      
      // Stereographic projection to R³
      const [px, py, pz] = stereographicProjection(x, y, z, w);
      
      points.push(px * radius, py * radius, pz * radius);
      
      // Color based on position on fiber
      const hue = t / pointsPerFiber;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors.push(color.r, color.g, color.b);
    }
  }

  // Create geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}

/**
 * Creates a Golden Spiral geometry
 * Based on the golden ratio (φ) and Fibonacci sequence
 */
export function createGoldenSpiral(turns: number = 8, pointsPerTurn: number = 100): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const normals = [];
  const totalPoints = turns * pointsPerTurn;

  // Create vertices for the spiral
  for (let i = 0; i < totalPoints; i++) {
    const t = i / pointsPerTurn;
    const radius = Math.pow(PHI, t / TAU);
    const theta = t * TAU;

    // Spiral in 3D with increasing height
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    const z = t * 0.5; // Gradual increase in height

    vertices.push(x, y, z);

    // Add UV coordinates based on position
    uvs.push(
      (x + radius) / (2 * radius),
      (y + radius) / (2 * radius)
    );

    // Add normals for proper lighting
    const normal = new THREE.Vector3(x, y, z).normalize();
    normals.push(normal.x, normal.y, normal.z);
  }

  // Create faces (triangles) for the spiral
  for (let i = 0; i < totalPoints - 1; i++) {
    // Create a triangle strip along the spiral
    indices.push(i, i + 1, i + 2);
    indices.push(i + 1, i + 3, i + 2);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Creates a Pi Spiral geometry
 * A visualization based on the digits of π
 */
export function createPiSpiral(digits: number = 100): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const normals = [];
  const piDigits = Math.PI.toString().replace('.', '').slice(0, digits);

  let x = 0, y = 0, z = 0;
  let direction = 0;
  let lastX = 0, lastY = 0, lastZ = 0;

  // Create vertices for the spiral
  for (let i = 0; i < piDigits.length; i++) {
    const digit = parseInt(piDigits[i]);
    const length = (digit + 1) * 0.1; // Length based on digit value

    // Change direction based on whether digit is even/odd
    if (digit % 2 === 0) {
      direction += Math.PI / 4;
    } else {
      direction -= Math.PI / 4;
    }

    // Move in 3D space
    x += length * Math.cos(direction);
    y += length * Math.sin(direction);
    z += digit * 0.05; // Height based on digit value

    vertices.push(x, y, z);

    // Add UV coordinates based on position
    uvs.push(
      (x + 10) / 20, // Normalize to [0,1] range
      (y + 10) / 20
    );

    // Add normals for proper lighting
    const normal = new THREE.Vector3(x - lastX, y - lastY, z - lastZ).normalize();
    normals.push(normal.x, normal.y, normal.z);

    lastX = x;
    lastY = y;
    lastZ = z;
  }

  // Create faces (triangles) for the spiral
  for (let i = 0; i < vertices.length / 3 - 1; i++) {
    // Create a triangle strip along the spiral
    indices.push(i, i + 1, i + 2);
    indices.push(i + 1, i + 3, i + 2);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Creates a Klein Bottle geometry
 * A non-orientable surface with no inside or outside
 */
export function createKleinBottle(segments: number = 32, radius: number = 1): THREE.BufferGeometry {
  const points: number[] = [];
  const colors: number[] = [];

  for (let u = 0; u <= segments; u++) {
    const un = u / segments;
    const phi = un * TAU;

    for (let v = 0; v <= segments; v++) {
      const vn = v / segments;
      const theta = vn * TAU;

      // Klein bottle parametric equations
      const x = (radius + Math.cos(theta / 2) * Math.sin(phi) - Math.sin(theta / 2) * Math.sin(2 * phi)) * Math.cos(theta);
      const y = (radius + Math.cos(theta / 2) * Math.sin(phi) - Math.sin(theta / 2) * Math.sin(2 * phi)) * Math.sin(theta);
      const z = Math.sin(theta / 2) * Math.sin(phi) + Math.cos(theta / 2) * Math.sin(2 * phi);

      points.push(x, y, z);

      // Color based on position
      const hue = (un + vn) / 2;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors.push(color.r, color.g, color.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}

/**
 * Helper function: Maps a point from S³ to S² using the Hopf fibration
 */
function hopfToR4(theta: number, phi: number, phase: number): [number, number, number, number] {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosPhase = Math.cos(phase);
  const sinPhase = Math.sin(phase);

  return [
    cosTheta * cosPhi * cosPhase - sinTheta * sinPhase,
    cosTheta * cosPhi * sinPhase + sinTheta * cosPhase,
    cosTheta * sinPhi,
    sinTheta * sinPhi
  ];
}

/**
 * Helper function: Stereographic projection from R⁴ to R³
 */
function stereographicProjection(x: number, y: number, z: number, w: number): [number, number, number] {
  const factor = 1 / (1 - w);
  return [x * factor, y * factor, z * factor];
}

/**
 * Creates a Möbius Strip geometry
 */
export function createMobiusStrip(segments: number = 128, radius: number = 1, width: number = 0.2): THREE.BufferGeometry {
  const points: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const theta = u * TAU;

    for (let j = 0; j <= segments / 4; j++) {
      const v = j / (segments / 4) - 0.5;
      const phi = theta / 2;

      const x = (radius + v * width * Math.cos(phi)) * Math.cos(theta);
      const y = (radius + v * width * Math.cos(phi)) * Math.sin(theta);
      const z = v * width * Math.sin(phi);

      points.push(x, y, z);

      // Color based on position
      const hue = (u + v + 0.5) / 2;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors.push(color.r, color.g, color.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}

/**
 * Creates a Torus Knot geometry
 * p and q determine the type of knot
 */
export function createTorusKnot(p: number = 3, q: number = 2, segments: number = 128, radius: number = 1): THREE.BufferGeometry {
  const points: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const u = i / segments * TAU;
    
    // Torus knot equations
    const phi = u * p;
    const theta = u * q;
    
    const r = radius * (2 + Math.cos(theta));
    const x = r * Math.cos(phi);
    const y = r * Math.sin(phi);
    const z = radius * Math.sin(theta);

    points.push(x, y, z);

    // Color based on position in knot
    const hue = i / segments;
    const color = new THREE.Color().setHSL(hue, 1, 0.5);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
} 