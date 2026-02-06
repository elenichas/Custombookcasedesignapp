import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { BookcaseConfig } from './Bookcase';

interface BookcaseViewerProps {
  config: BookcaseConfig;
  onConfigChange: (config: BookcaseConfig) => void;
}

export interface BookcaseViewerRef {
  exportAsOBJ: () => void;
}

export const BookcaseViewer = forwardRef<BookcaseViewerRef, BookcaseViewerProps>(
  ({ config, onConfigChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      controls: OrbitControls;
      bookcase: THREE.Group;
      compartments: THREE.Group;
      highlightMesh: THREE.Mesh | null;
      raycaster: THREE.Raycaster;
      mouse: THREE.Vector2;
      isDragging: boolean;
      dragPlane: THREE.Plane;
      dragOffset: THREE.Vector3;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredCompartment, setHoveredCompartment] = useState<{ row: number; column: number } | null>(null);
    const configRef = useRef(config);

    // Update config ref when it changes
    useEffect(() => {
      configRef.current = config;
    }, [config]);

    // Initialize Three.js scene
    useEffect(() => {
      if (!containerRef.current) return;

      try {
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        console.log('Initializing Three.js scene:', { width, height });

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xdfe9f0);
        scene.fog = new THREE.Fog(0xdfe9f0, 15, 50);

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(6, 4, 6);
        camera.lookAt(0, 1, 0);

        // Renderer with tone mapping for realistic lighting
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 3;
        controls.maxDistance = 15;
        controls.maxPolarAngle = Math.PI / 2;
        controls.target.set(0, 1.2, 0);
        controls.update();

        // Enhanced Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xfff4e6, 2.5);
        mainLight.position.set(8, 12, 6);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 4096;
        mainLight.shadow.mapSize.height = 4096;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -12;
        mainLight.shadow.camera.right = 12;
        mainLight.shadow.camera.top = 12;
        mainLight.shadow.camera.bottom = -12;
        mainLight.shadow.bias = -0.0001;
        mainLight.shadow.radius = 3;
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xe3f2ff, 0.8);
        fillLight.position.set(-6, 6, 4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(-3, 4, -6);
        scene.add(rimLight);

        const pointLight1 = new THREE.PointLight(0xfff4e6, 1.2, 15);
        pointLight1.position.set(-4, 4, 2);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffe4b3, 0.8, 12);
        pointLight2.position.set(5, 3, -3);
        scene.add(pointLight2);

        const hemisphereLight = new THREE.HemisphereLight(0xdfe9f0, 0xb8a080, 0.6);
        scene.add(hemisphereLight);

        // Room
        createRoom(scene);

        // Bookcase
        const bookcase = new THREE.Group();
        bookcase.userData.draggable = true;
        scene.add(bookcase);

        // Compartments for interaction
        const compartments = new THREE.Group();
        scene.add(compartments);

        // Highlight mesh for hover
        const highlightGeometry = new THREE.BoxGeometry(1, 1, 0.01);
        const highlightMaterial = new THREE.MeshBasicMaterial({
          color: 0x4488ff,
          transparent: true,
          opacity: 0.3,
          depthTest: false,
        });
        const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlightMesh.visible = false;
        scene.add(highlightMesh);

        // Raycaster for interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const dragOffset = new THREE.Vector3();

        // Store references
        sceneRef.current = { 
          scene, 
          camera, 
          renderer, 
          controls, 
          bookcase,
          compartments,
          highlightMesh,
          raycaster,
          mouse,
          isDragging: false,
          dragPlane,
          dragOffset
        };

        let isOverBookcase = false;

        // Mouse event handlers
        const handleMouseMove = (event: MouseEvent) => {
          if (!sceneRef.current || !containerRef.current) return;
          
          const rect = containerRef.current.getBoundingClientRect();
          sceneRef.current.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          sceneRef.current.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          if (sceneRef.current.isDragging) {
            // Update bookcase position while dragging
            sceneRef.current.raycaster.setFromCamera(sceneRef.current.mouse, sceneRef.current.camera);
            const intersectPoint = new THREE.Vector3();
            sceneRef.current.raycaster.ray.intersectPlane(sceneRef.current.dragPlane, intersectPoint);
            
            if (intersectPoint) {
              sceneRef.current.bookcase.position.x = intersectPoint.x - sceneRef.current.dragOffset.x;
              sceneRef.current.bookcase.position.z = intersectPoint.z - sceneRef.current.dragOffset.z;
            }
            sceneRef.current.highlightMesh!.visible = false;
          } else {
            // Check for hover on compartments
            sceneRef.current.raycaster.setFromCamera(sceneRef.current.mouse, sceneRef.current.camera);
            const compartmentIntersects = sceneRef.current.raycaster.intersectObjects(sceneRef.current.compartments.children, false);
            
            if (compartmentIntersects.length > 0) {
              const compartment = compartmentIntersects[0].object as THREE.Mesh;
              const userData = compartment.userData as { row: number; column: number };
              setHoveredCompartment(userData);
              
              // Show highlight
              if (sceneRef.current.highlightMesh) {
                sceneRef.current.highlightMesh.position.copy(compartment.position);
                sceneRef.current.highlightMesh.scale.copy(compartment.scale);
                sceneRef.current.highlightMesh.visible = true;
              }
              
              container.style.cursor = 'pointer';
              isOverBookcase = false;
            } else {
              setHoveredCompartment(null);
              if (sceneRef.current.highlightMesh) {
                sceneRef.current.highlightMesh.visible = false;
              }
              
              // Check if over bookcase for dragging
              const bookcaseIntersects = sceneRef.current.raycaster.intersectObjects(sceneRef.current.bookcase.children, true);
              if (bookcaseIntersects.length > 0) {
                container.style.cursor = 'grab';
                isOverBookcase = true;
              } else {
                container.style.cursor = 'default';
                isOverBookcase = false;
              }
            }
          }
        };

        const handleMouseDown = (event: MouseEvent) => {
          if (!sceneRef.current) return;
          
          sceneRef.current.raycaster.setFromCamera(sceneRef.current.mouse, sceneRef.current.camera);
          
          // Check if clicking on a compartment first
          const compartmentIntersects = sceneRef.current.raycaster.intersectObjects(sceneRef.current.compartments.children, false);
          
          if (compartmentIntersects.length > 0) {
            // Handle compartment click
            const compartment = compartmentIntersects[0].object;
            const userData = compartment.userData as { row: number; column: number };
            handleCompartmentClick(userData.row, userData.column);
            return;
          }
          
          // Otherwise check for bookcase drag
          const bookcaseIntersects = sceneRef.current.raycaster.intersectObjects(sceneRef.current.bookcase.children, true);
          
          if (bookcaseIntersects.length > 0) {
            sceneRef.current.isDragging = true;
            sceneRef.current.controls.enabled = false;
            
            // Calculate drag offset
            const intersectPoint = new THREE.Vector3();
            sceneRef.current.raycaster.ray.intersectPlane(sceneRef.current.dragPlane, intersectPoint);
            sceneRef.current.dragOffset.subVectors(intersectPoint, sceneRef.current.bookcase.position);
            
            container.style.cursor = 'grabbing';
          }
        };

        const handleMouseUp = () => {
          if (!sceneRef.current || !containerRef.current) return;
          
          if (sceneRef.current.isDragging) {
            sceneRef.current.isDragging = false;
            sceneRef.current.controls.enabled = true;
            containerRef.current.style.cursor = isOverBookcase ? 'grab' : 'default';
          }
        };

        const handleCompartmentClick = (row: number, column: number) => {
          const currentConfig = configRef.current;
          
          // Find existing drawer
          const drawerIndex = currentConfig.drawers.findIndex(
            d => d.row === row && d.column === column
          );

          let newDrawers;
          
          if (drawerIndex >= 0) {
            // Drawer exists - cycle through states: solid -> glass -> remove
            const currentDrawer = currentConfig.drawers[drawerIndex];
            if (currentDrawer.type === 'solid') {
              // Change to glass
              newDrawers = currentConfig.drawers.map((d, i) =>
                i === drawerIndex ? { ...d, type: 'glass' as const } : d
              );
            } else {
              // Remove drawer
              newDrawers = currentConfig.drawers.filter((_, i) => i !== drawerIndex);
            }
          } else {
            // Add new solid drawer
            newDrawers = [...currentConfig.drawers, { row, column, type: 'solid' as const }];
          }

          onConfigChange({ ...currentConfig, drawers: newDrawers });
        };

        // Add event listeners
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        // Animation loop
        let animationId: number;
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
          if (!containerRef.current || !sceneRef.current) return;
          const newWidth = containerRef.current.clientWidth;
          const newHeight = containerRef.current.clientHeight;
          sceneRef.current.camera.aspect = newWidth / newHeight;
          sceneRef.current.camera.updateProjectionMatrix();
          sceneRef.current.renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        setIsLoading(false);
        console.log('Three.js scene initialized successfully');

        // Cleanup
        return () => {
          cancelAnimationFrame(animationId);
          window.removeEventListener('resize', handleResize);
          container.removeEventListener('mousemove', handleMouseMove);
          container.removeEventListener('mousedown', handleMouseDown);
          window.removeEventListener('mouseup', handleMouseUp);
          controls.dispose();
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
          container.style.cursor = 'default';
        };
      } catch (err) {
        console.error('Error initializing Three.js:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize 3D viewer');
        setIsLoading(false);
      }
    }, [onConfigChange]);

    // Update bookcase when config changes
    useEffect(() => {
      if (!sceneRef.current) return;
      
      try {
        const { bookcase, compartments } = sceneRef.current;
        
        // Store current position
        const currentPosition = bookcase.position.clone();
        
        // Clear existing bookcase
        while (bookcase.children.length > 0) {
          const child = bookcase.children[0];
          bookcase.remove(child);
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }

        // Clear existing compartments
        while (compartments.children.length > 0) {
          const child = compartments.children[0];
          compartments.remove(child);
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }

        // Create new bookcase and compartments
        createBookcase(bookcase, compartments, config);
        
        // Restore position if it was moved, otherwise align to back wall
        if (currentPosition.x !== 0 || currentPosition.z !== 0) {
          bookcase.position.copy(currentPosition);
        } else {
          bookcase.position.set(0, 0, -5 + config.depth / 2 + 0.05);
        }

        // Position compartments with bookcase
        compartments.position.copy(bookcase.position);
        
        console.log('Bookcase updated with config:', config);
      } catch (err) {
        console.error('Error updating bookcase:', err);
      }
    }, [config]);

    // Export as OBJ
    useImperativeHandle(ref, () => ({
      exportAsOBJ: () => {
        if (!sceneRef.current) return;
        const exporter = new OBJExporter();
        const objString = exporter.parse(sceneRef.current.bookcase);
        const blob = new Blob([objString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookcase.obj';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }));

    if (error) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <p className="text-red-600 font-semibold mb-2">Failed to load 3D viewer</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading 3D viewer...</p>
            </div>
          </div>
        )}
        {hoveredCompartment && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm pointer-events-none z-10">
            Row {hoveredCompartment.row + 1}, Column {hoveredCompartment.column + 1} - Click to add/change drawer
          </div>
        )}
        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>
    );
  }
);

