
import { SensorData, RoverSensorStatus, SensorStatus } from '@/types/api';

// Initial sensor status for a new rover
export const createInitialSensorStatus = (): RoverSensorStatus => {
  return {
    moisture: { isWorking: true, accuracyLevel: 1, lastFailure: null },
    ph: { isWorking: true, accuracyLevel: 1, lastFailure: null },
    temperature: { isWorking: true, accuracyLevel: 1, lastFailure: null }
  };
};

// Detect sensor anomalies by comparing with nearby rover readings
export const detectSensorAnomalies = (
  roverId: string,
  roverData: SensorData,
  allRoversData: { [key: string]: SensorData },
  threshold: number = 25
): RoverSensorStatus => {
  // Initialize with default good status
  const sensorStatus = createInitialSensorStatus();
  const now = Date.now();
  
  // Get nearby rovers (could be enhanced with actual distance calculation)
  const nearbyRovers = Object.keys(allRoversData)
    .filter(id => id !== roverId)
    .slice(0, 2); // Just use a couple rovers for comparison
    
  if (nearbyRovers.length === 0) {
    return sensorStatus; // Not enough rovers to compare
  }
  
  // Calculate average values from nearby rovers
  const avgMoisture = nearbyRovers.reduce((sum, id) => sum + allRoversData[id].soil_moisture, 0) / nearbyRovers.length;
  const avgPh = nearbyRovers.reduce((sum, id) => sum + allRoversData[id].soil_pH, 0) / nearbyRovers.length;
  const avgTemp = nearbyRovers.reduce((sum, id) => sum + allRoversData[id].temperature, 0) / nearbyRovers.length;
  
  // Check for large deviations (possible sensor failures)
  const moistureDiff = Math.abs(roverData.soil_moisture - avgMoisture);
  const phDiff = Math.abs(roverData.soil_pH - avgPh);
  const tempDiff = Math.abs(roverData.temperature - avgTemp);
  
  // Update sensor status based on deviations
  if (moistureDiff > threshold) {
    sensorStatus.moisture = { 
      isWorking: false, 
      accuracyLevel: 1 - (moistureDiff / 100), 
      lastFailure: now 
    };
  }
  
  if (phDiff > threshold / 10) { // pH values have smaller range
    sensorStatus.ph = {
      isWorking: false,
      accuracyLevel: 1 - (phDiff / 14), // pH scale is 0-14
      lastFailure: now
    };
  }
  
  if (tempDiff > threshold / 2) {
    sensorStatus.temperature = {
      isWorking: false,
      accuracyLevel: 1 - (tempDiff / 50), // assuming temp range -10 to 40
      lastFailure: now
    };
  }
  
  return sensorStatus;
};

// Get corrected sensor reading using nearby rovers' data
export const getCorrectedSensorReading = (
  sensorValue: number,
  sensorType: 'moisture' | 'ph' | 'temperature',
  sensorStatus: SensorStatus,
  allRoversData: { [key: string]: SensorData }
): number => {
  if (sensorStatus.isWorking && sensorStatus.accuracyLevel > 0.8) {
    return sensorValue; // Sensor is working well, use actual reading
  }
  
  // Get average from other rovers to correct the reading
  const allValues = Object.values(allRoversData);
  let avgValue: number;
  
  switch (sensorType) {
    case 'moisture':
      avgValue = allValues.reduce((sum, data) => sum + data.soil_moisture, 0) / allValues.length;
      break;
    case 'ph':
      avgValue = allValues.reduce((sum, data) => sum + data.soil_pH, 0) / allValues.length;
      break;
    case 'temperature':
      avgValue = allValues.reduce((sum, data) => sum + data.temperature, 0) / allValues.length;
      break;
  }
  
  // Blend the actual reading with the average based on accuracy level
  return (sensorValue * sensorStatus.accuracyLevel) + (avgValue * (1 - sensorStatus.accuracyLevel));
};
