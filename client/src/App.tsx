import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import TeamSetup from './components/TeamSetup';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import ProjectsPage from './components/ProjectsPage';
import TasksPage from './components/TasksPage';
import ChatPage from './components/ChatPage';
import AssistantPage from './components/AssistantPage';
import TeamPage from './components/TeamPage';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [teamReady, setTeamReady] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (!teamReady) return <TeamSetup onTeamReady={() => setTeamReady(true)} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="team" element={<TeamPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppRoutes />;
}