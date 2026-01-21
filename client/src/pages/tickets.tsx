import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { usePageContext } from "@/contexts/page-context";
import { useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  MoreVertical,
  Ticket as TicketIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketSchema, type Ticket, type InsertTicket } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function Tickets() {
  const { setPageTitle } = usePageContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPageTitle("Tickets", "Manage notes and reminders linked to customers");
  }, [setPageTitle]);

  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: customers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    select: (data: any) => data.customers || [],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTicket) => apiRequest("POST", "/api/tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Success", description: "Ticket created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTicket> }) => 
      apiRequest("PATCH", `/api/tickets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Success", description: "Ticket updated successfully" });
      setIsDialogOpen(false);
      setEditingTicket(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tickets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Success", description: "Ticket deleted successfully" });
    },
  });

  const form = useForm<InsertTicket>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      customerId: "",
      customerName: "",
      note: "",
    },
  });

  const onSubmit = (data: InsertTicket) => {
    if (editingTicket) {
      updateMutation.mutate({ id: editingTicket._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    form.reset({
      customerId: ticket.customerId,
      customerName: ticket.customerName,
      note: ticket.note,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredTickets = tickets?.filter(t => 
    t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickets..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTicket(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTicket ? "Edit Ticket" : "Create New Ticket"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          const customer = customers?.find(c => c._id === val);
                          if (customer) form.setValue("customerName", customer.name);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem key={customer._id} value={customer._id}>
                              {customer.name} ({customer.phone})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Write your note here..." 
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTicket ? "Save Changes" : "Create Ticket"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ticketsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredTickets?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <TicketIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No tickets found</h3>
            <p className="text-sm text-muted-foreground">Create your first ticket to keep track of customer notes.</p>
          </div>
        ) : (
          filteredTickets?.map((ticket) => (
            <Card key={ticket._id} className="hover-elevate transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">
                    {ticket.customerName}
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase">
                    {format(new Date(ticket.createdAt), "PPp")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(ticket)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(ticket._id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap italic">
                  "{ticket.note}"
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Helper for API requests since it might not be exported from @lib/api
async function apiRequest(method: string, url: string, data?: any) {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}
