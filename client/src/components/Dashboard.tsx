import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderKanban, ListTodo, Users, Clock, CheckCircle2 } from 'lucide-react';

interface ProjectSummary {
  _id: string;
  name: string;
  taskCount: number;
  doneCount: number;
}

interface MemberSummary {
  _id: string;
  name: string;
  email: string;
  role: string;
  taskCounts: {
    todo: number;
    inProgress: number;
    done: number;
    total: number;
    pending: number;
  };
}

interface TaskProgress {
  todo: number;
  inProgress: number;
  done: number;
  pending: number;
  completed: number;
}

interface RecentTask {
  _id: string;
  title: string;
  status: string;
  assignedTo?: { name: string; email: string } | null;
}

interface Summary {
  projectCount: number;
  taskCount: number;
  memberCount: number;
  projects: ProjectSummary[];
  members: MemberSummary[];
  taskProgress: TaskProgress;
  recentTasks: RecentTask[];
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(res => setSummary(res.data))
      .catch(err => console.error('Failed to load dashboard summary', err));
  }, []);

  if (!summary) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const totalTasks = summary.taskProgress.pending + summary.taskProgress.completed;
const completionPercent = totalTasks > 0
  ? Math.round((summary.taskProgress.completed / totalTasks) * 100)
  : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Top stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.projectCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.taskCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.memberCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending vs Completed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Task Completion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <span>Pending: <strong>{summary.taskProgress.pending}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span>Completed: <strong>{summary.taskProgress.completed}</strong></span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{completionPercent}% completed</span>
              <span>{summary.taskProgress.completed}/{summary.taskProgress.pending + summary.taskProgress.completed} tasks</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderKanban className="h-5 w-5" /> Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.projects.map(proj => (
                <li key={proj._id} className="flex justify-between text-sm">
                  <span>{proj.name}</span>
                  <span className="text-muted-foreground">{proj.taskCount} tasks ({proj.doneCount} done)</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Team members and their task loads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Members & Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {summary.members.map(member => (
                <li key={member._id} className="border-b pb-2 last:border-0">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{member.name}</span>
                    <Badge variant="secondary">{member.role}</Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Pending: {member.taskCounts.pending}</span>
                    <span>Done: {member.taskCounts.done}</span>
                    <span className="font-semibold">Total: {member.taskCounts.total}</span>
                  </div>
                  {member.taskCounts.total > 0 && (
                    <div className="mt-2">
                      <Progress 
                        value={(member.taskCounts.done / member.taskCounts.total) * 100} 
                        className="h-1.5" 
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" /> Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {summary.recentTasks.map(task => (
                <li key={task._id} className="flex justify-between text-sm">
                  <span>
                    {task.title}
                    {task.assignedTo && (
                      <span className="ml-2 text-muted-foreground">({task.assignedTo.name})</span>
                    )}
                  </span>
                  <span className="capitalize text-muted-foreground">{task.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}