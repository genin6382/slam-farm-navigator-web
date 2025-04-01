
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
