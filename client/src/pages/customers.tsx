import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, User, Phone, Car, ChevronRight, MapPin, Wrench, X, Trash2 } from 'lucide-react';
import { Link } from 'wouter';

const CUSTOMER_STATUSES = ['Inquired', 'Working', 'Waiting', 'Completed'];

const VEHICLE_DATA: Record<string, string[]> = {
  'Toyota': ['Fortuner', 'Innova', 'Fortuner Legender', 'Glanza', 'Urban Cruiser', 'Other'],
  'Maruti': ['Swift', 'Wagon R', 'Alto', 'Dzire', 'Celerio', 'Vitara Brezza', 'XL5', 'Other'],
  'Hyundai': ['Creta', 'i20', 'Venue', 'Verna', 'Tucson', 'Kona Electric', 'Other'],
  'Mahindra': ['XUV500', 'XUV700', 'Bolero', 'Scorpio', 'Thar', 'KUV100', 'Other'],
  'Tata': ['Nexon', 'Harrier', 'Safari', 'Punch', 'Tigor', 'Altroz', 'Other'],
  'Honda': ['City', 'Civic', 'CR-V', 'Jazz', 'WR-V', 'Other'],
  'Skoda': ['Superb', 'Octavia', 'Slavia', 'Kushaq', 'Other'],
  'Volkswagen': ['Vento', 'Polo', 'Tiguan', 'T-Roc', 'Other'],
  'Kia': ['Sonet', 'Seltos', 'Carens', 'EV6', 'Other'],
  'MG': ['Hector', 'ZS EV', 'Astor', 'Gloster', 'Other'],
  'Other': ['Other']
};

const VEHICLE_MAKES = ['Toyota', 'Maruti', 'Hyundai', 'Mahindra', 'Tata', 'Honda', 'Skoda', 'Volkswagen', 'Kia', 'MG', 'Other'];

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  const cleanedPhone = phone.replace(/[\s+\-]/g, '');
  return phoneRegex.test(cleanedPhone) && cleanedPhone.length === 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return emailRegex.test(email.toLowerCase());
};

const STATUS_COLORS: Record<string, string> = {
  Inquired: "bg-blue-100 text-blue-700 border-blue-200",
  Working: "bg-orange-100 text-orange-700 border-orange-200",
  Waiting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Completed: "bg-gray-100 text-black border-gray-300",
};

