import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageCircle, Settings } from 'lucide-react';
import ModelManagerScreen from './ModelManagerScreen';
import ChatScreen from './ChatScreen';
import SettingsScreen from './SettingsScreen';

export default function MobileTabNavigation() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Tabs defaultValue="modelo" className="flex flex-col h-full">
        {/* Tab Content Area */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="modelo" className="h-full m-0 p-4">
            <ModelManagerScreen />
          </TabsContent>
          
          <TabsContent value="chat" className="h-full m-0 p-0">
            <ChatScreen />
          </TabsContent>
          
          <TabsContent value="config" className="h-full m-0 p-4">
            <SettingsScreen />
          </TabsContent>
        </div>
        
        {/* Bottom Navigation */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm">
          <TabsList className="w-full h-16 bg-transparent p-0 grid grid-cols-3">
            <TabsTrigger 
              value="modelo" 
              className="flex flex-col items-center justify-center h-full space-y-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-0"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs font-medium">Modelo</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="chat" 
              className="flex flex-col items-center justify-center h-full space-y-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-0"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-medium">Chat</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="config" 
              className="flex flex-col items-center justify-center h-full space-y-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-0"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Config</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}