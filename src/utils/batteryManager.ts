
import { BATTERY_CONSUMPTION } from '@/types/api';

// Calculate battery consumption for a movement
export const calculateMovementBatteryConsumption = (): number => {
  return BATTERY_CONSUMPTION.MOVE;
};

// Calculate battery consumption for a task
export const calculateTaskBatteryConsumption = (task: string | null): number => {
  if (!task) return 0;
  
  return BATTERY_CONSUMPTION.TASK[task as keyof typeof BATTERY_CONSUMPTION.TASK] || 0;
};

// Check if rover has enough battery for operation
export const hasEnoughBattery = (currentBattery: number, operation: 'move' | 'task', taskType?: string): boolean => {
  const requiredBattery = operation === 'move' 
    ? BATTERY_CONSUMPTION.MOVE 
    : (taskType ? calculateTaskBatteryConsumption(taskType) : 0);
    
  // Ensure rovers don't go below 10% battery
  return (currentBattery - requiredBattery) >= 10;
};

// Calculate estimated remaining work capacity
export const calculateRemainingCapacity = (currentBattery: number): number => {
  // Available battery (excluding 10% reserve)
  const usableBattery = Math.max(0, currentBattery - 10);
  
  // Average moves possible
  return Math.floor(usableBattery / BATTERY_CONSUMPTION.MOVE);
};
