import * as THREE from 'three';
import type { GeometryType } from '../types';
import {
  createHopfFibration,
  createGoldenSpiral,
  createPiSpiral,
  createKleinBottle,
  createMobiusStrip,
  createTorusKnot
} from './mathGeometry';

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
  const normals = [];
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
    
    // Add UV coordinates based on position
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );

    // Add normals for proper lighting
    const normal = new THREE.Vector3(x, y, z).normalize();
    normals.push(normal.x, normal.y, normal.z);
  }

  // Generate faces (triangles) for each cube face
  const faceIndices = [
    [0, 1, 2, 3], // front face
    [4, 5, 6, 7], // back face
    [0, 1, 5, 4], // top face
    [2, 3, 7, 6], // bottom face
    [0, 3, 7, 4], // left face
    [1, 2, 6, 5]  // right face
  ];

  // Create triangles for each face
  faceIndices.forEach(face => {
    // First triangle
    indices.push(face[0], face[1], face[2]);
    // Second triangle
    indices.push(face[0], face[2], face[3]);
  });

  // Add edges for wireframe effect
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
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

// Create tesseract geometry (4D cube with rotation)
function createTesseract(complexity: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const normals = [];
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
    
    // Add UV coordinates based on position
    uvs.push(
      (x + size) / (2 * size),
      (y + size) / (2 * size)
    );

    // Add normals for proper lighting
    const normal = new THREE.Vector3(x, y, z).normalize();
    normals.push(normal.x, normal.y, normal.z);
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

        // Add normals
        const normal = new THREE.Vector3(x, y, z).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }
  }

  // Generate faces for the outer cube
  const faceIndices = [
    [0, 1, 2, 3], // front face
    [4, 5, 6, 7], // back face
    [0, 1, 5, 4], // top face
    [2, 3, 7, 6], // bottom face
    [0, 3, 7, 4], // left face
    [1, 2, 6, 5]  // right face
  ];

  // Create triangles for each face
  faceIndices.forEach(face => {
    // First triangle
    indices.push(face[0], face[1], face[2]);
    // Second triangle
    indices.push(face[0], face[2], face[3]);
  });

  // Add edges for wireframe effect
  for (let i = 0; i < vertices.length / 3; i++) {
    for (let j = i + 1; j < vertices.length / 3; j++) {
      if (countBits(i ^ j) === 1 || Math.random() < 0.1) {
        indices.push(i, j);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

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
  const normals = [];
  
  // Create a more dynamic field with multiple layers
  const segments = Math.max(32, complexity * 8);
  const radius = 1.5; // Reduced from 3 to 1.5
  const layers = 3; // Multiple layers for depth
  
  // Generate vertices in a multi-layered spherical pattern
  for (let layer = 0; layer < layers; layer++) {
    const layerRadius = radius * (1 + layer * 0.1); // Reduced layer scaling from 0.2 to 0.1
    
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * Math.PI * 2;
      
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI;
        
        // Calculate base position
        const x = layerRadius * Math.sin(theta) * Math.cos(phi);
        const y = layerRadius * Math.sin(theta) * Math.sin(phi);
        const z = layerRadius * Math.cos(theta);
        
        // Apply quantum probability distribution with multiple states
        const n = 2 + layer; // Different principal quantum numbers for each layer
        const l = 1 + layer; // Different angular momentum quantum numbers
        const m = layer; // Different magnetic quantum numbers
        
        // Enhanced spherical harmonic function
        const Y = Math.sqrt((2 * l + 1) / (4 * Math.PI)) * 
                  Math.cos(theta) * 
                  Math.cos(m * phi) * 
                  Math.sin(n * theta); // Added theta dependence
        
        // Enhanced radial probability distribution
        const R = Math.exp(-Math.sqrt(x*x + y*y + z*z) / n) * 
                  Math.pow(Math.sqrt(x*x + y*y + z*z), l) *
                  Math.sin(Math.sqrt(x*x + y*y + z*z) * 2); // Added oscillatory term
        
        // Combine to get probability amplitude with interference
        const probability = Math.abs(R * Y) * (1 + Math.sin(phi * 3) * 0.2);
        
        // Scale position by probability with layer-specific effects
        const scale = 1 + probability * (0.1 + layer * 0.05); // Reduced scaling factors
        
        // Add vertex with quantum probability influence
        vertices.push(
          x * scale,
          y * scale,
          z * scale
        );
        
        // Calculate normal with quantum influence
        const normal = new THREE.Vector3(x, y, z).normalize();
        const quantumNormal = normal.clone().add(
          new THREE.Vector3(
            Math.sin(phi * 2) * 0.1,
            Math.cos(theta * 2) * 0.1,
            Math.sin(theta * phi) * 0.1
          )
        ).normalize();
        
        normals.push(quantumNormal.x, quantumNormal.y, quantumNormal.z);
        
        // Add UV coordinates with layer offset
        uvs.push(
          (phi / (Math.PI * 2)) + (layer * 0.1),
          (theta / Math.PI) + (layer * 0.1)
        );
      }
    }
  }
  
  // Generate indices for triangles with layer connections
  for (let layer = 0; layer < layers - 1; layer++) {
    const layerOffset = layer * (segments + 1) * (segments + 1);
    const nextLayerOffset = (layer + 1) * (segments + 1) * (segments + 1);
    
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = layerOffset + i * (segments + 1) + j;
        const b = a + 1;
        const c = layerOffset + (i + 1) * (segments + 1) + j;
        const d = c + 1;
        
        // Add triangles for current layer
        indices.push(a, b, c);
        indices.push(b, d, c);
        
        // Add triangles connecting to next layer
        const e = nextLayerOffset + i * (segments + 1) + j;
        const f = e + 1;
        const g = nextLayerOffset + (i + 1) * (segments + 1) + j;
        const h = g + 1;
        
        indices.push(a, e, b);
        indices.push(b, e, f);
        indices.push(c, g, d);
        indices.push(d, g, h);
      }
    }
  }
  
  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  // Compute vertex normals for smooth shading
  geometry.computeVertexNormals();
  
  // Add quantum tunneling effect with multiple barriers
  const positions = geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    
    // Multiple quantum barriers
    const barriers = [1.0, 1.5, 2.0];
    const particleEnergy = 0.8;
    
    // Calculate combined tunneling effect
    let tunnelingProb = 0;
    barriers.forEach((barrierHeight, index) => {
      const distance = Math.abs(Math.sqrt(x*x + y*y + z*z) - (radius * (1 + index * 0.2)));
      tunnelingProb += Math.exp(-2 * Math.sqrt(2 * (barrierHeight - particleEnergy)) * distance);
    });
    tunnelingProb /= barriers.length;
    
    // Apply tunneling effect to surface with interference
    const normal = new THREE.Vector3(x, y, z).normalize();
    const tunnelEffect = tunnelingProb * 0.15 * (1 + Math.sin(x * 5) * Math.cos(y * 5) * 0.2);
    
    positions[i] += normal.x * tunnelEffect;
    positions[i + 1] += normal.y * tunnelEffect;
    positions[i + 2] += normal.z * tunnelEffect;
  }
  
  geometry.computeBoundingSphere();
  return geometry;
}