export default function Customers() {
  const [search, setSearch] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedServiceCustomerId, setSelectedServiceCustomerId] = useState<string>('');
  const [newCustomerStatus, setNewCustomerStatus] = useState('Inquired');
  const [formErrors, setFormErrors] = useState<{ phone?: string; email?: string }>({});
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    service: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    plateNumber: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.customers.list(search || undefined),
  });

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const handleCustomerSelect = (customerId: string) => {
    setSelectedServiceCustomerId(customerId);
    
    if (customerId && customerId !== 'new') {
      const customer = allCustomers.find((c: any) => c._id === customerId);
      if (customer) {
        const vehicle = customer.vehicles?.[0] || {};
        setFormData({
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          city: customer.city || '',
          district: customer.district || '',
          state: customer.state || '',
          service: '',
          vehicleMake: vehicle.make || '',
          vehicleModel: vehicle.model || '',
          vehicleYear: vehicle.year || '',
          vehicleColor: vehicle.color || '',
          plateNumber: vehicle.plateNumber || ''
        });
        setNewCustomerStatus(customer.status || 'Inquired');
      }
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        district: '',
        state: '',
        service: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        vehicleColor: '',
        plateNumber: ''
      });
      setNewCustomerStatus('Inquired');
    }
  };

  const createCustomerMutation = useMutation({
    mutationFn: api.customers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowServiceForm(false);
      setSelectedServiceCustomerId('');
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        service: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        vehicleColor: '',
        plateNumber: ''
      });
      toast({ title: 'Customer service added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add customer service', variant: 'destructive' });
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.customers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update customer', variant: 'destructive' });
    }
  });

  const addVehicleMutation = useMutation({
    mutationFn: ({ id, vehicle }: { id: string; vehicle: any }) => api.customers.addVehicle(id, vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setVehicleDialogOpen(false);
      toast({ title: 'Vehicle added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add vehicle', variant: 'destructive' });
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => api.customers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete customer', variant: 'destructive' });
    }
  });

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleCreateCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const newErrors: { phone?: string; email?: string } = {};
    
    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }
    
    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid Gmail address";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    
    setFormErrors({});

    if (selectedServiceCustomerId && selectedServiceCustomerId !== 'new') {
      updateCustomerMutation.mutate({
        id: selectedServiceCustomerId,
        data: {
          service: formData.service,
          status: newCustomerStatus
        }
      });
      setShowServiceForm(false);
      setSelectedServiceCustomerId('');
    } else {
      createCustomerMutation.mutate({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        city: (formData as any).city || undefined,
        district: (formData as any).district || undefined,
        state: (formData as any).state || undefined,
        status: newCustomerStatus,
        service: formData.service,
        vehicles: [{
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: formData.vehicleYear,
          plateNumber: formData.plateNumber,
          color: formData.vehicleColor,
        }]
      });
    }
  };

  const handleAddVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    
    const form = e.currentTarget;
    const fd = new FormData(form);
    
    addVehicleMutation.mutate({
      id: selectedCustomerId,
      vehicle: {
        make: fd.get('make') as string,
        model: fd.get('model') as string,
        year: fd.get('year') as string,
        plateNumber: fd.get('plateNumber') as string,
        color: fd.get('color') as string,
      }
    });
  };

  const handleStatusChange = (customerId: string, newStatus: string) => {
    updateCustomerMutation.mutate({
      id: customerId,
      data: { status: newStatus }
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/customers/export');
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = await import('xlsx');
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const items = XLSX.utils.sheet_to_json(sheet);

        const response = await fetch('/api/customers/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });

        if (!response.ok) throw new Error('Import failed');
        
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast({ title: 'Import successful' });
      } catch (error) {
        toast({ title: 'Import failed', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export-customers">
            Export
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleImport}
              data-testid="input-import-customers"
            />
            <Button variant="outline">Import</Button>
          </div>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 ml-auto" 
          data-testid="button-add-service"
          onClick={() => setShowServiceForm(!showServiceForm)}
        >
           
          Add Customer Service
        </Button>
      </div>

      {showServiceForm && (
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 pt-6">
            <CardTitle>Add Customer Service</CardTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowServiceForm(false);
                setSelectedServiceCustomerId('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCustomer} className="space-y-6">
              <div className="space-y-2">
                <Label>Select Existing Customer (Optional)</Label>
                <Select value={selectedServiceCustomerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger data-testid="select-existing-customer">
                    <SelectValue placeholder="Select a customer or add new below" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">-- Add New Customer --</SelectItem>
                    {allCustomers.map((customer: any) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required={!selectedServiceCustomerId || selectedServiceCustomerId === 'new'}
                    disabled={!!selectedServiceCustomerId && selectedServiceCustomerId !== 'new'}
                    placeholder="Customer name" 
                    data-testid="input-customer-name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number (10 digits) *</Label>
                  <Input 
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                      setFormData({...formData, phone: value});
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                    }}
                    required={!selectedServiceCustomerId || selectedServiceCustomerId === 'new'}
                    disabled={!!selectedServiceCustomerId && selectedServiceCustomerId !== 'new'}
                    placeholder="9876543210" 
                    maxLength={10}
                    data-testid="input-customer-phone"
                    className={formErrors.phone ? "border-red-500" : ""}
                  />
                  {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gmail Email *</Label>
                  <Input 
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                    }}
                    type="email"
                    required={!selectedServiceCustomerId || selectedServiceCustomerId === 'new'}
                    disabled={!!selectedServiceCustomerId && selectedServiceCustomerId !== 'new'}
                    placeholder="name@gmail.com" 
                    data-testid="input-customer-email"
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    disabled={!!selectedServiceCustomerId && selectedServiceCustomerId !== 'new'}
                    placeholder="Area / Street" 
                    data-testid="input-customer-address" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input 
                    value={(formData as any).city || ''}
                    onChange={(e) => setFormData({...formData, city: e.target.value} as any)}
                    disabled={!!selectedServiceCustomerId && selectedServiceCustomerId !== 'new'}
                    placeholder="City" 
                    data-testid="input-customer-city" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input 
                    value={(formData as any).district || ''}
                    onChange={(e) => setFormData({...formData, district: e.target.value} as any)}
                    disabled={!!selectedServiceCustomerId && selectedServiceCustomerId !== 'new'}
                    placeholder="District" 
                    data-testid="input-customer-district" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input 
                    value={(formData as any).state || ''}
                    onChange={(e) => setFormData({...formData, state: e.target.value} as any)}
                    disabled={!!selectedServiceCustomerId && selectedServiceCustomerId !== 'new'}
                    placeholder="State" 
                    data-testid="input-customer-state" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newCustomerStatus} onValueChange={setNewCustomerStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Required *</Label>
                  <Input 
                    value={formData.service}
                    onChange={(e) => setFormData({...formData, service: e.target.value})}
                    required 
                    placeholder="e.g., PPF, Ceramic Coating, Denting" 
                    data-testid="input-customer-service" 
                  />
                </div>
              </div>

              {(!selectedServiceCustomerId || selectedServiceCustomerId === 'new') && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Vehicle Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Make *</Label>
                      <Select value={formData.vehicleMake} onValueChange={(value) => setFormData({...formData, vehicleMake: value, vehicleModel: ''})}>
                        <SelectTrigger data-testid="input-vehicle-make">
                          <SelectValue placeholder="Select make" />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_MAKES.map((make) => (
                            <SelectItem key={make} value={make}>
                              {make}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model *</Label>
                      <Select value={formData.vehicleModel} onValueChange={(value) => setFormData({...formData, vehicleModel: value})} disabled={!formData.vehicleMake}>
                        <SelectTrigger data-testid="input-vehicle-model">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.vehicleMake && VEHICLE_DATA[formData.vehicleMake]?.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input 
                        value={formData.vehicleYear}
                        onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
                        placeholder="2023" 
                        data-testid="input-vehicle-year" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color *</Label>
                      <Input 
                        value={formData.vehicleColor}
                        onChange={(e) => setFormData({...formData, vehicleColor: e.target.value})}
                        required 
                        placeholder="White" 
                        data-testid="input-vehicle-color" 
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Plate Number *</Label>
                      <Input 
                        value={formData.plateNumber}
                        onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                        required 
                        placeholder="MH02 AB 1234" 
                        data-testid="input-plate-number" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedServiceCustomerId && selectedServiceCustomerId !== 'new' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Selected Vehicle</h4>
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                    <Car className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formData.vehicleMake} {formData.vehicleModel} ({formData.vehicleColor})</p>
                      <p className="text-sm text-muted-foreground">{formData.plateNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full md:w-auto bg-primary"
                disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                data-testid="button-submit-customer"
              >
                {createCustomerMutation.isPending || updateCustomerMutation.isPending 
                  ? 'Saving...' 
                  : (selectedServiceCustomerId && selectedServiceCustomerId !== 'new')
                    ? 'Update Customer Service' 
                    : 'Add Customer Service'
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        
        <Input
          placeholder="Search by name, phone, or plate number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-customers"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {search ? 'No customers match your search' : 'No customers yet. Add your first customer!'}
          </div>
        ) : (
          customers.map((customer: any) => (
            <Card 
              key={customer._id} 
              className="card-modern"
              data-testid={`customer-card-${customer._id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select 
                    value={customer.status || 'Inquired'} 
                    onValueChange={(value) => handleStatusChange(customer._id, value)}
                  >
                    <SelectTrigger className={`w-auto h-7 text-xs ${STATUS_COLORS[customer.status || 'Inquired']}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {customer.service && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{customer.service}</span>
                  </div>
                )}

                {customer.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {customer.address}
                  </p>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Vehicles ({customer.vehicles.length})</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedCustomerId(customer._id);
                        setVehicleDialogOpen(true);
                      }}
                      data-testid={`button-add-vehicle-${customer._id}`}
                    >
                       
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {customer.vehicles.map((vehicle: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-gray-200">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.plateNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{vehicle.color}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href={`/customers/${customer._id}`} className="w-full">
                  <Button variant="outline" className="w-full" data-testid={`button-view-customer-${customer._id}`}>
                    Details
                  </Button>
                </Link>
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleDeleteCustomer(customer._id)}
                  disabled={deleteCustomerMutation.isPending}
                  data-testid={`button-delete-customer-${customer._id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Customer
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Make *</Label>
                <Select name="make" required onValueChange={(value) => {
                  const formElement = document.querySelector('input[name="make"]') as HTMLInputElement;
                  if (formElement) formElement.value = value;
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_MAKES.map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="make" />
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Select name="model" required onValueChange={(value) => {
                  const formElement = document.querySelector('input[name="model"]') as HTMLInputElement;
                  if (formElement) formElement.value = value;
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_MAKES.map((make) => VEHICLE_DATA[make]).flat().filter((v, i, a) => a.indexOf(v) === i).map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="model" />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input name="year" placeholder="2023" />
              </div>
              <div className="space-y-2">
                <Label>Color *</Label>
                <Input name="color" required placeholder="White" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Plate Number *</Label>
                <Input name="plateNumber" required placeholder="MH02 AB 1234" />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary"
              disabled={addVehicleMutation.isPending}
            >
              {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
