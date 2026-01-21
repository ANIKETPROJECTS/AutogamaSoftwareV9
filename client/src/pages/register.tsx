import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Car,
  Check,
  ChevronRight,
  ChevronLeft,
  Zap,
  X,
} from "lucide-react";
import { useLocation } from "wouter";

const REFERRAL_SOURCES = [
  "Google Search",
  "Social Media",
  "Friend/Family",
  "Advertisement",
  "Walk-in",
];

const CUSTOMER_STATUSES = [
  { value: "Inquired", label: "Inquired" },
  { value: "Working", label: "Working" },
  { value: "Waiting", label: "Waiting" },
  { value: "Completed", label: "Completed" },
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Luxury",
  "Sports",
  "Other",
];

const PPF_CATEGORIES = {
  Elite: {
    "Small Cars": {
      "TPU 5 Years Gloss": 55000,
      "TPU 5 Years Matt": 60000,
      "TPU 7 Years Gloss": 80000,
      "TPU 10 Years Gloss": 95000,
    },
    "Hatchback / Small Sedan": {
      "TPU 5 Years Gloss": 60000,
      "TPU 5 Years Matt": 70000,
      "TPU 7 Years Gloss": 85000,
      "TPU 10 Years Gloss": 105000,
    },
    "Mid-size Sedan / Compact SUV / MUV": {
      "TPU 5 Years Gloss": 70000,
      "TPU 5 Years Matt": 75000,
      "TPU 7 Years Gloss": 90000,
      "TPU 10 Years Gloss": 112000,
    },
    "SUV / MPV": {
      "TPU 5 Years Gloss": 80000,
      "TPU 5 Years Matt": 85000,
      "TPU 7 Years Gloss": 95000,
      "TPU 10 Years Gloss": 120000,
    },
  },
  "Garware Plus": {
    "Small Cars": { "TPU 5 Years Gloss": 62000 },
    "Hatchback / Small Sedan": { "TPU 5 Years Gloss": 65000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 5 Years Gloss": 70000 },
    "SUV / MPV": { "TPU 5 Years Gloss": 85000 },
  },
  "Garware Premium": {
    "Small Cars": { "TPU 8 Years Gloss": 80000 },
    "Hatchback / Small Sedan": { "TPU 8 Years Gloss": 85000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 8 Years Gloss": 90000 },
    "SUV / MPV": { "TPU 8 Years Gloss": 95000 },
  },
  "Garware Matt": {
    "Small Cars": { "TPU 5 Years Matt": 105000 },
    "Hatchback / Small Sedan": { "TPU 5 Years Matt": 110000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 5 Years Matt": 115000 },
    "SUV / MPV": { "TPU 5 Years Matt": 120000 },
  },
};

const OTHER_SERVICES = {
  "Foam Washing": {
    "Small Cars": 400,
    "Hatchback / Small Sedan": 500,
    "Mid-size Sedan / Compact SUV / MUV": 600,
    "SUV / MPV": 700,
  },
  "Premium Washing": {
    "Small Cars": 600,
    "Hatchback / Small Sedan": 700,
    "Mid-size Sedan / Compact SUV / MUV": 800,
    "SUV / MPV": 900,
  },
  "Interior Cleaning": {
    "Small Cars": 2500,
    "Hatchback / Small Sedan": 3000,
    "Mid-size Sedan / Compact SUV / MUV": 3500,
    "SUV / MPV": 4500,
  },
  "Interior Steam Cleaning": {
    "Small Cars": 3500,
    "Hatchback / Small Sedan": 4000,
    "Mid-size Sedan / Compact SUV / MUV": 4500,
    "SUV / MPV": 5500,
  },
  "Leather Treatment": {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 5500,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 7000,
  },
  Detailing: {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 6500,
    "Mid-size Sedan / Compact SUV / MUV": 7000,
    "SUV / MPV": 9000,
  },
  "Paint Sealant Coating (Teflon)": {
    "Small Cars": 6500,
    "Hatchback / Small Sedan": 8500,
    "Mid-size Sedan / Compact SUV / MUV": 9500,
    "SUV / MPV": 11500,
  },
  "Ceramic Coating – 9H": {
    "Small Cars": 11000,
    "Hatchback / Small Sedan": 12500,
    "Mid-size Sedan / Compact SUV / MUV": 15000,
    "SUV / MPV": 18000,
  },
  "Ceramic Coating – MAFRA": {
    "Small Cars": 12500,
    "Hatchback / Small Sedan": 15000,
    "Mid-size Sedan / Compact SUV / MUV": 18000,
    "SUV / MPV": 21000,
  },
  "Ceramic Coating – MENZA PRO": {
    "Small Cars": 15000,
    "Hatchback / Small Sedan": 18000,
    "Mid-size Sedan / Compact SUV / MUV": 21000,
    "SUV / MPV": 24000,
  },
  "Ceramic Coating – KOCH CHEMIE": {
    "Small Cars": 18000,
    "Hatchback / Small Sedan": 22000,
    "Mid-size Sedan / Compact SUV / MUV": 25000,
    "SUV / MPV": 28000,
  },
  "Corrosion Treatment": {
    "Small Cars": 3500,
    "Hatchback / Small Sedan": 5000,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 7500,
  },
  "Windshield Coating": {
    "Small Cars": 2500,
    "Hatchback / Small Sedan": 3000,
    "Mid-size Sedan / Compact SUV / MUV": 3500,
    "SUV / MPV": 4000,
  },
  "Windshield Coating All Glasses": {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 5500,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 6500,
  },
  "Sun Control Film – Economy": {
    "Small Cars": 5200,
    "Hatchback / Small Sedan": 6000,
    "Mid-size Sedan / Compact SUV / MUV": 6500,
    "SUV / MPV": 8400,
  },
  "Sun Control Film – Standard": {
    "Small Cars": 7500,
    "Hatchback / Small Sedan": 8300,
    "Mid-size Sedan / Compact SUV / MUV": 9500,
    "SUV / MPV": 12500,
  },
  "Sun Control Film – Premium": {
    "Small Cars": 11500,
    "Hatchback / Small Sedan": 13000,
    "Mid-size Sedan / Compact SUV / MUV": 15000,
    "SUV / MPV": 18000,
  },
  "Sun Control Film – Ceramic": {
    "Small Cars": 13500,
    "Hatchback / Small Sedan": 15500,
    "Mid-size Sedan / Compact SUV / MUV": 18000,
    "SUV / MPV": 21000,
  },
};

const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");
  // Check if exactly 10 digits
  return digitsOnly.length === 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const VEHICLE_MAKES = [
  "Other",
  "Toyota",
  "Honda",
  "Maruti Suzuki",
  "Hyundai",
  "Tata",
  "Mahindra",
  "Kia",
  "MG",
  "Volkswagen",
  "Skoda",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Land Rover",
  "Jaguar",
  "Volvo",
  "Porsche",
  "Lexus",
  "Jeep",
];

const VEHICLE_MODELS: Record<string, string[]> = {
  Toyota: [
    "Fortuner",
    "Innova",
    "Innova Crysta",
    "Creta",
    "Fortuner GR-S",
    "Vios",
    "Yaris",
    "Glanza",
    "Urban Cruiser",
    "Rumion",
  ],
  Honda: [
    "City",
    "Accord",
    "Civic",
    "CR-V",
    "Jazz",
    "Amaze",
    "WR-V",
    "Elevate",
    "BR-V",
  ],
  "Maruti Suzuki": [
    "Swift",
    "Alto",
    "WagonR",
    "Celerio",
    "Ertiga",
    "XL5",
    "Vitara Brezza",
    "S-Cross",
    "Jimny",
    "Baleno",
  ],
  Hyundai: [
    "Creta",
    "Tucson",
    "Kona",
    "Venue",
    "i20",
    "i10",
    "Grand i10 Nios",
    "Aura",
    "Alcazar",
    "Santa Fe",
  ],
  Tata: [
    "Nexon",
    "Harrier",
    "Safari",
    "Punch",
    "Altroz",
    "Tigor",
    "Tiago",
    "Hexa",
    "Nexon EV",
  ],
  Mahindra: [
    "XUV500",
    "XUV700",
    "Scorpio",
    "Bolero",
    "TUV300",
    "Xylo",
    "Quanto",
    "KUV100",
  ],
  Kia: ["Seltos", "Sonet", "Niro", "Carens", "EV6"],
  MG: ["Hector", "Astor", "ZS EV", "Gloster", "Comet"],
  Volkswagen: ["Polo", "Vento", "Tiguan", "Taigun", "Passat"],
  Skoda: ["Slavia", "Superb", "Karoq", "Octavia"],
  BMW: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "Z4"],
  "Mercedes-Benz": [
    "C-Class",
    "E-Class",
    "S-Class",
    "GLA",
    "GLC",
    "GLE",
    "GLS",
    "A-Class",
  ],
  Audi: ["A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8"],
  "Land Rover": ["Range Rover", "Range Rover Evoque", "Discovery", "Defender"],
  Jaguar: ["XE", "XF", "F-PACE", "E-PACE"],
  Volvo: ["S60", "S90", "XC60", "XC90", "V90"],
  Porsche: ["911", "Cayenne", "Panamera", "Macan"],
  Lexus: ["LX", "RX", "NX", "ES", "CT"],
  Jeep: ["Wrangler", "Compass", "Meridian", "Cherokee"],
  Other: ["Other"],
};

const VEHICLE_COLORS = [
  "White",
  "Silver",
  "Grey",
  "Black",
  "Red",
  "Blue",
  "Brown",
  "Beige",
  "Golden",
  "Orange",
  "Yellow",
  "Green",
  "Maroon",
  "Purple",
  "Other",
];

export default function CustomerRegistration() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<{
    phone?: string;
    email?: string;
    referrerName?: string;
    referrerPhone?: string;
  }>({});

  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "Maharashtra",
    referralSource: "",
    referrerName: "",
    referrerPhone: "",
    registrationDate: new Date().toISOString().split('T')[0],
    invoiceDate: new Date().toISOString().split('T')[0],
    ppfCategory: "",
    ppfVehicleType: "",
    ppfWarranty: "",
    ppfPrice: 0,
    tempAccessoryCategory: "",
    tempAccessoryName: "",
    accessoryQuantity: 1,
    selectedOtherServices: [] as Array<{
      name: string;
      vehicleType: string;
      price: number;
    }>,
    tempServiceName: "",
    tempServiceVehicleType: "",
    technicianId: "",
    rollId: "",
    ppfQuantity: 1,
    discount: 0,
    taxPercentage: "0",
    laborCharge: 0,
    serviceNotes: "",
  });

  const { data: dbServices = [], refetch: refetchServices } = useQuery<any[]>({
    queryKey: ["/api/services"],
    staleTime: 0, // Ensure we get fresh data
  });

  const availableServiceVehicleTypes = useMemo(() => {
    if (!customerData.tempServiceName) return VEHICLE_TYPES;
    const dbSvc = dbServices.find((s: any) => s.name === customerData.tempServiceName);
    if (dbSvc && dbSvc.prices) {
      const types = Object.keys(dbSvc.prices);
      if (types.length > 0) return types;
    }
    const staticSvc = OTHER_SERVICES[customerData.tempServiceName as keyof typeof OTHER_SERVICES];
    if (staticSvc) return Object.keys(staticSvc);
    return VEHICLE_TYPES;
  }, [customerData.tempServiceName, dbServices]);

  const setManualRollId = (val: string) => {
    setCustomerData(prev => ({ ...prev, rollId: val }));
  };

  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list({ page: 1, limit: 1000 }),
  });

  const existingCustomers = customersData?.customers || [];

  const filteredCustomerNames = useMemo(() => {
    if (!customerData.name.trim()) return [];
    return existingCustomers.filter((c: any) => 
      c.name.toLowerCase().includes(customerData.name.toLowerCase())
    ).slice(0, 5);
  }, [existingCustomers, customerData.name]);

  const filteredCustomerPhones = useMemo(() => {
    if (!customerData.phone.trim()) return [];
    return existingCustomers.filter((c: any) => 
      c.phone.includes(customerData.phone)
    ).slice(0, 5);
  }, [existingCustomers, customerData.phone]);

  const handleSelectCustomer = (customer: any) => {
    setCustomerData({
      ...customerData,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
    });
    setShowNameDropdown(false);
    setShowPhoneDropdown(false);
  };

  const [vehicleData, setVehicleData] = useState({
    name: "",
    make: "",
    otherMake: "",
    model: "",
    otherModel: "",
    year: "",
    plateNumber: "",
    chassisNumber: "",
    color: "",
    vehicleType: "",
    image: "" as string | undefined,
  });

  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

  // Extract unique makes and models from existing customers
  const { makes: dynamicMakes, models: dynamicModels } = useMemo(() => {
    const makes = new Set<string>(VEHICLE_MAKES);
    const models = { ...VEHICLE_MODELS };

    existingCustomers.forEach((c: any) => {
      if (c.vehicles && c.vehicles.length > 0) {
        c.vehicles.forEach((v: any) => {
          if (v.make) {
            makes.add(v.make);
            if (!models[v.make]) {
              models[v.make] = [];
            }
            if (v.model && !models[v.make].includes(v.model)) {
              models[v.make].push(v.model);
            }
          }
        });
      }
    });

    return {
      makes: Array.from(makes).sort((a, b) => {
        if (a === "Other") return -1;
        if (b === "Other") return 1;
        return a.localeCompare(b);
      }),
      models,
    };
  }, [existingCustomers]);

  const [vehicleImagePreview, setVehicleImagePreview] = useState<string>("");

  const { data: dbPpfCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/ppf-categories"],
  });

  const { data: inventory = [], refetch: refetchInventory } = useQuery<any[]>({
    queryKey: ["inventory"],
    queryFn: api.inventory.list,
  });

  const selectedPpfInventory = useMemo(() => {
    if (!customerData.ppfCategory) return null;
    return inventory.find(item => 
      item.isPpf && (item.category === customerData.ppfCategory || item.name === customerData.ppfCategory)
    );
  }, [inventory, customerData.ppfCategory]);

  const allRolls = useMemo(() => {
    return inventory
      .filter((item: any) => item.isPpf || (item.category && item.category.toString().toLowerCase().includes('ppf')))
      .flatMap((item: any) => (item.rolls || []).map((roll: any) => ({
        ...roll,
        inventoryName: item.name
      })))
      .filter((r: any) => r.status !== 'Finished');
  }, [inventory]);

  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    prices: {} as Record<string, number>,
  });

  const createServiceMutation = useMutation({
    mutationFn: api.services.create,
    onSuccess: () => {
      refetchServices();
      setIsAddingService(false);
      setNewService({ name: "", prices: {} });
      toast({ title: "Service added successfully" });
    },
  });

  const allOtherServices = useMemo(() => {
    const servicesMap: Record<string, any> = {};
    dbServices.forEach(s => {
      // Only include standard services (not PPF) in "Other Services"
      if (!s.isPpf && !s.isPPF) {
        servicesMap[s.name] = s.prices;
      }
    });
    return servicesMap;
  }, [dbServices]);

  const accessoryInventory = useMemo(() => {
    return inventory.filter((item) => {
      const cat = (item.category || "").toString().trim().toLowerCase();
      // Exclude items that are clearly PPF based on their category
      const ppfBrands = dbPpfCategories.map(c => c.name.toLowerCase().trim());
      const isPPF = ppfBrands.some(brand => cat.includes(brand));
      
      // Any item that isn't a known PPF brand is considered an accessory
      return !isPPF && cat !== "";
    });
  }, [inventory, dbPpfCategories]);

  const accessoryCategories = useMemo(() => {
    const categories = accessoryInventory.map((item) => {
      const cat = (item.category || "").toString().trim();
      const unit = (item.unit || "").toString().trim();
      
      // If the category name is generic ("Accessories" or "Accessory"), 
      // we use the 'unit' field as the more specific category label (e.g., "test1").
      // Otherwise, we use the category itself (e.g., "Headgear").
      if (cat.toLowerCase() === "accessories" || cat.toLowerCase() === "accessory") {
        return unit || cat;
      }
      return cat;
    });
    return Array.from(new Set(categories)).filter(Boolean).sort();
  }, [accessoryInventory]);

  const filteredAccessories = useMemo(() => {
    return accessoryInventory.filter(
      (item) => {
        if (!customerData.tempAccessoryCategory) return true;
        const cat = (item.category || "").toString().trim();
        const itemUnit = (item.unit || "").toString().trim();
        
        // Item matches if its category or its specific unit matches the selected label.
        return cat === customerData.tempAccessoryCategory || itemUnit === customerData.tempAccessoryCategory;
      }
    );
  }, [accessoryInventory, customerData.tempAccessoryCategory]);

  const [isInvoiceDirect, setIsInvoiceDirect] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('createInvoice') === 'true') {
      setIsInvoiceDirect(true);
      const name = params.get('name') || "";
      const phone = params.get('phone') || "";
      const vehicle = params.get('vehicle') || "";
      const service = params.get('service') || "";
      
      setCustomerData(prev => ({
        ...prev,
        name,
        phone,
        serviceNotes: service ? `Appointment Service: ${service}` : prev.serviceNotes
      }));
      
      if (vehicle) {
        setVehicleData(prev => ({
          ...prev,
          name: vehicle,
          make: vehicle.split(' ')[0] || "",
          model: vehicle.split(' ').slice(1).join(' ') || ""
        }));
      }
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [selectedAccessories, setSelectedAccessories] = useState<Array<{
    name: string;
    quantity: number;
    price: number;
  }>>([]);

  const addAccessory = () => {
    if (!customerData.tempAccessoryName) return;
    const accessory = accessoryInventory.find(i => i.name === customerData.tempAccessoryName);
    if (!accessory) return;

    setSelectedAccessories([...selectedAccessories, {
      name: accessory.name,
      quantity: customerData.accessoryQuantity,
      price: accessory.price || 0
    }]);

    setCustomerData({
      ...customerData,
      tempAccessoryCategory: "",
      tempAccessoryName: "",
      accessoryQuantity: 1
    });
  };

  const removeAccessory = (index: number) => {
    setSelectedAccessories(selectedAccessories.filter((_, i) => i !== index));
  };

  const createCustomerMutation = useMutation({
    mutationFn: api.customers.create,
    onSuccess: async (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer processed successfully!" });
      
      if (isInvoiceDirect) {
        // Use the assignments from the dialog
        const items = serviceAssignments.map(item => ({
          description: item.name,
          quantity: 1,
          unitPrice: item.price,
          total: item.price,
          type: item.type === 'part' ? 'accessory' : 'service',
          category: item.type === 'part' ? 'Accessory' : 'Service',
          assignedBusiness: item.assignedBusiness
        }));

        const itemsParam = encodeURIComponent(JSON.stringify(items));
        const technicianParam = customerData.technicianId ? `&technicianId=${customerData.technicianId}` : "";
        const rollParam = customerData.rollId ? `&rollId=${customerData.rollId}` : "";
        
        // Redirect to invoice generation
        console.log("[REGISTER_DEBUG] Navigating to /invoices with date:", customerData.invoiceDate, "taxPercentage:", customerData.taxPercentage);
        setLocation(`/invoices?direct=true&autoSubmit=true&customerId=${customer._id}&customerName=${encodeURIComponent(customer.name)}&customerPhone=${customer.phone}&vehicleName=${encodeURIComponent(vehicleData.make + " " + vehicleData.model)}&plateNumber=${encodeURIComponent(vehicleData.plateNumber)}&items=${itemsParam}${technicianParam}${rollParam}&discount=${customerData.discount}&tax=${encodeURIComponent(String(customerData.taxPercentage))}&labor=${customerData.laborCharge}&notes=${encodeURIComponent(customerData.serviceNotes)}&invoiceDate=${customerData.invoiceDate}`);
      } else {
        setLocation("/registered-customers");
      }
    },
    onError: () => {
      toast({ title: "Failed to register customer", variant: "destructive" });
    },
  });

  const handleVehicleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setVehicleData({ ...vehicleData, image: base64String });
        setVehicleImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const ppfInventoryCategories = useMemo(() => {
    // Combine categories from dedicated PPF categories AND from inventory items flagged as PPF
    const categoriesSet = new Set<string>();

    // 1. Add categories from the dedicated PPF categories collection
    dbPpfCategories.forEach(cat => {
      if (cat.name) categoriesSet.add(cat.name.trim());
    });

    // 2. Add categories from inventory items that are flagged as PPF
    inventory.forEach(item => {
      const isPpfFlag = item.isPpf === true || item.isPpf === 'true' || item.isPPF === true || item.isPPF === 'true';
      const catName = (item.category || item.Category || "").toString().trim();
      const itemName = (item.name || item.Name || "").toString().trim();

      if (isPpfFlag) {
        if (catName && catName.toLowerCase() !== 'inventory' && catName.toLowerCase() !== 'accessories') {
          categoriesSet.add(catName);
        } else if (itemName) {
          categoriesSet.add(itemName);
        }
      } else {
        // Fallback for items that might not have the flag but are clearly PPF
        const lowerCat = catName.toLowerCase();
        const lowerName = itemName.toLowerCase();
        if (lowerCat.includes('ppf') || lowerName.includes('ppf') || lowerName.includes('garware') || lowerName.includes('elite')) {
          if (catName && lowerCat !== 'inventory' && lowerCat !== 'accessories') {
            categoriesSet.add(catName);
          } else if (itemName) {
            categoriesSet.add(itemName);
          }
        }
      }
    });

    const result = Array.from(categoriesSet).sort().map(cat => {
      const inventoryItems = inventory.filter(i =>
        (i.category || i.Category || "").toString().trim() === cat ||
        (i.name || i.Name || "").toString().trim() === cat
      );
      const hasRolls = inventoryItems.some(i => (i.rolls && i.rolls.length > 0) || (i.Rolls && i.Rolls.length > 0));
      return {
        name: cat,
        hasRolls: hasRolls
      };
    });
    return result;
  }, [inventory, dbPpfCategories]);

  const ppfCategoriesFromServices = useMemo(() => {
    return dbServices
      .filter(s => s.isPpf)
      .map(service => ({
        _id: service._id,
        name: service.name,
        isPpf: true,
        warrantyOptions: service.warrantyOptions || {},
        prices: service.prices || {}
      }));
  }, [dbServices]);

  const selectedPpfProducts = useMemo(() => {
    if (!customerData.ppfCategory) return [];
    
    const items = inventory.filter(item => {
      const isPpf = item.isPpf === true || 
                    item.isPpf === 'true' || 
                    (item.category && item.category.toLowerCase().includes('ppf')) ||
                    (item.name && item.name.toLowerCase().includes('garware')) ||
                    (item.name && item.name.toLowerCase().includes('elite'));
      
      const catMatch = (item.category || item.name) === customerData.ppfCategory;
      return isPpf && catMatch;
    });

    const rolls = items.flatMap(item => (item.rolls || []).map((roll: any) => ({
      ...roll,
      inventoryName: item.name,
      inventoryId: item._id
    })));

    return rolls;
  }, [inventory, customerData.ppfCategory]);

  const categoryStock = useMemo(() => {
    if (!customerData.ppfCategory) return 0;
    const totalInventory = selectedPpfProducts.reduce((acc, roll) => acc + (roll.remaining_sqft || roll.remainingSqft || 0), 0);
    
    // Subtract already added quantities for this category from the available stock
    const alreadyAdded = customerData.selectedOtherServices
      .filter(s => s.vehicleType === "PPF" && s.name.startsWith(`PPF: ${customerData.ppfCategory}`))
      .reduce((acc, s) => acc + ((s as any).quantity || 0), 0);
      
    return Math.max(0, totalInventory - alreadyAdded);
  }, [selectedPpfProducts, customerData.ppfCategory, customerData.selectedOtherServices]);

  const selectedRollData = useMemo(() => {
    return allRolls.find(r => (r._id || r.name) === customerData.rollId);
  }, [allRolls, customerData.rollId]);

  const [assignBusinessOpen, setAssignBusinessOpen] = useState(false);
  const [serviceAssignments, setServiceAssignments] = useState<any[]>([]);

  const handleSubmit = () => {
    if (isInvoiceDirect) {
      // Calculate selected services and accessories for auto-fill
      const items = [];
      
      // Add PPF if selected
      if (customerData.ppfCategory && customerData.ppfPrice > 0) {
        items.push({
          name: `PPF - ${customerData.ppfCategory} - ${customerData.ppfWarranty}`,
          price: customerData.ppfPrice,
          type: 'labor',
          assignedBusiness: 'Auto Gamma'
        });
      }

      // Add other services
      customerData.selectedOtherServices.forEach(s => {
        const isPpfSqFt = s.vehicleType === "PPF";
        items.push({
          name: isPpfSqFt ? s.name : `${s.name} (${s.vehicleType})`,
          price: isPpfSqFt ? 0 : s.price, // Set price to 0 for PPF sq ft items
          quantity: isPpfSqFt ? (s as any).quantity || 1 : 1,
          type: s.vehicleType === "Accessory" ? 'part' : 'labor',
          assignedBusiness: 'Auto Gamma'
        });
      });

      // Add selected accessories
      selectedAccessories.forEach(acc => {
        items.push({
          name: `${acc.name} (x${acc.quantity})`,
          price: acc.price * acc.quantity,
          type: 'part',
          assignedBusiness: 'Auto Gamma'
        });
      });

      // Add labor charge
      if (customerData.laborCharge > 0) {
        items.push({
          name: "Labor Charges",
          price: customerData.laborCharge,
          type: 'labor',
          assignedBusiness: 'Auto Gamma'
        });
      }

      if (items.length > 0) {
        setServiceAssignments(items);
        setAssignBusinessOpen(true);
        return;
      }
    }

    const selectedService = customerData.ppfCategory
      ? `${customerData.ppfCategory} - ${customerData.ppfWarranty}`
      : "";

    // Calculate total service cost (PPF + All selected Other Services)
    let totalServiceCost = 0;
    if (customerData.ppfPrice > 0) {
      totalServiceCost += customerData.ppfPrice;
    }
    customerData.selectedOtherServices.forEach((service) => {
      if (service.price > 0) {
        totalServiceCost += service.price;
      }
    });

    const otherServicesStr =
      customerData.selectedOtherServices.length > 0
        ? customerData.selectedOtherServices.map((s) => s.name).join(", ")
        : "";

    const servicesList =
      [selectedService, otherServicesStr].filter(Boolean).join(" + ") ||
      undefined;

    createCustomerMutation.mutate(
      {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || undefined,
        address: customerData.address,
        city: customerData.city,
        district: customerData.district,
        state: customerData.state,
        service: servicesList,
        serviceCost: totalServiceCost,
        referralSource: customerData.referralSource || undefined,
        referrerName: customerData.referrerName || undefined,
        referrerPhone: customerData.referrerPhone || undefined,
        registrationDate: customerData.registrationDate,
        vehicles: [
          {
            make:
              vehicleData.make === "Other"
                ? vehicleData.otherMake
                : vehicleData.make,
            model:
              vehicleData.make === "Other" || vehicleData.model === "Other"
                ? vehicleData.otherModel
                : vehicleData.model,
            year: vehicleData.year,
            plateNumber: vehicleData.plateNumber,
            color: vehicleData.color,
            vin: vehicleData.chassisNumber,
            image: vehicleData.image,
            ppfCategory: customerData.ppfCategory,
            ppfVehicleType: customerData.ppfVehicleType,
            ppfWarranty: customerData.ppfWarranty,
            ppfPrice: customerData.ppfPrice,
            laborCost: 0,
            otherServices: customerData.selectedOtherServices,
            accessories: selectedAccessories,
          },
        ],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["customers"] });
          toast({ title: "Customer registered successfully!" });
          setLocation("/registered-customers");
        },
        onError: (error: any) => {
          const message = error?.message || "Failed to register customer";
          toast({
            title: "Registration Failed",
            description: message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const confirmCompleteRegistration = async () => {
    // Collect all items from assignments first so they are available for both flows
    const items = serviceAssignments.map(item => ({
      description: item.name,
      quantity: item.quantity || 1,
      unitPrice: item.price,
      type: item.type === 'part' ? 'accessory' : 'service',
      category: item.type === 'part' ? 'Accessory' : 'Service',
      assignedBusiness: item.assignedBusiness
    }));

    const itemsParam = encodeURIComponent(JSON.stringify(items));
    const technicianParam = customerData.technicianId ? `&technicianId=${customerData.technicianId}` : "";
    const rollParam = customerData.rollId ? `&rollId=${customerData.rollId}` : "";

    // Check if customer exists by phone number
    try {
      const response = await fetch(`/api/customers/check-phone/${customerData.phone}`);
      const data = await response.json();
      
      if (data.exists && data.customer) {
        // Customer exists, skip registration and redirect to invoice directly
        const existingCustomer = data.customer;
        
        setAssignBusinessOpen(false);
        // Using existing customer ID
        setLocation(`/invoices?direct=true&autoSubmit=true&customerId=${existingCustomer._id}&customerName=${encodeURIComponent(existingCustomer.name)}&customerPhone=${existingCustomer.phone}&vehicleName=${encodeURIComponent(vehicleData.make + " " + vehicleData.model)}&plateNumber=${encodeURIComponent(vehicleData.plateNumber)}&items=${itemsParam}${technicianParam}${rollParam}&discount=${customerData.discount}&tax=${customerData.taxPercentage}&labor=${customerData.laborCharge}&notes=${encodeURIComponent(customerData.serviceNotes)}&invoiceDate=${customerData.invoiceDate}`);
        return;
      }
    } catch (error) {
      console.error("Error checking customer existence:", error);
    }

    const selectedService = customerData.ppfCategory
      ? `${customerData.ppfCategory} - ${customerData.ppfWarranty}`
      : "";

    // Calculate total service cost
    let totalServiceCost = 0;
    if (customerData.ppfPrice > 0) {
      totalServiceCost += customerData.ppfPrice;
    }
    customerData.selectedOtherServices.forEach((service) => {
      if (service.price > 0) {
        totalServiceCost += service.price;
      }
    });

    const otherServicesStr =
      customerData.selectedOtherServices.length > 0
        ? customerData.selectedOtherServices.map((s) => s.name).join(", ")
        : "";

    const servicesList =
      [selectedService, otherServicesStr].filter(Boolean).join(" + ") ||
      undefined;

    createCustomerMutation.mutate({
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || undefined,
      address: customerData.address,
      city: customerData.city,
      district: customerData.district,
      state: customerData.state,
      service: servicesList,
      serviceCost: totalServiceCost,
      referralSource: customerData.referralSource || undefined,
      referrerName: customerData.referrerName || undefined,
      referrerPhone: customerData.referrerPhone || undefined,
      registrationDate: customerData.registrationDate,
      vehicles: [
        {
          make:
            vehicleData.make === "Other"
              ? vehicleData.otherMake
              : vehicleData.make,
          model:
            vehicleData.make === "Other" || vehicleData.model === "Other"
              ? vehicleData.otherModel
              : vehicleData.model,
          year: vehicleData.year,
          plateNumber: vehicleData.plateNumber,
          color: vehicleData.color,
          vin: vehicleData.chassisNumber,
          image: vehicleData.image,
          ppfCategory: customerData.ppfCategory,
          ppfVehicleType: customerData.ppfVehicleType,
          ppfWarranty: customerData.ppfWarranty,
          ppfPrice: customerData.ppfPrice,
          laborCost: 0,
          otherServices: customerData.selectedOtherServices,
          accessories: selectedAccessories,
        },
      ],
    });
    setAssignBusinessOpen(false);
  };

  const validateStep1 = async () => {
    const newErrors: {
      phone?: string;
      email?: string;
      referrerName?: string;
      referrerPhone?: string;
    } = {};

    if (!validatePhone(customerData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    } else if (!isInvoiceDirect) {
      // Check if phone number already exists only if NOT creating invoice directly
      try {
        const response = await fetch(
          `/api/customers/check-phone/${customerData.phone}`,
        );
        const data = await response.json();
        if (data.exists) {
          newErrors.phone = "This mobile number is already registered";
        }
      } catch (error) {
        console.error("Error checking phone number:", error);
      }
    }

    if (customerData.email && !validateEmail(customerData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (customerData.referralSource === "Friend/Family") {
      // Fields are optional as per user request
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async () => {
    if (await validateStep1()) {
      // Pre-fill vehicle type from PPF selection in step 2
      if (customerData.ppfVehicleType) {
        setVehicleData({
          ...vehicleData,
          vehicleType: customerData.ppfVehicleType,
        });
      }
      setStep(2);
    }
  };

  const canProceedStep1 =
    customerData.name &&
    customerData.phone &&
    validatePhone(customerData.phone);
  const canProceedStep2 =
    vehicleData.make && vehicleData.model;

  return (
    <div className="p-4 pt-2">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Add New Service Dialog */}
        <Dialog open={isAddingService} onOpenChange={setIsAddingService}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g. Interior Steam Cleaning"
                />
              </div>
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Prices by Vehicle Type</Label>
                {VEHICLE_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-4">
                    <Label className="flex-1 text-xs">{type}</Label>
                    <Input
                      type="number"
                      className="w-32"
                      placeholder="₹ 0"
                      value={newService.prices[type] || ""}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          prices: {
                            ...newService.prices,
                            [type]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingService(false)}>
                Cancel
              </Button>
              <Button
                disabled={!newService.name || Object.keys(newService.prices).length === 0}
                onClick={() => createServiceMutation.mutate(newService)}
              >
                Save Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <Card
            className="bg-gradient-to-br from-white to-slate-50 border-2 border-red-300 shadow-sm"
            data-testid="card-customer-info"
          >
            <CardHeader className="pb-6 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
                    <User className="w-5 h-5 text-primary" />
                    Customer Information
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="invoice-direct"
                        checked={isInvoiceDirect}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          console.log("DEBUG: Checkbox changed", checked);
                          setIsInvoiceDirect(checked);
                          if (checked) {
                            console.log("DEBUG: Ticking checkbox - refetching inventory...");
                            // Explicitly refetch inventory when checkbox is ticked
                            refetchInventory().then((res) => {
                              console.log("DEBUG: Refetch completed", res.data);
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="invoice-direct" className="text-xs font-semibold text-slate-600">Create Invoice Directly</Label>
                    </div>
                    {isInvoiceDirect && (
                      <div className="mt-2 space-y-1">
                        <Label htmlFor="invoice-date" className="text-[10px] font-bold text-slate-500 uppercase">Invoice Date</Label>
                        <Input
                          id="invoice-date"
                          type="date"
                          value={customerData.invoiceDate}
                          onChange={(e) => setCustomerData({ ...customerData, invoiceDate: e.target.value })}
                          className="h-7 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              <p className="text-sm text-slate-600 mt-2">
                Provide your personal details and service preferences
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6 relative">
                  <Label>Full Name *</Label>
                  <Input
                    value={customerData.name}
                    onChange={(e) => {
                      setCustomerData({ ...customerData, name: e.target.value });
                      setShowNameDropdown(true);
                    }}
                    onFocus={() => setShowNameDropdown(true)}
                    autoComplete="off"
                    placeholder="Enter your full name"
                    data-testid="input-full-name"
                    className="border-slate-300"
                  />
                  {showNameDropdown && filteredCustomerNames.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-[-1.5rem] max-h-48 overflow-auto">
                      {filteredCustomerNames.map((c: any) => (
                        <div
                          key={c._id}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm flex justify-between items-center"
                          onClick={() => handleSelectCustomer(c)}
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-slate-500 text-xs">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6 relative">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={customerData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) {
                        setCustomerData({
                          ...customerData,
                          phone: value,
                        });
                        setShowPhoneDropdown(true);
                        if (errors.phone)
                          setErrors({ ...errors, phone: undefined });
                      }
                    }}
                    onFocus={() => setShowPhoneDropdown(true)}
                    autoComplete="off"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    data-testid="input-mobile"
                    className={
                      cn(errors.phone ? "border-red-500" : "border-slate-300")
                    }
                  />
                  {showPhoneDropdown && filteredCustomerPhones.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-[-1.5rem] max-h-48 overflow-auto">
                      {filteredCustomerPhones.map((c: any) => (
                        <div
                          key={c._id}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm flex justify-between items-center"
                          onClick={() => handleSelectCustomer(c)}
                        >
                          <span className="font-medium">{c.phone}</span>
                          <span className="text-slate-500 text-xs">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-6">
                  <Label>Registration Date *</Label>
                  <Input
                    type="date"
                    value={customerData.registrationDate}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, registrationDate: e.target.value })
                    }
                    data-testid="input-registration-date"
                    className="border-slate-300"
                  />
                </div>

                <div className="space-y-6">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => {
                      setCustomerData({
                        ...customerData,
                        email: e.target.value,
                      });
                      if (errors.email)
                        setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="your@email.com (optional)"
                    data-testid="input-email"
                    className={
                      errors.email ? "border-red-500" : "border-slate-300"
                    }
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-6">
                  <Label>How did you hear about us?</Label>
                  <Select
                    value={customerData.referralSource}
                    onValueChange={(value) =>
                      setCustomerData({
                        ...customerData,
                        referralSource: value,
                        referrerName:
                          value === "Friend/Family"
                            ? customerData.referrerName
                            : "",
                        referrerPhone:
                          value === "Friend/Family"
                            ? customerData.referrerPhone
                            : "",
                      })
                    }
                  >
                    <SelectTrigger
                      className="border-slate-300"
                      data-testid="select-referral"
                    >
                      <SelectValue placeholder="Select referral source" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="max-h-60 w-[var(--radix-select-trigger-width)]"
                    >
                      <div className="p-2 sticky top-0 bg-white z-10 border-b">
                        <Input
                          placeholder="Search..."
                          className="h-8 text-sm"
                          onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            const items = e.target
                              .closest('[role="listbox"]')
                              ?.querySelectorAll('[role="option"]');
                            items?.forEach((item) => {
                              const text =
                                item.textContent?.toLowerCase() || "";
                              (item as HTMLElement).style.display =
                                text.includes(search) ? "flex" : "none";
                            });
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {REFERRAL_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {customerData.referralSource === "Friend/Family" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <Label>Referrer's Name</Label>
                      <Input
                        value={customerData.referrerName}
                        onChange={(e) => {
                          setCustomerData({
                            ...customerData,
                            referrerName: e.target.value,
                          });
                          if (errors.referrerName)
                            setErrors({ ...errors, referrerName: undefined });
                        }}
                        placeholder="Enter name of the person who referred you"
                        data-testid="input-referrer-name"
                        className="border-slate-300"
                      />
                    </div>

                    <div className="space-y-6">
                      <Label>Referrer's Phone Number</Label>
                      <Input
                        value={customerData.referrerPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 10) {
                            setCustomerData({
                              ...customerData,
                              referrerPhone: value,
                            });
                            if (errors.referrerPhone)
                              setErrors({
                                ...errors,
                                referrerPhone: undefined,
                              });
                          }
                        }}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        data-testid="input-referrer-phone"
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                )}

                {/* PPF & Services in 2 Columns */}
                {isInvoiceDirect && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PPF Selection - Left Column */}
                  <div className="space-y-6">
                    <Card className="border-red-300 shadow-sm p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                          PPF Services
                        </h3>
                        {(customerData.ppfCategory ||
                          customerData.ppfVehicleType ||
                          customerData.ppfWarranty) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setCustomerData({
                                ...customerData,
                                ppfCategory: "",
                                ppfVehicleType: "",
                                ppfWarranty: "",
                                ppfPrice: 0,
                              });
                            }}
                          >
                            Clear PPF
                          </Button>
                        )}
                      </div>
                        <div className="space-y-4">
                          {isInvoiceDirect && (
                            <Card className="border-primary/20 bg-blue-50/30">
                              <CardContent className="pt-4 space-y-4">
                                <div className="space-y-2">
                                  <Select
                                    value={customerData.ppfCategory}
                                    onValueChange={(val) => {
                                      console.log("DEBUG: Category selected from product dropdown", val);
                                      setCustomerData(prev => ({ 
                                        ...prev, 
                                        ppfCategory: val,
                                        ppfVehicleType: "",
                                        ppfWarranty: "",
                                        ppfPrice: 0,
                                        rollId: "" // Reset roll when category changes
                                      }));
                                    }}
                                  >
                                    <SelectTrigger className="bg-white border-primary/20 h-10">
                                      <SelectValue placeholder="Choose a product" />
                                    </SelectTrigger>
                                    <SelectContent
                                      position="popper"
                                      className="max-h-60 w-[var(--radix-select-trigger-width)]"
                                    >
                                      <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                        <Input
                                          placeholder="Search product..."
                                          className="h-8 text-sm"
                                          onChange={(e) => {
                                            const search =
                                              e.target.value.toLowerCase();
                                            const items = e.target
                                              .closest('[role="listbox"]')
                                              ?.querySelectorAll('[role="option"]');
                                            items?.forEach((item) => {
                                              const text =
                                                item.textContent?.toLowerCase() || "";
                                              (item as HTMLElement).style.display =
                                                text.includes(search)
                                                  ? "flex"
                                                  : "none";
                                            });
                                          }}
                                          onKeyDown={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      {ppfInventoryCategories && ppfInventoryCategories.length > 0 ? (
                                        ppfInventoryCategories.map((cat: any) => (
                                          <SelectItem key={cat.name} value={cat.name}>
                                            {cat.name} {cat.hasRolls ? "(In Stock)" : "(No Rolls)"}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <div className="p-4 text-center text-sm text-slate-500">
                                          No products available in inventory
                                        </div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {customerData.ppfCategory && (
                                  <div className="bg-blue-100/50 rounded-lg p-3 flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-800">Available Stock</span>
                                    <span className="font-bold text-blue-900">
                                      {categoryStock.toFixed(2)} sq ft
                                    </span>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Quantity/Amount (sq ft)</Label>
                                  <Input
                                    type="number"
                                    value={customerData.ppfQuantity}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      if (val > categoryStock) {
                                        toast({ 
                                          title: "Insufficient Stock", 
                                          description: `Only ${categoryStock.toFixed(2)} sq ft available in this category.`,
                                          variant: "destructive" 
                                        });
                                        return;
                                      }
                                      setCustomerData(prev => ({ ...prev, ppfQuantity: val }));
                                    }}
                                    className="bg-white border-primary/20"
                                    min="0"
                                    max={categoryStock}
                                    step="0.01"
                                  />
                                </div>

                                <Button 
                                  className="w-full bg-white text-black border border-black hover:bg-slate-50"
                                  variant="outline"
                                  onClick={() => {
                                    if (!customerData.ppfCategory || customerData.ppfQuantity <= 0) {
                                      toast({ title: "Please select a category and quantity", variant: "destructive" });
                                      return;
                                    }
                                    
                                    // Add to selectedOtherServices just like in service section logic
                                    // We'll use a special vehicleType "PPF" to distinguish it
                                    setCustomerData(prev => ({
                                      ...prev,
                                      selectedOtherServices: [
                                        ...prev.selectedOtherServices,
                                        {
                                          name: `PPF: ${prev.ppfCategory} - ${prev.ppfQuantity} sq ft`,
                                          vehicleType: "PPF",
                                          price: 0,
                                          quantity: prev.ppfQuantity
                                        }
                                      ],
                                      ppfQuantity: 1
                                    }));
                                    
                                    toast({ title: "PPF Item added to selection" });
                                  }}
                                >
                                  + Add Item
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                          
                          <div className="space-y-2">
                            <Label>PPF Category</Label>
                          <Select
                            value={customerData.ppfCategory}
                            onValueChange={(value) =>
                              setCustomerData({
                                ...customerData,
                                ppfCategory: value,
                                ppfVehicleType: "",
                                ppfWarranty: "",
                                ppfPrice: 0,
                              })
                            }
                          >
                            <SelectTrigger
                              className="border-slate-300"
                              data-testid="select-ppf-category"
                            >
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="max-h-60 w-[var(--radix-select-trigger-width)]"
                            >
                              <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                <Input
                                  placeholder="Search category..."
                                  className="h-8 text-sm"
                                  onChange={(e) => {
                                    const search = e.target.value.toLowerCase();
                                    const items = e.target
                                      .closest('[role="listbox"]')
                                      ?.querySelectorAll('[role="option"]');
                                    items?.forEach((item) => {
                                      const text =
                                        item.textContent?.toLowerCase() || "";
                                      (item as HTMLElement).style.display =
                                        text.includes(search) ? "flex" : "none";
                                    });
                                  }}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {ppfCategoriesFromServices.length > 0 ? (
                                ppfCategoriesFromServices.map((cat: any) => (
                                  <SelectItem key={cat._id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-ppf" disabled>
                                  No PPF Inventory Found
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>


                        {customerData.ppfCategory && (
                          <div className="space-y-2">
                            <Label>Vehicle Type</Label>
                            <Select
                              value={customerData.ppfVehicleType}
                              onValueChange={(value) =>
                                setCustomerData({
                                  ...customerData,
                                  ppfVehicleType: value,
                                  ppfWarranty: "",
                                  ppfPrice: 0,
                                })
                              }
                            >
                              <SelectTrigger
                                className="border-slate-300"
                                data-testid="select-ppf-vehicle"
                              >
                                <SelectValue placeholder="Select vehicle type" />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                className="max-h-60 w-[var(--radix-select-trigger-width)]"
                              >
                                <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                  <Input
                                    placeholder="Search..."
                                    className="h-8 text-sm"
                                    onChange={(e) => {
                                      const search =
                                        e.target.value.toLowerCase();
                                      const items = e.target
                                        .closest('[role="listbox"]')
                                        ?.querySelectorAll('[role="option"]');
                                      items?.forEach((item) => {
                                        const text =
                                          item.textContent?.toLowerCase() || "";
                                        (item as HTMLElement).style.display =
                                          text.includes(search)
                                            ? "flex"
                                            : "none";
                                      });
                                    }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {(() => {
                                  const selectedCat = ppfCategoriesFromServices.find(c => c.name === customerData.ppfCategory);
                                  const options = selectedCat?.warrantyOptions || {};
                                  const keys = Object.keys(options);
                                  
                                  if (keys.length > 0) {
                                    return keys.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ));
                                  }

                                  // Fallback to prices if no warranty options
                                  const priceKeys = Object.keys(selectedCat?.prices || {});
                                  if (priceKeys.length > 0) {
                                    return priceKeys.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ));
                                  }

                                  // Final fallback to default vehicle types
                                  return VEHICLE_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {customerData.ppfVehicleType && (
                          <div className="space-y-2">
                            <Label>Warranty & Price</Label>
                            <Select
                              value={customerData.ppfWarranty}
                              onValueChange={(value) => {
                                const selectedCat = ppfCategoriesFromServices.find(c => c.name === customerData.ppfCategory);
                                const vehicleOptions = selectedCat?.warrantyOptions?.[customerData.ppfVehicleType] || [];
                                const option = vehicleOptions.find((o: any) => o.warranty === value);
                                const price = option?.price || 0;
                                
                                setCustomerData({
                                  ...customerData,
                                  ppfWarranty: value,
                                  ppfPrice: price,
                                });
                              }}
                            >
                              <SelectTrigger
                                className="border-slate-300"
                                data-testid="select-ppf-warranty"
                              >
                                <SelectValue placeholder="Select warranty" />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                className="max-h-60 w-[var(--radix-select-trigger-width)]"
                              >
                                <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                  <Input
                                    placeholder="Search..."
                                    className="h-8 text-sm"
                                    onChange={(e) => {
                                      const search =
                                        e.target.value.toLowerCase();
                                      const items = e.target
                                        .closest('[role="listbox"]')
                                        ?.querySelectorAll('[role="option"]');
                                      items?.forEach((item) => {
                                        const text =
                                          item.textContent?.toLowerCase() || "";
                                        (item as HTMLElement).style.display =
                                          text.includes(search)
                                            ? "flex"
                                            : "none";
                                      });
                                    }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {(() => {
                                  const selectedCat = ppfCategoriesFromServices.find(c => c.name === customerData.ppfCategory);
                                  const vehicleOptions = selectedCat?.warrantyOptions?.[customerData.ppfVehicleType] || [];
                                  return vehicleOptions.map((opt: any) => (
                                    <SelectItem key={opt.warranty} value={opt.warranty}>
                                      {opt.warranty} - ₹
                                      {opt.price.toLocaleString("en-IN")}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                              Accessory Section
                            </h3>
                            {(customerData.tempAccessoryCategory ||
                              customerData.tempAccessoryName ||
                              customerData.selectedOtherServices.some(
                                (s) => s.vehicleType === "Accessory",
                              )) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setCustomerData({
                                    ...customerData,
                                    tempAccessoryCategory: "",
                                    tempAccessoryName: "",
                                    accessoryQuantity: 1,
                                    selectedOtherServices:
                                      customerData.selectedOtherServices.filter(
                                        (s) => s.vehicleType !== "Accessory",
                                      ),
                                  });
                                }}
                              >
                                Clear Accessories
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Accessory Category</Label>
                              <Select
                                value={customerData.tempAccessoryCategory}
                                onValueChange={(value) =>
                                  setCustomerData({
                                    ...customerData,
                                    tempAccessoryCategory: value,
                                    tempAccessoryName: "",
                                  })
                                }
                              >
                                <SelectTrigger className="border-slate-300">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent
                                  position="popper"
                                  className="max-h-60 w-[var(--radix-select-trigger-width)]"
                                >
                                  <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                    <Input
                                      placeholder="Search..."
                                      className="h-8 text-sm"
                                      onChange={(e) => {
                                        const search =
                                          e.target.value.toLowerCase();
                                        const items = e.target
                                          .closest('[role="listbox"]')
                                          ?.querySelectorAll('[role="option"]');
                                        items?.forEach((item) => {
                                          const text =
                                            item.textContent?.toLowerCase() ||
                                            "";
                                          (item as HTMLElement).style.display =
                                            text.includes(search)
                                              ? "flex"
                                              : "none";
                                        });
                                      }}
                                      onKeyDown={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  {accessoryCategories.length > 0 ? (
                                    accessoryCategories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="none" disabled>
                                      No categories available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>


                            {customerData.tempAccessoryCategory && (
                              <div className="space-y-2">
                                <Label>Accessory Name</Label>
                                <Select
                                  value={customerData.tempAccessoryName}
                                  onValueChange={(value) => {
                                    setCustomerData({
                                      ...customerData,
                                      tempAccessoryName: value,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="border-slate-300">
                                    <SelectValue placeholder="Select accessory" />
                                  </SelectTrigger>
                                  <SelectContent
                                    position="popper"
                                    className="max-h-60 w-[var(--radix-select-trigger-width)]"
                                  >
                                    <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                      <Input
                                        placeholder="Search..."
                                        className="h-8 text-sm"
                                        onChange={(e) => {
                                          const search =
                                            e.target.value.toLowerCase();
                                          const items = e.target
                                            .closest('[role="listbox"]')
                                            ?.querySelectorAll(
                                              '[role="option"]',
                                            );
                                          items?.forEach((item) => {
                                            const text =
                                              item.textContent?.toLowerCase() ||
                                              "";
                                            (
                                              item as HTMLElement
                                            ).style.display = text.includes(
                                              search,
                                            )
                                              ? "flex"
                                              : "none";
                                          });
                                        }}
                                        onKeyDown={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    {filteredAccessories.length > 0 ? (
                                      filteredAccessories.map((item) => (
                                        <SelectItem
                                          key={item._id}
                                          value={item.name}
                                        >
                                          {item.name}{" "}
                                          {item.quantity > 0
                                            ? ""
                                            : "(out of stock)"}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="none" disabled>
                                        No accessories available
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          {customerData.tempAccessoryCategory && customerData.tempAccessoryName && (
                            <div className="space-y-2">
                              <Label>Quantity</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={
                                    customerData.accessoryQuantity || 1
                                  }
                                  onChange={(e) =>
                                    setCustomerData({
                                      ...customerData,
                                      accessoryQuantity:
                                        parseInt(e.target.value) || 1,
                                    })
                                  }
                                  className="border-slate-300"
                                />
                                <Button
                                  type="button"
                                  disabled={
                                    !customerData.tempAccessoryName ||
                                    (() => {
                                      const item = accessoryInventory.find(
                                        (i: any) =>
                                          i.name ===
                                          customerData.tempAccessoryName,
                                      );
                                      return (
                                        !item ||
                                        item.quantity <
                                          customerData.accessoryQuantity
                                      );
                                    })()
                                  }
                                  onClick={() => {
                                    if (customerData.tempAccessoryName) {
                                      const item = accessoryInventory.find(
                                        (i: any) =>
                                          i.name ===
                                          customerData.tempAccessoryName,
                                      );
                                      if (item) {
                                        if (
                                          item.quantity <
                                          customerData.accessoryQuantity
                                        ) {
                                          toast({
                                            title: "Insufficient Stock",
                                            description: `Only ${item.quantity} units available in stock.`,
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        setCustomerData({
                                          ...customerData,
                                          selectedOtherServices: [
                                            ...customerData.selectedOtherServices,
                                            {
                                              name: `${item.name} (x${customerData.accessoryQuantity})`,
                                              vehicleType: "Accessory",
                                              price:
                                                (item.price || 0) *
                                                customerData.accessoryQuantity,
                                            },
                                          ],
                                          tempAccessoryCategory: "",
                                          tempAccessoryName: "",
                                          accessoryQuantity: 1,
                                        });
                                        toast({
                                          title: "Accessory added",
                                        });
                                      }
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          )}
                          {customerData.selectedOtherServices.some(
                            (s) => s.vehicleType === "Accessory",
                          ) && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                              <Label className="font-semibold text-slate-900 mb-3 block">
                                Selected Accessories
                              </Label>
                              <div className="space-y-2">
                                {customerData.selectedOtherServices
                                  .filter((s) => s.vehicleType === "Accessory")
                                  .map((acc, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                                    >
                                      <span className="text-sm font-medium">
                                        {acc.name} - ₹
                                        {acc.price.toLocaleString("en-IN")}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                          const originalIndex =
                                            customerData.selectedOtherServices.findIndex(
                                              (s) => s === acc,
                                            );
                                          setCustomerData({
                                            ...customerData,
                                            selectedOtherServices:
                                              customerData.selectedOtherServices.filter(
                                                (_, i) => i !== originalIndex,
                                              ),
                                          });
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Other Services Selection - Right Column */}
                  <div className="space-y-6">
                    <Card className="border-red-300 shadow-sm p-4 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                          Other Services (Multiple)
                        </h3>
                        {(customerData.tempServiceName ||
                          customerData.tempServiceVehicleType ||
                          customerData.selectedOtherServices.some(
                            (s) => s.vehicleType !== "Accessory",
                          )) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setCustomerData({
                                ...customerData,
                                tempServiceName: "",
                                tempServiceVehicleType: "",
                                selectedOtherServices:
                                  customerData.selectedOtherServices.filter(
                                    (s) => s.vehicleType === "Accessory",
                                  ),
                              });
                            }}
                          >
                            Clear Services
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Service</Label>
                          <Select
                            value={customerData.tempServiceName}
                            onValueChange={(value) => {
                              if (value === "ADD_NEW") {
                                setIsAddingService(true);
                                return;
                              }
                              setCustomerData({
                                ...customerData,
                                tempServiceName: value,
                                tempServiceVehicleType: "",
                              });
                            }}
                          >
                            <SelectTrigger
                              className="border-slate-300"
                              data-testid="select-service-name"
                            >
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="max-h-60 w-[var(--radix-select-trigger-width)]"
                            >
                              <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                <Input
                                  placeholder="Search..."
                                  className="h-8 text-sm"
                                  onChange={(e) => {
                                    const search = e.target.value.toLowerCase();
                                    const items = e.target
                                      .closest('[role="listbox"]')
                                      ?.querySelectorAll('[role="option"]');
                                    items?.forEach((item) => {
                                      const text =
                                        item.textContent?.toLowerCase() || "";
                                      (item as HTMLElement).style.display =
                                        text.includes(search) ? "flex" : "none";
                                    });
                                  }}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {Object.keys(allOtherServices).map((service) => (
                                <SelectItem key={service} value={service}>
                                  {service}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {customerData.tempServiceName && (
                          <div className="space-y-2">
                            <Label>Vehicle Type</Label>
                            <Select
                              value={customerData.tempServiceVehicleType}
                              onValueChange={(value) =>
                                setCustomerData({
                                  ...customerData,
                                  tempServiceVehicleType: value,
                                })
                              }
                            >
                              <SelectTrigger
                                className="border-slate-300"
                                data-testid="select-service-vehicle"
                              >
                                <SelectValue placeholder="Select vehicle type" />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                className="max-h-60 w-[var(--radix-select-trigger-width)]"
                              >
                                <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                  <Input
                                    placeholder="Search..."
                                    className="h-8 text-sm"
                                    onChange={(e) => {
                                      const search =
                                        e.target.value.toLowerCase();
                                      const items = e.target
                                        .closest('[role="listbox"]')
                                        ?.querySelectorAll('[role="option"]');
                                      items?.forEach((item) => {
                                        const text =
                                          item.textContent?.toLowerCase() || "";
                                        (item as HTMLElement).style.display =
                                          text.includes(search)
                                            ? "flex"
                                            : "none";
                                      });
                                    }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {availableServiceVehicleTypes.map((type) => {
                                  const serviceData = allOtherServices[
                                    customerData.tempServiceName
                                  ] as Record<string, number>;
                                  const price = serviceData ? serviceData[type] : null;
                                  return (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                      {price !== undefined && price !== null
                                        ? ` - ₹${price.toLocaleString("en-IN")}`
                                        : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => {
                                if (
                                  customerData.tempServiceName &&
                                  customerData.tempServiceVehicleType
                                ) {
                                  const serviceData = allOtherServices[
                                    customerData.tempServiceName
                                  ] as Record<string, number>;
                                  const price =
                                    serviceData[
                                      customerData.tempServiceVehicleType
                                    ];
                                  setCustomerData({
                                    ...customerData,
                                    selectedOtherServices: [
                                      ...customerData.selectedOtherServices,
                                      {
                                        name: customerData.tempServiceName,
                                        vehicleType:
                                          customerData.tempServiceVehicleType,
                                        price,
                                      },
                                    ],
                                    tempServiceName: "",
                                    tempServiceVehicleType: "",
                                  });
                                }
                              }}
                            >
                              Add Service
                            </Button>
                          </div>
                        )}

                        {customerData.selectedOtherServices.some(
                          (s) => s.vehicleType !== "Accessory",
                        ) && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <Label className="font-semibold text-slate-900 mb-3 block">
                              Selected Services
                            </Label>
                            <div className="space-y-2">
                              {customerData.selectedOtherServices
                                .filter((s) => s.vehicleType !== "Accessory")
                                .map((service, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                                  >
                                    {service.vehicleType === "PPF" ? (
                                      <span className="text-sm font-medium">
                                        {service.name}
                                      </span>
                                    ) : (
                                      <span className="text-sm font-medium">
                                        {service.name} ({service.vehicleType}) - ₹
                                        {service.price.toLocaleString("en-IN")}
                                      </span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        const originalIndex =
                                          customerData.selectedOtherServices.findIndex(
                                            (s) => s === service,
                                          );
                                        setCustomerData({
                                          ...customerData,
                                          selectedOtherServices:
                                            customerData.selectedOtherServices.filter(
                                              (_, i) => i !== originalIndex,
                                            ),
                                        });
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
                )}

                <div className="md:col-span-2 space-y-6">
                  <Label>Address</Label>
                  <Input
                    value={customerData.address}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter street address"
                    data-testid="input-address"
                    className="border-slate-300"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={customerData.city}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          city: e.target.value,
                        })
                      }
                      placeholder="City"
                      data-testid="input-city"
                      className="border-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>District</Label>
                    <Input
                      value={customerData.district}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          district: e.target.value,
                        })
                      }
                      placeholder="District"
                      data-testid="input-district"
                      className="border-slate-300"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={customerData.state}
                      onValueChange={(value) =>
                        setCustomerData({ ...customerData, state: value })
                      }
                    >
                      <SelectTrigger
                        className="border-slate-300"
                        data-testid="select-state"
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="max-h-60 w-[var(--radix-select-trigger-width)]"
                      >
                        <div className="p-2 sticky top-0 bg-white z-10 border-b">
                          <Input
                            placeholder="Search state..."
                            className="h-8 text-sm"
                            onChange={(e) => {
                              const search = e.target.value.toLowerCase();
                              const items = e.target
                                .closest('[role="listbox"]')
                                ?.querySelectorAll('[role="option"]');
                              items?.forEach((item) => {
                                const text =
                                  item.textContent?.toLowerCase() || "";
                                (item as HTMLElement).style.display =
                                  text.includes(search) ? "flex" : "none";
                              });
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isInvoiceDirect && (
                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-900">Direct Invoice Details</h4>
                      <div className="w-[200px]">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Technician</Label>
                        <Select
                          value={customerData.technicianId}
                          onValueChange={(val) => setCustomerData(prev => ({ ...prev, technicianId: val }))}
                        >
                          <SelectTrigger className="bg-white border-slate-300 h-9 w-full">
                            <SelectValue placeholder="Select Technician" />
                          </SelectTrigger>
                          <SelectContent>
                            {technicians.map((tech: any) => (
                              <SelectItem key={tech._id || tech.id} value={tech._id || tech.id}>
                                {tech.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Labor Charge (₹)</Label>
                        <Input
                          type="text"
                          value={customerData.laborCharge === 0 ? "" : customerData.laborCharge}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            if (!isNaN(val as number)) {
                              setCustomerData(prev => ({ ...prev, laborCharge: val as number }));
                            }
                          }}
                          placeholder="0"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Discount (₹)</Label>
                        <Input
                          type="text"
                          value={customerData.discount === 0 ? "" : customerData.discount}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            if (!isNaN(val as number)) {
                              setCustomerData(prev => ({ ...prev, discount: val as number }));
                            }
                          }}
                          placeholder="0"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">GST (%)</Label>
                        <Input
                          type="text"
                          value={customerData.taxPercentage}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Allow typing numbers and decimal point
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                              setCustomerData(prev => ({ ...prev, taxPercentage: val }));
                            }
                          }}
                          placeholder="0"
                          className="border-slate-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Service Notes</Label>
                      <Input
                        type="text"
                        value={customerData.serviceNotes}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, serviceNotes: e.target.value }))}
                        placeholder="Additional notes for the invoice..."
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-end pt-6 border-t border-slate-200">
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedStep1}
                  className="px-8 shadow-sm hover:shadow-md transition-all"
                  data-testid="button-next-step"
                >
                  Vehicle Information
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Vehicle Details */}
        {step === 2 && (
          <Card
            className="bg-gradient-to-br from-white to-slate-50 border-2 border-red-300 shadow-sm"
            data-testid="card-vehicle-info"
          >
            <CardHeader className="pb-6 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
                <Car className="w-5 h-5 text-primary" />
                Vehicle Details
              </CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Please provide your vehicle information
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vehicle Name *</Label>
                    <Select
                      value={vehicleData.make}
                      onValueChange={(value) =>
                        setVehicleData({
                          ...vehicleData,
                          make: value,
                          model: value === "Other" ? "Other" : "",
                          otherMake: "",
                          otherModel: "",
                        })
                      }
                    >
                      <SelectTrigger
                        className="border-slate-300"
                        data-testid="select-vehicle-make"
                      >
                        <SelectValue placeholder="Select vehicle make" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="max-h-60 w-[var(--radix-select-trigger-width)]"
                      >
                        <div className="p-2 sticky top-0 bg-white z-10 border-b">
                          <Input
                            placeholder="Search make..."
                            className="h-8 text-sm"
                            onChange={(e) => {
                              const search = e.target.value.toLowerCase();
                              const items = e.target
                                .closest('[role="listbox"]')
                                ?.querySelectorAll('[role="option"]');
                              items?.forEach((item) => {
                                const text =
                                  item.textContent?.toLowerCase() || "";
                                (item as HTMLElement).style.display =
                                  text.includes(search) ? "flex" : "none";
                              });
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        {(() => {
                          return dynamicMakes.map((make) => (
                            <SelectItem key={make} value={make}>
                              {make}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  {vehicleData.make === "Other" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <Label>Enter Vehicle Name *</Label>
                      <Input
                        value={vehicleData.otherMake}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            otherMake: e.target.value,
                          })
                        }
                        placeholder="e.g. Tesla, Ferrari"
                        className="border-slate-300"
                        data-testid="input-other-make"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vehicle Model *</Label>
                    <Select
                      value={vehicleData.model}
                      onValueChange={(value) =>
                        setVehicleData({
                          ...vehicleData,
                          model: value,
                          otherModel: "",
                        })
                      }
                      disabled={!vehicleData.make}
                    >
                      <SelectTrigger
                        className="border-slate-300"
                        data-testid="select-vehicle-model"
                      >
                        <SelectValue
                          placeholder={
                            vehicleData.make
                              ? "Select model"
                              : "Select vehicle name first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="max-h-60 w-[var(--radix-select-trigger-width)]"
                      >
                        <div className="p-2 sticky top-0 bg-white z-10 border-b">
                          <Input
                            placeholder="Search model..."
                            className="h-8 text-sm"
                            onChange={(e) => {
                              const search = e.target.value.toLowerCase();
                              const items = e.target
                                .closest('[role="listbox"]')
                                ?.querySelectorAll('[role="option"]');
                              items?.forEach((item) => {
                                const text =
                                  item.textContent?.toLowerCase() || "";
                                (item as HTMLElement).style.display =
                                  text.includes(search) ? "flex" : "none";
                              });
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        {vehicleData.make &&
                          (() => {
                            const standardModels = dynamicModels[vehicleData.make as keyof typeof dynamicModels] || [];
                            const models = Array.from(new Set(["Other", ...standardModels])).sort((a, b) => {
                              if (a === "Other") return -1;
                              if (b === "Other") return 1;
                              return a.localeCompare(b);
                            });
                            return models.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ));
                          })()}
                      </SelectContent>
                    </Select>
                  </div>
                  {(vehicleData.make === "Other" ||
                    vehicleData.model === "Other") && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <Label>Enter Vehicle Model *</Label>
                      <Input
                        value={vehicleData.otherModel}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            otherModel: e.target.value,
                          })
                        }
                        placeholder="e.g. Model S, 488"
                        className="border-slate-300"
                        data-testid="input-other-model"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <Label>Vehicle Type</Label>
                  <div
                    className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900"
                    data-testid="display-vehicle-type"
                  >
                    {vehicleData.vehicleType || "Not selected"}
                  </div>
                </div>

                <div className="space-y-6">
                  <Label>Year of Manufacture</Label>
                  <Input
                    value={vehicleData.year}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, year: e.target.value })
                    }
                    placeholder="e.g., 2023"
                    data-testid="input-vehicle-year"
                  />
                </div>

                <div className="space-y-6">
                  <Label>Vehicle Number</Label>
                  <Input
                    value={vehicleData.plateNumber}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        plateNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., MH02 AB 1234"
                    data-testid="input-plate-number"
                  />
                </div>

                <div className="space-y-6">
                  <Label>Color</Label>
                  <Select
                    value={vehicleData.color}
                    onValueChange={(value) =>
                      setVehicleData({ ...vehicleData, color: value })
                    }
                  >
                    <SelectTrigger
                      className="border-slate-300"
                      data-testid="select-vehicle-color"
                    >
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="max-h-60 w-[var(--radix-select-trigger-width)]"
                    >
                      <div className="p-2 sticky top-0 bg-white z-10 border-b">
                        <Input
                          placeholder="Search color..."
                          className="h-8 text-sm"
                          onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            const items = e.target
                              .closest('[role="listbox"]')
                              ?.querySelectorAll('[role="option"]');
                            items?.forEach((item) => {
                              const text =
                                item.textContent?.toLowerCase() || "";
                              (item as HTMLElement).style.display =
                                text.includes(search) ? "flex" : "none";
                            });
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {VEHICLE_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <Label>Vehicle Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleVehicleImageChange}
                    placeholder="Upload vehicle photo"
                    data-testid="input-vehicle-image"
                  />
                  {vehicleImagePreview && (
                    <div className="mt-3 relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={vehicleImagePreview}
                        alt="Vehicle preview"
                        className="w-full h-full object-cover"
                        data-testid="img-vehicle-preview"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  data-testid="button-prev-step"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !canProceedStep2 || createCustomerMutation.isPending
                  }
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-lg transition-all"
                  data-testid="button-submit-registration"
                >
                  {createCustomerMutation.isPending
                    ? "Registering..."
                    : isInvoiceDirect ? "Create Invoice" : "Complete Registration"}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Business Assignment Dialog */}
      <Dialog open={assignBusinessOpen} onOpenChange={setAssignBusinessOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Items to Business Entities</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select which business entity each service or accessory should be billed under.
            </p>
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
              {serviceAssignments.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price.toLocaleString()}</p>
                  </div>
                  <Select
                    value={item.assignedBusiness}
                    onValueChange={(val) => {
                      const newAssignments = [...serviceAssignments];
                      newAssignments[index].assignedBusiness = val;
                      setServiceAssignments(newAssignments);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auto Gamma">Auto Gamma</SelectItem>
                      <SelectItem value="AGNX">AGNX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignBusinessOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCompleteRegistration}>
              Generate Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
