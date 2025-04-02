import React, { useState, useEffect } from 'react';
import { ArrowRightCircle, Database, Server, Cloud, Layers, Monitor, Smartphone, Activity, Settings, Box, Radio } from 'lucide-react';

const ArchitectureVisualization = () => {
  const [activeFlow, setActiveFlow] = useState(null);
  const [flowVisible, setFlowVisible] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [highlightedLayer, setHighlightedLayer] = useState(null);

  // Animation loop to cycle through different data flows
  useEffect(() => {
    const flows = [
      'client-to-frontend',
      'frontend-to-api',
      'api-to-backend',
      'backend-to-fleetapi',
      'backend-to-db',
      'iot-to-rovers',
      'data-processing'
    ];
    
    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      // Reset previous flow
      setFlowVisible({});
      
      // Set next flow
      const newFlow = flows[currentIndex];
      setActiveFlow(newFlow);
      
      // Update index for next iteration
      currentIndex = (currentIndex + 1) % flows.length;
      
      // Show flow with animation
      setTimeout(() => {
        setFlowVisible({ [newFlow]: true });
      }, 100);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle layer click
  const handleLayerClick = (layer) => {
    setHighlightedLayer(highlightedLayer === layer ? null : layer);
    setShowExplanation(true);
  };

  // Get explanation text based on highlighted layer
  const getExplanation = () => {
    switch (highlightedLayer) {
      case 'client':
        return 'Web and mobile applications that farmers use to monitor and control the agricultural robot fleet.';
      case 'frontend':
        return 'Static web assets hosted on S3 and distributed via CloudFront. AWS Amplify manages CI/CD and deployment.';
      case 'api':
        return 'API Gateway manages API traffic, authentication, and request routing to backend services.';
      case 'backend':
        return 'Fleet management logic running on Elastic Beanstalk or Lambda functions, processing requests and routing to appropriate services.';
      case 'communication':
        return 'AWS IoT Core and WebSocket API enable real-time communication between rovers and the management system.';
      case 'data':
        return 'Multi-tiered data storage using DynamoDB for status data, RDS for structured data, and Timestream for time-series sensor data.';
      case 'processing':
        return 'Serverless data processing with Lambda functions and advanced analytics with Amazon SageMaker.';
      case 'monitoring':
        return 'CloudWatch monitors system health and performance, while Systems Manager manages fleet configuration.';
      case 'fleetapi':
        return 'External FleetBots API that provides direct communication with the physical robot hardware.';
      case 'rovers':
        return 'SLAM-enabled agricultural robots that navigate farmland and collect data autonomously.';
      default:
        return 'Click on any layer for more information about its components and purpose.';
    }
  };

  // Render flow lines with animation
  const renderFlowLine = (flowName, startX, startY, endX, endY, isVisible) => {
    const isActive = flowVisible[flowName];
    const animationDuration = '2s';
    
    // Create path string for curved lines
    const generatePath = () => {
      const midX = (startX + endX) / 2;
      return `M${startX},${startY} Q${midX},${startY} ${midX},${(startY + endY) / 2} T${endX},${endY}`;
    };
    
    return (
      <g className={`flow-line ${isActive ? 'active' : ''}`}>
        <path
          d={generatePath()}
          fill="none"
          stroke={isActive ? "#4f46e5" : "#9ca3af"}
          strokeWidth={isActive ? 3 : 1.5}
          strokeDasharray={isActive ? "10,5" : "5,5"}
          opacity={isActive ? 1 : 0.4}
          style={{
            transition: `all 0.5s ease-in-out`,
            strokeDashoffset: isActive ? 0 : 100,
            animation: isActive ? `dash ${animationDuration} linear infinite` : 'none'
          }}
        />
        {isActive && (
          <circle
            cx={startX}
            cy={startY}
            r={5}
            fill="#4f46e5"
            style={{
              animation: `pulse 1s ease-in-out infinite`,
            }}
          />
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 bg-slate-50 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Agricultural Fleet Management Architecture</h1>
      <p className="text-gray-600 mb-8">Interactive visualization of AWS cloud architecture for SLAM-based agricultural robot fleet</p>
      
      <div className="relative w-full h-[600px] bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
        {/* SVG Container for the architecture diagram */}
        <svg width="100%" height="100%" viewBox="0 0 1000 600" className="architecture-diagram">
          {/* Background Grid */}
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
            </pattern>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#smallGrid)"/>
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Data Flow Lines */}
          {renderFlowLine('client-to-frontend', 150, 100, 300, 100, activeFlow === 'client-to-frontend')}
          {renderFlowLine('frontend-to-api', 400, 100, 550, 100, activeFlow === 'frontend-to-api')}
          {renderFlowLine('api-to-backend', 650, 100, 800, 100, activeFlow === 'api-to-backend')}
          {renderFlowLine('backend-to-fleetapi', 800, 250, 900, 350, activeFlow === 'backend-to-fleetapi')}
          {renderFlowLine('iot-to-rovers', 650, 250, 500, 350, activeFlow === 'iot-to-rovers')}
          {renderFlowLine('backend-to-db', 800, 180, 650, 350, activeFlow === 'backend-to-db')}
          {renderFlowLine('data-processing', 500, 450, 650, 450, activeFlow === 'data-processing')}
          
          {/* Client Applications Layer */}
          <g 
            className={`layer client-layer ${highlightedLayer === 'client' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('client')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="50" y="50" width="200" height="100" rx="10" 
              fill={highlightedLayer === 'client' ? '#ede9fe' : '#f3f4f6'} 
              stroke={highlightedLayer === 'client' ? '#8b5cf6' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="150" y="80" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">Client Applications</text>
            <foreignObject x="65" y="90" width="80" height="50">
              <Monitor className="h-10 w-10 text-gray-700" />
            </foreignObject>
            <foreignObject x="155" y="90" width="80" height="50">
              <Smartphone className="h-10 w-10 text-gray-700" />
            </foreignObject>
          </g>
          
          {/* Frontend Layer */}
          <g 
            className={`layer frontend-layer ${highlightedLayer === 'frontend' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('frontend')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="300" y="50" width="200" height="100" rx="10" 
              fill={highlightedLayer === 'frontend' ? '#dcfce7' : '#f3f4f6'} 
              stroke={highlightedLayer === 'frontend' ? '#22c55e' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="400" y="80" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">Frontend Layer</text>
            <foreignObject x="320" y="90" width="160" height="50">
              <div className="flex justify-around">
                <Cloud className="h-10 w-10 text-gray-700" />
                <Layers className="h-10 w-10 text-gray-700" />
              </div>
            </foreignObject>
          </g>
          
          {/* API Layer */}
          <g 
            className={`layer api-layer ${highlightedLayer === 'api' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('api')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="550" y="50" width="200" height="100" rx="10" 
              fill={highlightedLayer === 'api' ? '#dbeafe' : '#f3f4f6'} 
              stroke={highlightedLayer === 'api' ? '#3b82f6' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="650" y="80" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">API Layer</text>
            <foreignObject x="570" y="90" width="160" height="50">
              <div className="flex justify-around">
                <Settings className="h-10 w-10 text-gray-700" />
                <ArrowRightCircle className="h-10 w-10 text-gray-700" />
              </div>
            </foreignObject>
          </g>
          
          {/* Backend Layer */}
          <g 
            className={`layer backend-layer ${highlightedLayer === 'backend' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('backend')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="800" y="50" width="150" height="200" rx="10" 
              fill={highlightedLayer === 'backend' ? '#fef3c7' : '#f3f4f6'} 
              stroke={highlightedLayer === 'backend' ? '#f59e0b' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="875" y="80" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">Backend Services</text>
            <foreignObject x="825" y="100" width="100" height="120">
              <div className="flex flex-col items-center justify-around h-full">
                <Server className="h-10 w-10 text-gray-700" />
                <Box className="h-10 w-10 text-gray-700" />
              </div>
            </foreignObject>
          </g>
          
          {/* Communication Layer */}
          <g 
            className={`layer communication-layer ${highlightedLayer === 'communication' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('communication')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="550" y="200" width="200" height="100" rx="10" 
              fill={highlightedLayer === 'communication' ? '#e0f2fe' : '#f3f4f6'} 
              stroke={highlightedLayer === 'communication' ? '#0ea5e9' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="650" y="230" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">Communication Layer</text>
            <foreignObject x="570" y="240" width="160" height="50">
              <div className="flex justify-around">
                <Radio className="h-10 w-10 text-gray-700" />
                <Activity className="h-10 w-10 text-gray-700" />
              </div>
            </foreignObject>
          </g>

          {/* Data Layer */}
          <g 
            className={`layer data-layer ${highlightedLayer === 'data' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('data')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="550" y="350" width="200" height="100" rx="10" 
              fill={highlightedLayer === 'data' ? '#ede9fe' : '#f3f4f6'} 
              stroke={highlightedLayer === 'data' ? '#8b5cf6' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="650" y="380" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">Data Layer</text>
            <foreignObject x="570" y="390" width="160" height="50">
              <div className="flex justify-around">
                <Database className="h-10 w-10 text-gray-700" />
                <Database className="h-10 w-10 text-gray-700" />
              </div>
            </foreignObject>
          </g>

          {/* Processing Layer */}
          <g 
            className={`layer processing-layer ${highlightedLayer === 'processing' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('processing')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="300" y="350" width="200" height="100" rx="10" 
              fill={highlightedLayer === 'processing' ? '#fae8ff' : '#f3f4f6'} 
              stroke={highlightedLayer === 'processing' ? '#d946ef' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="400" y="380" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">Processing Layer</text>
            <foreignObject x="320" y="390" width="160" height="50">
              <div className="flex justify-around">
                <Settings className="h-10 w-10 text-gray-700" />
                <Activity className="h-10 w-10 text-gray-700" />
              </div>
            </foreignObject>
          </g>

          {/* Monitoring Layer */}
          <g 
            className={`layer monitoring-layer ${highlightedLayer === 'monitoring' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('monitoring')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="800" y="350" width="150" height="100" rx="10" 
              fill={highlightedLayer === 'monitoring' ? '#fee2e2' : '#f3f4f6'} 
              stroke={highlightedLayer === 'monitoring' ? '#ef4444' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="875" y="380" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">Monitoring</text>
            <foreignObject x="825" y="390" width="100" height="50">
              <div className="flex justify-around">
                <Activity className="h-10 w-10 text-gray-700" />
              </div>
            </foreignObject>
          </g>

          {/* FleetBots API */}
          <g 
            className={`layer fleetapi-layer ${highlightedLayer === 'fleetapi' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('fleetapi')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="850" y="500" width="100" height="80" rx="10" 
              fill={highlightedLayer === 'fleetapi' ? '#ffedd5' : '#f3f4f6'} 
              stroke={highlightedLayer === 'fleetapi' ? '#f97316' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="900" y="530" textAnchor="middle" className="text-md font-semibold" fill="#1f2937">FleetBots API</text>
            <foreignObject x="865" y="540" width="70" height="30">
              <Server className="h-6 w-6 text-gray-700" />
            </foreignObject>
          </g>

          {/* Physical Rovers */}
          <g 
            className={`layer rovers-layer ${highlightedLayer === 'rovers' ? 'highlighted' : ''}`}
            onClick={() => handleLayerClick('rovers')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="50" y="500" width="700" height="80" rx="10" 
              fill={highlightedLayer === 'rovers' ? '#dbeafe' : '#f3f4f6'} 
              stroke={highlightedLayer === 'rovers' ? '#3b82f6' : '#d1d5db'}
              strokeWidth="2"
            />
            <text x="400" y="530" textAnchor="middle" className="text-lg font-semibold" fill="#1f2937">Agricultural Rovers (SLAM-enabled)</text>
            <foreignObject x="100" y="540" width="600" height="30">
              <div className="flex justify-around">
                <Box className="h-6 w-6 text-gray-700" />
                <Box className="h-6 w-6 text-gray-700" />
                <Box className="h-6 w-6 text-gray-700" />
                <Box className="h-6 w-6 text-gray-700" />
                <Box className="h-6 w-6 text-gray-700" />
              </div>
            </foreignObject>
          </g>

          {/* AWS Cloud Boundary */}
          <rect x="275" y="25" width="700" height="450" rx="15" 
            fill="none" 
            stroke="#d1d5db" 
            strokeWidth="2"
            strokeDasharray="10,5"
          />
          <text x="325" y="45" className="text-md font-semibold" fill="#6b7280">AWS Cloud</text>
        </svg>

        {/* Animated Data Flow Indicators */}
        {activeFlow === 'client-to-frontend' && (
          <div className="absolute top-6 left-6 bg-indigo-100 p-2 rounded-lg border border-indigo-300 shadow-sm text-sm">
            User requests sent to CloudFront CDN
          </div>
        )}
        {activeFlow === 'frontend-to-api' && (
          <div className="absolute top-6 right-1/2 bg-blue-100 p-2 rounded-lg border border-blue-300 shadow-sm text-sm">
            API Gateway receives and authenticates requests
          </div>
        )}
        {activeFlow === 'api-to-backend' && (
          <div className="absolute top-6 right-6 bg-yellow-100 p-2 rounded-lg border border-yellow-300 shadow-sm text-sm">
            Requests routed to backend services
          </div>
        )}
        {activeFlow === 'backend-to-fleetapi' && (
          <div className="absolute top-1/2 right-6 bg-orange-100 p-2 rounded-lg border border-orange-300 shadow-sm text-sm">
            Backend communicates with FleetBots API
          </div>
        )}
        {activeFlow === 'iot-to-rovers' && (
          <div className="absolute bottom-1/3 left-1/2 bg-sky-100 p-2 rounded-lg border border-sky-300 shadow-sm text-sm transform -translate-x-1/2">
            IoT Core provides real-time rover communication
          </div>
        )}
        {activeFlow === 'backend-to-db' && (
          <div className="absolute top-1/2 right-1/4 bg-purple-100 p-2 rounded-lg border border-purple-300 shadow-sm text-sm">
            Sensor data stored in database
          </div>
        )}
        {activeFlow === 'data-processing' && (
          <div className="absolute bottom-1/4 left-1/3 bg-pink-100 p-2 rounded-lg border border-pink-300 shadow-sm text-sm">
            Lambda processes data for insights
          </div>
        )}
      </div>

      {/* Explanation Panel */}
      <div className="w-full bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {highlightedLayer ? `${highlightedLayer.charAt(0).toUpperCase() + highlightedLayer.slice(1)} Layer` : "AWS Architecture Overview"}
        </h2>
        <p className="text-gray-600">{getExplanation()}</p>
      </div>

      {/* Data Flow Legend */}
      <div className="w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Data Flow Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Monitor className="h-6 w-6 text-indigo-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">User Interaction Flow</h3>
              <p className="text-gray-600 text-sm">User requests from web/mobile interfaces flow through CloudFront to API Gateway and finally to backend services.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Radio className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Command Control Flow</h3>
              <p className="text-gray-600 text-sm">Backend services issue commands to rovers through IoT Core for real-time control.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-3 rounded-full">
              <Database className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Data Storage Flow</h3>
              <p className="text-gray-600 text-sm">Sensor data from rovers is stored in multiple databases optimized for different data types.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Analytics Processing Flow</h3>
              <p className="text-gray-600 text-sm">Sensor data is processed through Lambda functions and SageMaker for predictive analytics.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
        @keyframes pulse {
          0% { r: 5; opacity: 1; }
          50% { r: 8; opacity: 0.7; }
          100% { r: 5; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ArchitectureVisualization;