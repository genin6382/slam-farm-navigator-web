
import React, { useEffect, useState } from 'react';
import { FleetStatus } from '@/types/api';

interface FarmMapProps {
  fleetStatus: FleetStatus | null;
}

const FarmMap: React.FC<FarmMapProps> = ({ fleetStatus }) => {
  const [gridSize, setGridSize] = useState({ width: 21, height: 21 });
  const [grid, setGrid] = useState<JSX.Element[]>([]);

  // Create grid cells
  useEffect(() => {
    const cells = [];

    for (let y = -10; y <= 10; y++) {
      for (let x = -10; x <= 10; x++) {
        // Determine if cell contains a rover
        let hasRover = false;
        let roverId = '';
        let task = null;
        let status = '';

        if (fleetStatus) {
          Object.entries(fleetStatus).forEach(([id, data]) => {
            const [roverX, roverY] = data.coordinates;
            if (roverX === x && roverY === y) {
              hasRover = true;
              roverId = id;
              task = data.task;
              status = data.status;
            }
          });
        }

        const color = roverId ? `bg-rover-${roverId.split('-')[1]}` : '';
        
        // Get task color
        let taskColor = '';
        if (task) {
          switch(task) {
            case 'Soil Analysis':
              taskColor = 'bg-task-soil-analysis';
              break;
            case 'Irrigation':
              taskColor = 'bg-task-irrigation';
              break;
            case 'Weeding':
              taskColor = 'bg-task-weeding';
              break;
            case 'Crop Monitoring':
              taskColor = 'bg-task-crop-monitoring';
              break;
          }
        }

        const cellKey = `cell-${x}-${y}`;
        cells.push(
          <div key={cellKey} className="farm-grid-cell">
            {hasRover && (
              <div 
                className={`grid-rover ${color} ${status === 'moving' ? 'animate-move' : ''}`}
              >
                {roverId.split('-')[1]}
                {task && <div className={`task-badge ${taskColor}`}></div>}
              </div>
            )}
          </div>
        );
      }
    }

    setGrid(cells);
  }, [fleetStatus]);

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h2 className="text-xl font-semibold mb-3">Farm Map</h2>
      <div className="farm-grid">
        {grid}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-rover-1 rounded-full mr-1"></div>
          <span>Rover-1</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-rover-2 rounded-full mr-1"></div>
          <span>Rover-2</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-rover-3 rounded-full mr-1"></div>
          <span>Rover-3</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-rover-4 rounded-full mr-1"></div>
          <span>Rover-4</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-rover-5 rounded-full mr-1"></div>
          <span>Rover-5</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-task-soil-analysis rounded-full mr-1"></div>
          <span>Soil Analysis</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-task-irrigation rounded-full mr-1"></div>
          <span>Irrigation</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-task-weeding rounded-full mr-1"></div>
          <span>Weeding</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-task-crop-monitoring rounded-full mr-1"></div>
          <span>Crop Monitoring</span>
        </div>
      </div>
    </div>
  );
};

export default FarmMap;
