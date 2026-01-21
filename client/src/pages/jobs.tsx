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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Car, User, Phone, MessageCircle, FileText, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

const JOB_STAGES = [
  'New Lead',
  'Inspection Done',
  'Work In Progress',
  'Completed',
  'Cancelled'
];

const STAGE_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Inspection Done': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Work In Progress': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Completed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Cancelled': 'bg-red-500/20 text-red-400 border-red-500/30'
};

const STAGE_BG_COLORS: Record<string, string> = {
  'New Lead': 'bg-white border-blue-200',
  'Inspection Done': 'bg-white border-yellow-200',
  'Work In Progress': 'bg-white border-orange-200',
  'Completed': 'bg-white border-emerald-200',
  'Cancelled': 'bg-white border-red-200'
};

const STAGE_BADGE_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-100 text-blue-700 border-blue-200',
  'Inspection Done': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Work In Progress': 'bg-orange-100 text-orange-700 border-orange-200',
  'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200'
};

export default function ServiceFunnel() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', search, stageFilter],
    queryFn: () => api.jobs.list({ 
      search, 
      stage: stageFilter === 'all' ? undefined : stageFilter,
      limit: 1000
    }),
  });
  const jobs = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });
  const customers = customersData?.customers || [];

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.invoices.list(),
  });

  const hasInvoice = (jobId: string) => invoices.some((inv: any) => inv.jobId === jobId);
  
  const isTerminalStage = (stage: string) => stage === 'Completed' || stage === 'Cancelled';

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, serviceItems, requiresGST, discount }: { 
      id: string; 
      stage: string; 
      serviceItems?: any[];
      requiresGST?: boolean;
      discount?: number;
    }) => 
      api.jobs.updateStage(id, stage, serviceItems, undefined, requiresGST, discount),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs', search, stageFilter]);
      
      queryClient.setQueryData(['jobs', search, stageFilter], (old: any) => ({
        ...old,
        jobs: old?.jobs?.map((j: any) => j._id === id ? { ...j, stage } : j)
      }));

      return { previousJobs };
    },
    onError: (err, { id, stage }, context: any) => {
      queryClient.setQueryData(['jobs', search, stageFilter], context.previousJobs);
      const errorMsg = (err as any)?.message || 'Failed to update status';
      toast({ title: errorMsg, variant: 'destructive' });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (variables.stage === 'Completed') {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        toast({ 
          title: 'Status updated',
          description: 'WhatsApp notification sent & invoices created successfully'
        });
      } else {
        toast({ 
          title: 'Status updated',
          description: 'WhatsApp notification sent'
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });

  const [assignBusinessOpen, setAssignBusinessOpen] = useState(false);
  const [selectedJobForAssign, setSelectedJobForAssign] = useState<any>(null);
  const [serviceAssignments, setServiceAssignments] = useState<any[]>([]);

  const handleStageChange = (job: any, newStage: string) => {
    if (newStage === 'Completed') {
      setSelectedJobForAssign(job);
      setServiceAssignments(job.serviceItems.map((item: any) => ({
        ...item,
        assignedBusiness: item.assignedBusiness || 'Auto Gamma'
      })));
      setAssignBusinessOpen(true);
    } else {
      updateStageMutation.mutate({ id: job._id, stage: newStage });
    }
  };

  const confirmCompleteService = () => {
    if (selectedJobForAssign) {
      updateStageMutation.mutate({ 
        id: selectedJobForAssign._id, 
        stage: 'Completed',
        serviceItems: serviceAssignments,
        requiresGST: selectedJobForAssign.requiresGST,
        discount: selectedJobForAssign.discount || 0
      });
      setAssignBusinessOpen(false);
    }
  };

  const groupedJobs = JOB_STAGES.reduce((acc, stage) => {
    acc[stage] = jobs.filter((job: any) => job.stage === stage);
    return acc;
  }, {} as Record<string, any[]>);

  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = search === '' || 
      job.customerName.toLowerCase().includes(search.toLowerCase()) ||
      job.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
      job.plateNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'all' || job.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const PHASE_STAGE_MAPPING: Record<string, string[]> = {
    'PHASE 1': ['New Lead'],
    'PHASE 2': ['Inspection Done'],
    'PHASE 3': ['Work In Progress'],
    'PHASE 4': ['Completed'],
    'PHASE 5': ['Cancelled']
  };

  const PHASE_BORDERS: Record<string, string> = {
    'PHASE 1': 'border-blue-500',
    'PHASE 2': 'border-yellow-500',
    'PHASE 3': 'border-orange-500',
    'PHASE 4': 'border-green-500',
    'PHASE 5': 'border-red-500'
  };

  const getPhaseTitle = (phase: string) => {
    const stages = PHASE_STAGE_MAPPING[phase];
    return stages[0] || phase;
  };

  return (
    <div className="space-y-8">
      {/* Phase Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(PHASE_STAGE_MAPPING).map(([phase, stages]) => {
          const phaseJobCount = stages.reduce((sum, stage) => sum + (groupedJobs[stage]?.length || 0), 0);
          const primaryStage = stages[0];
          return (
            <Card key={phase} className={cn("card-modern border-2 shadow-md hover:shadow-lg transition-all duration-300", STAGE_BG_COLORS[primaryStage])}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Badge className={cn(STAGE_BADGE_COLORS[primaryStage], "text-xs font-bold")}>{primaryStage}</Badge>
                  <span className="text-4xl font-bold text-slate-900">{phaseJobCount}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, vehicle, or plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-slate-300 rounded-lg shadow-sm"
            data-testid="input-search-jobs"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300 rounded-lg shadow-sm" data-testid="select-stage-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {JOB_STAGES.map(stage => (
              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vertical Phase Sections */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading services...</div>
      ) : (
        Object.entries(PHASE_STAGE_MAPPING).map(([phase, stages]) => {
          const phaseJobs = jobs.filter((job: any) => 
            stages.includes(job.stage) && 
            (search === '' || 
              job.customerName.toLowerCase().includes(search.toLowerCase()) ||
              job.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
              job.plateNumber.toLowerCase().includes(search.toLowerCase())) &&
            (stageFilter === 'all' || job.stage === stageFilter)
          );

          return (
            <div key={phase} className={cn("border-l-4 rounded-lg p-6 space-y-4 bg-white", PHASE_BORDERS[phase])}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{phase}</span>
                <h3 className="text-xl font-bold text-slate-900">{getPhaseTitle(phase)}</h3>
              </div>

              {phaseJobs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No services in this phase
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {phaseJobs.map((job: any) => (
            <Card 
              key={job._id} 
              className="card-modern border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:border-slate-300 bg-white flex flex-col"
              data-testid={`service-item-${job._id}`}
            >
              <CardContent className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200 shadow-sm flex-shrink-0">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{job.vehicleName}</h3>
                      <Badge variant="outline" className="text-xs font-semibold bg-slate-100 border-slate-300 truncate">{job.plateNumber}</Badge>
                    </div>
                    <div className="flex flex-col gap-1 mt-1.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{job.customerName}</span>
                      </span>
                      {job.technicianName && (
                        <span className="flex items-center gap-1 font-medium">
                          <span className="inline-block w-1 h-1 bg-gray-500 rounded-full flex-shrink-0"></span>
                          <span className="truncate">Assigned: {job.technicianName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {job.notes && (
                  <p className="text-xs text-slate-600 italic bg-slate-100 px-2 py-1.5 rounded line-clamp-2">{job.notes}</p>
                )}

                <div className="w-full">
                  {isTerminalStage(job.stage) ? (
                    <Badge className={cn("w-full justify-center border py-1.5 text-xs", STAGE_COLORS[job.stage])}>
                      {job.stage}
                    </Badge>
                  ) : (
                    <Select
                      value={job.stage}
                      onValueChange={(stage) => handleStageChange(job, stage)}
                    >
                      <SelectTrigger className={cn("w-full border text-xs h-8", STAGE_COLORS[job.stage])} data-testid={`stage-select-${job._id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_STAGES.map(stage => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Cost:</span>
                    <span className="font-bold text-slate-900">₹{(job.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "w-full justify-center text-xs",
                      job.paymentStatus === 'Paid' && 'border-green-500/30 text-slate-600',
                      job.paymentStatus === 'Partially Paid' && 'border-yellow-500/30 text-yellow-500',
                      job.paymentStatus === 'Pending' && 'border-red-500/30 text-red-500'
                    )}
                  >
                    {job.paymentStatus}
                  </Badge>
                  {hasInvoice(job._id) && (
                    <Badge className="w-full justify-center bg-gray-100 text-slate-600 border-gray-200 text-xs">
                      Invoice Created
                    </Badge>
                  )}
                </div>
                  </CardContent>
                </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
      {/* Assign Business Dialog */}
      <Dialog open={assignBusinessOpen} onOpenChange={setAssignBusinessOpen}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold">Complete Service - Assign Business</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="bg-slate-50 border p-4 rounded-lg flex items-center gap-4">
              <FileText className="w-5 h-5 text-slate-500" />
              <p className="text-sm text-slate-600">
                Select which business each service item belongs to. Separate invoices will be generated for each business.
              </p>
            </div>
            
            <div className="space-y-4">
              {serviceAssignments.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs font-bold text-slate-600">₹{(item.price || 0).toLocaleString('en-IN')}</p>
                  </div>
                  
                  <div className="w-[200px] space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Assign To</Label>
                    <Select 
                      value={item.assignedBusiness} 
                      onValueChange={(value) => {
                        const newAssignments = [...serviceAssignments];
                        newAssignments[index].assignedBusiness = value;
                        setServiceAssignments(newAssignments);
                      }}
                    >
                      <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auto Gamma">Auto Gamma</SelectItem>
                        <SelectItem value="AGNX">AGNX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t flex justify-end items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAssignBusinessOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={confirmCompleteService}
              disabled={updateStageMutation.isPending}
            >
              {updateStageMutation.isPending ? "Generating..." : "Generate Invoices Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
