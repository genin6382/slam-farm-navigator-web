
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FleetStatus, RoverSensorData, FARM_BOUNDARY } from '@/types/api';

// OrbitControls is not directly importable from three in a module context
// We need to implement it manually
class OrbitControls {
  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this.enableZoom = true;
    this.enableRotate = true;
    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.0;
    this.minDistance = 5;
    this.maxDistance = 100;
    
    this.setupEventListeners();
  }

  camera: THREE.Camera;
  domElement: HTMLElement;
  target: THREE.Vector3;
  enableDamping: boolean;
  dampingFactor: number;
  enableZoom: boolean;
  enableRotate: boolean;
  rotateSpeed: number;
  zoomSpeed: number;
  minDistance: number;
  maxDistance: number;
  position0: THREE.Vector3 = new THREE.Vector3();
  target0: THREE.Vector3 = new THREE.Vector3();
  isDragging: boolean = false;
  previousMousePosition = { x: 0, y: 0 };

  setupEventListeners() {
    const element = this.domElement;
    
    element.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    });
    
    element.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const deltaMove = {
        x: e.clientX - this.previousMousePosition.x,
        y: e.clientY - this.previousMousePosition.y
      };
      
      if (this.enableRotate) {
        const rotateAngle = Math.PI / 180 * this.rotateSpeed;
        
        // Calculate the rotation angles based on mouse movement
        const thetaY = 2 * Math.PI * deltaMove.x / this.domElement.clientWidth;
        const thetaX = 2 * Math.PI * deltaMove.y / this.domElement.clientHeight;
        
        // Get the camera direction
        const offset = new THREE.Vector3();
        offset.copy((this.camera as THREE.PerspectiveCamera).position).sub(this.target);
        
        // Rotate around the target point
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 1, 0)
        );
        
        // Rotate around Y-axis (left/right)
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -thetaY * this.rotateSpeed);
        
        // Rotate around X-axis (up/down)
        const tempVector = new THREE.Vector3().copy(offset).normalize();
        const rightVector = new THREE.Vector3(1, 0, 0).cross(tempVector);
        offset.applyAxisAngle(rightVector, -thetaX * this.rotateSpeed);
        
        // Update camera position
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
      }
      
      this.previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    });
    
    element.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    
    element.addEventListener('wheel', (e) => {
      if (!this.enableZoom) return;
      
      const direction = new THREE.Vector3();
      direction.subVectors((this.camera as THREE.PerspectiveCamera).position, this.target).normalize();
      
      const distance = (this.camera as THREE.PerspectiveCamera).position.distanceTo(this.target);
      const delta = e.deltaY * 0.01 * this.zoomSpeed;
      
      // Limit zoom
      const newDistance = THREE.MathUtils.clamp(
        distance + delta,
        this.minDistance,
        this.maxDistance
      );
      
      if (newDistance !== distance) {
        (this.camera as THREE.PerspectiveCamera).position.copy(
          this.target.clone().add(direction.multiplyScalar(newDistance))
        );
      }
    });
  }

  update() {
    // Required for compatibility with Three.js OrbitControls
    return true;
  }
}

interface FarmVisualizationProps {
  fleetStatus: FleetStatus | null;
  sensorData: RoverSensorData | null;
}

