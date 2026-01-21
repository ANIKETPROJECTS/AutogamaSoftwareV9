import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Wrench, Phone, Briefcase, Search, Filter, ArrowUpDown, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_COLORS: Record<string, string> = {
  'Available': 'bg-gray-200 text-black border-gray-300',
  'Busy': 'bg-gray-200 text-black border-gray-300',
  'Off': 'bg-gray-200 text-black border-gray-300'
};

export default function Technicians() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTech, setEditTech] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [techToDelete, setTechToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
  });

  const { data: workload = [] } = useQuery({
    queryKey: ['technicians', 'workload'],
    queryFn: api.technicians.workload,
  });

  const createTechnicianMutation = useMutation({
    mutationFn: api.technicians.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setDialogOpen(false);
      toast({ title: 'Technician added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add technician', variant: 'destructive' });
    }
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.technicians.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setDialogOpen(false);
      setEditTech(null);
      toast({ title: 'Technician updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update technician', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: api.technicians.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['technicians', 'workload'] });
      setDeleteConfirmOpen(false);
      setTechToDelete(null);
      toast({ title: 'Technician deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Delete Failed', 
        description: error.message || 'Cannot delete technician with active jobs.',
        variant: 'destructive' 
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.technicians.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast({ title: 'Status updated' });
    }
  });

  const handleCreateOrUpdateTechnician = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const data = {
      name: formData.get('name') as string,
      specialty: formData.get('specialty') as string,
      phone: formData.get('phone') as string || undefined,
    };

    if (editTech) {
      updateTechnicianMutation.mutate({ id: editTech._id, data });
    } else {
      createTechnicianMutation.mutate({ ...data, status: 'Available' });
    }
  };

  const getWorkloadForTechnician = (techId: string) => {
    const found = workload.find((w: any) => w.technician._id === techId);
    return found?.jobCount || 0;
  };

  const filteredAndSortedTechnicians = technicians
    .filter((tech: any) => {
      const matchesSearch = searchQuery === '' || 
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || tech.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'jobs':
          return (getWorkloadForTechnician(b._id) || 0) - (getWorkloadForTechnician(a._id) || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Technicians</h1>
        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditTech(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-all" data-testid="button-new-technician">
              <Plus className="w-4 h-4 mr-2" />
              Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {editTech ? 'Edit Technician' : 'Add New Technician'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdateTechnician} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input name="name" required defaultValue={editTech?.name} placeholder="Technician name" data-testid="input-technician-name" />
              </div>
              <div className="space-y-2">
                <Label>Specialty *</Label>
                <Input name="specialty" required defaultValue={editTech?.specialty} placeholder="e.g., General Mechanic, Detailing Expert" data-testid="input-technician-specialty" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" defaultValue={editTech?.phone} placeholder="+91 98765 43210" data-testid="input-technician-phone" />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-all"
                disabled={createTechnicianMutation.isPending || updateTechnicianMutation.isPending}
                data-testid="button-submit-technician"
              >
                {editTech 
                  ? (updateTechnicianMutation.isPending ? 'Updating...' : 'Update Technician')
                  : (createTechnicianMutation.isPending ? 'Adding...' : 'Add Technician')
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name or specialty..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-technicians"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48" data-testid="select-sort-technicians">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
            <SelectItem value="jobs">Sort by Active Jobs</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48" data-testid="select-filter-technicians">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Busy">Busy</SelectItem>
            <SelectItem value="Off">Off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Technicians Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-slate-500">Loading technicians...</div>
        ) : technicians.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            No technicians yet. Add your first technician!
          </div>
        ) : filteredAndSortedTechnicians.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            No technicians match your search or filter criteria.
          </div>
        ) : (
          filteredAndSortedTechnicians.map((tech: any) => {
            const jobCount = getWorkloadForTechnician(tech._id);
            return (
              <Card 
                key={tech._id} 
                className="bg-gradient-to-br from-white to-slate-50 border border-red-300 shadow-sm hover:shadow-md transition-all hover-elevate"
                data-testid={`technician-card-${tech._id}`}
              >
                <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Wrench className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">{tech.name}</CardTitle>
                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                          <Briefcase className="w-3 h-3" />
                          {tech.specialty}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditTech(tech);
                          setDialogOpen(true);
                        }}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => {
                            if (jobCount > 0) {
                              toast({
                                title: "Cannot Delete",
                                description: "This technician has active jobs assigned.",
                                variant: "destructive"
                              });
                              return;
                            }
                            setTechToDelete(tech);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {tech.phone && (
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {tech.phone}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Status</span>
                    <Select
                      value={tech.status}
                      onValueChange={(status) => updateStatusMutation.mutate({ id: tech._id, status })}
                    >
                      <SelectTrigger 
                        className={cn("w-32 border-slate-200 bg-white", STATUS_COLORS[tech.status])}
                        data-testid={`status-select-${tech._id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
                        <SelectItem value="Off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Active Jobs</span>
                      <Badge 
                        variant="outline"
                        className={cn(
                          jobCount > 2 && 'border-orange-300 text-orange-700 bg-orange-50',
                          jobCount > 0 && jobCount <= 2 && 'border-yellow-300 text-yellow-700 bg-yellow-50',
                          jobCount === 0 && 'border-gray-300 text-slate-700 bg-gray-50'
                        )}
                      >
                        {jobCount}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete technician {techToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTechToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteTechnicianMutation.mutate(techToDelete?._id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
