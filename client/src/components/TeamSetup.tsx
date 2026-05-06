import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Team {
  _id: string;
  name: string;
  description: string;
  adminId: { name: string; email: string };
}

export default function TeamSetup({ onTeamReady }: { onTeamReady: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user already has a team
    api.get('/teams/my-team')
      .then((res) => {
        setTeam(res.data);
        onTeamReady();   // notify parent to show dashboard
      })
      .catch(() => {}); // no team yet
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/teams/create', { name, description });
      setTeam(res.data.team);
      onTeamReady();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  if (team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Team Ready!</CardTitle>
            <CardDescription>You are part of <strong>{team.name}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Admin: {team.adminId.name} ({team.adminId.email})</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Team</CardTitle>
          <CardDescription>You’re not part of any team yet. Create one to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateTeam}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="My Awesome Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-desc">Description (optional)</Label>
              <Input
                id="team-desc"
                placeholder="What does your team do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}