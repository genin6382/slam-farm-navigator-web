
import React, { useState, useEffect, useCallback } from 'react';
import SessionInitializer from '@/components/SessionInitializer';
import DashboardHeader from '@/components/DashboardHeader';
import FarmMap from '@/components/FarmMap';
import RoverCard from '@/components/RoverCard';
import { 
  getFleetStatus, 
  getSensorData,
  moveRover,
  resetRover,
  assignTask
} from '@/api/farmApi';
import { FleetStatus, RoverSensorData, Direction, Task } from '@/types/api';
import { toast } from 'sonner';

const Index = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fleetStatus, setFleetStatus] = useState<FleetStatus | null>(null);
  const [sensorData, setSensorData] = useState<RoverSensorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [farmStats, setFarmStats] = useState({
    avgTemp: 0,
    avgMoisture: 0,
    avgpH: 0,
    avgBattery: 0
  });
  
  // Helper to calculate farm-wide stats from sensor data
  const calculateFarmStats = useCallback((sensorData: RoverSensorData) => {
    const rovers = Object.values(sensorData);
    if (rovers.length === 0) return;
    
    const temp = rovers.reduce((sum, rover) => sum + rover.temperature, 0) / rovers.length;
    const moisture = rovers.reduce((sum, rover) => sum + rover.soil_moisture, 0) / rovers.length;
    const pH = rovers.reduce((sum, rover) => sum + rover.soil_pH, 0) / rovers.length;
    const battery = rovers.reduce((sum, rover) => sum + rover.battery_level, 0) / rovers.length;
    
    setFarmStats({
      avgTemp: temp,
      avgMoisture: moisture,
      avgpH: pH,
      avgBattery: battery
    });
  }, []);

  // Fetch data on initial load and refresh
  const fetchData = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const [statusData, sensorsData] = await Promise.all([
        getFleetStatus(sessionId),
        getSensorData(sessionId)
      ]);
      
      setFleetStatus(statusData);
      setSensorData(sensorsData);
      calculateFarmStats(sensorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, calculateFarmStats]);

  // Load data when session starts or on manual refresh
  useEffect(() => {
    if (sessionId) {
      fetchData();
      
      // Set up polling for regular updates
      const intervalId = setInterval(() => {
        fetchData();
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [sessionId, fetchData]);

  // Handle rover movement
  const handleMoveRover = async (rover: string, direction: Direction) => {
    if (!sessionId) return;
    
    try {
      await moveRover(sessionId, rover, direction);
      fetchData(); // Refresh data after movement
    } catch (error) {
      console.error('Error moving rover:', error);
    }
  };

  // Handle rover reset
  const handleResetRover = async (rover: string) => {
    if (!sessionId) return;
    
    try {
      await resetRover(sessionId, rover);
      fetchData(); // Refresh data after reset
    } catch (error) {
      console.error('Error resetting rover:', error);
    }
  };

  // Handle task assignment
  const handleAssignTask = async (rover: string, task: Task) => {
    if (!sessionId) return;
    
    try {
      await assignTask(sessionId, rover, task);
      fetchData(); // Refresh data after task assignment
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  // If no session, show initializer
  if (!sessionId) {
    return <SessionInitializer onSessionStart={setSessionId} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader 
          sessionId={sessionId}
          onRefresh={fetchData}
          isLoading={isLoading}
          farmStats={farmStats}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FarmMap fleetStatus={fleetStatus} />
          </div>
          
          <div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-md p-4 h-full">
              <h2 className="text-xl font-semibold mb-3">System Status</h2>
              
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Connection Status:</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Active Rovers:</span>
                  <span className="font-semibold">{fleetStatus ? Object.keys(fleetStatus).length : 0}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Current Tasks:</span>
                  <span className="font-semibold">
                    {fleetStatus 
                      ? Object.values(fleetStatus).filter(rover => rover.task !== null).length 
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Moving Rovers:</span>
                  <span className="font-semibold">
                    {fleetStatus 
                      ? Object.values(fleetStatus).filter(rover => rover.status === 'moving').length 
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rovers Needing Charge:</span>
                  <span className="font-semibold">
                    {fleetStatus 
                      ? Object.values(fleetStatus).filter(rover => rover.battery < 30).length 
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Rover Fleet</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {fleetStatus && Object.entries(fleetStatus).map(([roverId, roverStatus]) => (
            <RoverCard
              key={roverId}
              id={roverId}
              roverStatus={roverStatus}
              sensorData={sensorData ? sensorData[roverId] : undefined}
              onMoveRover={handleMoveRover}
              onResetRover={handleResetRover}
              onAssignTask={handleAssignTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
