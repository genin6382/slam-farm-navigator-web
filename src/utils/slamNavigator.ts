
import { 
  VisitedNode, 
  FARM_BOUNDARY, 
  NODE_LOCK_TIME,
  Task,
  SensorData,
  SOIL_THRESHOLDS
} from '@/types/api';

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
