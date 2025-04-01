
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tractor } from 'lucide-react';
import { toast } from 'sonner';
import { startSession } from '@/api/farmApi';

interface SessionInitializerProps {
  onSessionStart: (sessionId: string) => void;
}

const SessionInitializer: React.FC<SessionInitializerProps> = ({ onSessionStart }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const sessionId = await startSession();
      onSessionStart(sessionId);
      toast.success('Session started successfully!');
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Tractor className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">SLAM Farm Navigator</h1>
          <p className="text-muted-foreground text-center mb-6">
            Manage and monitor your agricultural robot fleet
          </p>
          
          <Button 
            onClick={handleStartSession}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Start New Session'}
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4 text-center">
            This will initialize a connection to the SLAM-enabled farm robots
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionInitializer;
