import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import api from '../services/api';
import useCurrentUser from '../hooks/useCurrentUser';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  projectId: string;
  assignedTo: { _id: string; name: string; email: string } | null;
}

interface Project {
  _id: string;
  name: string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { user, loading: userLoading } = useCurrentUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('none');   // was ''
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load projects');
    }
  };

  const fetchTasks = async () => {
    if (!selectedProject) return;
    try {
      const res = await api.get(`/tasks?projectId=${selectedProject}`);
      setTasks(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tasks');
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/users/team-members');
      setTeamMembers(res.data);
    } catch (err: any) {
      console.error('Could not load team members');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (selectedProject) fetchTasks();
  }, [selectedProject]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.droppableId === result.destination.droppableId) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
    );

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err: any) {
      // Revert on failure
      fetchTasks();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setError('');
    try {
      await api.post('/tasks', {
        title,
        description,
        projectId: selectedProject,
        assignedTo: assigneeId === 'none' ? null : assigneeId || null,
      });
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setCreateOpen(false);
      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    try {
      await api.put(`/tasks/${editTask._id}`, {
        title,
        description,
        assignedTo: assigneeId === 'none' ? null : assigneeId || null,
      });
      setEditTask(null);
      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setAssigneeId(task.assignedTo?._id || '');
  };

  const canAssign = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

  if (userLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-3xl font-bold">Kanban Board</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)} disabled={!selectedProject}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      {selectedProject && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid gap-6 md:grid-cols-3">
            {columns.map((col) => (
              <div key={col.id} className="bg-muted/30 rounded-lg p-4">
                <h2 className="font-semibold mb-4">{col.title}</h2>
                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3 min-h-[200px]"
                    >
                      {tasks
                        .filter((t) => t.status === col.id)
                        .map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => openEdit(task)}
                              >
                                <CardHeader className="flex flex-row items-center gap-2 p-4">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-sm">{task.title}</CardTitle>
                                  </div>
                                </CardHeader>
                                {(task.description || task.assignedTo) && (
                                  <CardContent className="p-4 pt-0">
                                    {task.description && (
                                      <p className="text-xs text-muted-foreground">{task.description}</p>
                                    )}
                                    {task.assignedTo && (
                                      <p className="text-xs text-primary mt-1">👤 {task.assignedTo.name}</p>
                                    )}
                                  </CardContent>
                                )}
                              </Card>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {canAssign && (
              <div>
                <Label htmlFor="assignee">Assign To</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m._id} value={m._id}>{m.name} ({m.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editTask && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Input id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              {canAssign && (
                <div>
                  <Label htmlFor="edit-assignee">Assign To</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m._id} value={m._id}>{m.name} ({m.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit">Save Changes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}