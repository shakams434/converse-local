import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Settings, MessageSquare } from 'lucide-react';
import ModelManagerScreen from './ModelManagerScreen';
import SettingsScreen from './SettingsScreen';
import ChatScreen from './ChatScreen';

const NavigationTabs = () => {
  const [activeTab, setActiveTab] = useState('model');

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-screen flex flex-col">
        {/* Header with tabs */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                AI Assistant
              </h1>
              <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                <TabsTrigger value="model" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">Modelo</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Config</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="model" className="h-full m-0">
            <ModelManagerScreen />
          </TabsContent>
          
          <TabsContent value="chat" className="h-full m-0">
            <ChatScreen />
          </TabsContent>
          
          <TabsContent value="settings" className="h-full m-0">
            <SettingsScreen />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default NavigationTabs;