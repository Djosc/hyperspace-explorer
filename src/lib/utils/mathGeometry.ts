import * as THREE from 'three';

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
const TAU = Math.PI * 2;

/**
 * Creates a beautiful, smooth Hopf fibration with flowing fibers
 * Similar to the classic mathematical visualization with rainbow colors
 */
export function createHopfFibration(complexity: number = 50, radius: number = 1): THREE.BufferGeometry {
  const points: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  const fibers = Math.min(complexity, 50); // Reduced for stability
  const pointsPerFiber = 60; // Reduced for better performance
  
  // Create fibers using organized spherical distribution
  for (let i = 0; i < fibers; i++) {
    const t = i / fibers;
    
    // Distribute base points evenly on the sphere using spherical coordinates
    // This creates the "sphere" that the user mentioned
    const phi = Math.acos(1 - 2 * t); // Latitude (0 to π)
    const theta = TAU * t * PHI; // Longitude using golden angle for even distribution
    
    // Each base point on the sphere gets a circular fiber
    const fiberPoints: THREE.Vector3[] = [];
    const fiberColors: THREE.Color[] = [];
    
    // Generate the circular fiber for this base point
    for (let j = 0; j <= pointsPerFiber; j++) {
      const fiberPhase = (j / pointsPerFiber) * TAU;
      
      try {
        // Use the proper Hopf fibration map: S³ → S²
        // This creates a circle in 4D space for each point on the 2D sphere
        const [x, y, z, w] = hopfMap(theta, phi, fiberPhase);
        
        // Validate 4D coordinates
        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(w)) {
          continue;
        }
        
        // Project from 4D to 3D using stereographic projection
        const [px, py, pz] = stereographicProjection(x, y, z, w);
        
        // Validate 3D projection
        if (isNaN(px) || isNaN(py) || isNaN(pz)) {
          continue;
        }
        
        // Scale appropriately
        const point = new THREE.Vector3(px * radius, py * radius, pz * radius);
        
        // Final validation
        if (isNaN(point.x) || isNaN(point.y) || isNaN(point.z)) {
          continue;
        }
        
        fiberPoints.push(point);
        
        // Color based on position on the base sphere (not the fiber)
        // This creates consistent coloring for each "magnetic field line"
        const baseHue = t; // Each fiber gets its own hue based on position on sphere
        const fiberVariation = Math.sin(fiberPhase) * 0.1; // Slight variation along the fiber
        const hue = (baseHue + fiberVariation) % 1.0;
        const saturation = 0.9;
        const lightness = 0.6 + Math.cos(fiberPhase) * 0.2; // Gentle variation along fiber
        
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        fiberColors.push(color);
      } catch (error) {
        continue;
      }
    }
    
    // Add this fiber to the geometry if we have valid points
    for (let j = 0; j < fiberPoints.length; j++) {
      const point = fiberPoints[j];
      const color = fiberColors[j];
      
      points.push(point.x, point.y, point.z);
      colors.push(color.r, color.g, color.b);
      
      // Calculate smooth normals for lighting
      let normal: THREE.Vector3;
      if (j === 0) {
        normal = fiberPoints[1] ? fiberPoints[1].clone().sub(point).normalize() : new THREE.Vector3(0, 1, 0);
      } else if (j === fiberPoints.length - 1) {
        normal = point.clone().sub(fiberPoints[j - 1]).normalize();
      } else {
        normal = fiberPoints[j + 1].clone().sub(fiberPoints[j - 1]).normalize();
      }
      
      normals.push(normal.x, normal.y, normal.z);
      
      // Create line segments for the circular fiber
      if (j < fiberPoints.length - 1) {
        const baseIndex = (points.length / 3) - fiberPoints.length + j;
        indices.push(baseIndex, baseIndex + 1);
      }
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  
  // Only set attributes if we have valid data
  if (points.length > 0) {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    if (indices.length > 0) {
      geometry.setIndex(indices);
    }
  }
  
  return geometry;
}

/**
 * Proper Hopf fibration map from S³ to S²
 * Takes spherical coordinates on S² and a fiber parameter, returns point on S³
 */
function hopfMap(theta: number, phi: number, t: number): [number, number, number, number] {
  // Convert spherical coordinates to Cartesian on S²
  const baseSinPhi = Math.sin(phi);
  const baseX = baseSinPhi * Math.cos(theta);
  const baseY = baseSinPhi * Math.sin(theta);
  const baseZ = Math.cos(phi);
  
  // Create the fiber circle in S³ above this base point
  // The Hopf fibration creates circles that are linked in a beautiful way
  const cosT = Math.cos(t);
  const sinT = Math.sin(t);
  
  // Map to S³ coordinates using the Hopf fibration formula
  const x = cosT * baseX;
  const y = cosT * baseY;
  const z = sinT * baseX;
  const w = sinT * baseY;
  
  // Normalize to ensure we're on the unit 3-sphere
  const norm = Math.sqrt(x*x + y*y + z*z + w*w);
  return [x/norm, y/norm, z/norm, w/norm];
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
 * Creates a Klein Bottle geometry using the mathematically accurate "figure-8" immersion
 * This matches the Julia implementation for consistent high-quality results
 */
export function createKleinBottle(segments: number = 32, radius: number = 1): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const normals = [];

  // Use higher resolution for quality matching Julia (minimum 32x32 = 1,024 vertices)
  const u_steps = Math.max(segments * 4, 32); // Ensure minimum quality
  const v_steps = Math.max(segments * 4, 32);
  const scale = radius * 0.1; // Scale down to match Julia's coordinate system

  // Klein bottle parametric equations using the "figure-8" immersion in R³
  // This is the mathematically accurate version that matches Julia implementation
  for (let i = 0; i < u_steps; i++) {
    for (let j = 0; j < v_steps; j++) {
      const u = (2 * Math.PI * i) / u_steps;
      const v = (2 * Math.PI * j) / v_steps;
      
      let x, y, z;
      
      // Klein bottle parametric equations (figure-8 immersion)
      // These equations exactly match the Julia implementation
      if (u < Math.PI) {
        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u)/2) * Math.cos(u) * Math.cos(v);
        y = 8 * Math.sin(u) + 2 * (1 - Math.cos(u)/2) * Math.sin(u) * Math.cos(v);
      } else {
        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u)/2) * Math.cos(v + Math.PI);
        y = 8 * Math.sin(u);
      }
      z = 2 * (1 - Math.cos(u)/2) * Math.sin(v);
      
      // Apply scale
      x *= scale;
      y *= scale;
      z *= scale;

      vertices.push(x, y, z);

      // UV coordinates
      uvs.push(i / (u_steps - 1), j / (v_steps - 1));

      // Compute mathematically accurate normals using numerical differentiation
      // This approach ensures smooth normals that properly represent the surface curvature
      const du_step = Math.PI / (u_steps * 2);
      const dv_step = Math.PI / (v_steps * 2);
      
      // Compute partial derivative with respect to u
      let u_forward = u + du_step;
      let u_backward = u - du_step;
      
      // Ensure we stay within parameter bounds and handle the u < π condition properly
      if (u_forward > 2 * Math.PI) u_forward -= 2 * Math.PI;
      if (u_backward < 0) u_backward += 2 * Math.PI;
      
      // Forward point
      let x_f, y_f, z_f;
      if (u_forward < Math.PI) {
        x_f = 3 * Math.cos(u_forward) * (1 + Math.sin(u_forward)) + 2 * (1 - Math.cos(u_forward)/2) * Math.cos(u_forward) * Math.cos(v);
        y_f = 8 * Math.sin(u_forward) + 2 * (1 - Math.cos(u_forward)/2) * Math.sin(u_forward) * Math.cos(v);
      } else {
        x_f = 3 * Math.cos(u_forward) * (1 + Math.sin(u_forward)) + 2 * (1 - Math.cos(u_forward)/2) * Math.cos(v + Math.PI);
        y_f = 8 * Math.sin(u_forward);
      }
      z_f = 2 * (1 - Math.cos(u_forward)/2) * Math.sin(v);
      
      // Backward point  
      let x_b, y_b, z_b;
      if (u_backward < Math.PI) {
        x_b = 3 * Math.cos(u_backward) * (1 + Math.sin(u_backward)) + 2 * (1 - Math.cos(u_backward)/2) * Math.cos(u_backward) * Math.cos(v);
        y_b = 8 * Math.sin(u_backward) + 2 * (1 - Math.cos(u_backward)/2) * Math.sin(u_backward) * Math.cos(v);
      } else {
        x_b = 3 * Math.cos(u_backward) * (1 + Math.sin(u_backward)) + 2 * (1 - Math.cos(u_backward)/2) * Math.cos(v + Math.PI);
        y_b = 8 * Math.sin(u_backward);
      }
      z_b = 2 * (1 - Math.cos(u_backward)/2) * Math.sin(v);
      
      const tangent_u = new THREE.Vector3(x_f - x_b, y_f - y_b, z_f - z_b);
      
      // Compute partial derivative with respect to v
      const v_forward = v + dv_step;
      const v_backward = v - dv_step;
      
      // Forward point in v
      let x_vf, y_vf, z_vf;
      if (u < Math.PI) {
        x_vf = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u)/2) * Math.cos(u) * Math.cos(v_forward);
        y_vf = 8 * Math.sin(u) + 2 * (1 - Math.cos(u)/2) * Math.sin(u) * Math.cos(v_forward);
      } else {
        x_vf = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u)/2) * Math.cos(v_forward + Math.PI);
        y_vf = 8 * Math.sin(u);
      }
      z_vf = 2 * (1 - Math.cos(u)/2) * Math.sin(v_forward);
      
      // Backward point in v
      let x_vb, y_vb, z_vb;
      if (u < Math.PI) {
        x_vb = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u)/2) * Math.cos(u) * Math.cos(v_backward);
        y_vb = 8 * Math.sin(u) + 2 * (1 - Math.cos(u)/2) * Math.sin(u) * Math.cos(v_backward);
      } else {
        x_vb = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u)/2) * Math.cos(v_backward + Math.PI);
        y_vb = 8 * Math.sin(u);
      }
      z_vb = 2 * (1 - Math.cos(u)/2) * Math.sin(v_backward);
      
      const tangent_v = new THREE.Vector3(x_vf - x_vb, y_vf - y_vb, z_vf - z_vb);
      
      // Cross product for normal (maintaining proper orientation)
      const normal = tangent_u.cross(tangent_v).normalize();
      
      // Handle any invalid normals with a robust fallback
      if (isNaN(normal.x) || isNaN(normal.y) || isNaN(normal.z) || normal.length() < 0.1) {
        // Use a simplified but mathematically sound normal calculation
        const fallbackNormal = new THREE.Vector3(
          Math.cos(u) * Math.cos(v),
          Math.sin(u) * Math.cos(v),
          Math.sin(v)
        ).normalize();
        normals.push(fallbackNormal.x, fallbackNormal.y, fallbackNormal.z);
      } else {
        normals.push(normal.x, normal.y, normal.z);
      }
    }
  }

  // Generate triangle indices with proper winding for smooth surfaces
  for (let i = 0; i < u_steps - 1; i++) {
    for (let j = 0; j < v_steps - 1; j++) {
      // Current quad vertices
      const a = i * v_steps + j;
      const b = a + 1;
      const c = (i + 1) * v_steps + j;
      const d = c + 1;
      
      // Two triangles per quad (maintaining consistent winding for proper lighting)
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  console.log(`Klein bottle created with ${vertices.length/3} vertices and ${indices.length/3} faces`);
  
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

/**
 * Creates a 3D Julia Set geometry
 * The Julia set is a fractal that can be extended into 3D space
 * @param complexity Number of iterations for the Julia set calculation
 * @param c Complex parameter that determines the shape of the Julia set
 * @param resolution Resolution of the 3D grid
 * @param bounds Bounds of the 3D space to explore
 */
export function createJuliaSet(
  complexity: number = 50,
  c: [number, number] = [-0.4, 0.6],
  resolution: number = 50,
  bounds: number = 2
): THREE.BufferGeometry {
  const points: number[] = [];
  const colors: number[] = [];
  const step = (bounds * 2) / resolution;

  // Create a 3D grid of points
  for (let x = -bounds; x < bounds; x += step) {
    for (let y = -bounds; y < bounds; y += step) {
      for (let z = -bounds; z < bounds; z += step) {
        // Convert 3D point to complex number
        const z0: THREE.Vector3 = new THREE.Vector3(x, y, z);
        let currentZ: THREE.Vector3 = z0.clone();
        let escaped = false;
        let iterations = 0;

        // Julia set iteration
        while (iterations < complexity && !escaped) {
          // 3D Julia set iteration formula
          const x2 = currentZ.x * currentZ.x;
          const y2 = currentZ.y * currentZ.y;
          const z2 = currentZ.z * currentZ.z;
          
          // Check if point has escaped
          if (x2 + y2 + z2 > 4) {
            escaped = true;
            continue;
          }

          // Update z using Julia set formula
          const newX = x2 - y2 - z2 + c[0];
          const newY = 2 * currentZ.x * currentZ.y + c[1];
          const newZ = 2 * currentZ.x * currentZ.z;

          currentZ.set(newX, newY, newZ);
          iterations++;
        }

        // Only add points that haven't escaped
        if (!escaped) {
          points.push(z0.x, z0.y, z0.z);
          
          // Color based on position in 3D space
          const hue = (Math.atan2(z0.y, z0.x) + Math.PI) / (2 * Math.PI);
          const saturation = 1;
          const lightness = 0.5 + (z0.z / (2 * bounds));
          const color = new THREE.Color().setHSL(hue, saturation, lightness);
          colors.push(color.r, color.g, color.b);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}

/**
 * Creates an even more beautiful Hopf fibration using tubes with gradient coloring
 * This version creates the flowing, organized appearance like the reference image
 */
export function createHopfFibrationTubes(
  complexity: number = 50,
  radius: number = 1,
  tubeRadius: number = 0.02,
  pointsPerFiber: number = 100
): THREE.Group {
  const group = new THREE.Group();
  const fibers = Math.min(complexity, 50); // Optimized for beauty and performance
  
  for (let i = 0; i < fibers; i++) {
    const t = i / fibers;
    
    // More organized fiber distribution
    const phi = Math.acos(1 - 2 * t);
    const theta = TAU * t * PHI; // Golden angle
    
    // Generate smooth fiber curve with more points for smoothness
    const fiberPoints: THREE.Vector3[] = [];
    const actualPointsPerFiber = Math.min(pointsPerFiber, 120);
    
    for (let j = 0; j <= actualPointsPerFiber; j++) {
      const phase = (j / actualPointsPerFiber) * TAU;
      
      try {
        const [x, y, z, w] = hopfToR4(theta, phi, phase);
        
        // Validate 4D coordinates
        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(w)) {
          console.warn(`Invalid hopfToR4 result at fiber ${i}, point ${j}`);
          continue;
        }
        
        const [px, py, pz] = stereographicProjection(x, y, z, w);
        
        // Validate 3D projection
        if (isNaN(px) || isNaN(py) || isNaN(pz)) {
          console.warn(`Invalid stereographic projection at fiber ${i}, point ${j}`);
          continue;
        }
        
        const point = new THREE.Vector3(px * radius, py * radius, pz * radius);
        
        // Final validation
        if (isNaN(point.x) || isNaN(point.y) || isNaN(point.z)) {
          console.warn(`Invalid Vector3 at fiber ${i}, point ${j}`);
          continue;
        }
        
        fiberPoints.push(point);
      } catch (error) {
        console.warn(`Error creating fiber point at ${i}, ${j}:`, error);
        continue;
      }
    }
    
    // Only create tube if we have enough valid points
    if (fiberPoints.length >= 3) {
      try {
        // Create smooth curve with proper tension for flowing appearance
        const curve = new THREE.CatmullRomCurve3(fiberPoints, true, 'catmullrom', 0.1);
        
        // Validate curve
        const testPoint = curve.getPoint(0.5);
        if (isNaN(testPoint.x) || isNaN(testPoint.y) || isNaN(testPoint.z)) {
          console.warn(`Invalid curve for fiber ${i}`);
          continue;
        }
        
        // Create tube geometry with higher detail for smoothness
        const tubeGeometry = new THREE.TubeGeometry(
          curve, 
          Math.max(30, Math.floor(fiberPoints.length * 1.2)), // More segments for smoother tubes
          tubeRadius * (0.8 + Math.sin(t * TAU * 3) * 0.2), // Slight radius variation
          12, // More radial segments for roundness
          true // Closed tube
        );
        
        // Beautiful gradient material
        const hue = t * 0.9; // Cycle through most of the spectrum
        const saturation = 0.85 + Math.sin(t * TAU * 2) * 0.1; // Slight saturation variation
        const lightness = 0.5 + Math.cos(t * TAU * 5) * 0.15; // Gentle lightness variation
        
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        const material = new THREE.MeshPhongMaterial({ 
          color,
          shininess: 100,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(tubeGeometry, material);
        group.add(mesh);
      } catch (error) {
        console.warn(`Error creating tube for fiber ${i}:`, error);
        continue;
      }
    } else {
      console.warn(`Insufficient points for fiber ${i}: ${fiberPoints.length}`);
    }
  }
  
  return group;
}

/**
 * Creates a premium Hopf fibration with flowing ribbons (most elegant version)
 * This creates the closest match to the reference image
 */
export function createHopfFibrationRibbons(
  complexity: number = 40,
  radius: number = 1,
  ribbonWidth: number = 0.08,
  ribbonThickness: number = 0.015
): THREE.Group {
  const group = new THREE.Group();
  const fibers = Math.min(complexity, 40); // Reduced for stability
  
  for (let i = 0; i < fibers; i++) {
    const t = i / fibers;
    
    // Organized distribution for maximum visual appeal
    const phi = Math.acos(1 - 2 * t);
    const theta = TAU * t * PHI;
    
    // Generate fiber path
    const centerPoints: THREE.Vector3[] = [];
    const pointsPerFiber = 80; // Reduced for stability
    
    for (let j = 0; j <= pointsPerFiber; j++) {
      const phase = (j / pointsPerFiber) * TAU;
      
      try {
        const [x, y, z, w] = hopfToR4(theta, phi, phase);
        
        // Validate coordinates
        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(w)) {
          continue;
        }
        
        const [px, py, pz] = stereographicProjection(x, y, z, w);
        
        // Validate projection
        if (isNaN(px) || isNaN(py) || isNaN(pz)) {
          continue;
        }
        
        const point = new THREE.Vector3(px * radius, py * radius, pz * radius);
        
        // Final validation
        if (isNaN(point.x) || isNaN(point.y) || isNaN(point.z)) {
          continue;
        }
        
        centerPoints.push(point);
      } catch (error) {
        continue;
      }
    }
    
    // Only create ribbon if we have enough valid points
    if (centerPoints.length >= 3) {
      try {
        // Create ribbon geometry
        const ribbonGeometry = createRibbonGeometry(centerPoints, ribbonWidth, ribbonThickness);
        
        // Validate ribbon geometry
        if (!ribbonGeometry || !ribbonGeometry.attributes.position) {
          console.warn(`Invalid ribbon geometry for fiber ${i}`);
          continue;
        }
        
        // Gorgeous gradient coloring
        const hue = t * 0.85 + Math.sin(t * TAU * 3) * 0.05; // Main rainbow with slight variation
        const saturation = 0.9;
        const lightness = 0.55 + Math.sin(t * TAU * 7) * 0.1;
        
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        const material = new THREE.MeshPhongMaterial({
          color,
          shininess: 80,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(ribbonGeometry, material);
        group.add(mesh);
      } catch (error) {
        console.warn(`Error creating ribbon for fiber ${i}:`, error);
        continue;
      }
    }
  }
  
  return group;
}

/**
 * Helper function to create ribbon geometry from a path
 */
function createRibbonGeometry(
  centerPoints: THREE.Vector3[], 
  width: number, 
  thickness: number
): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  
  // Validate input
  if (!centerPoints || centerPoints.length < 2) {
    console.warn('Insufficient center points for ribbon geometry');
    return new THREE.BufferGeometry();
  }
  
  for (let i = 0; i < centerPoints.length - 1; i++) {
    const current = centerPoints[i];
    const next = centerPoints[i + 1];
    
    // Validate current points
    if (!current || !next || 
        isNaN(current.x) || isNaN(current.y) || isNaN(current.z) ||
        isNaN(next.x) || isNaN(next.y) || isNaN(next.z)) {
      continue;
    }
    
    // Calculate ribbon direction and perpendicular vectors
    const forward = next.clone().sub(current).normalize();
    
    // Avoid degenerate cases
    if (forward.lengthSq() < 0.001) {
      continue;
    }
    
    const up = new THREE.Vector3(0, 1, 0);
    const right = forward.clone().cross(up).normalize();
    
    // If right vector is degenerate, try a different up vector
    if (right.lengthSq() < 0.001) {
      up.set(1, 0, 0);
      right.copy(forward).cross(up).normalize();
    }
    
    const actualUp = right.clone().cross(forward).normalize();
    
    // Create ribbon cross-section (4 vertices per segment)
    const halfWidth = width / 2;
    const halfThickness = thickness / 2;
    
    try {
      // Bottom edge
      const bottomLeft = current.clone().add(right.clone().multiplyScalar(-halfWidth)).add(actualUp.clone().multiplyScalar(-halfThickness));
      const bottomRight = current.clone().add(right.clone().multiplyScalar(halfWidth)).add(actualUp.clone().multiplyScalar(-halfThickness));
      
      // Top edge
      const topLeft = current.clone().add(right.clone().multiplyScalar(-halfWidth)).add(actualUp.clone().multiplyScalar(halfThickness));
      const topRight = current.clone().add(right.clone().multiplyScalar(halfWidth)).add(actualUp.clone().multiplyScalar(halfThickness));
      
      // Validate vertices
      const verts = [bottomLeft, bottomRight, topLeft, topRight];
      let validVerts = true;
      
      for (const vert of verts) {
        if (isNaN(vert.x) || isNaN(vert.y) || isNaN(vert.z)) {
          validVerts = false;
          break;
        }
      }
      
      if (!validVerts) {
        continue;
      }
      
      // Add vertices
      vertices.push(
        bottomLeft.x, bottomLeft.y, bottomLeft.z,
        bottomRight.x, bottomRight.y, bottomRight.z,
        topLeft.x, topLeft.y, topLeft.z,
        topRight.x, topRight.y, topRight.z
      );
      
      // Add normals
      for (let j = 0; j < 4; j++) {
        normals.push(actualUp.x, actualUp.y, actualUp.z);
      }
      
      // Add UVs
      const u = i / (centerPoints.length - 1);
      uvs.push(u, 0, u, 1, u, 0, u, 1);
      
      // Add indices for triangles
      if (i < centerPoints.length - 2) {
        const base = i * 4;
        
        // Bottom face
        indices.push(base, base + 1, base + 4);
        indices.push(base + 1, base + 5, base + 4);
        
        // Top face
        indices.push(base + 2, base + 6, base + 3);
        indices.push(base + 3, base + 6, base + 7);
        
        // Left face
        indices.push(base, base + 4, base + 2);
        indices.push(base + 2, base + 4, base + 6);
        
        // Right face
        indices.push(base + 1, base + 3, base + 5);
        indices.push(base + 3, base + 7, base + 5);
      }
    } catch (error) {
      console.warn(`Error creating ribbon segment ${i}:`, error);
      continue;
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  
  // Only set attributes if we have valid data
  if (vertices.length > 0) {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    if (indices.length > 0) {
      geometry.setIndex(indices);
    }
  }
  
  return geometry;
}

/**
 * Creates a Hopf fibration with visible base sphere for educational clarity
 * This version explicitly shows the sphere with circles at each point
 */
export function createHopfFibrationWithBaseSphere(
  complexity: number = 40,
  radius: number = 1,
  showBaseSphere: boolean = true
): THREE.Group {
  const group = new THREE.Group();
  
  // 1. Create the base sphere (optional, for visualization)
  if (showBaseSphere) {
    const sphereGeometry = new THREE.SphereGeometry(radius * 0.3, 32, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const baseSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(baseSphere);
  }
  
  // 2. Create the fibers (circles) at each point on the sphere
  const fibers = Math.min(complexity, 40); // Reduced for stability
  
  for (let i = 0; i < fibers; i++) {
    const t = i / fibers;
    
    // Point on the base sphere
    const phi = Math.acos(1 - 2 * t); // Latitude
    const theta = TAU * t * PHI; // Longitude
    
    // Create the circular fiber for this base point
    const fiberPoints: THREE.Vector3[] = [];
    const pointsPerFiber = 40; // Reduced for stability
    
    for (let j = 0; j <= pointsPerFiber; j++) {
      const fiberPhase = (j / pointsPerFiber) * TAU;
      
      try {
        // Hopf fibration map with validation
        const [x, y, z, w] = hopfMap(theta, phi, fiberPhase);
        
        // Validate the 4D coordinates
        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(w)) {
          console.warn(`Invalid Hopf map result at i=${i}, j=${j}`);
          continue;
        }
        
        const [px, py, pz] = stereographicProjection(x, y, z, w);
        
        // Validate the 3D projection
        if (isNaN(px) || isNaN(py) || isNaN(pz)) {
          console.warn(`Invalid stereographic projection at i=${i}, j=${j}`);
          continue;
        }
        
        // Create valid Vector3 with finite coordinates
        const point = new THREE.Vector3(
          px * radius, 
          py * radius, 
          pz * radius
        );
        
        // Final validation
        if (point.x !== point.x || point.y !== point.y || point.z !== point.z) {
          console.warn(`Invalid Vector3 created at i=${i}, j=${j}`);
          continue;
        }
        
        fiberPoints.push(point);
      } catch (error) {
        console.warn(`Error creating fiber point at i=${i}, j=${j}:`, error);
        continue;
      }
    }
    
    // Only create tube if we have enough valid points
    if (fiberPoints.length >= 3) {
      try {
        // Create tube geometry for this fiber with error handling
        const curve = new THREE.CatmullRomCurve3(fiberPoints, true);
        
        // Validate the curve before creating tube
        const testPoint = curve.getPoint(0.5);
        if (isNaN(testPoint.x) || isNaN(testPoint.y) || isNaN(testPoint.z)) {
          console.warn(`Invalid curve generated for fiber ${i}`);
          continue;
        }
        
        const tubeGeometry = new THREE.TubeGeometry(
          curve, 
          Math.max(20, fiberPoints.length), // Segments based on point count
          radius * 0.01, // Smaller radius for cleaner look
          8, // Radial segments
          true // Closed
        );
        
        // Create gradient material for this fiber
        const fiberHue = t;
        const fiberColor = new THREE.Color().setHSL(fiberHue, 0.9, 0.6);
        const fiberMaterial = new THREE.MeshPhongMaterial({
          color: fiberColor,
          shininess: 80,
          transparent: true,
          opacity: 0.8
        });
        
        const fiberMesh = new THREE.Mesh(tubeGeometry, fiberMaterial);
        group.add(fiberMesh);
      } catch (error) {
        console.warn(`Error creating tube geometry for fiber ${i}:`, error);
        continue;
      }
    } else {
      console.warn(`Insufficient valid points for fiber ${i}: ${fiberPoints.length}`);
    }
  }
  
  return group;
} 