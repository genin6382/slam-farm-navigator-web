
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Thermometer, Droplet, Activity, Leaf } from 'lucide-react';

interface DashboardHeaderProps {
  sessionId: string;
  onRefresh: () => void;
  isLoading: boolean;
  farmStats?: {
    avgTemp: number;
    avgMoisture: number;
    avgpH: number;
    avgBattery: number;
  };
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  sessionId,
  onRefresh,
  isLoading,
  farmStats
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">SLAM Farm Navigator</h1>
          <p className="text-muted-foreground text-sm">
            Session ID: <span className="font-mono">{sessionId}</span>
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-4">
          {farmStats && (
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/80 p-2 rounded-lg shadow-sm flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{farmStats.avgTemp.toFixed(1)}°C</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg shadow-sm flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{farmStats.avgMoisture.toFixed(1)}%</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg shadow-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">pH {farmStats.avgpH.toFixed(1)}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg shadow-sm flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{farmStats.avgBattery.toFixed(0)}%</span>
              </div>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="ml-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
