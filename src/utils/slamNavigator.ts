import { 
  VisitedNode, 
  FARM_BOUNDARY, 
  NODE_LOCK_TIME,
  Task,
  SensorData,
  SOIL_THRESHOLDS,
  Direction
} from '@/types/api';
import { hasEnoughBattery } from './batteryManager';

// Store visited nodes
const visitedNodes: Map<string, VisitedNode> = new Map();

// Create a key for coordinates
const getNodeKey = (x: number, y: number): string => `${x},${y}`;

// Check if movement is within farm boundaries
export const isWithinBoundary = (x: number, y: number): boolean => {
  return (
    x >= FARM_BOUNDARY.MIN_X &&
    x <= FARM_BOUNDARY.MAX_X &&
    y >= FARM_BOUNDARY.MIN_Y &&
    y <= FARM_BOUNDARY.MAX_Y
  );
};

// Mark a node as visited
export const markNodeAsVisited = (
  coordinates: [number, number], 
  task: Task | null
): void => {
  const [x, y] = coordinates;
  const key = getNodeKey(x, y);
  const now = Date.now();
  
  if (visitedNodes.has(key)) {
    const node = visitedNodes.get(key)!;
    node.lastVisited = now;
    if (task && !node.tasks.includes(task)) {
      node.tasks.push(task);
    }
    visitedNodes.set(key, node);
  } else {
    visitedNodes.set(key, {
      coordinates,
      lastVisited: now,
      tasks: task ? [task] : []
    });
  }
};

// Check if node is locked (recently visited)
export const isNodeLocked = (coordinates: [number, number]): boolean => {
  const [x, y] = coordinates;
  const key = getNodeKey(x, y);
  
  if (!visitedNodes.has(key)) return false;
  
  const node = visitedNodes.get(key)!;
  const now = Date.now();
  return (now - node.lastVisited) < NODE_LOCK_TIME;
};

// Find the next best direction for a rover to move
export const findNextBestDirection = (
  currentCoordinates: [number, number],
  currentBattery: number
): Direction | null => {
  const [x, y] = currentCoordinates;
  
  // Check all four directions
  const directions: Array<{direction: Direction, coordinates: [number, number]}> = [
    { direction: 'forward', coordinates: [x, y - 1] },
    { direction: 'backward', coordinates: [x, y + 1] },
    { direction: 'left', coordinates: [x - 1, y] },
    { direction: 'right', coordinates: [x + 1, y] }
  ];
  
  // Filter directions that are within boundary, not locked, and have enough battery
  const validDirections = directions.filter(({ coordinates }) => {
    return isWithinBoundary(coordinates[0], coordinates[1]) && 
           !isNodeLocked(coordinates) &&
           hasEnoughBattery(currentBattery, 'move');
  });
  
  if (validDirections.length === 0) return null;
  
  // Prioritize unvisited nodes
  const unvisitedDirections = validDirections.filter(({ coordinates }) => {
    const key = getNodeKey(coordinates[0], coordinates[1]);
    return !visitedNodes.has(key);
  });
  
  // If there are unvisited directions, choose one randomly
  if (unvisitedDirections.length > 0) {
    const randomIndex = Math.floor(Math.random() * unvisitedDirections.length);
    return unvisitedDirections[randomIndex].direction;
  }
  
  // Otherwise, choose a direction with the oldest visit time
  let oldestDirection = validDirections[0];
  let oldestTime = Number.MAX_SAFE_INTEGER;
  
  validDirections.forEach(({ direction, coordinates }) => {
    const key = getNodeKey(coordinates[0], coordinates[1]);
    const node = visitedNodes.get(key);
    
    if (node && node.lastVisited < oldestTime) {
      oldestTime = node.lastVisited;
      oldestDirection = { direction, coordinates };
    }
  });
  
  return oldestDirection.direction;
};

// Determine best task based on sensor data
export const determineBestTask = (sensorData: SensorData): Task => {
  const { soil_moisture, soil_pH, temperature } = sensorData;
  
  // Decision for Irrigation
  if (
    soil_moisture < SOIL_THRESHOLDS.MOISTURE.LOW || 
    (temperature > SOIL_THRESHOLDS.TEMPERATURE.HIGH && soil_moisture < 30)
  ) {
    return "Irrigation";
  }
  
  // Decision for Weeding
  if (
    soil_moisture > 30 && 
    temperature >= 20 && 
    temperature <= 35
  ) {
    return "Weeding";
  }
  
  // Decision for Soil Analysis based on pH imbalance
  if (
    soil_pH < SOIL_THRESHOLDS.PH.LOW || 
    soil_pH > SOIL_THRESHOLDS.PH.HIGH
  ) {
    return "Soil Analysis";
  }
  
  // Default to Crop Monitoring
  return "Crop Monitoring";
};

// Get all nodes that are currently locked
export const getLockedNodes = (): [number, number][] => {
  const now = Date.now();
  return Array.from(visitedNodes.values())
    .filter((node) => (now - node.lastVisited) < NODE_LOCK_TIME)
    .map((node) => node.coordinates);
};

// Get stats about visited areas
export const getVisitationStats = () => {
  const totalNodes = visitedNodes.size;
  const lockedNodes = getLockedNodes().length;
  
  // Count tasks by type
  const taskCounts = {
    "Soil Analysis": 0,
    "Irrigation": 0,
    "Weeding": 0,
    "Crop Monitoring": 0
  };
  
  visitedNodes.forEach((node) => {
    node.tasks.forEach((task) => {
      taskCounts[task]++;
    });
  });
  
  return {
    totalVisitedNodes: totalNodes,
    currentlyLockedNodes: lockedNodes,
    taskCounts
  };
};

// Battery-aware path planning
export const findOptimalPath = (
  start: [number, number],
  destination: [number, number],
  currentBattery: number
): [number, number][] | null => {
  // Check if we have enough battery to make the trip
  const distanceToDestination = Math.abs(start[0] - destination[0]) + Math.abs(start[1] - destination[1]);
  
  // Each move costs BATTERY_CONSUMPTION.MOVE
  if (!hasEnoughBattery(currentBattery, 'move') || currentBattery < distanceToDestination) {
    return null; // Not enough battery to reach destination
  }
  
  // Simplified path planning (direct route) for this example
  // In a real implementation, A* or similar algorithm would be used
  const path: [number, number][] = [];
  
  // Horizontal movement first
  let currentX = start[0];
  const destX = destination[0];
  while (currentX !== destX) {
    currentX += currentX < destX ? 1 : -1;
    if (isWithinBoundary(currentX, start[1])) {
      path.push([currentX, start[1]]);
    }
  }
  
  // Then vertical movement
  let currentY = start[1];
  const destY = destination[1];
  while (currentY !== destY) {
    currentY += currentY < destY ? 1 : -1;
    if (isWithinBoundary(currentX, currentY)) {
      path.push([currentX, currentY]);
    }
  }
  
  return path;
};
