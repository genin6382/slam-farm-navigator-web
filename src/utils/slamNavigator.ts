
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

// Get the distance between two coordinates
export const getDistance = (
  coord1: [number, number],
  coord2: [number, number]
): number => {
  return Math.sqrt(
    Math.pow(coord1[0] - coord2[0], 2) + 
    Math.pow(coord1[1] - coord2[1], 2)
  );
};

// Find the next best direction for a rover to move
export const findNextBestDirection = (
  currentCoordinates: [number, number],
  currentBattery: number,
  avoidRovers: [number, number][] = []
): Direction | null => {
  const [x, y] = currentCoordinates;
  
  // Check all four directions
  const directions: Array<{direction: Direction, coordinates: [number, number], score: number}> = [
    { direction: 'forward', coordinates: [x, y - 1], score: 0 },
    { direction: 'backward', coordinates: [x, y + 1], score: 0 },
    { direction: 'left', coordinates: [x - 1, y], score: 0 },
    { direction: 'right', coordinates: [x + 1, y], score: 0 }
  ];
  
  // Filter directions that are within boundary, not locked, and have enough battery
  const validDirections = directions.filter(({ coordinates }) => {
    // Check if coordinates are within boundary
    const validBoundary = isWithinBoundary(coordinates[0], coordinates[1]);
    
    // Check if coordinates are not locked
    const notLocked = !isNodeLocked(coordinates);
    
    // Check if there's enough battery
    const sufficientBattery = hasEnoughBattery(currentBattery, 'move');
    
    // Check if coordinates don't collide with other rovers
    const noCollision = !avoidRovers.some(roverCoord => 
      roverCoord[0] === coordinates[0] && 
      roverCoord[1] === coordinates[1]
    );
    
    return validBoundary && notLocked && sufficientBattery && noCollision;
  });
  
  if (validDirections.length === 0) return null;
  
  // Score the valid directions based on various factors
  validDirections.forEach(direction => {
    const [dx, dy] = direction.coordinates;
    
    // Factor 1: Prefer unvisited nodes (highest priority)
    const key = getNodeKey(dx, dy);
    if (!visitedNodes.has(key)) {
      direction.score += 100;
    } else {
      // Factor 2: For visited nodes, prefer those visited longer ago
      const visitedTime = visitedNodes.get(key)!.lastVisited;
      const timeSinceVisit = Date.now() - visitedTime;
      direction.score += Math.min(80, timeSinceVisit / (NODE_LOCK_TIME / 80)); // Max score 80
    }
    
    // Factor 3: Avoid edges of the map where possible (unless exploring)
    const distanceFromEdge = Math.min(
      Math.abs(dx - FARM_BOUNDARY.MIN_X),
      Math.abs(dx - FARM_BOUNDARY.MAX_X),
      Math.abs(dy - FARM_BOUNDARY.MIN_Y),
      Math.abs(dy - FARM_BOUNDARY.MAX_Y)
    );
    
    direction.score += distanceFromEdge * 2; // Each step from edge adds 2 to score
    
    // Factor 4: Slightly randomize to avoid predictable patterns
    direction.score += Math.random() * 10; // Random bonus between 0-10
  });
  
  // Sort by score (descending) and take the highest scoring direction
  validDirections.sort((a, b) => b.score - a.score);
  return validDirections[0].direction;
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

// Get all visited nodes (for visualization)
export const getAllVisitedNodes = (): {coordinates: [number, number], lastVisited: number}[] => {
  return Array.from(visitedNodes.values()).map(node => ({
    coordinates: node.coordinates,
    lastVisited: node.lastVisited
  }));
};

// Battery-aware path planning
export const findOptimalPath = (
  start: [number, number],
  destination: [number, number],
  currentBattery: number,
  avoidNodes: [number, number][] = []
): [number, number][] | null => {
  // Enhanced A* pathfinding algorithm
  
  // Check if destination is within boundary
  if (!isWithinBoundary(destination[0], destination[1])) {
    return null;
  }
  
  // Check if we have enough battery to make the trip
  const distanceToDestination = Math.abs(start[0] - destination[0]) + Math.abs(start[1] - destination[1]);
  
  // Each move costs battery, so we need enough for the distance
  if (!hasEnoughBattery(currentBattery, 'move') || currentBattery < distanceToDestination) {
    return null; // Not enough battery to reach destination
  }
  
  // Create a set of nodes to avoid (includes locked nodes and other rovers)
  const nodesToAvoid = new Set<string>();
  avoidNodes.forEach(coord => {
    nodesToAvoid.add(getNodeKey(coord[0], coord[1]));
  });
  
  // We'll use A* algorithm to find the optimal path
  type AStarNode = {
    coord: [number, number];
    g: number; // Cost from start to current node
    h: number; // Heuristic (estimated cost from current to goal)
    f: number; // Total cost (g + h)
    parent: AStarNode | null;
  };
  
  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();
  
  // Add starting node to open set
  openSet.push({
    coord: start,
    g: 0,
    h: getDistance(start, destination),
    f: getDistance(start, destination),
    parent: null
  });
  
  while (openSet.length > 0) {
    // Find node with lowest f cost
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    
    // We've reached the destination
    if (current.coord[0] === destination[0] && current.coord[1] === destination[1]) {
      // Reconstruct path
      const path: [number, number][] = [];
      let currentNode: AStarNode | null = current;
      
      while (currentNode) {
        path.unshift(currentNode.coord);
        currentNode = currentNode.parent;
      }
      
      // Remove start node from path
      path.shift();
      
      return path;
    }
    
    // Add current to closed set
    closedSet.add(getNodeKey(current.coord[0], current.coord[1]));
    
    // Check neighbors
    const directions = [
      [0, -1], [0, 1], [-1, 0], [1, 0] // Up, down, left, right
    ];
    
    for (const [dx, dy] of directions) {
      const neighborCoord: [number, number] = [current.coord[0] + dx, current.coord[1] + dy];
      const neighborKey = getNodeKey(neighborCoord[0], neighborCoord[1]);
      
      // Skip if out of bounds, in closed set, or in avoid set
      if (
        !isWithinBoundary(neighborCoord[0], neighborCoord[1]) ||
        closedSet.has(neighborKey) ||
        nodesToAvoid.has(neighborKey)
      ) {
        continue;
      }
      
      // Calculate costs
      const gCost = current.g + 1; // Each move costs 1
      const hCost = getDistance(neighborCoord, destination);
      const fCost = gCost + hCost;
      
      // Check if neighbor is already in open set with a better path
      const existingNeighbor = openSet.find(
        node => node.coord[0] === neighborCoord[0] && node.coord[1] === neighborCoord[1]
      );
      
      if (existingNeighbor && existingNeighbor.g <= gCost) {
        continue; // Skip if existing path is better or equal
      }
      
      // Add or update neighbor in open set
      if (existingNeighbor) {
        existingNeighbor.g = gCost;
        existingNeighbor.f = fCost;
        existingNeighbor.parent = current;
      } else {
        openSet.push({
          coord: neighborCoord,
          g: gCost,
          h: hCost,
          f: fCost,
          parent: current
        });
      }
    }
  }
  
  // No path found
  return null;
};
