
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Pause, Zap, Thermometer, Droplet, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { RoverStatus, SensorData, Direction, Task } from '@/types/api';

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
  const roverNumber = id.split('-')[1];
  const batteryPercentage = roverStatus.battery;
  
  let batteryColor = 'bg-green-500';
  if (batteryPercentage < 30) {
    batteryColor = 'bg-red-500';
  } else if (batteryPercentage < 70) {
    batteryColor = 'bg-yellow-500';
  }

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
    await onMoveRover(id, direction);
  };

  const handleReset = async () => {
    await onResetRover(id);
  };

  const handleTaskAssign = async (task: Task) => {
    await onAssignTask(id, task);
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
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sensors">
            {sensorData ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplet className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Soil Moisture</span>
                  </div>
                  <p className="sensor-value">{sensorData.soil_moisture.toFixed(1)}%</p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Soil pH</span>
                  </div>
                  <p className="sensor-value">{sensorData.soil_pH.toFixed(1)}</p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Temperature</span>
                  </div>
                  <p className="sensor-value">{sensorData.temperature.toFixed(1)}°C</p>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Battery</span>
                  </div>
                  <p className="sensor-value">{sensorData.battery_level.toFixed(1)}%</p>
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
