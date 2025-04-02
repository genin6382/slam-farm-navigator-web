
import React, { useEffect, useState } from 'react';
import { FleetStatus, FARM_BOUNDARY } from '@/types/api';
import { getLockedNodes } from '@/utils/slamNavigator';

interface FarmMapProps {
  fleetStatus: FleetStatus | null;
}

const FarmMap: React.FC<FarmMapProps> = ({ fleetStatus }) => {
  const [gridSize, setGridSize] = useState({ width: 21, height: 21 });
  const [grid, setGrid] = useState<JSX.Element[]>([]);
  const [lockedNodes, setLockedNodes] = useState<[number, number][]>([]);

  // Update locked nodes every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setLockedNodes(getLockedNodes());
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Create grid cells
  useEffect(() => {
    const cells = [];

    for (let y = FARM_BOUNDARY.MIN_Y; y <= FARM_BOUNDARY.MAX_Y; y++) {
      for (let x = FARM_BOUNDARY.MIN_X; x <= FARM_BOUNDARY.MAX_X; x++) {
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

        // Check if node is locked/visited
        const isLocked = lockedNodes.some(([lockX, lockY]) => lockX === x && lockY === y);
        
        // Determine border style for boundary edges
        const isBoundaryEdge = 
          x === FARM_BOUNDARY.MIN_X || 
          x === FARM_BOUNDARY.MAX_X || 
          y === FARM_BOUNDARY.MIN_Y || 
          y === FARM_BOUNDARY.MAX_Y;

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
          <div 
            key={cellKey} 
            className={`farm-grid-cell ${isBoundaryEdge ? 'border-2 border-green-700' : ''} ${isLocked && !hasRover ? 'bg-gray-200' : ''}`}
            title={`Coordinates: [${x}, ${y}]${isLocked ? ' (Recently visited)' : ''}`}
          >
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
  }, [fleetStatus, lockedNodes]);

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
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-200 rounded-full mr-1"></div>
          <span>Recently Visited</span>
        </div>
      </div>
    </div>
  );
};

export default FarmMap;
