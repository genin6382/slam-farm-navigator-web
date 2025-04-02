import { 
  SessionData, 
  FleetStatus, 
  RoverSensorData, 
  RoverBatteryData, 
  RoverCoordinateData,
  Direction,
  Task,
  MoveResponse,
  ResetResponse,
  TaskResponse
} from '@/types/api';
import { toast } from 'sonner';

const API_BASE_URL = 'https://fleetbots-production.up.railway.app/api';
const API_PROXY = 'http://localhost:5000/api';

// Enable mock mode if we can't connect to the real API
let useMockData = false;

// Mock data generators for offline development/testing
const generateMockFleetStatus = (): FleetStatus => {
  const fleet: FleetStatus = {};

  for (let i = 1; i <= 5; i++) {
    fleet[`rover-${i}`] = {
      status: Math.random() > 0.7 ? 'moving' : 'idle',
      battery: Math.floor(Math.random() * 70) + 30,
      coordinates: [
        Math.floor(Math.random() * 20) - 10,
        Math.floor(Math.random() * 20) - 10
      ],
      task: Math.random() > 0.5 ? null : ['Soil Analysis', 'Irrigation', 'Weeding', 'Crop Monitoring'][
        Math.floor(Math.random() * 4)
      ] as Task | null
    };
  }

  return fleet;
};

const generateMockSensorData = (fleetStatus: FleetStatus): RoverSensorData => {
  const sensorData: RoverSensorData = {};

  Object.entries(fleetStatus).forEach(([roverId, status]) => {
    sensorData[roverId] = {
      timestamp: Date.now(),
      rover_id: roverId,
      soil_moisture: Math.floor(Math.random() * 50) + 10,
      soil_pH: 5 + Math.random() * 3,
      temperature: 15 + Math.random() * 25,
      battery_level: status.battery
    };
  });

  return sensorData;
};

export const startSession = async (): Promise<string> => {
  try {
    // Try to connect to the real API
    const response = await fetch(`${API_PROXY}/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to start session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error starting session:', error);
    
    // If we can't connect to the real API, use mock data
    useMockData = true;
    toast.info('Using mock data for demonstration. Real API connection failed.');
    
    // Generate a fake session ID
    return `mock-session-${Date.now()}`;
  }
};

export const getFleetStatus = async (sessionId: string): Promise<FleetStatus> => {
  try {
    if (useMockData) {
      return generateMockFleetStatus();
    }
    
    const response = await fetch(`${API_PROXY}/fleet/status?session_id=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get fleet status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting fleet status:', error);
    
    if (!useMockData) {
      toast.error('Failed to get fleet status');
    }
    
    // If real API fails but we weren't in mock mode before, enable it
    if (!useMockData) {
      useMockData = true;
      toast.info('Switched to mock data for demonstration');
    }
    
    return generateMockFleetStatus();
  }
};

export const getSensorData = async (sessionId: string): Promise<RoverSensorData> => {
  try {
    if (useMockData) {
      // We need fleet data to generate realistic mock sensor data
      const fleetStatus = await getFleetStatus(sessionId);
      return generateMockSensorData(fleetStatus);
    }
    
    const response = await fetch(`${API_PROXY}/rover/sensor-data?session_id=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get sensor data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting sensor data:', error);
    
    if (!useMockData) {
      toast.error('Failed to get sensor data');
    }
    
    // If real API fails but we weren't in mock mode before, enable it
    if (!useMockData) {
      useMockData = true;
      toast.info('Switched to mock data for demonstration');
    }
    
    // We need fleet data to generate realistic mock sensor data
    const fleetStatus = await getFleetStatus(sessionId);
    return generateMockSensorData(fleetStatus);
  }
};

export const getRoverStatus = async (sessionId: string): Promise<FleetStatus> => {
  try {
    const response = await fetch(`${API_PROXY}/rover/status?session_id=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get rover status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting rover status:', error);
    toast.error('Failed to get rover status');
    throw error;
  }
};

export const getBatteryLevels = async (sessionId: string): Promise<RoverBatteryData> => {
  try {
    const response = await fetch(`${API_PROXY}/rover/battery?session_id=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get battery levels');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting battery levels:', error);
    toast.error('Failed to get battery levels');
    throw error;
  }
};

export const getRoverCoordinates = async (sessionId: string): Promise<RoverCoordinateData> => {
  try {
    const response = await fetch(`${API_PROXY}/rover/coordinates?session_id=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get rover coordinates');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting rover coordinates:', error);
    toast.error('Failed to get rover coordinates');
    throw error;
  }
};

export const moveRover = async (
  sessionId: string,
  rover: string,
  direction: Direction
): Promise<MoveResponse> => {
  try {
    if (useMockData) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: `${rover} is moving ${direction}` };
    }
    
    const response = await fetch(`${API_PROXY}/rover/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        rover,
        direction,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to move ${rover}`);
    }
    
    const result = await response.json();
    toast.success(result.message);
    return result;
  } catch (error) {
    console.error('Error moving rover:', error);
    
    if (!useMockData) {
      toast.error(`Failed to move rover: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // If real API fails but we weren't in mock mode before, enable it
    if (!useMockData) {
      useMockData = true;
      toast.info('Switched to mock data for demonstration');
    }
    
    return { message: `${rover} is moving ${direction} (mock)` };
  }
};

export const resetRover = async (
  sessionId: string,
  rover: string
): Promise<ResetResponse> => {
  try {
    if (useMockData) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: `${rover} has been reset` };
    }
    
    const response = await fetch(`${API_PROXY}/rover/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        rover,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reset ${rover}`);
    }
    
    const result = await response.json();
    toast.success(result.message);
    return result;
  } catch (error) {
    console.error('Error resetting rover:', error);
    
    if (!useMockData) {
      toast.error(`Failed to reset rover: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // If real API fails but we weren't in mock mode before, enable it
    if (!useMockData) {
      useMockData = true;
      toast.info('Switched to mock data for demonstration');
    }
    
    return { message: `${rover} has been reset (mock)` };
  }
};

export const assignTask = async (
  sessionId: string,
  rover: string,
  task: Task
): Promise<TaskResponse> => {
  try {
    if (useMockData) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: `Assigned ${task} to ${rover}` };
    }
    
    const response = await fetch(`${API_PROXY}/rover/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        rover,
        task,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to assign task to ${rover}`);
    }
    
    const result = await response.json();
    toast.success(result.message);
    return result;
  } catch (error) {
    console.error('Error assigning task:', error);
    
    if (!useMockData) {
      toast.error(`Failed to assign task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // If real API fails but we weren't in mock mode before, enable it
    if (!useMockData) {
      useMockData = true;
      toast.info('Switched to mock data for demonstration');
    }
    
    return { message: `Assigned ${task} to ${rover} (mock)` };
  }
};
