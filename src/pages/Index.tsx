
import React, { useState, useEffect, useCallback } from 'react';
import SessionInitializer from '@/components/SessionInitializer';
import DashboardHeader from '@/components/DashboardHeader';
import FarmMap from '@/components/FarmMap';
import RoverCard from '@/components/RoverCard';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  getFleetStatus, 
  getSensorData,
  moveRover,
  resetRover,
  assignTask
} from '@/api/farmApi';
import { FleetStatus, RoverSensorData, Direction, Task } from '@/types/api';
import { toast } from 'sonner';
import { markNodeAsVisited, getVisitationStats } from '@/utils/slamNavigator';
import { detectSensorAnomalies } from '@/utils/sensorManager';
import { 
  createCoordinationPlan, 
  assignRoversToTasks, 
  generateCoordinationTask,
  updateTaskCompletionStatus
} from '@/utils/fleetCoordinator';

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
  const [slamStats, setSlamStats] = useState({
    totalVisitedNodes: 0,
    currentlyLockedNodes: 0,
    taskCounts: {
      "Soil Analysis": 0,
      "Irrigation": 0,
      "Weeding": 0,
      "Crop Monitoring": 0
    }
  });
  const [sensorFailures, setSensorFailures] = useState<{
    roverId: string;
    sensorType: string;
    severity: string;
  }[]>([]);
  const [coordinationPlan, setCoordinationPlan] = useState(createCoordinationPlan());
  
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

  // Update SLAM stats
  const updateSlamStats = useCallback(() => {
    const stats = getVisitationStats();
    setSlamStats(stats);
  }, []);

  // Mark visited nodes when rovers' positions change
  useEffect(() => {
    if (fleetStatus) {
      Object.entries(fleetStatus).forEach(([roverId, status]) => {
        markNodeAsVisited(status.coordinates, status.task as Task | null);
      });
      updateSlamStats();
    }
  }, [fleetStatus, updateSlamStats]);

  // Detect sensor failures
  useEffect(() => {
    if (sensorData && Object.keys(sensorData).length > 1) { // Need at least 2 rovers to compare
      const failures: {
        roverId: string;
        sensorType: string;
        severity: string;
      }[] = [];
      
      // Check each rover's sensors for anomalies
      Object.entries(sensorData).forEach(([roverId, data]) => {
        const sensorStatus = detectSensorAnomalies(roverId, data, sensorData);
        
        // Check moisture sensor
        if (!sensorStatus.moisture.isWorking) {
          failures.push({
            roverId,
            sensorType: 'Moisture',
            severity: sensorStatus.moisture.accuracyLevel < 0.5 ? 'High' : 'Medium'
          });
        }
        
        // Check pH sensor
        if (!sensorStatus.ph.isWorking) {
          failures.push({
            roverId,
            sensorType: 'pH',
            severity: sensorStatus.ph.accuracyLevel < 0.5 ? 'High' : 'Medium'
          });
        }
        
        // Check temperature sensor
        if (!sensorStatus.temperature.isWorking) {
          failures.push({
            roverId,
            sensorType: 'Temperature',
            severity: sensorStatus.temperature.accuracyLevel < 0.5 ? 'High' : 'Medium'
          });
        }
      });
      
      setSensorFailures(failures);
    }
  }, [sensorData]);

  // Update fleet coordination plan
  useEffect(() => {
    if (fleetStatus && sensorData) {
      // Update existing tasks
      let updatedPlan = updateTaskCompletionStatus(coordinationPlan);
      
      // Generate new tasks if needed (max 5 active tasks)
      if (updatedPlan.activeTasks < 3) {
        // Try to create tasks for each type
        const tasks = ["Soil Analysis", "Irrigation", "Weeding", "Crop Monitoring"] as Task[];
        
        for (const taskType of tasks) {
          const newTask = generateCoordinationTask(sensorData, taskType);
          if (newTask) {
            updatedPlan = {
              ...updatedPlan,
              tasks: [...updatedPlan.tasks, newTask]
            };
          }
        }
      }
      
      // Assign rovers to tasks
      updatedPlan = assignRoversToTasks(fleetStatus, updatedPlan);
      
      setCoordinationPlan(updatedPlan);
    }
  }, [fleetStatus, sensorData, coordinationPlan]);

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

  // Handle rover movement with battery reduction
  const handleMoveRover = async (rover: string, direction: Direction) => {
    if (!sessionId || !fleetStatus) return;
    
    try {
      await moveRover(sessionId, rover, direction);
      
      // Update local state with reduced battery
      // Note: The actual battery state will be updated on the next fetch,
      // but we update locally for immediate UI feedback
      const updatedFleetStatus = { ...fleetStatus };
      if (updatedFleetStatus[rover]) {
        // Reduce battery by movement consumption
        updatedFleetStatus[rover].battery -= 1; // Using hardcoded value, typically would use BATTERY_CONSUMPTION.MOVE
        setFleetStatus(updatedFleetStatus);
      }
      
      await fetchData(); // Refresh data after movement
      toast.success(`${rover} is moving ${direction}`);
    } catch (error) {
      console.error('Error moving rover:', error);
      toast.error('Failed to move rover');
    }
  };

  // Handle rover reset
  const handleResetRover = async (rover: string) => {
    if (!sessionId) return;
    
    try {
      await resetRover(sessionId, rover);
      await fetchData(); // Refresh data after reset
      toast.success(`${rover} has been reset`);
    } catch (error) {
      console.error('Error resetting rover:', error);
      toast.error('Failed to reset rover');
    }
  };

  // Handle task assignment with battery reduction
  const handleAssignTask = async (rover: string, task: Task) => {
    if (!sessionId || !fleetStatus) return;
    
    try {
      await assignTask(sessionId, rover, task);
      
      // Update local state with reduced battery
      const updatedFleetStatus = { ...fleetStatus };
      if (updatedFleetStatus[rover]) {
        // Reduce battery based on task type
        let batteryReduction;
        switch(task) {
          case "Soil Analysis": batteryReduction = 2; break;
          case "Irrigation": batteryReduction = 3; break;
          case "Weeding": batteryReduction = 4; break;
          case "Crop Monitoring": batteryReduction = 1; break;
          default: batteryReduction = 0;
        }
        
        updatedFleetStatus[rover].battery -= batteryReduction;
        setFleetStatus(updatedFleetStatus);
      }
      
      await fetchData(); // Refresh data after task assignment
      toast.success(`Assigned ${task} to ${rover}`);
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
    }
  };

  // If no session, show initializer
  if (!sessionId) {
    return <SessionInitializer onSessionStart={setSessionId} />;
  }

  // Calculate current moving rovers count correctly
  const movingRoversCount = fleetStatus 
    ? Object.values(fleetStatus).filter(rover => rover.status === 'moving').length 
    : 0;

  // Calculate rovers with active tasks
  const activeTasksCount = fleetStatus
    ? Object.values(fleetStatus).filter(rover => rover.task !== null).length
    : 0;

  // Calculate rovers needing charge
  const lowBatteryRoversCount = fleetStatus
    ? Object.values(fleetStatus).filter(rover => rover.battery < 30).length
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader 
          sessionId={sessionId}
          onRefresh={fetchData}
          isLoading={isLoading}
          farmStats={farmStats}
        />
        
        {sensorFailures.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Sensor Failures Detected</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2">
                {sensorFailures.map((failure, index) => (
                  <li key={index} className="mb-1">
                    {failure.roverId}: {failure.sensorType} sensor has {failure.severity.toLowerCase()} deviation 
                    from expected values. Using corrected readings from nearby rovers.
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
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
                  <span className="font-semibold">{activeTasksCount}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Moving Rovers:</span>
                  <span className="font-semibold">{movingRoversCount}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Rovers Needing Charge:</span>
                  <span className="font-semibold">{lowBatteryRoversCount}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-dashed">
                  <span className="font-medium">SLAM Navigation Stats:</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Visited Areas:</span>
                  <span className="font-semibold">{slamStats.totalVisitedNodes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Recently Visited (Locked):</span>
                  <span className="font-semibold">{slamStats.currentlyLockedNodes}</span>
                </div>
                <div className="pt-2 text-xs">
                  <div className="font-medium mb-1">Completed Tasks:</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <div className="flex justify-between">
                      <span>Soil Analysis:</span>
                      <span>{slamStats.taskCounts["Soil Analysis"]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Irrigation:</span>
                      <span>{slamStats.taskCounts["Irrigation"]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weeding:</span>
                      <span>{slamStats.taskCounts["Weeding"]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crop Monitoring:</span>
                      <span>{slamStats.taskCounts["Crop Monitoring"]}</span>
                    </div>
                  </div>
                </div>
                
                {/* Fleet Coordination Section */}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed">
                  <span className="font-medium">Fleet Coordination:</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Coordination Tasks:</span>
                  <span className="font-semibold">{coordinationPlan.activeTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed Coordination Tasks:</span>
                  <span className="font-semibold">{coordinationPlan.completedTasks}</span>
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
