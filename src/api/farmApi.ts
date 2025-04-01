
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

export const startSession = async (): Promise<string> => {
  try {
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
    toast.error('Failed to start session. Please try again.');
    throw error;
  }
};

export const getFleetStatus = async (sessionId: string): Promise<FleetStatus> => {
  try {
    const response = await fetch(`${API_PROXY}/fleet/status?session_id=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get fleet status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting fleet status:', error);
    toast.error('Failed to get fleet status');
    throw error;
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

export const getSensorData = async (sessionId: string): Promise<RoverSensorData> => {
  try {
    const response = await fetch(`${API_PROXY}/rover/sensor-data?session_id=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get sensor data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting sensor data:', error);
    toast.error('Failed to get sensor data');
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
    toast.error(`Failed to move rover: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export const resetRover = async (
  sessionId: string,
  rover: string
): Promise<ResetResponse> => {
  try {
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
    toast.error(`Failed to reset rover: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export const assignTask = async (
  sessionId: string,
  rover: string,
  task: Task
): Promise<TaskResponse> => {
  try {
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
    toast.error(`Failed to assign task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};