// Create procedural wood texture
function createWoodTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;

  const gradient = context.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, '#8B6F47');
  gradient.addColorStop(0.3, '#A0826D');
  gradient.addColorStop(0.5, '#8B6F47');
  gradient.addColorStop(0.7, '#9E7A5C');
  gradient.addColorStop(1, '#8B6F47');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  context.strokeStyle = 'rgba(70, 50, 30, 0.3)';
  context.lineWidth = 1;
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 512;
    const offset = Math.sin(x * 0.05) * 20;
    context.beginPath();
    context.moveTo(x, 0);
    context.bezierCurveTo(x + offset, 128, x - offset, 384, x, 512);
    context.stroke();
  }

  const imageData = context.getImageData(0, 0, 512, 512);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    imageData.data[i] += noise;
    imageData.data[i + 1] += noise;
    imageData.data[i + 2] += noise;
  }
  context.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createWoodNormalMap(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;

  context.fillStyle = '#8080ff';
  context.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = Math.random() * 3 + 1;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#9090ff');
    gradient.addColorStop(1, '#8080ff');
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createParquetTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d')!;

  const plankWidth = 128;
  const plankHeight = 512;
  
  for (let x = 0; x < 1024; x += plankWidth * 2) {
    for (let y = 0; y < 1024; y += plankHeight) {
      const color1 = `hsl(${25 + Math.random() * 10}, 40%, ${35 + Math.random() * 10}%)`;
      context.fillStyle = color1;
      context.fillRect(x, y, plankWidth, plankHeight);
      context.strokeStyle = 'rgba(0,0,0,0.3)';
      context.lineWidth = 2;
      context.strokeRect(x, y, plankWidth, plankHeight);
      
      const color2 = `hsl(${25 + Math.random() * 10}, 40%, ${35 + Math.random() * 10}%)`;
      context.fillStyle = color2;
      context.fillRect(x + plankWidth, y, plankWidth, plankHeight);
      context.strokeRect(x + plankWidth, y, plankWidth, plankHeight);
      
      for (let i = 0; i < 5; i++) {
        context.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.05})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x + Math.random() * plankWidth, y);
        context.lineTo(x + Math.random() * plankWidth, y + plankHeight);
        context.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createRoom(scene: THREE.Scene) {
  const floorTexture = createParquetTexture();
  
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    map: floorTexture,
    roughness: 0.7,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallGeometry = new THREE.PlaneGeometry(20, 8);
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5f0,
    roughness: 0.95,
    metalness: 0,
  });
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 4, -5);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
  leftWall.position.set(-10, 4, 5);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const baseboardGeometry = new THREE.BoxGeometry(20, 0.15, 0.05);
  const baseboardMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.1,
  });
  const baseboard = new THREE.Mesh(baseboardGeometry, baseboardMaterial);
  baseboard.position.set(0, 0.075, -4.975);
  baseboard.castShadow = true;
  baseboard.receiveShadow = true;
  scene.add(baseboard);
}

