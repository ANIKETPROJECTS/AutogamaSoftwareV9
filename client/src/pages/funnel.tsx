import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, Wrench, Phone, MapPin, Search, History, Car, Clock, Mail, Briefcase, DollarSign, Calendar, Pencil, Trash2, ReceiptText } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const FUNNEL_STAGES = [
  { key: "New Lead", label: "New Lead", color: "blue" },
  { key: "Inspection Done", label: "Inspection Done", color: "cyan" },
  { key: "Work In Progress", label: "Work In Progress", color: "orange" },
  { key: "Completed", label: "Completed", color: "green" },
  { key: "Cancelled", label: "Cancelled", color: "red" },
];

const PHASE_COLORS: Record<string, string> = {
  "New Lead": "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300",
  "Inspection Done": "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300",
  "Work In Progress": "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300",
  "Completed": "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300",
  "Cancelled": "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300",
};

const STAGE_BG_COLORS: Record<string, string> = {
  "New Lead": "bg-blue-50 dark:bg-blue-950/20",
  "Inspection Done": "bg-cyan-50 dark:bg-cyan-950/20",
  "Work In Progress": "bg-orange-50 dark:bg-orange-950/20",
  "Completed": "bg-green-50 dark:bg-green-950/20",
  "Cancelled": "bg-red-50 dark:bg-red-950/20",
};

export default function CustomerFunnel() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customersData = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list(),
  });

  const customers = Array.isArray(customersData) ? customersData : (customersData?.customers || []);

  const { data: jobsData = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
  });

  const jobs = Array.isArray(jobsData) ? jobsData : (jobsData?.jobs || []);

  const getCustomerJobHistory = (customerId: string) => {
    return jobs.filter((job: any) => job.customerId === customerId);
  };

  const filteredCustomers = customers.filter((customer: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = customer.name?.toLowerCase().includes(query);
    const phoneMatch = customer.phone?.includes(query);
    const vehicleMatch = customer.vehicles?.some((v: any) => 
      v.make?.toLowerCase().includes(query) ||
      v.model?.toLowerCase().includes(query) ||
      v.plateNumber?.toLowerCase().includes(query)
    );
    return nameMatch || phoneMatch || vehicleMatch;
  });

  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [pendingJob, setPendingJob] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ vehicleName: "", plateNumber: "", totalAmount: 0 });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, serviceItems, cancellationReason, requiresGST, discount }: { 
      id: string; 
      status: string; 
      serviceItems?: any[]; 
      cancellationReason?: string;
      requiresGST?: boolean;
      discount?: number;
    }) =>
      api.jobs.updateStage(id, status, serviceItems, cancellationReason, requiresGST, discount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data.stage === 'Completed') {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      }
      const message = data.stage === 'Completed' ? "Service completed & invoice created!" : 
                     data.stage === 'Cancelled' ? "Service cancelled" : "Status updated";
      toast({ title: message });
      setAssignmentOpen(false);
      setCancelDialogOpen(false);
      setCancellationReason("");
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Failed to update status";
      toast({ title: errorMsg, variant: "destructive" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => api.jobs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job deleted successfully" });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to delete job", variant: "destructive" });
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.jobs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job updated successfully" });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update job", variant: "destructive" });
    }
  });

  const handleStageChange = (job: any, newStage: string) => {
    if (newStage === 'Completed') {
      setPendingJob(job);
      setAssignmentOpen(true);
    } else if (newStage === 'Cancelled') {
      setPendingJob(job);
      setCancelDialogOpen(true);
    } else {
      updateStatusMutation.mutate({ id: job._id, status: newStage });
    }
  };

  const handleCancelConfirm = () => {
    if (!pendingJob) return;
    updateStatusMutation.mutate({ 
      id: pendingJob._id, 
      status: 'Cancelled',
      cancellationReason 
    });
  };

  const { data: invoicesData = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.invoices.list(),
  });

  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  const getJobsByStage = (stage: string) => {
    return jobs.filter((job: any) => {
      const isStage = job.stage === stage;
      if (!isStage) return false;
      
      const customerForStage = customers.find((c: any) => c._id === job.customerId);

      // Filter out paid completed jobs
      if (stage === 'Completed') {
        const jobInvoices = invoices.filter((inv: any) => {
          // Normalize IDs to handle potential MongoDB ObjectId vs String issues
          const invJobId = (inv.jobId?._id || inv.jobId || "").toString();
          const currentJobId = (job._id?._id || job._id || "").toString();
          return invJobId === currentJobId;
        });
        
        // Only hide if all related invoices are paid
        if (jobInvoices.length > 0 && jobInvoices.every((inv: any) => {
          // Normalize status and check for 'paid'
          const status = (inv.paymentStatus || inv.status || "").toString().toLowerCase();
          return status === 'paid';
        })) {
          return false;
        }
      }
      
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      
      const nameMatch = customerForStage?.name?.toLowerCase().includes(query);
      const phoneMatch = customerForStage?.phone?.includes(query);
      const vehicleMatch = job.vehicleName?.toLowerCase().includes(query) || 
                          job.plateNumber?.toLowerCase().includes(query);
      
      return nameMatch || phoneMatch || vehicleMatch;
    });
  };

  const stageCounts = FUNNEL_STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = getJobsByStage(stage.key).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-8">
      {/* Summary Cards - All 5 Stages */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {FUNNEL_STAGES.map((stage) => (
          <Card key={stage.key} className={cn("border-2", "hover:shadow-md transition-all", 
            stage.key === "New Lead" ? "border-blue-300" :
            stage.key === "Inspection Done" ? "border-cyan-300" :
            stage.key === "Work In Progress" ? "border-orange-300" :
            stage.key === "Completed" ? "border-green-300" :
            "border-red-300"
          )}>
            <CardContent className="p-3">
              <div className="text-center space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 line-clamp-2">{stage.label}</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{stageCounts[stage.key]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pb-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-slate-600">Track service jobs through different stages</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, or car..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
              data-testid="input-search-customer"
            />
          </div>
        </div>
      </div>

      {/* Rows for each stage */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        <div className="space-y-6">
          {FUNNEL_STAGES.map((stage) => (
            <div key={stage.key} className={cn("rounded-lg border p-4 bg-gradient-to-br", STAGE_BG_COLORS[stage.key], "border-slate-200")}>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={cn(PHASE_COLORS[stage.key], "px-3 py-1 text-sm font-semibold")}>{stage.label}</Badge>
                <span className="text-sm text-slate-600 font-medium">({stageCounts[stage.key]}) jobs</span>
              </div>

              {getJobsByStage(stage.key).length === 0 ? (
                <p className="text-sm text-slate-500">No services in this phase</p>
              ) : (
                <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <div className="flex flex-nowrap gap-4 min-w-full">
                    {getJobsByStage(stage.key).map((job: any) => {
                      const customer = customers.find((c: any) => c._id === job.customerId);
                      const hasInvoice = invoices.some((inv: any) => {
                        const invJobId = (inv.jobId?._id || inv.jobId || "").toString();
                        const currentJobId = (job._id?._id || job._id || "").toString();
                        return invJobId === currentJobId;
                      });
                      return (
                      <Card
                        key={job._id}
                        className="bg-white border-slate-200 flex-shrink-0 w-80 hover:shadow-md transition-shadow hover-elevate"
                        data-testid={`funnel-job-${job._id}`}
                      >
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-1 pb-3 border-b border-slate-100">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">{customer?.name || 'Unknown'}</h4>
                            <p className="text-xs text-slate-600 flex items-center gap-0.5 mt-1">
                              <Phone className="w-3 h-3" />
                              <span className="truncate">{customer?.phone || 'N/A'}</span>
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setJobToEdit(job);
                                setEditForm({
                                  vehicleName: job.vehicleName || "",
                                  plateNumber: job.plateNumber || "",
                                  totalAmount: job.totalAmount || 0
                                });
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setJobToDelete(job);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Invoice Status */}
                        {hasInvoice && (
                          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1.5 rounded border border-green-100">
                            <ReceiptText className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Invoice Generated</span>
                          </div>
                        )}

                        {/* Vehicle Info */}
                        {job.vehicleName && (
                          <div className="bg-slate-50 rounded p-2 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-900 truncate">{job.vehicleName}</p>
                            {job.plateNumber && (
                              <p className="text-[10px] text-slate-600 truncate">{job.plateNumber}</p>
                            )}
                          </div>
                        )}

                        {/* Cost */}
                        {job.totalAmount > 0 && (
                          <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded border border-slate-200">
                            <span className="text-xs font-medium text-slate-600">Cost:</span>
                            <span className="text-sm font-bold text-slate-900">
                              ₹{job.totalAmount.toLocaleString('en-IN')}
                              {!job.requiresGST && <span className="text-[9px] ml-1 text-slate-400 font-normal">(No GST)</span>}
                            </span>
                          </div>
                        )}

                        {/* Payment Status */}
                        {job.paymentStatus && (
                          <Badge variant="outline" className="text-xs px-2 py-1 h-6 w-full justify-center mb-2">
                            {job.paymentStatus}
                          </Badge>
                        )}

                        {/* Cancellation Reason */}
                        {job.stage === 'Cancelled' && job.cancellationReason && (
                          <div className="bg-red-50 p-2 rounded border border-red-100 mt-2">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Cancellation Reason</p>
                            <p className="text-xs text-red-700 italic">"{job.cancellationReason}"</p>
                          </div>
                        )}

                        {/* Status Update Dropdown */}
                        <div className="pt-2 border-t border-slate-100">
                          <Select
                            value={job.stage}
                            disabled={job.stage === 'Completed' || job.stage === 'Cancelled'}
                            onValueChange={(value) => handleStageChange(job, value)}
                          >
                            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              {FUNNEL_STAGES.map((s) => (
                                <SelectItem 
                                  key={s.key} 
                                  value={s.key} 
                                  className="text-[10px]"
                                  disabled={s.key === 'Cancelled' && job.stage === 'Completed'}
                                >
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Business Assignment Dialog */}
      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold">Complete Service - Assign Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <p className="text-sm text-slate-500">Select which business each service item belongs to. Separate invoices will be generated for each business.</p>
            <div className="space-y-4">
              {pendingJob?.serviceItems?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="w-[200px] space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Assign To</p>
                    <Select 
                      value={item.assignedBusiness || 'Auto Gamma'} 
                      onValueChange={(val) => {
                        const newItems = [...pendingJob.serviceItems];
                        newItems[index] = { ...newItems[index], assignedBusiness: val };
                        setPendingJob({ ...pendingJob, serviceItems: newItems });
                      }}
                    >
                      <SelectTrigger className="w-full h-9 text-xs bg-white border-slate-200">
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
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAssignmentOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={() => updateStatusMutation.mutate({ 
                  id: pendingJob._id, 
                  status: 'Completed',
                  serviceItems: pendingJob.serviceItems,
                  requiresGST: pendingJob.requiresGST,
                  discount: pendingJob.discount || 0
                })}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Completing..." : "Complete & Generate Invoice"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Personal Information - Compact */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wider">Personal Information</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 min-w-fit">Name:</span>
                    <p className="text-slate-600 truncate">{selectedCustomer.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-900 min-w-fit">Phone:</span>
                    <p className="text-slate-600 truncate">{selectedCustomer.phone}</p>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium min-w-fit">Email:</span>
                      <p className="truncate">{selectedCustomer.email}</p>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">Address:</span>
                        <p className="text-xs text-muted-foreground truncate">{selectedCustomer.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Information - Compact */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wider">Service Information</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium min-w-fit">Status:</span>
                    <Badge variant="outline" className={cn(`text-xs`, PHASE_COLORS[selectedCustomer.status || 'Inquired'])}>
                      {selectedCustomer.status || 'Inquired'}
                    </Badge>
                  </div>
                  {selectedCustomer.service && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">Service:</span>
                        <p className="text-xs text-muted-foreground truncate">{selectedCustomer.service}</p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.serviceCost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium min-w-fit">Cost:</span>
                      <p>₹{selectedCustomer.serviceCost.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {selectedCustomer.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium min-w-fit">Created:</span>
                      <p className="text-xs">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Stats - Compact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-primary/5 to-white rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider">Vehicles</p>
                  <p className="font-bold text-2xl text-primary mt-2">{selectedCustomer.vehicles?.length || 0}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-primary/5 to-white rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider">Services</p>
                  <p className="font-bold text-2xl text-primary mt-2">{jobs.filter((j: any) => j.customerId === selectedCustomer._id).length}</p>
                </div>
              </div>

              {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Vehicles</p>
                  <div className="space-y-2">
                    {selectedCustomer.vehicles.map((vehicle: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-gray-200">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.plateNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{vehicle.color}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">Change Status</p>
                <Select
                  value={selectedCustomer.status || 'Inquired'}
                  onValueChange={(value) => {
                    if (value === 'Cancelled') {
                      setPendingJob({ _id: selectedCustomer._id, customerId: selectedCustomer._id });
                      setCancelDialogOpen(true);
                    } else {
                      updateStatusMutation.mutate({
                        id: selectedCustomer._id,
                        status: value,
                      });
                    }
                    setSelectedCustomer({ ...selectedCustomer, status: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNNEL_STAGES.map((stage) => (
                      <SelectItem key={stage.key} value={stage.key}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Reason Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reason for Cancellation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Please provide a reason for cancelling this service.</p>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900"
              placeholder="Enter reason here..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setCancelDialogOpen(false)}>Back</Button>
            <Button variant="destructive" size="sm" onClick={handleCancelConfirm} disabled={!cancellationReason.trim() || updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Name</Label>
              <Input 
                value={editForm.vehicleName} 
                onChange={(e) => setEditForm({...editForm, vehicleName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Plate Number</Label>
              <Input 
                value={editForm.plateNumber} 
                onChange={(e) => setEditForm({...editForm, plateNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input 
                type="number"
                value={editForm.totalAmount} 
                onChange={(e) => setEditForm({...editForm, totalAmount: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => updateJobMutation.mutate({ id: jobToEdit._id, data: editForm })} disabled={updateJobMutation.isPending}>
                {updateJobMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service job.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteJobMutation.mutate(jobToDelete._id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteJobMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Service History - {historyCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {historyCustomer && (
            <div className="space-y-3">
              {getCustomerJobHistory(historyCustomer._id).length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">No service history</p>
              ) : (
                <div className="space-y-2">
                  {getCustomerJobHistory(historyCustomer._id).map((job: any) => (
                    <Card key={job._id} className="border-border">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <Car className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium text-sm">{job.vehicleName}</span>
                              {job.plateNumber && (
                                <Badge variant="outline" className="text-xs">{job.plateNumber}</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: <Badge className="text-xs ml-1" variant="outline">{job.stage}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
