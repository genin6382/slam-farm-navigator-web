
export interface SessionData {
  session_id: string;
}

export interface RoverStatus {
  status: string;
  battery: number;
  coordinates: [number, number];
  task: string | null;
}

export interface FleetStatus {
  [roverId: string]: RoverStatus;
}

export interface SensorData {
  timestamp: number;
  rover_id: string;
  soil_moisture: number;
  soil_pH: number;
  temperature: number;
  battery_level: number;
}

export interface RoverSensorData {
  [roverId: string]: SensorData;
}

export interface BatteryData {
  rover_id: string;
  battery_level: number;
}

export interface RoverBatteryData {
  [roverId: string]: BatteryData;
}

export interface CoordinateData {
  rover_id: string;
  coordinates: [number, number];
}

export interface RoverCoordinateData {
  [roverId: string]: CoordinateData;
}

export interface MoveResponse {
  message: string;
}

export interface ResetResponse {
  message: string;
}

export interface TaskResponse {
  message: string;
}

export type Direction = "forward" | "backward" | "left" | "right";
export type Task = "Soil Analysis" | "Irrigation" | "Weeding" | "Crop Monitoring";

// Farm boundary constants
export const FARM_BOUNDARY = {
  MIN_X: -10,
  MAX_X: 10,
  MIN_Y: -10,
  MAX_Y: 10
};

// SLAM-based implementation related types
export interface VisitedNode {
  coordinates: [number, number];
  lastVisited: number;
  tasks: Task[];
}

// Soil analysis thresholds
export const SOIL_THRESHOLDS = {
  MOISTURE: {
    LOW: 25,    // Below 25% is dry
    HIGH: 40    // Above 40% is waterlogged
  },
  PH: {
    LOW: 5.5,   // Below 5.5 is acidic
    HIGH: 7.5   // Above 7.5 is alkaline
  },
  TEMPERATURE: {
    LOW: 15,    // Below 15°C is cold stress
    HIGH: 30    // Above 30°C is heat stress
  }
};

// Lock time for visited nodes (in milliseconds)
export const NODE_LOCK_TIME = 5 * 60 * 1000; // 5 minutes
