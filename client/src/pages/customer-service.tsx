import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, User, Car, Package, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { PPF_CATEGORIES, OTHER_SERVICES, VEHICLE_TYPES } from '@/lib/service-catalog';

type SelectedService = {
  name: string;
  vehicleType: string;
  price: number;
  discount: number;
  category?: string;
  warranty?: string;
};

export default function CustomerService() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<string>('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [ppfDiscount, setPpfDiscount] = useState<string>('');
  const [laborCost, setLaborCost] = useState<string>('');
  const [includeGst, setIncludeGst] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ inventoryId: string; metersUsed?: number; name: string; unit: string; quantity?: number; rollId?: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [metersUsed, setMetersUsed] = useState<string>('1');
  const [expandedInventoryId, setExpandedInventoryId] = useState<string | null>(null);

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicleMake, setNewVehicleMake] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState('');
  const [newVehicleColor, setNewVehicleColor] = useState('');

  const [ppfCategory, setPpfCategory] = useState('');
  const [ppfVehicleType, setPpfVehicleType] = useState('');
  const [ppfWarranty, setPpfWarranty] = useState('');
  const [ppfPrice, setPpfPrice] = useState(0);
  const [ppfGstEnabled, setPpfGstEnabled] = useState(false);
  const [otherServicesGstEnabled, setOtherServicesGstEnabled] = useState(false);
  const [ppfWarrantyFromPreferences, setPpfWarrantyFromPreferences] = useState(false);
  const [selectedAccessoryCategory, setSelectedAccessoryCategory] = useState('');
  const [selectedAccessoryId, setSelectedAccessoryId] = useState('');
  const [accessoryQuantity, setAccessoryQuantity] = useState('1');
  const [selectedAccessories, setSelectedAccessories] = useState<{ id: string; name: string; category: string; price: number; quantity: number }[]>([]);

  const [selectedOtherServices, setSelectedOtherServices] = useState<SelectedService[]>([]);
  const [otherServiceName, setOtherServiceName] = useState('');
  const [otherServiceVehicleType, setOtherServiceVehicleType] = useState('');

  const [showPpfSection, setShowPpfSection] = useState(false);
  const [showOtherServicesSection, setShowOtherServicesSection] = useState(false);
  const [showAddAccessorySection, setShowAddAccessorySection] = useState(false);
  const [isLoadingLastService, setIsLoadingLastService] = useState(false);

  useEffect(() => {
    if (ppfCategory) setShowPpfSection(true);
  }, [ppfCategory]);

  useEffect(() => {
    if (selectedAccessoryCategory) setShowAddAccessorySection(true);
  }, [selectedAccessoryCategory]);

  const { data: customersData = [] } = useQuery<any>({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const customers = (Array.isArray(customersData) ? customersData : (customersData as any)?.customers || [])
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedCustomerId = urlParams.get('customerId');
    const preSelectedJobId = urlParams.get('jobId');
    
    if (preSelectedJobId) {
      setEditingJobId(preSelectedJobId);
      const loadJobData = async () => {
        try {
          const job = await api.jobs.get(preSelectedJobId);
          if (job) {
            setSelectedCustomerId(job.customerId);
            setServiceNotes(job.notes || '');
            setLaborCost(job.laborCost?.toString() || '');
            setIncludeGst(job.requiresGST ?? true);
            setSelectedTechnicianId(job.technicianId || '');
            
            if (job.vehicleIndex !== undefined) {
              setSelectedVehicleIndex(job.vehicleIndex.toString());
            }

            // Map service items back to form state
            if (Array.isArray(job.serviceItems)) {
              const ppfItem = job.serviceItems.find((item: any) => item.isPpf);
              if (ppfItem) {
                setPpfCategory(ppfItem.category || '');
                setPpfVehicleType(ppfItem.vehicleType || '');
                setPpfWarranty(ppfItem.warranty || '');
                setPpfPrice(ppfItem.price || 0);
                setPpfDiscount(ppfItem.discount?.toString() || '');
              }

              const otherServices = job.serviceItems
                .filter((item: any) => !item.isPpf && item.category !== 'Accessories')
                .map((item: any) => ({
                  name: item.name,
                  vehicleType: item.vehicleType || '',
                  price: item.price || 0,
                  discount: item.discount || 0
                }));
              setSelectedOtherServices(otherServices);

              const accessories = job.serviceItems
                .filter((item: any) => item.category === 'Accessories')
                .map((item: any) => ({
                  id: item.inventoryId || Math.random().toString(),
                  name: item.name,
                  category: 'Accessories',
                  price: item.price || 0,
                  quantity: item.quantity || 1
                }));
              setSelectedAccessories(accessories);

              // Map inventory items (rolls)
              const inventoryItems = job.serviceItems
                .filter((item: any) => item.sizeUsed !== undefined && !item.isPpf)
                .map((item: any) => ({
                  inventoryId: item.inventoryId || '',
                  quantity: item.sizeUsed || 0,
                  name: item.name,
                  unit: item.unit || 'Units'
                }));
              setSelectedItems(inventoryItems);
            }
          }
        } catch (error) {
          console.error("Error loading job for edit:", error);
          toast({ title: "Failed to load job details", variant: "destructive" });
        }
      };
      loadJobData();
    } else if (preSelectedCustomerId && customers.length > 0) {
      const customer = customers.find((c: any) => (c._id === preSelectedCustomerId || c.id === preSelectedCustomerId));
      if (customer) {
        const targetId = customer._id || customer.id;
        const timer = setTimeout(() => {
          setSelectedCustomerId(targetId);
          if (customer.vehicles && customer.vehicles.length > 0) {
            setSelectedVehicleIndex('0');
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [customersData]);

  const filteredCustomers = customers.filter((customer: any) => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    customer.phone.includes(customerSearch)
  );

  const displayedCustomers = customerSearch ? filteredCustomers : filteredCustomers.slice(0, 5);

  const { data: ppfCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/ppf-categories"],
  });

  const { data: dbServices = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.services.list(),
  });

  const ppfCategoriesFromServices = useMemo(() => {
    const servicesFromDb = (dbServices || [])
      .filter((s: any) => s && (s.isPpf === true || s.isPPF === true))
      .map((s: any) => ({
        _id: s._id || s.id || Math.random().toString(),
        name: s.name,
        isPpf: true,
        warrantyOptions: s.warrantyOptions || {},
        prices: s.prices || {}
      }));
    return Array.from(new Map(servicesFromDb.map(s => [s.name, s])).values());
  }, [dbServices]);

  useEffect(() => {
    if (isLoadingLastService) return;
    if (!ppfCategory || !ppfVehicleType) return;

    const selectedService = ppfCategoriesFromServices.find(s => s.name === ppfCategory);
    if (selectedService) {
      if (selectedService.warrantyOptions) {
        const vehicleTypeOptions = selectedService.warrantyOptions[ppfVehicleType];
        if (Array.isArray(vehicleTypeOptions) && ppfWarranty) {
          const option = vehicleTypeOptions.find((o: any) => o.warranty === ppfWarranty);
          if (option) {
            const calculatedPrice = option.price;
            setPpfPrice(prev => (prev === 0 || prev !== calculatedPrice ? calculatedPrice : prev));
            return;
          }
        }
      }
      
      // Fallback to single price if no warranty or option not found
      if (selectedService.prices && selectedService.prices[ppfVehicleType]) {
        const calculatedPrice = selectedService.prices[ppfVehicleType];
        setPpfPrice(prev => (prev === 0 || prev !== calculatedPrice ? calculatedPrice : prev));
        return;
      }
    }

    if (!ppfWarranty) return;
    
    const categoryData = PPF_CATEGORIES[ppfCategory as keyof typeof PPF_CATEGORIES];
    if (categoryData && (categoryData as any)[ppfVehicleType]) {
      const vehicleTypeData = (categoryData as any)[ppfVehicleType] as Record<string, number>;
      if (vehicleTypeData[ppfWarranty]) {
        const calculatedPrice = vehicleTypeData[ppfWarranty];
        setPpfPrice(prev => (prev === 0 || prev !== calculatedPrice ? calculatedPrice : prev));
      }
    }
  }, [ppfCategory, ppfVehicleType, ppfWarranty, isLoadingLastService, ppfCategoriesFromServices]);

  const { data: inventoryData = [] } = useQuery<any>({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const inventory = Array.isArray(inventoryData) ? inventoryData : (inventoryData as any)?.inventory || [];

  const ppfInventoryItems = useMemo(() => {
    return inventory.filter((item: any) => item.isPpf === true || item.isPpf === 'true' || item.isPpf === 1);
  }, [inventory]);

  const { data: techniciansData = [] } = useQuery<any>({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
  });

  const technicians = Array.isArray(techniciansData) ? techniciansData : (techniciansData as any)?.technicians || [];

  const addVehicleMutation = useMutation({
    mutationFn: async ({ customerId, vehicle }: { customerId: string; vehicle: any }) => {
      return api.customers.addVehicle(customerId, vehicle);
    },
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(['customers'], (oldData: any[]) => {
        if (!oldData) return [updatedCustomer];
        return oldData.map(c => c._id === updatedCustomer._id ? updatedCustomer : c);
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Vehicle added successfully!' });
      setShowAddVehicle(false);
      setNewVehicleMake('');
      setNewVehicleModel('');
      setNewVehiclePlate('');
      setNewVehicleYear('');
      setNewVehicleColor('');
      if (updatedCustomer && updatedCustomer.vehicles) {
        setSelectedVehicleIndex((updatedCustomer.vehicles.length - 1).toString());
      }
    },
    onError: (error: any) => {
      toast({ title: error?.message || 'Failed to add vehicle', variant: 'destructive' });
    }
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const job = await api.jobs.create(data);
      if (selectedItems.length > 0) {
        const materialsToAdd = selectedItems.map(item => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity || item.metersUsed || 0
        }));
        try {
          await api.jobs.addMaterials(job._id, materialsToAdd);
        } catch (error: any) {
          console.error('Failed to add materials to job:', error);
          throw new Error(error?.message || 'Failed to add materials to job');
        }
      }
      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      resetForm();
      toast({ title: 'Service created successfully! Rolls deducted and materials added to job.' });
    },
    onError: (error: any) => {
      toast({ title: error?.message || 'Failed to create service', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedVehicleIndex('');
    setSelectedTechnicianId('');
    setServiceNotes('');
    setPpfDiscount('');
    setLaborCost('');
    setIncludeGst(true);
    setSelectedItems([]);
    setSelectedItemId('');
    setMetersUsed('1');
    setPpfCategory('');
    setPpfVehicleType('');
    setPpfWarranty('');
    setPpfPrice(0);
    setPpfWarrantyFromPreferences(false);
    setSelectedOtherServices([]);
    setOtherServiceName('');
    setOtherServiceVehicleType('');
    setSelectedAccessoryCategory('');
    setSelectedAccessoryId('');
    setAccessoryQuantity('1');
    setSelectedAccessories([]);
  };

  const selectedCustomer = (Array.isArray(customers) ? customers : []).find((c: any) => c._id === selectedCustomerId);

  useEffect(() => {
    if (selectedCustomer) {
      if (selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0) {
        setSelectedVehicleIndex('0');
      }
    }
  }, [selectedCustomerId, selectedCustomer]);

  useEffect(() => {
    const loadVehiclePreferences = async () => {
      if (!selectedCustomerId || selectedVehicleIndex === '') return;
      
      setIsLoadingLastService(true);
      try {
        const prefs = await api.customers.getVehiclePreferences(selectedCustomerId, parseInt(selectedVehicleIndex, 10));
        if (prefs) {
          const category = prefs.ppfCategory || '';
          const vehicleType = prefs.ppfVehicleType || '';
          const warranty = prefs.ppfWarranty || (prefs as any).warranty || '';
          
          setPpfCategory(category);
          setPpfVehicleType(vehicleType);
          setPpfWarranty(warranty);
          
          // Auto-select product from inventory with matching name when loading preferences
          if (category) {
            const matchingItem = (Array.isArray(inventory) ? inventory : []).find(
              (item: any) => item.name.toLowerCase() === category.toLowerCase() && item.category !== 'Accessories'
            );
            if (matchingItem) {
              setSelectedItemId(matchingItem._id || matchingItem.id);
            }
          }
          
          let price = prefs.ppfPrice || 0;
          if (price === 0 && category && vehicleType && warranty) {
            const selectedService = ppfCategoriesFromServices.find(s => s.name === category);
            if (selectedService && selectedService.warrantyOptions) {
              const vehicleTypeOptions = selectedService.warrantyOptions[vehicleType];
              if (Array.isArray(vehicleTypeOptions)) {
                const option = vehicleTypeOptions.find((o: any) => o.warranty === warranty);
                if (option) {
                  price = option.price;
                }
              }
            }

            if (price === 0) {
              const categoryData = PPF_CATEGORIES[category as keyof typeof PPF_CATEGORIES];
              if (categoryData) {
                const vehicleTypeData = categoryData[vehicleType as keyof typeof categoryData] as Record<string, number>;
                if (vehicleTypeData && vehicleTypeData[warranty]) {
                  price = vehicleTypeData[warranty];
                }
              }
            }
          }
          setPpfPrice(price);
          if (warranty) {
            setPpfWarrantyFromPreferences(true);
          }
          
          if (Array.isArray(prefs.otherServices) && prefs.otherServices.length > 0 && (vehicleType || ppfVehicleType)) {
            const vType = vehicleType || ppfVehicleType;
            
            // Handle accessories from preferences
            const accessories = prefs.otherServices
              .filter((svc: any) => {
                const name = (svc.name || "").toLowerCase();
                const category = svc.category || "";
                
                // If it's explicitly an accessory category
                if (category === 'Accessories') return true;
                
                // Logical solution: Check if name contains quantity pattern (xN)
                // This indicates it was formatted as an accessory in the past
                if (name.includes('(x')) return true;

                // Robust solution: Check if the item exists in inventory as an accessory
                const invItem = inventory.find((i: any) => 
                  i.category === 'Accessories' && 
                  (name === i.name.toLowerCase() || 
                   name.startsWith(i.name.toLowerCase()) || 
                   i.name.toLowerCase().startsWith(name))
                );
                if (invItem) return true;

                // Special case for legacy or specific known items
                const isSpecialAccessory = name === 'test' || name.includes('helmet') || name.includes('test2');
                return isSpecialAccessory;
              })
              .map((svc: any) => {
                const rawName = svc.name || "";
                // Extract clean name if it has (xN) pattern
                const nameMatch = rawName.match(/^(.*?)\s*\(x\d+\)$/);
                const name = nameMatch ? nameMatch[1] : rawName;
                
                // Extract quantity if it has (xN) pattern
                const qtyMatch = rawName.match(/\(x(\d+)\)$/);
                const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : (svc.quantity || 1);

                const invItem = inventory.find((i: any) => 
                  i.category === 'Accessories' && 
                  (name.toLowerCase() === i.name.toLowerCase() || 
                   name.toLowerCase().startsWith(i.name.toLowerCase()) || 
                   i.name.toLowerCase().startsWith(name.toLowerCase()))
                );
                return {
                  id: invItem?._id || invItem?.id || svc.id || Math.random().toString(),
                  name: invItem?.name || name,
                  category: 'Accessories',
                  price: svc.price || invItem?.price || 0,
                  quantity: quantity
                };
              });

            if (accessories.length > 0) {
              setSelectedAccessories(prev => {
                const existingNames = new Set(prev.map(a => a.name.toLowerCase()));
                const newAccessories = accessories.filter((a: any) => !existingNames.has(a.name.toLowerCase()));
                return [...prev, ...newAccessories];
              });
            }

            const servicesWithPrices = prefs.otherServices
              .filter((svc: any) => {
                const name = (svc.name || "").toLowerCase();
                const category = svc.category || "";
                
                if (name === 'labor charge') return false;
                
                // Check if it's an accessory to exclude from services
                const isAccessoryCategory = category === 'Accessories';
                // Logical check for (xN) pattern
                const hasQuantityPattern = name.includes('(x');
                
                const invItem = inventory.find((inv: any) => 
                  inv.category === 'Accessories' && 
                  (name === inv.name.toLowerCase() || 
                   name.startsWith(inv.name.toLowerCase()) || 
                   inv.name.toLowerCase().startsWith(name))
                );
                
                const isSpecialAccessory = name === 'test' || name.includes('helmet') || name.includes('test2');

                return !(isAccessoryCategory || hasQuantityPattern || invItem || isSpecialAccessory);
              })
              .map((svc: any) => {
                const serviceData = OTHER_SERVICES[svc.name as keyof typeof OTHER_SERVICES];
                let price = svc.price || 0;
                
                if (price === 0 && serviceData) {
                  price = (serviceData as any)[vType] || 0;
                }
                return {
                  name: svc.name,
                  vehicleType: vType,
                  price: price,
                  discount: svc.discount || 0
                };
              });
            
            setSelectedOtherServices(servicesWithPrices);
          }
        }
      } catch (error) {
        console.error("Error loading vehicle preferences:", error);
      } finally {
        setIsLoadingLastService(false);
      }
    };
    
    loadVehiclePreferences();
  }, [selectedCustomerId, selectedVehicleIndex]);


  const allOtherServices = useMemo(() => {
    const servicesMap: Record<string, any> = {};
    (dbServices || []).forEach((s: any) => {
      // Only include standard services (not PPF) in "Other Services"
      if (!s.isPpf && !s.isPPF) {
        servicesMap[s.name] = s.prices;
      }
    });
    return servicesMap;
  }, [dbServices]);

  const availableOtherServiceVehicleTypes = useMemo(() => {
    if (!otherServiceName) return VEHICLE_TYPES;
    const dbSvc = dbServices.find((s: any) => s.name === otherServiceName);
    if (dbSvc && dbSvc.prices) {
      const types = Object.keys(dbSvc.prices);
      if (types.length > 0) return types;
    }
    const staticSvc = OTHER_SERVICES[otherServiceName as keyof typeof OTHER_SERVICES];
    if (staticSvc) return Object.keys(staticSvc);
    return VEHICLE_TYPES;
  }, [otherServiceName, dbServices]);

  const handleAddOtherService = () => {
    if (!otherServiceName || !otherServiceVehicleType) {
      toast({ title: 'Please select a service and vehicle type', variant: 'destructive' });
      return;
    }
    const serviceData = allOtherServices[otherServiceName];
    if (!serviceData) {
      toast({ title: 'Invalid service selection', variant: 'destructive' });
      return;
    }
    const price = (serviceData as any)[otherServiceVehicleType] || 0;
    const exists = selectedOtherServices.some(
      s => s.name === otherServiceName && s.vehicleType === otherServiceVehicleType
    );
    if (exists) {
      toast({ title: 'This service is already added', variant: 'destructive' });
      return;
    }
    setSelectedOtherServices([...selectedOtherServices, {
      name: otherServiceName,
      vehicleType: otherServiceVehicleType,
      price,
      discount: 0
    }]);
    setOtherServiceName('');
    setOtherServiceVehicleType('');
  };

  const handleRemoveOtherService = (index: number) => {
    setSelectedOtherServices(selectedOtherServices.filter((_, i) => i !== index));
  };

  const handleAddAccessory = () => {
    if (!selectedAccessoryId) {
      toast({ title: 'Please select an accessory', variant: 'destructive' });
      return;
    }
    const item = inventory.find((inv: any) => inv._id === selectedAccessoryId || inv.id === selectedAccessoryId);
    if (!item) return;

    const qty = parseInt(accessoryQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: 'Please enter a valid quantity', variant: 'destructive' });
      return;
    }

    // Calculate currently pending deductions for this accessory
    const pendingDeduction = selectedAccessories
      .filter(a => a.id === (item._id || item.id))
      .reduce((sum, a) => sum + a.quantity, 0);

    const availableQty = item.quantity || 0;
    const actualAvailable = availableQty - pendingDeduction;

    if (qty > actualAvailable) {
      toast({ title: `Only ${actualAvailable} available in stock (after pending selections)`, variant: 'destructive' });
      return;
    }

    const exists = selectedAccessories.some(a => a.id === (item._id || item.id));
    if (exists) {
      toast({ title: 'This accessory is already added', variant: 'destructive' });
      return;
    }

    setSelectedAccessories([...selectedAccessories, {
      id: item._id || item.id,
      name: item.name,
      category: item.category,
      price: item.price || 0,
      quantity: qty
    }]);
    setSelectedAccessoryId('');
    setAccessoryQuantity('1');
  };

  const handleRemoveAccessory = (index: number) => {
    setSelectedAccessories(selectedAccessories.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!selectedItemId) {
      toast({ title: 'Please select a product', variant: 'destructive' });
      return;
    }
    const item = (Array.isArray(inventory) ? inventory : []).find((inv: any) => inv._id === selectedItemId || inv.name === selectedItemId);
    if (!item) {
      // If it's a category selected instead of a product, handle it or ignore
      const isCategory = ppfCategories.some((cat: any) => cat.name === selectedItemId);
      if (isCategory) {
        toast({ title: 'Please select a specific product, not a category', variant: 'destructive' });
      }
      return;
    }

    const val = parseFloat(metersUsed);
    if (isNaN(val) || val <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    // Calculate currently pending deductions for this item in selectedItems
    const pendingDeduction = selectedItems
      .filter(i => i.inventoryId === (item._id || item.id))
      .reduce((sum, i) => sum + (i.quantity || 0), 0);

    let totalAvailable = 0;
    if (item.rolls && item.rolls.length > 0) {
      totalAvailable = item.rolls.reduce((sum: number, roll: any) => {
        if (roll.status !== 'Finished') {
          return sum + (roll.remaining_sqft || 0);
        }
        return sum;
      }, 0);
    } else {
      totalAvailable = item.quantity || 0;
    }

    const actualAvailable = totalAvailable - pendingDeduction;

    if (val > actualAvailable) {
      toast({ title: `Only ${actualAvailable.toFixed(2)} available for ${item.category} (after pending selections)`, variant: 'destructive' });
      return;
    }

    setSelectedItems([...selectedItems, {
      inventoryId: item._id || item.id,
      quantity: val,
      name: item.name,
      unit: item.unit || 'Units'
    }]);
    setSelectedItemId('');
    setMetersUsed('1');
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const ppfDiscountAmount = parseFloat(ppfDiscount) || 0;
  const ppfAfterDiscount = Math.max(0, ppfPrice - ppfDiscountAmount);
  
  // Calculate inventory items total price
  const inventoryTotal = selectedItems.reduce((sum, item) => {
    const invItem = inventory.find((i: any) => i._id === item.inventoryId || i.id === item.inventoryId);
    const price = invItem?.price || 0;
    return sum + (price * (item.quantity || 0));
  }, 0);

  const accessoryTotal = selectedAccessories.reduce((sum, a) => sum + (a.price * a.quantity), 0);

  const otherServicesAfterDiscount = selectedOtherServices.reduce((sum, s) => sum + Math.max(0, s.price - (s.discount || 0)), 0);
  
  const parsedLaborCost = parseFloat(laborCost) || 0;
  
  const subtotal = ppfAfterDiscount + otherServicesAfterDiscount + inventoryTotal + accessoryTotal + parsedLaborCost;
  const includeGstValue = includeGst ? subtotal * 0.18 : 0;
  const totalCostValue = subtotal + includeGstValue;

  const updateJobMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!editingJobId) return;
      const job = await api.jobs.update(editingJobId, data);
      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      resetForm();
      setEditingJobId(null);
      setLocation('/funnel');
      toast({ title: 'Service updated successfully!' });
    },
    onError: (error: any) => {
      toast({ title: error?.message || 'Failed to update service', variant: 'destructive' });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Inventory DEBUG] Form submission started');
    if (!selectedCustomerId || !selectedVehicleIndex) {
      toast({ title: 'Please select a customer and vehicle', variant: 'destructive' });
      return;
    }
    if (subtotal <= 0) {
      toast({ title: 'Please select at least one service or enter labor cost', variant: 'destructive' });
      return;
    }

    const customer = customers.find((c: any) => c._id === selectedCustomerId);
    if (!customer) return;
    const vehicleIdx = parseInt(selectedVehicleIndex, 10);
    const vehicle = customer.vehicles[vehicleIdx];
    
    if (!vehicle) {
      toast({ title: 'Vehicle data error. Please re-select vehicle.', variant: 'destructive' });
      return;
    }

    const selectedTechnician = technicians.find((t: any) => t._id === selectedTechnicianId);

    const serviceItemsList: any[] = [];
    if (ppfPrice > 0) {
      serviceItemsList.push({
        name: `PPF ${ppfCategory} - ${ppfWarranty}`,
        price: ppfPrice,
        discount: ppfDiscountAmount,
        type: 'part',
        category: ppfCategory,
        vehicleType: ppfVehicleType,
        warranty: ppfWarranty,
        sizeUsed: metersUsed,
        isPpf: true
      });
    }
    selectedOtherServices.filter(s => s.name !== 'TEST').forEach(s => {
      serviceItemsList.push({
        name: s.name,
        price: s.price,
        discount: s.discount || 0,
        type: 'part',
        vehicleType: s.vehicleType,
        isPpf: false
      });
    });
    // Add Accessories explicitly
    selectedAccessories.forEach(a => {
      serviceItemsList.push({
        name: `${a.name} (x${a.quantity})`,
        price: a.price * a.quantity,
        unitPrice: a.price,
        quantity: a.quantity,
        discount: 0,
        type: 'part',
        category: 'Accessories',
        vehicleType: 'accessory',
        inventoryId: a.id,
        isPpf: false
      });
    });

    // Add Selected Inventory Items (Rolls)
    selectedItems.forEach(item => {
      serviceItemsList.push({
        name: item.name,
        price: 0, // Material cost usually handled elsewhere or part of service
        unitPrice: 0,
        quantity: item.quantity,
        sizeUsed: item.quantity,
        unit: item.unit,
        inventoryId: item.inventoryId,
        type: 'part',
        isPpf: false
      });
    });

    if (parsedLaborCost > 0) {
      serviceItemsList.push({
        name: 'Labor Charge',
        price: parsedLaborCost,
        type: 'labor',
        isPpf: false
      });
    }

    const jobData = {
      customerId: selectedCustomerId,
      vehicleIndex: vehicleIdx,
      customerName: customer.name,
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      plateNumber: vehicle.plateNumber,
      technicianId: selectedTechnicianId || undefined,
      technicianName: selectedTechnician?.name,
      notes: serviceNotes,
      stage: 'New Lead',
      serviceItems: serviceItemsList,
      totalAmount: totalCostValue,
      paidAmount: 0,
      paymentStatus: 'Pending',
      requiresGST: includeGst
    };

    if (editingJobId) {
      updateJobMutation.mutate(jobData);
    } else {
      // DEDUCT ACCESSORIES only for new jobs
      for (const acc of selectedAccessories) {
        console.log(`[Inventory DEBUG] Deducting accessory: ${acc.name}, qty: ${acc.quantity}`);
        try {
          await api.inventory.adjust(acc.id, -acc.quantity);
        } catch (err: any) {
          console.error('[Inventory DEBUG] Accessory deduction failed:', err);
        }
      }

      createJobMutation.mutate(jobData, {
        onSuccess: () => {
          setLocation('/jobs');
        }
      });
    }
  };

  const getAvailableWarranties = () => {
    if (!ppfCategory || !ppfVehicleType) return [];
    
    const selectedService = ppfCategoriesFromServices.find(s => s.name === ppfCategory);
    if (selectedService && selectedService.warrantyOptions) {
      const vehicleTypeOptions = selectedService.warrantyOptions[ppfVehicleType];
      if (Array.isArray(vehicleTypeOptions)) {
        return vehicleTypeOptions.map((o: any) => o.warranty);
      }
    }

    const categoryData = PPF_CATEGORIES[ppfCategory as keyof typeof PPF_CATEGORIES];
    if (!categoryData || !(categoryData as any)[ppfVehicleType]) return [];
    return Object.keys((categoryData as any)[ppfVehicleType]);
  };

  return (
    <div className="space-y-8 p-4">
      <Card className="bg-white border-2 border-red-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-red-200 bg-gradient-to-r from-red-50/50 to-transparent">
          <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="w-5 h-5 text-red-600" />
            </div>
            Create New Service
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Customer *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Choose a customer" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      <div className="p-2 sticky top-0 bg-white z-10 border-b">
                        <Input
                          placeholder="Search customer..."
                          className="h-8 text-sm"
                          onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                            items?.forEach((item) => {
                              const text = item.textContent?.toLowerCase() || "";
                              (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                            });
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto max-h-[220px]">
                        {customers.map((customer: any) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {customer.name} - {customer.phone}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Select Vehicle *</Label>
                  <Select value={selectedVehicleIndex} onValueChange={setSelectedVehicleIndex} disabled={!selectedCustomerId}>
                    <SelectTrigger data-testid="select-vehicle">
                      <SelectValue placeholder="Choose a vehicle" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      <div className="p-2 sticky top-0 bg-white z-10 border-b">
                        <Input
                          placeholder="Search vehicle..."
                          className="h-8 text-sm"
                          onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                            items?.forEach((item) => {
                              const text = item.textContent?.toLowerCase() || "";
                              (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                            });
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {selectedCustomer?.vehicles?.map((v: any, idx: number) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {v.make} {v.model} - {v.plateNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign Technician</Label>
                    <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                      <SelectTrigger data-testid="select-technician">
                        <SelectValue placeholder="Assign technician" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                        <div className="p-2 sticky top-0 bg-white z-10 border-b">
                          <Input
                            placeholder="Search technician..."
                            className="h-8 text-sm"
                            onChange={(e) => {
                              const search = e.target.value.toLowerCase();
                              const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                              items?.forEach((item) => {
                                const text = item.textContent?.toLowerCase() || "";
                                (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                              });
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        {technicians.map((t: any) => (
                          t.status !== 'Off' && (
                            <SelectItem key={t._id} value={t._id} disabled={t.status !== 'Available'}>
                              {t.name} - {t.specialty} ({t.status})
                            </SelectItem>
                          )
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <Card className="border border-red-200">
                  <CardHeader className="py-3 cursor-pointer" onClick={() => setShowPpfSection(!showPpfSection)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">PPF Service</CardTitle>
                      {showPpfSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">PPF Category</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setPpfCategory('');
                          setPpfVehicleType('');
                          setPpfWarranty('');
                          setPpfPrice(0);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <Select value={ppfCategory} onValueChange={(val) => {
                        setPpfCategory(val);
                        setPpfWarranty('');
                        setShowPpfSection(true);
                        
                        // Auto-select the category in the "Add Item from Inventory" dropdown
                        setSelectedItemId(val);
                      }}>
                        <SelectTrigger data-testid="select-ppf-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input
                              placeholder="Search category..."
                              className="h-8 text-sm"
                              onChange={(e) => {
                                const search = e.target.value.toLowerCase();
                                const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                items?.forEach((item) => {
                                  const text = item.textContent?.toLowerCase() || "";
                                  (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                });
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        {ppfCategoriesFromServices.map((cat: any) => (
                          <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                        </SelectContent>
                      </Select>

                    {showPpfSection && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="space-y-2">
                          <Label className="text-sm">Vehicle Type</Label>
                          <Select value={ppfVehicleType} onValueChange={(val) => {
                            setPpfVehicleType(val);
                            setPpfWarranty('');
                          }}>
                            <SelectTrigger data-testid="select-ppf-vehicle-type">
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                              <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                <Input
                                  placeholder="Search vehicle type..."
                                  className="h-8 text-sm"
                                  onChange={(e) => {
                                    const search = e.target.value.toLowerCase();
                                    const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                    items?.forEach((item) => {
                                      const text = item.textContent?.toLowerCase() || "";
                                      (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                    });
                                  }}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {(() => {
                                const selectedCat = ppfCategoriesFromServices.find(s => s.name === ppfCategory);
                                const options = selectedCat?.warrantyOptions || {};
                                const keys = Object.keys(options);
                                if (keys.length > 0) {
                                  return keys.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ));
                                }
                                const priceKeys = Object.keys(selectedCat?.prices || {});
                                if (priceKeys.length > 0) {
                                  return priceKeys.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ));
                                }
                                return VEHICLE_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Warranty & Price</Label>
                          <Select key={`${ppfCategory}-${ppfVehicleType}`} value={ppfWarranty} onValueChange={setPpfWarranty} disabled={!ppfCategory || !ppfVehicleType}>
                            <SelectTrigger data-testid="select-ppf-warranty">
                              <SelectValue placeholder="Select warranty" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-y-auto">
                              {getAvailableWarranties().map((warranty) => {
                                const price = null; // Prices are now fully dynamic and should be set from inventory
                                return (
                                  <SelectItem key={warranty} value={warranty}>
                                    {warranty} {price ? `- ₹${(price as number).toLocaleString('en-IN')}` : ''}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {ppfPrice > 0 && (
                          <div className="space-y-3">
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                              <div className="flex justify-between items-center">
                                <Label className="text-sm font-medium">PPF Price</Label>
                                <span className="text-lg font-bold text-primary">₹{ppfPrice.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <div className="w-full">
                              <Label className="text-xs">Discount</Label>
                              <Input type="number" value={ppfDiscount} onChange={(e) => setPpfDiscount(e.target.value)} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>


                <Card className="border border-red-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Other Services</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Select Service</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setOtherServiceName('');
                          setOtherServiceVehicleType('');
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <Select value={otherServiceName} onValueChange={setOtherServiceName}>
                        <SelectTrigger data-testid="select-other-service">
                          <SelectValue placeholder="Choose a service" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input
                              placeholder="Search service..."
                              className="h-8 text-sm"
                              onChange={(e) => {
                                const search = e.target.value.toLowerCase();
                                const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                items?.forEach((item) => {
                                  const text = item.textContent?.toLowerCase() || "";
                                  (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                });
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {Object.keys(allOtherServices).map((service) => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                    <div className="space-y-2">
                      <Label className="text-sm">Vehicle Type</Label>
                      <Select value={otherServiceVehicleType} onValueChange={setOtherServiceVehicleType}>
                        <SelectTrigger data-testid="select-other-service-vehicle-type">
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                          {availableOtherServiceVehicleTypes.map((type) => {
                            const serviceData = otherServiceName ? allOtherServices[otherServiceName] : null;
                            const price = serviceData ? (serviceData as any)[type] : null;
                            return (
                              <SelectItem key={type} value={type}>
                                {type} {price ? `- ₹${price.toLocaleString('en-IN')}` : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="button" variant="outline" onClick={handleAddOtherService} disabled={!otherServiceName || !otherServiceVehicleType} className="w-full">
                      Add Service
                    </Button>

                    {selectedOtherServices.length > 0 && (
                      <div className="space-y-4 mt-3">
                        <div className="border-b pb-2">
                          <Label className="text-sm font-semibold">Selected Services</Label>
                        </div>
                        <div className="border rounded-lg divide-y">
                          {selectedOtherServices
                            .map((service, index) => {
                              // Find the actual index in the original array
                              const originalIndex = selectedOtherServices.findIndex(origS => origS === service);
                              return (
                                <div key={originalIndex} className="space-y-2 p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">{service.name}</p>
                                      <p className="text-xs text-muted-foreground">{service.vehicleType}</p>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOtherService(originalIndex)}>
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                      <Label className="text-sm font-medium">Service Price</Label>
                                      <span className="text-lg font-bold text-primary">₹{(service.price || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="w-full">
                                      <Label className="text-xs">Discount</Label>
                                      <Input 
                                        type="number" 
                                        value={service.discount || ''} 
                                        onChange={(e) => {
                                          const newServices = [...selectedOtherServices];
                                          newServices[originalIndex].discount = parseFloat(e.target.value) || 0;
                                          setSelectedOtherServices(newServices);
                                        }} 
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Service Notes</Label>
                  <Textarea value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} placeholder="Additional notes..." rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Labor Charge</Label>
                  <Input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} placeholder="0" min="0" />
                </div>

                <div className="space-y-4 border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Add Item from Inventory</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedItemId('');
                        setMetersUsed('1');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Select Product</Label>
                      <Select value={selectedItemId} onValueChange={(id) => {
                        setSelectedItemId(id);
                        setExpandedInventoryId(null);
                      }}>
                        <SelectTrigger data-testid="select-inventory-item">
                          <SelectValue placeholder="Choose a product" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input
                              placeholder="Search product..."
                              className="h-8 text-sm"
                              onChange={(e) => {
                                const search = e.target.value.toLowerCase();
                                const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                items?.forEach((item) => {
                                  const text = item.textContent?.toLowerCase() || "";
                                  (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                });
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {ppfCategories.map((cat: any) => (
                            <SelectItem key={cat._id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                          {ppfInventoryItems.map((item: any) => (
                            <SelectItem key={item._id} value={item._id}>
                              {item.category} - {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedItemId && (
                      <div className="space-y-3 pt-3 border-t">
                        {(() => {
                          const item = (Array.isArray(inventory) ? inventory : []).find((inv: any) => inv._id === selectedItemId || inv.name === selectedItemId);
                          if (!item) return null;
                          
                          let totalAvailable = 0;
                          if (item.rolls && item.rolls.length > 0) {
                            totalAvailable = item.rolls.reduce((sum: number, roll: any) => {
                              if (roll.status !== 'Finished' && roll.remaining_sqft > 0) {
                                return sum + (roll.remaining_sqft || 0);
                              }
                              return sum;
                            }, 0);
                          } else {
                            totalAvailable = item.quantity || 0;
                          }

                          return (
                            <>
                              <div className="bg-blue-50 p-2 rounded-md border border-blue-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-blue-700">Available Stock</span>
                                  <span className="text-sm font-bold text-blue-800">
                                    {(() => {
                                      const pending = selectedItems
                                        .filter(i => i.inventoryId === (item._id || item.id))
                                        .reduce((sum, i) => sum + (i.quantity || 0), 0);
                                      const remaining = Math.max(0, totalAvailable - pending);
                                      return `${remaining.toFixed(2)} sq ft`;
                                    })()}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm">Quantity/Amount (sq ft)</Label>
                                <Input type="number" value={metersUsed} onChange={(e) => setMetersUsed(e.target.value)} min="1" step="0.1" />
                              </div>

                              <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Accessories Section */}
                  <div className="space-y-4 border border-gray-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">Add Accessory</h3>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setSelectedAccessoryCategory('');
                          setSelectedAccessoryId('');
                          setAccessoryQuantity('1');
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Category</Label>
                        <Select value={selectedAccessoryCategory} onValueChange={setSelectedAccessoryCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              // Service categories to exclude
                              const ppfCategories = ['Elite', 'Garware Plus', 'Garware Premium', 'Garware Matt'];
                              
                              // Handle inventory data properly
                              const invList = Array.isArray(inventory) ? inventory : [];
                              
                              // Extract ALL unique categories directly from inventory
                              // Filtering out ONLY the specific PPF service categories
                              const categorySet = new Set(
                                invList
                                  .map((item: any) => item.category)
                                  .filter((cat: any) => cat && !ppfCategories.includes(cat))
                              );
                              
                              const finalCategories = Array.from(categorySet).sort();
                              
                              console.log('--- Final Accessory Categories from DB ---', finalCategories);
                              console.log('All raw items found:', invList.map(i => ({ name: i.name, category: i.category })));

                              if (finalCategories.length === 0) {
                                return <div className="p-2 text-sm text-slate-500">No categories found in inventory</div>;
                              }

                              return finalCategories.map((category: any) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedAccessoryCategory && (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="space-y-2">
                            <Label className="text-sm">Select Item</Label>
                            <Select value={selectedAccessoryId} onValueChange={setSelectedAccessoryId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Item" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                                <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                  <Input
                                    placeholder="Search item..."
                                    className="h-8 text-sm"
                                    onChange={(e) => {
                                      const search = e.target.value.toLowerCase();
                                      const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                      items?.forEach((item) => {
                                        const text = item.textContent?.toLowerCase() || "";
                                        (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                      });
                                    }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {inventory
                                  .filter((item: any) => item.category === selectedAccessoryCategory)
                                  .map((item: any) => {
                                    const pending = selectedAccessories
                                      .filter(a => a.id === (item._id || item.id))
                                      .reduce((sum, a) => sum + a.quantity, 0);
                                    const remaining = Math.max(0, (item.quantity || 0) - pending);
                                    return (
                                      <SelectItem key={item._id || item.id} value={item._id || item.id}>
                                        {item.name} - ₹{item.price} ({remaining} in stock)
                                      </SelectItem>
                                    );
                                  })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Quantity</Label>
                            <Input 
                              type="number" 
                              value={accessoryQuantity} 
                              onChange={(e) => setAccessoryQuantity(e.target.value)} 
                              min="1" 
                            />
                          </div>

                          <Button type="button" variant="outline" onClick={handleAddAccessory} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Accessory
                          </Button>
                        </div>
                      )}
                    </div>

                    {selectedAccessories.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Added Accessories</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedAccessories.map((a, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-md border border-slate-100">
                              <div className="text-sm">
                                <span className="font-medium">{a.name}</span>
                                <span className="text-slate-500 ml-2">({a.quantity}x ₹{a.price})</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAccessory(idx)}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-slate-700">Selected Inventory Items</Label>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedItems.map((item, index) => (
                        <Card key={index} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h4 className="font-semibold text-slate-900">{item.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <Package className="w-4 h-4" />
                                  <span>Quantity: {item.quantity} {item.unit}</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 rounded-md">
                        <Package className="w-4 h-4 text-red-600" />
                      </div>
                      Cost Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">PPF Service:</span>
                        <span className="font-semibold">₹{ppfAfterDiscount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Other Services:</span>
                        <span className="font-semibold">₹{otherServicesAfterDiscount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Accessories:</span>
                        <span className="font-semibold">₹{accessoryTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Labor:</span>
                        <span className="font-semibold">₹{parsedLaborCost.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-t border-slate-100 pt-2 mt-2">
                        <div className="flex justify-between text-base font-bold text-slate-800">
                          <span>Subtotal:</span>
                          <span>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3 pt-2">
                        <Checkbox 
                          id="gst" 
                          checked={includeGst} 
                          onCheckedChange={(checked) => setIncludeGst(checked as boolean)}
                          className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <label htmlFor="gst" className="text-sm font-semibold text-slate-700 leading-none cursor-pointer">
                          GST (18%)
                        </label>
                        {includeGst && (
                          <span className="ml-auto text-sm font-bold text-slate-600">
                            ₹{includeGstValue.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t-2 border-red-200 border-dashed mt-4">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-bold text-slate-900">Total:</span>
                        <span className="text-3xl font-black text-red-600">₹{totalCostValue.toLocaleString('en-IN')}</span>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-10 text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 transition-all active:scale-[0.98]" 
                        disabled={createJobMutation.isPending || updateJobMutation.isPending}
                      >
                        {editingJobId ? (
                          updateJobMutation.isPending ? 'Updating...' : 'Update Service'
                        ) : (
                          createJobMutation.isPending ? 'Creating...' : 'Create Service'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
