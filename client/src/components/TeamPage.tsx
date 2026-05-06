import { useEffect, useState } from 'react';
import api from '../services/api';
import useCurrentUser from '../hooks/useCurrentUser';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, Edit, Trash2, Activity } from 'lucide-react';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  adminId: {
    _id: string;
    name: string;
    email: string;
  };
}

interface ActivityItem {
  type: string;
  text: string;
  timestamp: string;
}

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const { user } = useCurrentUser();

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchData = () => {
    api.get('/teams/my-team').then(res => setTeam(res.data)).catch(() => {});
    api.get('/users/team-members').then(res => setMembers(res.data)).catch(() => {});
    api.get('/activity').then(res => setActivities(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put('/teams/my-team', { name: editName, description: editDesc });
      setEditOpen(false);
      fetchData();
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update team');
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await api.delete('/teams/my-team');
      window.location.reload();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Failed to delete team');
    }
  };

  const openEditDialog = () => {
    if (team) {
      setEditName(team.name);
      setEditDesc(team.description || '');
      setEditOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Team Overview</h1>

      {team && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>{team.description || 'No description'}</CardDescription>
              <p className="text-sm mt-1">Admin: {team.adminId?.name} ({team.adminId?.email})</p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openEditDialog}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Members section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Members</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <Card key={member._id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{member.name}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{member.email}</p>
                <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'} className="mt-2">
                  {member.role}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Log section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" /> Activity Log
        </h2>
        <Card>
          <CardContent className="p-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((act, idx) => (
                  <li key={idx} className="text-sm flex justify-between border-b pb-1 last:border-0">
                    <span>{act.text}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Change the team name or description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Team Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Input id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            {editError && <p className="text-sm text-red-500">{editError}</p>}
            <Button type="submit">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              This will permanently delete the team, all projects, tasks, and messages. 
              All members will be removed from the team. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
          {deleteError && <p className="text-sm text-red-500 mt-2">{deleteError}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}