const FarmVisualization3D: React.FC<FarmVisualizationProps> = ({ fleetStatus, sensorData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    controls: OrbitControls | null;
    farmObject: THREE.Group | null;
    roverObjects: Map<string, THREE.Group> | null;
    gridHelper: THREE.GridHelper | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    farmObject: null,
    roverObjects: null,
    gridHelper: null
  });

  // Initialize 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Create grid representing the farm boundaries
    const gridSize = Math.max(
      FARM_BOUNDARY.MAX_X - FARM_BOUNDARY.MIN_X,
      FARM_BOUNDARY.MAX_Y - FARM_BOUNDARY.MIN_Y
    ) + 2; // Add some padding
    
    const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x555555, 0x333333);
    gridHelper.position.set(0, 0, 0);
    scene.add(gridHelper);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    // Create farm terrain
    const farmObject = createFarmTerrain();
    scene.add(farmObject);

    // Create rover objects (will be populated later)
    const roverObjects = new Map<string, THREE.Group>();

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      farmObject,
      roverObjects,
      gridHelper
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.update();
      }
      
      if (sceneRef.current.renderer && sceneRef.current.scene && sceneRef.current.camera) {
        sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      }
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current.camera || !sceneRef.current.renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && sceneRef.current.renderer) {
        containerRef.current.removeChild(sceneRef.current.renderer.domElement);
      }
    };
  }, []);

  // Update rover positions and states
  useEffect(() => {
    if (!fleetStatus || !sceneRef.current.scene || !sceneRef.current.roverObjects) return;
    
    const { scene, roverObjects } = sceneRef.current;
    
    // Add or update rovers
    Object.entries(fleetStatus).forEach(([roverId, roverStatus]) => {
      const [x, y] = roverStatus.coordinates;
      
      // Convert farm coordinates to scene coordinates
      const sceneX = x;
      const sceneZ = y;
      
      if (!roverObjects.has(roverId)) {
        // Create new rover if it doesn't exist
        const roverColor = getRoverColor(roverId);
        const rover = createRover(roverColor);
        rover.position.set(sceneX, 0.3, sceneZ);
        scene.add(rover);
        roverObjects.set(roverId, rover);
      } else {
        // Update existing rover
        const rover = roverObjects.get(roverId)!;
        
        // Animate rover movement
        const fromPosition = rover.position.clone();
        const toPosition = new THREE.Vector3(sceneX, 0.3, sceneZ);
        
        // Only animate if rover is actually moving to a new position
        if (!fromPosition.equals(toPosition)) {
          const duration = 500; // milliseconds
          const startTime = Date.now();
          
          function animateRoverMovement() {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function for smoother movement
            const easeProgress = progress * (2 - progress);
            
            rover.position.lerpVectors(fromPosition, toPosition, easeProgress);
            
            if (progress < 1) {
              requestAnimationFrame(animateRoverMovement);
            }
          }
          
          animateRoverMovement();
        }
        
        // Update rover task indication
        updateRoverTaskIndication(rover, roverStatus.task);
      }
    });
    
    // Remove rovers that are no longer in fleet status
    const activeRoverIds = new Set(Object.keys(fleetStatus));
    roverObjects.forEach((rover, roverId) => {
      if (!activeRoverIds.has(roverId)) {
        scene.remove(rover);
        roverObjects.delete(roverId);
      }
    });
    
  }, [fleetStatus]);

  // Update soil visualization based on sensor data
  useEffect(() => {
    if (!sensorData || !sceneRef.current.farmObject) return;
    
    updateSoilVisualization(sceneRef.current.farmObject, sensorData, fleetStatus);
    
  }, [sensorData, fleetStatus]);

  // Create farm terrain with soil patches
  function createFarmTerrain() {
    const farmGroup = new THREE.Group();
    
    // Create base ground
    const groundSize = Math.max(
      FARM_BOUNDARY.MAX_X - FARM_BOUNDARY.MIN_X,
      FARM_BOUNDARY.MAX_Y - FARM_BOUNDARY.MIN_Y
    ) + 2;
    
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x7c5e42,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -0.05; // Slightly below zero
    farmGroup.add(ground);
    
    // Add crop rows
    for (let x = -9; x <= 9; x += 2) {
      for (let z = -9; z <= 9; z += 2) {
        // Skip some spots randomly for variation
        if (Math.random() > 0.85) continue;
        
        const cropPatch = createCropPatch();
        cropPatch.position.set(x, 0, z);
        cropPatch.scale.set(1.8, 1, 1.8); // Cover most of the grid cell
        farmGroup.add(cropPatch);
      }
    }
    
    return farmGroup;
  }

  // Create a crop patch
  function createCropPatch() {
    const patchGroup = new THREE.Group();
    
    // Base dirt patch
    const patchGeometry = new THREE.PlaneGeometry(1, 1);
    const patchMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x634b36,
      roughness: 0.9
    });
    
    const patch = new THREE.Mesh(patchGeometry, patchMaterial);
    patch.rotation.x = -Math.PI / 2;
    patchGroup.add(patch);
    
    // Add some crop plants
    const plantsCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < plantsCount; i++) {
      const plant = createPlant();
      
      // Position randomly within patch
      const offsetX = (Math.random() - 0.5) * 0.8;
      const offsetZ = (Math.random() - 0.5) * 0.8;
      plant.position.set(offsetX, 0, offsetZ);
      
      patchGroup.add(plant);
    }
    
    return patchGroup;
  }

  // Create a plant
  function createPlant() {
    const plantGroup = new THREE.Group();
    
    // Create stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x2e6930 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.15;
    plantGroup.add(stem);
    
    // Create leaves
    const leafGeometry = new THREE.SphereGeometry(0.08, 4, 4);
    leafGeometry.scale(1, 0.3, 1);
    
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x3a9142 });
    
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.y = 0.2 + i * 0.1;
      leaf.rotation.y = Math.random() * Math.PI * 2;
      const scale = 0.6 + Math.random() * 0.4;
      leaf.scale.set(scale, scale, scale);
      plantGroup.add(leaf);
    }
    
    return plantGroup;
  }

  // Create a rover
  function createRover(color: number) {
    const roverGroup = new THREE.Group();
    
    // Create rover body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.1;
    roverGroup.add(body);
    
    // Create wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const wheelPositions = [
      { x: 0.25, y: 0, z: 0.35 },
      { x: 0.25, y: 0, z: -0.35 },
      { x: -0.25, y: 0, z: 0.35 },
      { x: -0.25, y: 0, z: -0.35 }
    ];
    
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      roverGroup.add(wheel);
    });
    
    // Add sensor array (common to all rovers)
    const sensorArrayGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.2);
    const sensorArrayMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const sensorArray = new THREE.Mesh(sensorArrayGeometry, sensorArrayMaterial);
    sensorArray.position.set(0, 0.225, -0.25);
    roverGroup.add(sensorArray);
    
    // Add task indicator light
    const indicatorGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      emissive: 0x888888,
      emissiveIntensity: 0.5
    });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(0, 0.25, 0);
    indicator.userData.isTaskIndicator = true;
    roverGroup.add(indicator);
    
    return roverGroup;
  }

  // Get color for a rover based on its ID
  function getRoverColor(roverId: string): number {
    const roverNumber = parseInt(roverId.split('-')[1], 10);
    
    switch(roverNumber) {
      case 1: return 0x4361ee; // Blue
      case 2: return 0xf72585; // Pink
      case 3: return 0x4cc9f0; // Light blue
      case 4: return 0x7209b7; // Purple
      case 5: return 0xf94144; // Red
      default: return 0xffffff; // White
    }
  }

  // Update rover task visualization
  function updateRoverTaskIndication(rover: THREE.Group, task: string | null) {
    const indicator = rover.children.find(child => child.userData.isTaskIndicator) as THREE.Mesh;
    
    if (!indicator) return;
    
    const material = indicator.material as THREE.MeshStandardMaterial;
    
    if (!task) {
      material.emissive.set(0x888888);
      material.color.set(0x888888);
      material.emissiveIntensity = 0.2;
      return;
    }
    
    // Set color based on task
    switch(task) {
      case "Soil Analysis":
        material.emissive.set(0xffff00); // Yellow
        material.color.set(0xffff00);
        break;
      case "Irrigation":
        material.emissive.set(0x00aaff); // Blue
        material.color.set(0x00aaff);
        break;
      case "Weeding":
        material.emissive.set(0xff5500); // Orange
        material.color.set(0xff5500);
        break;
      case "Crop Monitoring":
        material.emissive.set(0x00ff00); // Green
        material.color.set(0x00ff00);
        break;
      default:
        material.emissive.set(0x888888);
        material.color.set(0x888888);
    }
    
    material.emissiveIntensity = 0.8;
    
    // Add pulsing animation for active task
    const initialIntensity = 0.8;
    const targetIntensity = 1.5;
    material.userData = material.userData || {};
    
    if (!material.userData.pulseAnimation) {
      material.userData.pulseAnimation = true;
      
      const pulsate = () => {
        if (!material.userData.pulseAnimation) return;
        
        const time = Date.now() * 0.001;
        material.emissiveIntensity = initialIntensity + 
          (targetIntensity - initialIntensity) * (0.5 + 0.5 * Math.sin(time * 3));
        
        requestAnimationFrame(pulsate);
      };
      
      pulsate();
    }
  }

  // Update soil visualization based on sensor data
  function updateSoilVisualization(farmObject: THREE.Group, sensorData: RoverSensorData, fleetStatus: FleetStatus | null) {
    if (!fleetStatus) return;
    
    // Find existing soil indicator objects and remove them
    const soilIndicators = farmObject.children.filter(child => child.userData.isSoilIndicator);
    soilIndicators.forEach(indicator => farmObject.remove(indicator));
    
    // Create new soil indicators based on sensor data
    Object.entries(sensorData).forEach(([roverId, data]) => {
      if (!fleetStatus[roverId]) return;
      
      const [x, z] = fleetStatus[roverId].coordinates;
      
      // Create moisture indicator
      const moistureColor = getMoistureColor(data.soil_moisture);
      const moistureIndicator = createSoilIndicator(moistureColor, 0.3);
      moistureIndicator.position.set(x, 0.01, z);
      moistureIndicator.userData.isSoilIndicator = true;
      farmObject.add(moistureIndicator);
      
      // Create pH indicator (offset slightly)
      const phColor = getPHColor(data.soil_pH);
      const phIndicator = createSoilIndicator(phColor, 0.15);
      phIndicator.position.set(x + 0.35, 0.01, z);
      phIndicator.userData.isSoilIndicator = true;
      farmObject.add(phIndicator);
      
      // Create temperature indicator (offset slightly)
      const tempColor = getTemperatureColor(data.temperature);
      const tempIndicator = createSoilIndicator(tempColor, 0.15);
      tempIndicator.position.set(x - 0.35, 0.01, z);
      tempIndicator.userData.isSoilIndicator = true;
      farmObject.add(tempIndicator);
    });
  }

  // Create a soil indicator (circular marker)
  function createSoilIndicator(color: number, size: number) {
    const geometry = new THREE.CircleGeometry(size, 12);
    const material = new THREE.MeshBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const indicator = new THREE.Mesh(geometry, material);
    indicator.rotation.x = -Math.PI / 2; // Lay flat on the ground
    return indicator;
  }

  // Get color for soil moisture visualization
  function getMoistureColor(moisture: number): number {
    if (moisture < 25) {
      return 0xd4a373; // Dry (brown)
    } else if (moisture > 40) {
      return 0x48cae4; // Wet (blue)
    } else {
      return 0x2d6a4f; // Optimal (green)
    }
  }

  // Get color for soil pH visualization
  function getPHColor(pH: number): number {
    if (pH < 5.5) {
      return 0xee6055; // Acidic (red)
    } else if (pH > 7.5) {
      return 0x6930c3; // Alkaline (purple)
    } else {
      return 0x80b918; // Neutral (green)
    }
  }

  // Get color for temperature visualization
  function getTemperatureColor(temperature: number): number {
    if (temperature < 15) {
      return 0xa2d2ff; // Cold (blue)
    } else if (temperature > 35) {
      return 0xdc2f02; // Hot (red)
    } else {
      return 0xffdd00; // Optimal (yellow)
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative bg-gray-900 rounded-xl overflow-hidden"
      style={{ height: '500px' }}
    >
      <div className="absolute top-2 left-2 z-10 text-xs text-white opacity-70 bg-black/40 p-2 rounded">
        <div className="font-semibold mb-1">3D Farm Visualization</div>
        <div>Click and drag to rotate | Scroll to zoom</div>
      </div>
      
      <div className="absolute bottom-2 right-2 z-10 text-xs text-white bg-black/40 p-2 rounded flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#4361ee] rounded-full mr-1"></div>
            <span>Rover-1</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#f72585] rounded-full mr-1"></div>
            <span>Rover-2</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#4cc9f0] rounded-full mr-1"></div>
            <span>Rover-3</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#7209b7] rounded-full mr-1"></div>
            <span>Rover-4</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#f94144] rounded-full mr-1"></div>
            <span>Rover-5</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
            <span>Soil Analysis</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
            <span>Irrigation</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
            <span>Weeding</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Crop Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmVisualization3D;
