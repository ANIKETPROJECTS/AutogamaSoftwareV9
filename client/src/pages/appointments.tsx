import { useLocation } from 'wouter';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Trash2, List, AlertCircle, X, ChevronUp, ChevronDown, Clock, MoreVertical, Check, CalendarDays, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const TimePicker = ({ value, onChange, error }: { value: string, onChange: (val: string) => void, error?: string }) => {
  const initialHours24 = value ? parseInt(value.split(':')[0]) : 9;
  const initialMinutes = value ? parseInt(value.split(':')[1]) : 0;
  
  const h12 = initialHours24 === 0 ? 12 : initialHours24 > 12 ? initialHours24 - 12 : initialHours24;
  const initialAmPm = initialHours24 >= 12 ? 'PM' : 'AM';

  const [hoursInput, setHoursInput] = useState(h12.toString().padStart(2, '0'));
  const [minutesInput, setMinutesInput] = useState(initialMinutes.toString().padStart(2, '0'));

  useEffect(() => {
    setHoursInput(h12.toString().padStart(2, '0'));
    setMinutesInput(initialMinutes.toString().padStart(2, '0'));
  }, [h12, initialMinutes]);

  const handleTimeChange = (h: string, m: string, p: string) => {
    let h24 = parseInt(h);
    if (p === 'PM' && h24 < 12) h24 += 12;
    if (p === 'AM' && h24 === 12) h24 = 0;
    const timeStr = `${h24.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
    onChange(timeStr);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="space-y-2">
      <div className={cn(
        "flex items-center gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 w-fit",
        error && "border-red-200 bg-red-50/30"
      )}>
        <Clock className="w-5 h-5 text-slate-400 mr-2" />
        
        <Select 
          value={h12.toString().padStart(2, '0')} 
          onValueChange={(h) => handleTimeChange(h, initialMinutes.toString(), initialAmPm)}
        >
          <SelectTrigger className="w-[70px] h-8 font-bold text-sm border-slate-200 bg-white shadow-sm">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>

        <span className="text-sm font-bold text-slate-400">:</span>

        <Select 
          value={initialMinutes.toString().padStart(2, '0')} 
          onValueChange={(m) => handleTimeChange(h12.toString(), m, initialAmPm)}
        >
          <SelectTrigger className="w-[70px] h-8 font-bold text-sm border-slate-200 bg-white shadow-sm">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select 
          value={initialAmPm} 
          onValueChange={(p) => handleTimeChange(h12.toString(), initialMinutes.toString(), p)}
        >
          <SelectTrigger className="w-[65px] h-8 font-bold text-sm border-slate-200 bg-white shadow-sm">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 px-1 text-sm font-medium text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const STATUS_COLORS: Record<string, string> = {
  'Scheduled': 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  'Done': 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300',
  'Cancelled': 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
};

export default function Appointments() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelData, setCancelData] = useState<{ id: string } | null>(null);
  const [rescheduleData, setRescheduleData] = useState<any | null>(null);
  const [time, setTime] = useState('09:00');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [, setLocation] = useLocation();
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', searchQuery],
    queryFn: () => api.appointments.list({ 
      date: undefined
    }),
  });
  const appointments = appointmentsData?.appointments || [];

  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => api.appointments.create(data),
    onSuccess: () => {
      setShowForm(false);
      setFormErrors({});
      toast({ title: 'Appointment booked successfully' });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => {
      toast({ title: 'Failed to book appointment', variant: 'destructive' });
    }
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: string) => api.appointments.delete(id),
    onSuccess: () => {
      toast({ title: 'Appointment deleted' });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => {
      toast({ title: 'Failed to delete appointment', variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, cancelReason }: { id: string; status: string; cancelReason?: string }) => 
      api.appointments.update(id, { status, cancelReason }),
    onSuccess: (updatedAppt: any) => {
      toast({ title: 'Appointment updated' });
      setCancelData(null);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      if (updatedAppt.status === 'Done') {
        const params = new URLSearchParams();
        params.set('createInvoice', 'true');
        params.set('name', updatedAppt.customerName || '');
        params.set('phone', updatedAppt.customerPhone || '');
        params.set('vehicle', updatedAppt.vehicleInfo || '');
        params.set('service', updatedAppt.serviceType || '');
        setLocation(`/register?${params.toString()}`);
      }
    }
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, date, time }: { id: string; date: string; time: string }) => 
      api.appointments.update(id, { date, time }),
    onSuccess: () => {
      toast({ title: 'Appointment rescheduled' });
      setRescheduleData(null);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const phone = (formData.get('customerPhone') as string) || '';
    const email = (formData.get('customerEmail') as string) || '';
    const selectedDate = (formData.get('date') as string) || '';
    const errors: Record<string, string> = {};

    if (!validatePhone(phone)) {
      errors.customerPhone = 'Phone must be 10 digits';
    }
    if (email && !validateEmail(email)) {
      errors.customerEmail = 'Invalid email address';
    }

    if (selectedDate && time) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      
      if (selectedDate === todayString) {
        const [hours, minutes] = time.split(':');
        const appointmentTime = new Date();
        appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (appointmentTime <= today) {
          errors.time = 'Cannot book appointments for past times.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createAppointmentMutation.mutate({
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      customerEmail: formData.get('customerEmail') as string || undefined,
      vehicleInfo: formData.get('vehicleInfo') as string,
      serviceType: formData.get('serviceType') as string,
      date: selectedDate,
      time: time,
      notes: formData.get('notes') as string || undefined,
      status: 'Scheduled'
    });
    
    form.reset();
    setTime('09:00');
  };

  const [statusFilter, setStatusFilter] = useState<string>("Scheduled");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredAppointments = useMemo(() => {
    let result = appointments.filter((appt: any) => {
      // Search filter
      const matchesSearch = !searchQuery.trim() || 
        appt.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appt.customerPhone?.includes(searchQuery) ||
        appt.vehicleInfo?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || appt.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort by date and time
    result.sort((a: any, b: any) => {
      const dateA = new Date(`${format(new Date(a.date), 'yyyy-MM-dd')}T${a.time}`);
      const dateB = new Date(`${format(new Date(b.date), 'yyyy-MM-dd')}T${b.time}`);
      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [appointments, searchQuery, statusFilter, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2 relative">
          <Label className="mb-2 block">Search</Label>
          <Search className="absolute left-3 top-9 w-4 h-4 text-secondary" />
          <Input
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-appointments"
          />
        </div>
        <div>
          <Label className="mb-2 block">Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Sort by Date</Label>
          <Button 
            variant="outline" 
            className="w-full justify-between" 
            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            data-testid="button-sort-date"
          >
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
            {sortOrder === "asc" ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-6">
          Book Appointment
        </Button>
      ) : (
        <Card className="mb-6 border-slate-200">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input id="customerName" name="customerName" placeholder="John Doe" required />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone *</Label>
                  <Input id="customerPhone" name="customerPhone" placeholder="9876543210" required maxLength={10} />
                  {formErrors.customerPhone && <p className="text-red-500 text-sm mt-1">{formErrors.customerPhone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleInfo">Vehicle Info *</Label>
                  <Input id="vehicleInfo" name="vehicleInfo" placeholder="Toyota Fortuner" required />
                </div>
                <div>
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Input id="serviceType" name="serviceType" placeholder="General Service" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" name="date" type="date" required min={format(new Date(), 'yyyy-MM-dd')} />
                </div>
                <div>
                  <Label htmlFor="time">Time *</Label>
                  <TimePicker value={time} onChange={setTime} error={formErrors.time} />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit" className="flex-1" disabled={createAppointmentMutation.isPending}>
                  {createAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-900/30">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt: any, index: number) => (
                  <tr key={appt._id} className={cn("border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/20", index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-950/20")}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-50">{appt.customerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{appt.customerPhone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{appt.vehicleInfo}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{appt.serviceType}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{format(new Date(appt.date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{appt.time}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1 min-w-[150px]">
                        <Badge className={cn("text-[10px] uppercase w-fit", STATUS_COLORS[appt.status])}>
                          {appt.status}
                        </Badge>
                        {appt.status === 'Cancelled' && appt.cancelReason && (
                          <span className="text-[12px] text-red-500 font-medium italic leading-tight break-words whitespace-normal max-w-[200px]">
                            Reason: {appt.cancelReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        {appt.status === 'Scheduled' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8">
                                <MoreVertical className="w-4 h-4 mr-1" />
                                Options
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setRescheduleData(appt);
                                  setRescheduleTime(appt.time);
                                }}
                              >
                                <CalendarDays className="w-4 h-4 mr-2" />
                                Reschedule
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-orange-600 focus:text-orange-700"
                                onClick={() => setCancelData({ id: appt._id })}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Done' })}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Mark Done
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8 text-destructive" 
                          onClick={() => setDeleteId(appt._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAppointments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No appointments found
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteId) deleteAppointmentMutation.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!cancelData} onOpenChange={(open) => !open && setCancelData(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const reason = formData.get('cancelReason') as string;
            if (cancelData) updateStatusMutation.mutate({ id: cancelData.id, status: 'Cancelled', cancelReason: reason });
          }} className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Reason for cancellation</Label>
              <Textarea id="cancelReason" name="cancelReason" placeholder="Enter reason..." required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCancelData(null)}>Back</Button>
              <Button type="submit" variant="destructive" disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rescheduleData} onOpenChange={(open) => !open && setRescheduleData(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const date = formData.get('date') as string;
            if (rescheduleData) rescheduleMutation.mutate({ id: rescheduleData._id, date, time: rescheduleTime });
          }} className="space-y-4">
            <div>
              <Label htmlFor="rescheduleDate">New Date</Label>
              <Input id="rescheduleDate" name="date" type="date" required defaultValue={rescheduleData?.date ? format(new Date(rescheduleData.date), 'yyyy-MM-dd') : ''} min={format(new Date(), 'yyyy-MM-dd')} />
            </div>
            <div>
              <Label>New Time</Label>
              <TimePicker value={rescheduleTime} onChange={setRescheduleTime} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRescheduleData(null)}>Back</Button>
              <Button type="submit" disabled={rescheduleMutation.isPending}>
                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Reschedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
