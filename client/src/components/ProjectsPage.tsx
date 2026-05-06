import { useEffect, useState } from 'react';
import api from '../services/api';
import useCurrentUser from '../hooks/useCurrentUser';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, loading: userLoading } = useCurrentUser();
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch projects');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', { name, description });
      setName('');
      setDescription('');
      setDialogOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleEdit = (project: Project) => {
    setEditId(project._id);
    setEditName(project.name);
    setEditDesc(project.description || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await api.put(`/projects/${editId}`, { name: editName, description: editDesc });
      setEditId(null);
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update project');
    }
  };

  const canModify = user && (user.role === 'ADMIN' || user.role === 'MANAGER');
  const canDelete = user?.role === 'ADMIN';

  if (userLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        {canModify && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="desc">Description</Label>
                  <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project._id}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              {canModify && (
                <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(project._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      {editId && (
        <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Input id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <Button type="submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}