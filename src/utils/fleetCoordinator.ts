
import { 
  CoordinationTask, 
  CoordinationPlan, 
  Task, 
  FleetStatus,
  RoverSensorData,
  FARM_BOUNDARY
} from '@/types/api';
import { isNodeLocked } from './slamNavigator';
import { hasEnoughBattery } from './batteryManager';

// Initialize an empty coordination plan
export const createCoordinationPlan = (): CoordinationPlan => {
  return {
    tasks: [],
    activeTasks: 0,
    completedTasks: 0
  };
};

// Generate a new task based on sensor data and current farm status
export const generateCoordinationTask = (
  sensorData: RoverSensorData,
  taskType: Task,
  priority: number = 5
): CoordinationTask | null => {
  // Find optimal coordinates for this task based on sensor data
  // This is a simplified implementation - in reality, would analyze all sensor data
  // to find the best location for this specific task
  
  // Get random coordinates within farm boundaries for demo purposes
  const randomX = Math.floor(Math.random() * (FARM_BOUNDARY.MAX_X - FARM_BOUNDARY.MIN_X + 1)) + FARM_BOUNDARY.MIN_X;
  const randomY = Math.floor(Math.random() * (FARM_BOUNDARY.MAX_Y - FARM_BOUNDARY.MIN_Y + 1)) + FARM_BOUNDARY.MIN_Y;
  
  // Skip if this node is locked (recently visited)
  if (isNodeLocked([randomX, randomY])) {
    return null;
  }
  
  // For more complex tasks, require more rovers
  const requiredRovers = taskType === 'Soil Analysis' || taskType === 'Crop Monitoring' ? 1 : 2;
  
  return {
    taskType,
    priority,
    coordinates: [randomX, randomY],
    requiredRovers,
    assignedRovers: [],
    startTime: null,
    completionTime: null
  };
};

// Assign rovers to tasks based on their availability, location, and battery level
export const assignRoversToTasks = (
  fleet: FleetStatus,
  plan: CoordinationPlan
): CoordinationPlan => {
  // Copy the plan to avoid mutations
  const updatedPlan = { ...plan, tasks: [...plan.tasks] };
  
  // Get idle rovers
  const idleRovers = Object.entries(fleet)
    .filter(([_, status]) => status.status === 'idle' && status.task === null)
    .map(([id, status]) => ({
      id,
      battery: status.battery,
      coordinates: status.coordinates
    }));
    
  // Process unassigned or partially assigned tasks by priority
  const sortedTasks = [...updatedPlan.tasks]
    .filter(task => !task.completionTime && task.assignedRovers.length < task.requiredRovers)
    .sort((a, b) => b.priority - a.priority);
    
  for (const task of sortedTasks) {
    // Skip already fully assigned tasks
    if (task.assignedRovers.length >= task.requiredRovers) continue;
    
    // How many more rovers needed
    const neededRovers = task.requiredRovers - task.assignedRovers.length;
    
    // Calculate distances for each rover to the task
    const roversWithDistance = idleRovers
      .filter(rover => !task.assignedRovers.includes(rover.id)) // Exclude already assigned rovers
      .map(rover => {
        // Manhattan distance (simplified)
        const distance = Math.abs(rover.coordinates[0] - task.coordinates[0]) + 
                         Math.abs(rover.coordinates[1] - task.coordinates[1]);
        return { ...rover, distance };
      })
      // Filter out rovers with insufficient battery 
      .filter(rover => hasEnoughBattery(rover.battery, 'move'))
      // Sort by distance (closest first)
      .sort((a, b) => a.distance - b.distance);
      
    // Assign closest rovers up to the required number
    for (let i = 0; i < Math.min(neededRovers, roversWithDistance.length); i++) {
      task.assignedRovers.push(roversWithDistance[i].id);
      
      // Remove assigned rover from idle rovers list
      const index = idleRovers.findIndex(r => r.id === roversWithDistance[i].id);
      if (index !== -1) {
        idleRovers.splice(index, 1);
      }
    }
    
    // Set start time if all required rovers are assigned
    if (task.assignedRovers.length === task.requiredRovers && !task.startTime) {
      task.startTime = Date.now();
    }
  }
  
  // Update active tasks count
  updatedPlan.activeTasks = updatedPlan.tasks.filter(
    task => task.startTime && !task.completionTime
  ).length;
  
  return updatedPlan;
};

// Mark tasks as completed
export const updateTaskCompletionStatus = (plan: CoordinationPlan): CoordinationPlan => {
  const updatedPlan = { ...plan, tasks: [...plan.tasks] };
  let completedCount = 0;
  
  // Set tasks with start time > 30 seconds ago as completed (for demo purposes)
  updatedPlan.tasks = updatedPlan.tasks.map(task => {
    if (task.startTime && !task.completionTime) {
      const elapsedTime = Date.now() - task.startTime;
      if (elapsedTime > 30000) { // 30 seconds
        completedCount++;
        return { ...task, completionTime: Date.now() };
      }
    }
    if (task.completionTime) completedCount++;
    return task;
  });
  
  updatedPlan.completedTasks = completedCount;
  return updatedPlan;
};
