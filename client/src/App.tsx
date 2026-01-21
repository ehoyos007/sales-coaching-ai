import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ChatContainer } from './components/Chat/ChatContainer';
import { ChatHeader } from './components/Chat/ChatHeader';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CallDetailsModal } from './components/CallDetails/CallDetailsModal';
import { RubricSettings } from './pages/Settings';
import { LoginPage } from './pages/Login';
import { AdminPage } from './pages/Admin';
import { TeamOverviewPage } from './pages/TeamOverview';
import { AgentOverviewPage } from './pages/AgentOverview';
import { useChat } from './hooks/useChat';
import { useAgents } from './hooks/useAgents';
import { useCalls } from './hooks/useCalls';
import type { Agent } from './types';

const ChatPage: React.FC = () => {
  // Chat state
  const {
    messages,
    isLoading,
    isLoadingHistory,
    sendMessage,
    setContext,
    clearMessages,
    startNewChat,
  } = useChat();

  // Agents state
  const {
    agents,
    isLoading: isLoadingAgents,
    error: agentsError,
  } = useAgents();

  // Call details state
  const {
    callDetails,
    transcript,
    isLoading: isLoadingCall,
    error: callError,
    fetchCallDetails,
    fetchTranscript,
    clearCallData,
  } = useCalls();

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();

  // Handle agent selection from sidebar
  const handleAgentSelect = useCallback(
    (agent: Agent) => {
      setSelectedAgentId(agent.agent_user_id);
      setContext({ agent_user_id: agent.agent_user_id });
      // Optionally send a message about the selected agent
      const agentName = agent.first_name || agent.email || 'this agent';
      sendMessage(`Tell me about ${agentName}'s performance`);
      // Close sidebar on mobile
      setIsSidebarOpen(false);
    },
    [setContext, sendMessage]
  );

  // Handle quick action from sidebar
  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
      // Close sidebar on mobile
      setIsSidebarOpen(false);
    },
    [sendMessage]
  );

  // Handle call click from chat messages
  const handleCallClick = useCallback(
    async (callId: string) => {
      setIsCallModalOpen(true);
      await Promise.all([fetchCallDetails(callId), fetchTranscript(callId)]);
    },
    [fetchCallDetails, fetchTranscript]
  );

  // Handle call modal close
  const handleCloseCallModal = useCallback(() => {
    setIsCallModalOpen(false);
    clearCallData();
  }, [clearCallData]);

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Handle clear chat
  const handleClearChat = useCallback(() => {
    clearMessages();
    setSelectedAgentId(undefined);
    setContext({});
  }, [clearMessages, setContext]);

  // Handle new chat (starts a fresh session)
  const handleNewChat = useCallback(() => {
    startNewChat();
    setSelectedAgentId(undefined);
  }, [startNewChat]);

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        agents={agents}
        isLoadingAgents={isLoadingAgents}
        agentsError={agentsError}
        selectedAgentId={selectedAgentId}
        isOpen={isSidebarOpen}
        isChatLoading={isLoading}
        onClose={() => setIsSidebarOpen(false)}
        onAgentSelect={handleAgentSelect}
        onQuickAction={handleQuickAction}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ChatHeader
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          onClearChat={handleClearChat}
          onNewChat={handleNewChat}
        />

        {/* Chat container */}
        <div className="flex-1 min-h-0">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            isLoadingHistory={isLoadingHistory}
            onSendMessage={sendMessage}
            onCallClick={handleCallClick}
          />
        </div>
      </div>

      {/* Call Details Modal */}
      <CallDetailsModal
        isOpen={isCallModalOpen}
        onClose={handleCloseCallModal}
        callDetails={callDetails}
        transcript={transcript}
        isLoading={isLoadingCall}
        error={callError}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route - Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected route - Main chat page */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Protected route with role restriction - Rubric settings (admin/manager only) */}
        <Route
          path="/settings/rubric"
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager']}>
              <RubricSettings />
            </ProtectedRoute>
          }
        />

        {/* Protected route with role restriction - Admin panel (admin and manager) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Team Overview Dashboard - managers and admin only */}
        <Route
          path="/teams/:teamId/overview"
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager']}>
              <TeamOverviewPage />
            </ProtectedRoute>
          }
        />

        {/* Agent Overview Dashboard - all authenticated users */}
        <Route
          path="/agents/:agentId/overview"
          element={
            <ProtectedRoute>
              <AgentOverviewPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
