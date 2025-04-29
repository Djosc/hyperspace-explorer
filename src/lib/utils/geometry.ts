import * as THREE from 'three';
import type { GeometryType } from '../types';

// Helper function to count bits
function countBits(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

// Create hypercube geometry
function createHyperCube(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const size = 2;

  // Generate vertices for a 4D hypercube projection
  for (let i = 0; i < Math.pow(2, 4); i++) {
    const x = ((i & 1) ? size : -size);
    const y = ((i & 2) ? size : -size);
    const z = ((i & 4) ? size : -size);
    const w = ((i & 8) ? size : -size);

    // Project 4D to 3D with perspective projection
    const scale = 1 / (w + 4);
    vertices.push(
      x * scale,
      y * scale,
      z * scale
    );
    
    // Add UV coordinates
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );
  }

  // Generate indices for edges
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Create mandala geometry
function createMandala(complexity: number, symmetry: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const segments = Math.max(3, symmetry); // Ensure at least 3 segments
  const rings = Math.max(1, complexity); // Ensure at least 1 ring

  // Create a flat disk with concentric rings
  for (let ring = 0; ring <= rings; ring++) {
    const radius = (ring / rings) * 2;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = 0; // Flat in the z-plane
      vertices.push(x, y, z);
      
      // Add UV coordinates
      uvs.push(
        (x + 2) / 4,
        (y + 2) / 4
      );
    }
  }

  // Generate indices for triangles
  for (let ring = 0; ring < rings; ring++) {
    for (let i = 0; i < segments; i++) {
      const a = ring * (segments + 1) + i;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals(); // Add normals for proper lighting

  return geometry;
}

// Create vortex geometry
function createVortex(complexity: number, symmetry: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const segments = Math.max(3, symmetry); // Ensure at least 3 segments
  const rings = Math.max(1, complexity); // Ensure at least 1 ring

  // Create a spiral shape
  for (let ring = 0; ring <= rings; ring++) {
    const radius = (ring / rings) * 2;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + (ring * Math.PI / 4);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (ring / rings) * 2 - 1; // Spiral upward
      vertices.push(x, y, z);
      
      // Add UV coordinates
      uvs.push(
        (x + 2) / 4,
        (y + 2) / 4
      );
    }
  }

  // Generate indices for triangles
  for (let ring = 0; ring < rings; ring++) {
    for (let i = 0; i < segments; i++) {
      const a = ring * (segments + 1) + i;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals(); // Add normals for proper lighting

  return geometry;
}

// Create neuronal geometry
function createNeuronal(complexity: number, symmetry: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const nodes = Math.max(4, complexity * 2); // Ensure at least 4 nodes
  const connections = Math.max(1, symmetry); // Ensure at least 1 connection

  // Generate nodes in a spherical pattern
  for (let i = 0; i < nodes; i++) {
    const theta = (i / nodes) * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 2;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    vertices.push(x, y, z);
    
    // Add UV coordinates
    uvs.push(
      (x + 2) / 4,
      (y + 2) / 4
    );
  }

  // Generate connections between nodes
  for (let i = 0; i < nodes; i++) {
    for (let j = 0; j < connections; j++) {
      const target = Math.floor(Math.random() * nodes);
      if (target !== i) {
        indices.push(i, target);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Create 5D hypercube geometry
function create5DHyperCube(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const size = 2;

  // Generate vertices for a 5D hypercube projection
  for (let i = 0; i < Math.pow(2, 5); i++) {
    const x = ((i & 1) ? size : -size);
    const y = ((i & 2) ? size : -size);
    const z = ((i & 4) ? size : -size);
    const w = ((i & 8) ? size : -size);
    const v = ((i & 16) ? size : -size);

    // Project 5D to 3D with perspective projection
    const scale = 1 / (w + v + 6);
    vertices.push(
      x * scale,
      y * scale,
      z * scale
    );
    
    // Add UV coordinates
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );
  }

  // Generate indices for edges
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Create tesseract geometry (4D cube with rotation)
function createTesseract(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const size = 2;
  const segments = Math.max(2, complexity);

  // Create a more complex tesseract with internal structure
  for (let i = 0; i < Math.pow(2, 4); i++) {
    const x = ((i & 1) ? size : -size);
    const y = ((i & 2) ? size : -size);
    const z = ((i & 4) ? size : -size);
    const w = ((i & 8) ? size : -size);

    // Project 4D to 3D with perspective projection
    const scale = 1 / (w + 4);
    vertices.push(
      x * scale,
      y * scale,
      z * scale
    );
    
    // Add UV coordinates
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );
  }

  // Add internal vertices for more complexity
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      for (let k = 0; k < segments; k++) {
        const x = (i / segments) * 2 * size - size;
        const y = (j / segments) * 2 * size - size;
        const z = (k / segments) * 2 * size - size;
        const w = Math.sin(i * j * k * Math.PI / segments) * size;
        
        // Project 4D to 3D
        const scale = 1 / (w + 4);
        vertices.push(
          x * scale,
          y * scale,
          z * scale
        );
        
        // Add UV coordinates
        uvs.push(
          (x + size) / (2 * size),
          (y + size) / (2 * size)
        );
      }
    }
  }

  // Generate indices for edges
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1 || Math.random() < 0.1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Create hypersphere geometry
function createHypersphere(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const segments = Math.max(8, complexity * 2);
  const radius = 2;

  // Create a 4D sphere projected to 3D
  for (let i = 0; i <= segments; i++) {
    const lat = Math.PI * i / segments;
    for (let j = 0; j <= segments; j++) {
      const lon = 2 * Math.PI * j / segments;
      
      // 3D spherical coordinates
      const x = radius * Math.sin(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat) * Math.sin(lon);
      const z = radius * Math.cos(lat);
      
      // 4D component (w) varies with position
      const w = radius * Math.sin(lat * 2) * Math.cos(lon * 2);
      
      // Project 4D to 3D
      const scale = 1 / (w + 4);
      vertices.push(
        x * scale,
        y * scale,
        z * scale
      );
      
      // Add UV coordinates
      uvs.push(
        j / segments,
        i / segments
      );
    }
  }

  // Generate indices for triangles
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();

  return geometry;
}

// Create DMT tunnel geometry
function createDMTTunnel(complexity: number, symmetry: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const segments = Math.max(3, symmetry); // Ensure at least 3 segments
  const rings = Math.max(1, complexity); // Ensure at least 1 ring
  const tunnelLength = 10; // Length of the tunnel
  const baseRadius = 2; // Base radius of the tunnel

  // Create a tunnel with DMT-inspired patterns
  for (let ring = 0; ring <= rings; ring++) {
    const radius = baseRadius * (1 - ring / rings); // Tapering radius
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Add some organic variation to the radius
      const radiusVariation = Math.sin(angle * 3 + ring * 0.5) * 0.2;
      const finalRadius = radius * (1 + radiusVariation);
      
      // Calculate position along the tunnel
      const z = (ring / rings) * tunnelLength - tunnelLength / 2;
      
      // Calculate x and y based on angle and radius
      const x = Math.cos(angle) * finalRadius;
      const y = Math.sin(angle) * finalRadius;
      
      vertices.push(x, y, z);
      
      // Add UV coordinates
      uvs.push(
        (x + baseRadius) / (2 * baseRadius),
        (z + tunnelLength / 2) / tunnelLength
      );
    }
  }

  // Generate indices for triangles
  for (let ring = 0; ring < rings; ring++) {
    for (let i = 0; i < segments; i++) {
      const a = ring * (segments + 1) + i;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // Add some floating entities in the tunnel
  const entityCount = Math.max(5, complexity * 2);
  for (let i = 0; i < entityCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = baseRadius * 0.5 * Math.random();
    const z = (Math.random() - 0.5) * tunnelLength;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    vertices.push(x, y, z);
    
    // Add UV coordinates for entities
    uvs.push(
      Math.random(),
      Math.random()
    );
    
    // Add indices for entities (simple points)
    indices.push(vertices.length / 3 - 1, vertices.length / 3 - 1);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals(); // Add normals for proper lighting

  return geometry;
}

// Create sound resonance geometry
function createSoundResonance(complexity: number, symmetry: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const segments = Math.max(3, symmetry); // Ensure at least 3 segments
  const rings = Math.max(1, complexity); // Ensure at least 1 ring

  // Create a waveform-like pattern
  for (let ring = 0; ring <= rings; ring++) {
    const radius = (ring / rings) * 2;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      // Create a sine wave pattern in the z-axis
      const z = Math.sin(angle * 4 + ring * 0.5) * 0.5;
      vertices.push(x, y, z);
      
      // Add UV coordinates
      uvs.push(
        (x + 2) / 4,
        (y + 2) / 4
      );
    }
  }

  // Generate indices for triangles
  for (let ring = 0; ring < rings; ring++) {
    for (let i = 0; i < segments; i++) {
      const a = ring * (segments + 1) + i;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals(); // Add normals for proper lighting

  return geometry;
}

// Create fractal geometry
function createFractal(complexity: number, symmetry: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  
  // Define return type for the recursive function
  interface TetrahedronResult {
    vertices: number[];
    faces: number[];
  }
  
  // Create a Sierpinski tetrahedron-like fractal
  function addTetrahedron(x: number, y: number, z: number, size: number, depth: number): TetrahedronResult {
    if (depth <= 0) {
      // Add a small tetrahedron
      const h = size * Math.sqrt(2/3);
      const vertices = [
        x, y, z + h,                    // Top
        x - size, y - size, z - h/3,    // Bottom left
        x + size, y - size, z - h/3,    // Bottom right
        x, y + size, z - h/3            // Bottom front
      ];
      
      // Add faces (triangles)
      const baseIndex = vertices.length / 3;
      const faces = [
        baseIndex, baseIndex + 1, baseIndex + 2,     // Bottom
        baseIndex, baseIndex + 2, baseIndex + 3,     // Right
        baseIndex, baseIndex + 3, baseIndex + 1,     // Left
        baseIndex + 1, baseIndex + 3, baseIndex + 2  // Back
      ];
      
      return { vertices, faces };
    } else {
      // Recursively add smaller tetrahedrons
      const newSize = size / 2;
      const h = newSize * Math.sqrt(2/3);
      
      const result1: TetrahedronResult = addTetrahedron(x, y, z + h, newSize, depth - 1);
      const result2: TetrahedronResult = addTetrahedron(x - newSize, y - newSize, z - h/3, newSize, depth - 1);
      const result3: TetrahedronResult = addTetrahedron(x + newSize, y - newSize, z - h/3, newSize, depth - 1);
      const result4: TetrahedronResult = addTetrahedron(x, y + newSize, z - h/3, newSize, depth - 1);
      
      return {
        vertices: [
          ...result1.vertices,
          ...result2.vertices,
          ...result3.vertices,
          ...result4.vertices
        ],
        faces: [
          ...result1.faces,
          ...result2.faces.map((f: number) => f + result1.vertices.length / 3),
          ...result3.faces.map((f: number) => f + (result1.vertices.length + result2.vertices.length) / 3),
          ...result4.faces.map((f: number) => f + (result1.vertices.length + result2.vertices.length + result3.vertices.length) / 3)
        ]
      };
    }
  }
  
  const depth = Math.min(complexity, 4); // Limit depth to prevent performance issues
  const result = addTetrahedron(0, 0, 0, 2, depth);
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(result.vertices, 3));
  geometry.setIndex(result.faces);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  
  return geometry;
}

// Create quantum field geometry
function createQuantumField(complexity: number, symmetry: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const particleCount = Math.max(100, complexity * 50);
  
  // Create a field of particles with quantum-like behavior
  for (let i = 0; i < particleCount; i++) {
    // Position particles in a spherical volume
    const radius = Math.random() * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    vertices.push(x, y, z);
    
    // Add UV coordinates
    uvs.push(
      (x + 3) / 6,
      (y + 3) / 6
    );
  }
  
  // Create connections between nearby particles
  for (let i = 0; i < particleCount; i++) {
    const x1 = vertices[i * 3];
    const y1 = vertices[i * 3 + 1];
    const z1 = vertices[i * 3 + 2];
    
    for (let j = i + 1; j < particleCount; j++) {
      const x2 = vertices[j * 3];
      const y2 = vertices[j * 3 + 1];
      const z2 = vertices[j * 3 + 2];
      
      // Calculate distance
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Connect particles that are close enough
      if (distance < 0.5) {
        indices.push(i, j);
      }
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  
  return geometry;
}

// Create 6D hypercube geometry
function create6DHyperCube(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const size = 2;

  // Generate vertices for a 6D hypercube projection
  for (let i = 0; i < Math.pow(2, 6); i++) {
    const x = ((i & 1) ? size : -size);
    const y = ((i & 2) ? size : -size);
    const z = ((i & 4) ? size : -size);
    const w = ((i & 8) ? size : -size);
    const v = ((i & 16) ? size : -size);
    const u = ((i & 32) ? size : -size);

    // Project 6D to 3D with perspective projection
    const scale = 1 / (w + v + u + 8);
    vertices.push(
      x * scale,
      y * scale,
      z * scale
    );
    
    // Add UV coordinates
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );
  }

  // Generate indices for edges
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Create 7D hypercube geometry
function create7DHyperCube(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const size = 2;

  // Generate vertices for a 7D hypercube projection
  for (let i = 0; i < Math.pow(2, 7); i++) {
    const x = ((i & 1) ? size : -size);
    const y = ((i & 2) ? size : -size);
    const z = ((i & 4) ? size : -size);
    const w = ((i & 8) ? size : -size);
    const v = ((i & 16) ? size : -size);
    const u = ((i & 32) ? size : -size);
    const t = ((i & 64) ? size : -size);

    // Project 7D to 3D with perspective projection
    const scale = 1 / (w + v + u + t + 10);
    vertices.push(
      x * scale,
      y * scale,
      z * scale
    );
    
    // Add UV coordinates
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );
  }

  // Generate indices for edges
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Create 8D hypercube geometry
function create8DHyperCube(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const size = 2;

  // Generate vertices for an 8D hypercube projection
  for (let i = 0; i < Math.pow(2, 8); i++) {
    const x = ((i & 1) ? size : -size);
    const y = ((i & 2) ? size : -size);
    const z = ((i & 4) ? size : -size);
    const w = ((i & 8) ? size : -size);
    const v = ((i & 16) ? size : -size);
    const u = ((i & 32) ? size : -size);
    const t = ((i & 64) ? size : -size);
    const s = ((i & 128) ? size : -size);

    // Project 8D to 3D with perspective projection
    const scale = 1 / (w + v + u + t + s + 12);
    vertices.push(
      x * scale,
      y * scale,
      z * scale
    );
    
    // Add UV coordinates
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );
  }

  // Generate indices for edges
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Create 9D hypercube geometry
function create9DHyperCube(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const size = 2;

  // Generate vertices for a 9D hypercube projection
  for (let i = 0; i < Math.pow(2, 9); i++) {
    const x = ((i & 1) ? size : -size);
    const y = ((i & 2) ? size : -size);
    const z = ((i & 4) ? size : -size);
    const w = ((i & 8) ? size : -size);
    const v = ((i & 16) ? size : -size);
    const u = ((i & 32) ? size : -size);
    const t = ((i & 64) ? size : -size);
    const s = ((i & 128) ? size : -size);
    const r = ((i & 256) ? size : -size);

    // Project 9D to 3D with perspective projection
    const scale = 1 / (w + v + u + t + s + r + 14);
    vertices.push(
      x * scale,
      y * scale,
      z * scale
    );
    
    // Add UV coordinates
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );
  }

  // Generate indices for edges
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Create 10D hypercube geometry
function create10DHyperCube(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const size = 2;

  // Generate vertices for a 10D hypercube projection
  for (let i = 0; i < Math.pow(2, 10); i++) {
    const x = ((i & 1) ? size : -size);
    const y = ((i & 2) ? size : -size);
    const z = ((i & 4) ? size : -size);
    const w = ((i & 8) ? size : -size);
    const v = ((i & 16) ? size : -size);
    const u = ((i & 32) ? size : -size);
    const t = ((i & 64) ? size : -size);
    const s = ((i & 128) ? size : -size);
    const r = ((i & 256) ? size : -size);
    const q = ((i & 512) ? size : -size);

    // Project 10D to 3D with perspective projection
    const scale = 1 / (w + v + u + t + s + r + q + 16);
    vertices.push(
      x * scale,
      y * scale,
      z * scale
    );
    
    // Add UV coordinates
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );
  }

  // Generate indices for edges
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

// Main geometry creation function
export function createGeometry(
  type: GeometryType,
  complexity: number,
  symmetry: number
): THREE.BufferGeometry {
  switch (type) {
    case 'hyperCube':
      return createHyperCube(complexity);
    case 'mandala':
      return createMandala(complexity, symmetry);
    case 'vortex':
      return createVortex(complexity, symmetry);
    case 'neuronal':
      return createNeuronal(complexity, symmetry);
    case 'tesseract':
      return createTesseract(complexity);
    case 'hypersphere':
      return createHypersphere(complexity);
    case 'hyper5D':
      return create5DHyperCube(complexity);
    case 'dmtTunnel':
      return createDMTTunnel(complexity, symmetry);
    case 'soundResonance':
      return createSoundResonance(complexity, symmetry);
    case 'fractal':
      return createFractal(complexity, symmetry);
    case 'quantumField':
      return createQuantumField(complexity, symmetry);
    case 'hyper6D':
      return create6DHyperCube(complexity);
    case 'hyper7D':
      return create7DHyperCube(complexity);
    case 'hyper8D':
      return create8DHyperCube(complexity);
    case 'hyper9D':
      return create9DHyperCube(complexity);
    case 'hyper10D':
      return create10DHyperCube(complexity);
    default:
      console.warn(`Unknown geometry type: ${type}, falling back to hyperCube`);
      return createHyperCube(complexity);
  }
} 