// Create Koch Snowflake geometry
function createKochSnowflake(complexity: number, symmetry: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  // Helper function to create a spike with dynamic height
  function createSpike(x: number, y: number, z: number, direction: THREE.Vector3, size: number, height: number) {
    const spikeLength = size * height; // Dynamic height based on parameter
    const spikeWidth = size * 0.15;  // Thinner base for more elegant spikes
    
    // Create base vertices for the spike with slight randomization
    const baseVertices = [
      new THREE.Vector3(x + (Math.random() - 0.5) * 0.1, y + (Math.random() - 0.5) * 0.1, z),
      new THREE.Vector3(x + spikeWidth + (Math.random() - 0.5) * 0.1, y + (Math.random() - 0.5) * 0.1, z),
      new THREE.Vector3(x + (Math.random() - 0.5) * 0.1, y + spikeWidth + (Math.random() - 0.5) * 0.1, z),
      new THREE.Vector3(x + spikeWidth + (Math.random() - 0.5) * 0.1, y + spikeWidth + (Math.random() - 0.5) * 0.1, z)
    ];
    
    // Create tip vertex with slight randomization
    const tip = new THREE.Vector3(x, y, z).add(
      direction.clone()
        .add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ))
        .normalize()
        .multiplyScalar(spikeLength)
    );
    
    // Add vertices for the spike
    vertices.push(
      // Base vertices
      baseVertices[0].x, baseVertices[0].y, baseVertices[0].z,
      baseVertices[1].x, baseVertices[1].y, baseVertices[1].z,
      baseVertices[2].x, baseVertices[2].y, baseVertices[2].z,
      baseVertices[3].x, baseVertices[3].y, baseVertices[3].z,
      // Tip vertex
      tip.x, tip.y, tip.z
    );
    
    // Calculate normal for the spike with slight variation
    const normal = direction.clone()
      .add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      ))
      .normalize();
    
    // Add normals for all vertices
    for (let i = 0; i < 5; i++) {
      normals.push(normal.x, normal.y, normal.z);
    }
    
    // Add UVs with slight variation
    uvs.push(
      0 + Math.random() * 0.1, 0 + Math.random() * 0.1,
      1 - Math.random() * 0.1, 0 + Math.random() * 0.1,
      0 + Math.random() * 0.1, 1 - Math.random() * 0.1,
      1 - Math.random() * 0.1, 1 - Math.random() * 0.1,
      0.5 + (Math.random() - 0.5) * 0.1, 0.5 + (Math.random() - 0.5) * 0.1
    );
    
    // Add indices for the spike faces
    const baseIndex = vertices.length / 3 - 5;
    indices.push(
      // Base triangles
      baseIndex, baseIndex + 1, baseIndex + 2,
      baseIndex + 1, baseIndex + 3, baseIndex + 2,
      // Side triangles with more detail
      baseIndex, baseIndex + 2, baseIndex + 4,
      baseIndex + 2, baseIndex + 3, baseIndex + 4,
      baseIndex + 3, baseIndex + 1, baseIndex + 4,
      baseIndex + 1, baseIndex, baseIndex + 4
    );
  }

  // Helper function to create a Koch curve segment with dynamic spikes
  function createKochSegment(x1: number, y1: number, x2: number, y2: number, depth: number) {
    if (depth === 0) {
      // Base case: create a cluster of spikes at this point
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const direction = new THREE.Vector3(x2 - x1, y2 - y1, 0).normalize();
      const size = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * 0.5;
      
      // Create main spike with dynamic height based on complexity
      const mainHeight = 0.8 + (complexity / 10);
      createSpike(midX, midY, 0, direction, size, mainHeight);
      
      // Create additional spikes around the main one
      const numSpikes = 4 + Math.floor(complexity / 2); // More spikes with higher complexity
      for (let i = 0; i < numSpikes; i++) {
        const angle = (i / numSpikes) * Math.PI * 2;
        const offsetX = Math.cos(angle) * size * 0.3;
        const offsetY = Math.sin(angle) * size * 0.3;
        
        // Create dynamic spike direction with varying heights
        const spikeDirection = new THREE.Vector3(
          Math.cos(angle),
          Math.sin(angle),
          0.5 + Math.random() * 0.5 // Random height variation
        ).normalize();
        
        // Create spike with dynamic size and height
        const spikeSize = size * (0.4 + Math.random() * 0.3);
        const spikeHeight = 0.6 + Math.random() * 0.4;
        createSpike(midX + offsetX, midY + offsetY, 0, spikeDirection, spikeSize, spikeHeight);
      }
      
      return;
    }

    // Calculate the points for the Koch curve
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Calculate the three points that form the triangle
    const x3 = x1 + dx / 3;
    const y3 = y1 + dy / 3;
    const x4 = x2 - dx / 3;
    const y4 = y2 - dy / 3;

    // Calculate the peak of the triangle with slight randomization
    const x5 = x3 + Math.cos(angle - Math.PI / 3) * length / 3 + (Math.random() - 0.5) * 0.1;
    const y5 = y3 + Math.sin(angle - Math.PI / 3) * length / 3 + (Math.random() - 0.5) * 0.1;

    // Recursively create the four segments
    createKochSegment(x1, y1, x3, y3, depth - 1);
    createKochSegment(x3, y3, x5, y5, depth - 1);
    createKochSegment(x5, y5, x4, y4, depth - 1);
    createKochSegment(x4, y4, x2, y2, depth - 1);
  }

  // Create the initial equilateral triangle with dynamic size
  const size = 2 + (complexity / 5); // Size increases with complexity
  const depth = Math.min(complexity, 5); // Limit depth to prevent performance issues

  // Calculate the three points of the equilateral triangle
  const x1 = 0;
  const y1 = size * Math.sqrt(3) / 3;
  const x2 = -size / 2;
  const y2 = -size * Math.sqrt(3) / 6;
  const x3 = size / 2;
  const y3 = -size * Math.sqrt(3) / 6;

  // Create the three sides of the snowflake
  createKochSegment(x1, y1, x2, y2, depth);
  createKochSegment(x2, y2, x3, y3, depth);
  createKochSegment(x3, y3, x1, y1, depth);

  // Set the attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);

  // Center the geometry
  geometry.center();

  // Compute vertex normals for smooth shading
  geometry.computeVertexNormals();

  return geometry;
}

// Main geometry creation function
export function createGeometry(type: GeometryType, complexity: number = 5, symmetry: number = 8): THREE.BufferGeometry {
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
    case 'fractal':
      return createFractal(complexity, symmetry);
    case 'quantumField':
      return createQuantumField(complexity, symmetry);
    case 'hopfFibration':
      return createHopfFibration(complexity);
    case 'goldenSpiral':
      return createGoldenSpiral(complexity);
    case 'piSpiral':
      return createPiSpiral(complexity);
    case 'kleinBottle':
      return createKleinBottle(complexity);
    case 'mobiusStrip':
      return createMobiusStrip(complexity);
    case 'torusKnot':
      return createTorusKnot(complexity);
    case 'kochSnowflake':
      return createKochSnowflake(complexity, symmetry);
    default:
      console.warn(`Unknown geometry type: ${type}, falling back to hyperCube`);
      return createHyperCube(complexity);
  }
} 