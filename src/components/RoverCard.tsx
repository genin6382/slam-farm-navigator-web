
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Pause, Zap, Thermometer, Droplet, Activity, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { RoverStatus, SensorData, Direction, Task, SOIL_THRESHOLDS } from '@/types/api';
import { determineBestTask, isWithinBoundary } from '@/utils/slamNavigator';

interface RoverCardProps {
  id: string;
  roverStatus: RoverStatus;
  sensorData?: SensorData;
  onMoveRover: (rover: string, direction: Direction) => Promise<void>;
  onResetRover: (rover: string) => Promise<void>;
  onAssignTask: (rover: string, task: Task) => Promise<void>;
}

const RoverCard: React.FC<RoverCardProps> = ({
  id,
  roverStatus,
  sensorData,
  onMoveRover,
  onResetRover,
  onAssignTask
}) => {
  const [activeTab, setActiveTab] = useState('status');
  const [recommendedTask, setRecommendedTask] = useState<Task | null>(null);
  const [soilStatusMessage, setSoilStatusMessage] = useState("");
  const roverNumber = id.split('-')[1];
  const batteryPercentage = roverStatus.battery;
  
  let batteryColor = 'bg-green-500';
  if (batteryPercentage < 30) {
    batteryColor = 'bg-red-500';
  } else if (batteryPercentage < 70) {
    batteryColor = 'bg-yellow-500';
  }

  // Determine recommended task based on sensor data
  useEffect(() => {
    if (sensorData) {
      const task = determineBestTask(sensorData);
      setRecommendedTask(task);
      
      // Generate soil status message
      let message = "";
      
      if (sensorData.soil_moisture < SOIL_THRESHOLDS.MOISTURE.LOW) {
        message = "Soil is too dry - needs irrigation";
      } else if (sensorData.soil_moisture > SOIL_THRESHOLDS.MOISTURE.HIGH) {
        message = "Soil is waterlogged - avoid irrigation";
      }
      
      if (sensorData.soil_pH < SOIL_THRESHOLDS.PH.LOW) {
        message += message ? ", pH is acidic" : "pH is acidic";
      } else if (sensorData.soil_pH > SOIL_THRESHOLDS.PH.HIGH) {
        message += message ? ", pH is alkaline" : "pH is alkaline";
      }
      
      if (sensorData.temperature < SOIL_THRESHOLDS.TEMPERATURE.LOW) {
        message += message ? ", cold stress" : "Cold stress condition";
      } else if (sensorData.temperature > SOIL_THRESHOLDS.TEMPERATURE.HIGH) {
        message += message ? ", heat stress" : "Heat stress condition";
      }
      
      setSoilStatusMessage(message || "Soil conditions optimal");
    }
  }, [sensorData]);

  const getStatusBadge = () => {
    switch(roverStatus.status) {
      case 'idle':
        return <Badge variant="outline" className="bg-blue-100">Idle</Badge>;
      case 'moving':
        return <Badge variant="outline" className="bg-amber-100">Moving</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100">{roverStatus.status}</Badge>;
    }
  };

  const handleMove = async (direction: Direction) => {
    // Calculate new coordinates based on direction
    const [currentX, currentY] = roverStatus.coordinates;
    let newX = currentX;
    let newY = currentY;
    
    switch(direction) {
      case 'forward':
        newY -= 1;
        break;
      case 'backward':
        newY += 1;
        break;
      case 'left':
        newX -= 1;
        break;
      case 'right':
        newX += 1;
        break;
    }
    
    // Check if movement is within boundaries
    if (!isWithinBoundary(newX, newY)) {
      alert(`Cannot move ${direction}. The rover would exit the farm boundary.`);
      return;
    }
    
    await onMoveRover(id, direction);
  };

  const handleReset = async () => {
    await onResetRover(id);
  };

  const handleTaskAssign = async (task: Task) => {
    await onAssignTask(id, task);
  };

  // Automatically assign recommended task
  const handleAutoAssignTask = async () => {
    if (recommendedTask && roverStatus.status !== 'moving') {
      await onAssignTask(id, recommendedTask);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 rover-item border-l-4 border-rover-${roverNumber}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">
            {id}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Battery Level</p>
              <div className="battery-level">
                <div 
                  className={`battery-fill ${batteryColor}`} 
                  style={{ width: `${batteryPercentage}%` }}
                ></div>
              </div>
              <p className="text-right text-xs mt-1">{batteryPercentage}%</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <p className="font-medium">X: {roverStatus.coordinates[0]}, Y: {roverStatus.coordinates[1]}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Task</p>
              <p className="font-medium">{roverStatus.task || 'None'}</p>
            </div>
            
            {recommendedTask && roverStatus.task !== recommendedTask && roverStatus.status !== 'moving' && (
              <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-700">Recommended task: <strong>{recommendedTask}</strong></p>
                    <p className="text-xs text-amber-600 mt-1">{soilStatusMessage}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2 w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={handleAutoAssignTask}
                    >
                      Auto-Assign Task
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {roverStatus.status === 'moving' && (
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={handleReset}
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop Rover
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="controls">
            <div className="space-y-4">
              <div className="rover-controls">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleMove('forward')}
                  disabled={roverStatus.status === 'moving'}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleMove('left')}
                  disabled={roverStatus.status === 'moving'}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleMove('right')}
                  disabled={roverStatus.status === 'moving'}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleMove('backward')}
                  disabled={roverStatus.status === 'moving'}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Assign Task</p>
                <Select 
                  onValueChange={(value) => handleTaskAssign(value as Task)}
                  disabled={roverStatus.status === 'moving'}
                  defaultValue={roverStatus.task || undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Soil Analysis">Soil Analysis</SelectItem>
                    <SelectItem value="Irrigation">Irrigation</SelectItem>
                    <SelectItem value="Weeding">Weeding</SelectItem>
                    <SelectItem value="Crop Monitoring">Crop Monitoring</SelectItem>
                  </SelectContent>
                </Select>
                
                {recommendedTask && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: <span className="font-medium text-amber-600">{recommendedTask}</span>
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sensors">
            {sensorData ? (
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-3 rounded-lg ${sensorData.soil_moisture < SOIL_THRESHOLDS.MOISTURE.LOW ? 'bg-red-50' : (sensorData.soil_moisture > SOIL_THRESHOLDS.MOISTURE.HIGH ? 'bg-yellow-50' : 'bg-blue-50')}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Droplet className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Soil Moisture</span>
                  </div>
                  <p className="sensor-value">{sensorData.soil_moisture.toFixed(1)}%</p>
                  <div className="mt-1 h-1 bg-gray-200 rounded-full">
                    <div 
                      className={`h-1 rounded-full ${sensorData.soil_moisture < SOIL_THRESHOLDS.MOISTURE.LOW ? 'bg-red-500' : (sensorData.soil_moisture > SOIL_THRESHOLDS.MOISTURE.HIGH ? 'bg-yellow-500' : 'bg-blue-500')}`}
                      style={{ width: `${Math.min(100, sensorData.soil_moisture * 2)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1">
                    {sensorData.soil_moisture < SOIL_THRESHOLDS.MOISTURE.LOW ? 'Too dry' : (sensorData.soil_moisture > SOIL_THRESHOLDS.MOISTURE.HIGH ? 'Too wet' : 'Optimal')}
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg ${sensorData.soil_pH < SOIL_THRESHOLDS.PH.LOW ? 'bg-orange-50' : (sensorData.soil_pH > SOIL_THRESHOLDS.PH.HIGH ? 'bg-purple-50' : 'bg-green-50')}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Soil pH</span>
                  </div>
                  <p className="sensor-value">{sensorData.soil_pH.toFixed(1)}</p>
                  <div className="mt-1 h-1 bg-gray-200 rounded-full">
                    <div 
                      className={`h-1 rounded-full ${sensorData.soil_pH < SOIL_THRESHOLDS.PH.LOW ? 'bg-orange-500' : (sensorData.soil_pH > SOIL_THRESHOLDS.PH.HIGH ? 'bg-purple-500' : 'bg-green-500')}`}
                      style={{ width: `${(sensorData.soil_pH / 14) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1">
                    {sensorData.soil_pH < SOIL_THRESHOLDS.PH.LOW ? 'Acidic' : (sensorData.soil_pH > SOIL_THRESHOLDS.PH.HIGH ? 'Alkaline' : 'Optimal')}
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg ${sensorData.temperature < SOIL_THRESHOLDS.TEMPERATURE.LOW ? 'bg-blue-50' : (sensorData.temperature > SOIL_THRESHOLDS.TEMPERATURE.HIGH ? 'bg-red-50' : 'bg-orange-50')}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Temperature</span>
                  </div>
                  <p className="sensor-value">{sensorData.temperature.toFixed(1)}°C</p>
                  <div className="mt-1 h-1 bg-gray-200 rounded-full">
                    <div 
                      className={`h-1 rounded-full ${sensorData.temperature < SOIL_THRESHOLDS.TEMPERATURE.LOW ? 'bg-blue-500' : (sensorData.temperature > SOIL_THRESHOLDS.TEMPERATURE.HIGH ? 'bg-red-500' : 'bg-orange-500')}`}
                      style={{ width: `${(sensorData.temperature / 50) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1">
                    {sensorData.temperature < SOIL_THRESHOLDS.TEMPERATURE.LOW ? 'Cold stress' : (sensorData.temperature > SOIL_THRESHOLDS.TEMPERATURE.HIGH ? 'Heat stress' : 'Optimal')}
                  </p>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Battery</span>
                  </div>
                  <p className="sensor-value">{sensorData.battery_level.toFixed(1)}%</p>
                  <div className="mt-1 h-1 bg-gray-200 rounded-full">
                    <div 
                      className={`h-1 rounded-full ${sensorData.battery_level < 30 ? 'bg-red-500' : (sensorData.battery_level < 70 ? 'bg-yellow-500' : 'bg-green-500')}`}
                      style={{ width: `${sensorData.battery_level}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="col-span-2 text-xs text-gray-500 mt-2">
                  Last updated: {new Date(sensorData.timestamp * 1000).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Sensor data unavailable
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RoverCard;