function createBookcase(bookcaseGroup: THREE.Group, compartmentsGroup: THREE.Group, config: BookcaseConfig) {
  const { width, height, depth, shelves, divisions, thickness, color, drawers } = config;

  const woodTexture = createWoodTexture();
  const woodNormalMap = createWoodNormalMap();

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    map: woodTexture,
    normalMap: woodNormalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.65,
    metalness: 0.05,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xccddff,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
    envMapIntensity: 1,
  });

  const createBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const uvs = geometry.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      uvs.setXY(i, uvs.getX(i) * (w / 0.5), uvs.getY(i) * (h / 0.5));
    }
    const mesh = new THREE.Mesh(geometry, woodMaterial.clone());
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Main structure
  bookcaseGroup.add(createBox(width, thickness, depth, 0, thickness / 2, 0));
  bookcaseGroup.add(createBox(width, thickness, depth, 0, height - thickness / 2, 0));
  bookcaseGroup.add(createBox(thickness, height, depth, -width / 2 + thickness / 2, height / 2, 0));
  bookcaseGroup.add(createBox(thickness, height, depth, width / 2 - thickness / 2, height / 2, 0));

  const backThickness = thickness / 2;
  const backMaterial = woodMaterial.clone();
  backMaterial.color.multiplyScalar(0.9);
  const backGeometry = new THREE.BoxGeometry(width - thickness * 2, height - thickness * 2, backThickness);
  const backPanel = new THREE.Mesh(backGeometry, backMaterial);
  backPanel.position.set(0, height / 2, -depth / 2 + backThickness / 2);
  backPanel.castShadow = true;
  backPanel.receiveShadow = true;
  bookcaseGroup.add(backPanel);

  // Shelves
  if (shelves > 0) {
    const usableHeight = height - thickness * 2;
    const shelfSpacing = usableHeight / (shelves + 1);
    for (let i = 1; i <= shelves; i++) {
      const y = thickness + shelfSpacing * i;
      bookcaseGroup.add(createBox(width - thickness * 2, thickness, depth, 0, y, 0));
    }
  }

  // Divisions
  if (divisions > 0) {
    const usableWidth = width - thickness * 2;
    const divisionSpacing = usableWidth / (divisions + 1);
    for (let i = 1; i <= divisions; i++) {
      const x = -width / 2 + thickness + divisionSpacing * i;
      bookcaseGroup.add(createBox(thickness, height - thickness * 2, depth, x, height / 2, 0));
    }
  }

  // Create clickable compartments
  const usableHeight = height - thickness * 2;
  const usableWidth = width - thickness * 2;
  const compartmentHeight = usableHeight / (shelves + 1);
  const compartmentWidth = usableWidth / (divisions + 1);

  const compartmentMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });

  for (let row = 0; row <= shelves; row++) {
    for (let col = 0; col <= divisions; col++) {
      const compartmentGeometry = new THREE.PlaneGeometry(compartmentWidth - thickness * 2, compartmentHeight - thickness * 2);
      const compartmentMesh = new THREE.Mesh(compartmentGeometry, compartmentMaterial);
      
      const x = -width / 2 + thickness + compartmentWidth * (col + 0.5);
      const y = thickness + compartmentHeight * (row + 0.5);
      const z = depth / 3;
      
      compartmentMesh.position.set(x, y, z);
      compartmentMesh.userData = { row, column: col };
      compartmentsGroup.add(compartmentMesh);
    }
  }

  // Drawers
  if (drawers && drawers.length > 0) {
    drawers.forEach((drawer) => {
      const { row, column, type } = drawer;

      const drawerX = -width / 2 + thickness + compartmentWidth * (column + 0.5);
      const drawerY = thickness + compartmentHeight * (row + 0.5);
      const drawerZ = depth / 4;

      const drawerWidth = compartmentWidth - thickness * 1.5;
      const drawerHeight = compartmentHeight - thickness * 1.5;

      const drawerGeometry = new THREE.BoxGeometry(drawerWidth, drawerHeight, thickness * 1.5);
      const drawerMaterial = type === 'solid' ? woodMaterial.clone() : glassMaterial.clone();
      
      const drawerMesh = new THREE.Mesh(drawerGeometry, drawerMaterial);
      drawerMesh.position.set(drawerX, drawerY, drawerZ);
      drawerMesh.castShadow = true;
      drawerMesh.receiveShadow = true;
      bookcaseGroup.add(drawerMesh);

      if (type === 'solid') {
        const handleGeometry = new THREE.CylinderGeometry(thickness * 0.5, thickness * 0.5, drawerWidth * 0.2, 16);
        handleGeometry.rotateZ(Math.PI / 2);
        const handleMaterial = new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.3,
          metalness: 0.8,
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(drawerX, drawerY, drawerZ + thickness);
        handle.castShadow = true;
        bookcaseGroup.add(handle);
      }

      if (type === 'glass') {
        const frameThickness = thickness * 0.3;
        const frameMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.4,
          metalness: 0.6,
        });

        const frames = [
          { w: drawerWidth, h: frameThickness, x: 0, y: drawerHeight / 2 },
          { w: drawerWidth, h: frameThickness, x: 0, y: -drawerHeight / 2 },
          { w: frameThickness, h: drawerHeight, x: -drawerWidth / 2, y: 0 },
          { w: frameThickness, h: drawerHeight, x: drawerWidth / 2, y: 0 },
        ];

        frames.forEach(({ w, h, x, y }) => {
          const frame = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, thickness * 1.5),
            frameMaterial
          );
          frame.position.set(drawerX + x, drawerY + y, drawerZ);
          frame.castShadow = true;
          bookcaseGroup.add(frame);
        });

        const handleGeometry = new THREE.CylinderGeometry(frameThickness, frameThickness, drawerWidth * 0.15, 12);
        handleGeometry.rotateZ(Math.PI / 2);
        const handle = new THREE.Mesh(handleGeometry, frameMaterial);
        handle.position.set(drawerX, drawerY, drawerZ + thickness);
        handle.castShadow = true;
        bookcaseGroup.add(handle);
      }
    });
  }

  bookcaseGroup.position.y = 0;
  console.log('Created bookcase with', bookcaseGroup.children.length, 'parts and', compartmentsGroup.children.length, 'compartments');
}