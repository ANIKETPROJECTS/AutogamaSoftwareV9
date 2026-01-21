import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Mail, MapPin, Car, Users, Filter, Grid3X3, List, Trash2, ExternalLink, Check, ImagePlus, Package, Download, Upload, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export default function RegisteredCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ... rest of state stays same
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedCustomerForImages, setSelectedCustomerForImages] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customersData = [], isLoading, refetch } = useQuery({
    queryKey: ["customers", searchQuery, selectedCity, selectedDistrict, selectedState, dateRange, fromDate, toDate],
    queryFn: () => api.customers.list(),
  });
  
  const customers = Array.isArray(customersData) ? customersData : (customersData?.customers || []);

  const uploadImagesMutation = useMutation({
    mutationFn: () => api.customers.addServiceImages(selectedCustomerForImages._id, uploadedImages),
    onSuccess: () => {
      toast({ title: "Success", description: "Service images added successfully" });
      setImageDialogOpen(false);
      setUploadedImages([]);
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add service images", variant: "destructive" });
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (customerId: string) => api.customers.delete(customerId),
    onMutate: async (customerId) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
    const previousCustomers = queryClient.getQueryData(["customers", searchQuery, selectedCity, selectedDistrict, selectedState, dateRange, fromDate, toDate]);
    
    queryClient.setQueryData(["customers", searchQuery, selectedCity, selectedDistrict, selectedState, dateRange, fromDate, toDate], (old: any) => 
      Array.isArray(old) ? old.filter((c: any) => c._id !== customerId) : old
    );

      return { previousCustomers };
    },
    onError: (err, customerId, context: any) => {
    const previousCustomers = queryClient.getQueryData(["customers", searchQuery, selectedCity, selectedDistrict, selectedState, dateRange, fromDate, toDate]);
    
    queryClient.setQueryData(["customers", searchQuery, selectedCity, selectedDistrict, selectedState, dateRange, fromDate, toDate], (old: any) => 
      Array.isArray(old) ? old.filter((c: any) => c._id !== customerId) : old
    );
      toast({ title: "Error", description: "Failed to delete customer", variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer deleted successfully" });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesToProcess = Array.from(files).slice(0, 5 - uploadedImages.length);
    const results: string[] = [];
    let loadedCount = 0;

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          results.push(event.target.result as string);
          loadedCount++;
          
          // Update state only after ALL files are loaded
          if (loadedCount === filesToProcess.length) {
            setUploadedImages([...uploadedImages, ...results]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const cities = new Set<string>();
    const districts = new Set<string>();
    const states = new Set<string>();

    console.log("[Filters] Processing customers for filter extraction:", customers.length);

    customers.forEach((customer: any) => {
      console.log("[Filters] Customer data:", {
        name: customer.name,
        address: customer.address,
        city: customer.city,
        district: customer.district,
        state: customer.state
      });

      if (customer.city?.trim()) cities.add(customer.city.trim());
      if (customer.district?.trim()) districts.add(customer.district.trim());
      if (customer.state?.trim()) states.add(customer.state.trim());
    });

    // Remove empty string if any
    cities.delete("");
    districts.delete("");
    states.delete("");

    const result = {
      cities: Array.from(cities).filter(Boolean).sort(),
      districts: Array.from(districts).filter(Boolean).sort(),
      states: Array.from(states).filter(Boolean).sort(),
    };

    console.log("[Filters] Extracted filter options:", result);
    return result;
  }, [customers]);

  const filteredCustomers = customers.filter((customer: any) => {
    // Use separate fields directly
    const customerCity = customer.city || "";
    const customerDistrict = customer.district || "";
    const customerState = customer.state || "";

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = customer.name?.toLowerCase().includes(query);
      const emailMatch = customer.email?.toLowerCase().includes(query);
      const phoneMatch = customer.phone?.includes(query);
      const referenceMatch = customer.customerId?.toLowerCase().includes(query);
      const addressMatch = customer.address?.toLowerCase().includes(query);
      const vehicleMatch = customer.vehicles?.some((v: any) => 
        v.make?.toLowerCase().includes(query) ||
        v.model?.toLowerCase().includes(query) ||
        v.plateNumber?.toLowerCase().includes(query) ||
        v.vin?.toLowerCase().includes(query)
      );

      if (!nameMatch && !emailMatch && !phoneMatch && !referenceMatch && !addressMatch && !vehicleMatch) {
        return false;
      }
    }

    // Apply location filters (parse from address field)
    if (selectedCity !== "all" && customerCity) {
      if (customerCity !== selectedCity) {
        return false;
      }
    }
    if (selectedDistrict !== "all" && customerDistrict) {
      if (customerDistrict !== selectedDistrict) {
        return false;
      }
    }
    if (selectedState !== "all" && customerState) {
      if (customerState !== selectedState) {
        return false;
      }
    }

    // Apply date range filter
    const customerDate = customer.createdAt ? new Date(customer.createdAt) : null;
    
    if (dateRange !== "all" && customerDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const customerDateOnly = new Date(customerDate);
      customerDateOnly.setHours(0, 0, 0, 0);
      
      if (dateRange === "today") {
        if (customerDateOnly.getTime() !== today.getTime()) return false;
      } else if (dateRange === "week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        if (customerDateOnly < startOfWeek) return false;
      } else if (dateRange === "month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        if (customerDateOnly < startOfMonth || customerDateOnly > endOfMonth) return false;
      } else if (dateRange === "custom") {
        if (fromDate) {
          const from = new Date(fromDate);
          if (customerDateOnly < from) return false;
        }
        if (toDate) {
          const to = new Date(toDate);
          if (customerDateOnly > to) return false;
        }
      }
    }

    return true;
  });

  const handleExport = () => {
    setIsExporting(true);
    console.log("[Export] Starting export process for", customers.length, "customers");
    try {
      if (!customers) {
        throw new Error("No customers data available to export");
      }

      const customersToExport = Array.isArray(customers) ? customers : ((customers as any).customers || []);
      console.log("[Export] Normalized customers to export:", customersToExport.length);

      if (customersToExport.length === 0) {
        console.warn("[Export] No customers found in normalized data");
      }

      const exportData = customersToExport.length > 0 ? customersToExport.map((c: any) => {
        try {
          console.log("[Export] Processing customer:", c.name, c.customerId);
          const firstVehicle = c.vehicles?.[0] || {};
          
          const parsedAddress = c.address || "";
          const parsedCity = c.city || "";
          const parsedDistrict = c.district || "";
          const parsedState = c.state || "";

          // Auto-set Referral Source if referrer info exists
          let referralSource = c.referralSource || "";
          if (!referralSource && (c.referrerName || c.referrerPhone)) {
            referralSource = "Friend/Family";
          }

          // Extract Services and Accessories based on JSON structure
          // PPF is also a service (stored in ppfCategory/ppfPrice)
          const services: string[] = [];
          const accessories: string[] = [];
          
          // Get Vehicle Type for the Excel - prioritize the one with actual data
          // There are two: one from PPF section, one from Other Services section
          const serviceVehicleType = firstVehicle.otherServices?.[0]?.vehicleType || "";
          const excelVehicleType = firstVehicle.ppfVehicleType || serviceVehicleType || firstVehicle.vehicleType || "";

          // 1. Add PPF if exists
          if (firstVehicle.ppfCategory && firstVehicle.ppfPrice) {
            services.push(`${firstVehicle.ppfCategory} (${excelVehicleType}) (₹${firstVehicle.ppfPrice})`);
          }

          // 2. Process otherServices
          const otherServices = firstVehicle.otherServices || [];
          otherServices.forEach((s: any) => {
            const entry = `${s.name || "Unnamed"} (₹${s.price || 0})`;
            if (s.vehicleType === "Accessory" || s.name?.includes("(x")) {
              accessories.push(entry);
            } else {
              services.push(entry);
            }
          });

          const selectedServices = services.join(", ");
          const selectedAccessories = accessories.join(", ");

          // Excel has a per-cell limit of 32767 characters. 
          // Base64 images often exceed this. We'll truncate them for safety.
          const safeString = (val: any) => {
            const str = String(val || "");
            if (str.length > 32000) {
              console.warn(`[Export] Truncating long field for ${c.name} (${str.length} chars)`);
              return str.substring(0, 32000) + "... [Truncated due to Excel limit]";
            }
            return str;
          };

          return {
            "Customer ID": safeString(c.customerId),
            "Name": safeString(c.name),
            "Phone": safeString(c.phone),
            "Email": safeString(c.email),
            "Address": safeString(parsedAddress),
            "City": safeString(parsedCity),
            "District": safeString(parsedDistrict),
            "State": safeString(parsedState),
            "Referral Source": safeString(referralSource),
            "Referrer Name": safeString(c.referrerName),
            "Referrer Phone": safeString(c.referrerPhone),
            "PPF Category": safeString(firstVehicle.ppfCategory),
            "PPF Vehicle Type": safeString(firstVehicle.ppfVehicleType),
            "PPF Warranty": safeString(firstVehicle.ppfWarranty),
            "PPF Price": Number(firstVehicle.ppfPrice || 0),
            "Labor Cost": Number(firstVehicle.laborCost || 0),
            "GST Required": c.requiresGST ? "Yes" : "No",
            "Material Supplied": c.customerSuppliedMaterial ? "Yes" : "No",
            "Material Details": safeString(c.customerMaterialDetails),
            "Selected Services": safeString(selectedServices),
            "Selected Accessories": safeString(selectedAccessories),
            "Service": safeString(c.service),
            "Service Cost": Number(c.serviceCost || 0),
            "Vehicle Name": safeString(firstVehicle.make),
            "Vehicle Model": safeString(firstVehicle.model),
            "Vehicle Type (PPF)": safeString(firstVehicle.ppfVehicleType),
            "Vehicle Type (Service)": safeString(firstVehicle.otherServices?.[0]?.vehicleType || firstVehicle.vehicleType),
            "Year of Manufacture": safeString(firstVehicle.year),
            "Vehicle Number": safeString(firstVehicle.plateNumber),
            "Chassis Number": safeString(firstVehicle.vin),
            "Color": safeString(firstVehicle.color),
            "Vehicle Image Link": safeString(firstVehicle.image),
            "Registration Date": c.registrationDate || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""),
            "Created Date": c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""
          };
        } catch (err) {
          console.error("[Export] Error mapping customer:", c?.name, err);
          return { "Error": "Failed to map customer data" };
        }
      }) : [{
        "Customer ID": "No Data",
        "Name": "",
        "Phone": "",
        "Email": "",
        "Address": "",
        "City": "",
        "District": "",
        "State": "",
        "Referral Source": "",
        "Referrer Name": "",
        "Referrer Phone": "",
        "PPF Category": "",
        "PPF Vehicle Type": "",
        "PPF Warranty": "",
        "PPF Price": "",
        "Labor Cost": "",
        "GST Required": "",
        "Material Supplied": "",
        "Material Details": "",
        "Service": "",
        "Service Cost": "",
        "Vehicle Name": "",
        "Vehicle Model": "",
        "Vehicle Type (PPF)": "",
        "Vehicle Type (Service)": "",
        "Year of Manufacture": "",
        "Vehicle Number": "",
        "Chassis Number": "",
        "Color": "",
        "Vehicle Image Link": "",
        "Registration Date": ""
      }];

      console.log("[Export] Export data prepared, creating sheet. Row count:", exportData.length);
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      console.log("[Export] Writing file...");
      XLSX.writeFile(wb, `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      console.log("[Export] Export successful");
      toast({ title: "Success", description: "Customers exported to Excel" });
    } catch (error: any) {
      console.error("[Export] Export failed error:", error);
      toast({ 
        title: "Error", 
        description: `Failed to export data: ${error.message || 'Unknown error'}`, 
        variant: "destructive" 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const { data: dbServices = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.services.list(),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.inventory.list(),
  });

  const ppfCategoriesFromServices = useMemo(() => {
    const servicesFromDb = (dbServices || [])
      .filter((s: any) => s && (s.isPpf === true || s.isPPF === true))
      .map((s: any) => s.name);
    return Array.from(new Set(servicesFromDb));
  }, [dbServices]);

  const allServiceNames = useMemo(() => {
    return Array.from(new Set((dbServices || []).map((s: any) => s.name)));
  }, [dbServices]);

  const allVehicleTypes = useMemo(() => {
    const types = new Set<string>();
    (dbServices || []).forEach((s: any) => {
      if (s.prices) Object.keys(s.prices).forEach(t => types.add(t));
      if (s.warrantyOptions) Object.keys(s.warrantyOptions).forEach(t => types.add(t));
    });
    return Array.from(types);
  }, [dbServices]);

  const allInventoryColors = useMemo(() => {
    return Array.from(new Set((inventory || []).map((i: any) => i.color).filter(Boolean)));
  }, [inventory]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Header validation
        const REQUIRED_HEADERS = [
          "Customer ID", "Name", "Phone", "Email", "Address", "City", "District", "State", 
          "Referral Source", "Referrer Name", "Referrer Phone", "PPF Category", 
          "PPF Vehicle Type", "PPF Warranty", "PPF Price", "Labor Cost", "GST Required", 
          "Material Supplied", "Material Details", "Service", "Service Cost", "Vehicle Name", "Vehicle Model", 
          "Vehicle Type (PPF)", "Vehicle Type (Service)", "Year of Manufacture", "Vehicle Number", "Chassis Number", 
          "Color", "Vehicle Image Link", "Registration Date"
        ];
        
        const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const headers = (sheetData[0] as string[]) || [];
        
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          toast({ 
            title: "Import Error", 
            description: `Invalid Excel structure. Missing columns: \${missingHeaders.join(", ")}`,
            variant: "destructive" 
          });
          setIsImporting(false);
          return;
        }

        const data = XLSX.utils.sheet_to_json(ws);

        // Pre-defined valid options for dropdowns
        const VALID_STATES = [
          "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
          "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
          "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
          "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
        ];
        const VALID_VEHICLE_TYPES = allVehicleTypes.length > 0 ? allVehicleTypes : ["Sedan", "SUV", "Hatchback", "Luxury", "Sports", "Mid-size Sedan / Compact SUV / MUV", "Other"];
        const VALID_REFERRAL_SOURCES = ["Google Search", "Social Media", "Friend/Family", "Advertisement", "Walk-in"];
        const VALID_COLORS = allInventoryColors.length > 0 ? allInventoryColors : ["White", "Silver", "Grey", "Black", "Red", "Blue", "Brown", "Beige", "Golden", "Orange", "Yellow", "Green", "Maroon", "Purple", "Other"];
        const VALID_PPF_CATEGORIES = ppfCategoriesFromServices;
        const VALID_SERVICES = allServiceNames;

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (let index = 0; index < (data as any[]).length; index++) {
          const row = (data as any[])[index];
          try {
            // Validate mandatory fields
            const mandatoryFields = ["Name", "Phone"];
            const missingFields = mandatoryFields.filter(f => !row[f]);
            if (missingFields.length > 0) {
              throw new Error(`Row ${index + 1}: Missing mandatory fields: ${missingFields.join(", ")}`);
            }
            if (!row["Vehicle Name"] && !row["Vehicle Make"]) {
              throw new Error(`Row ${index + 1}: Vehicle Name is required.`);
            }

            // Validate dropdown fields
            if (row["State"] && !VALID_STATES.map(s => s.toLowerCase()).includes(row["State"].toString().trim().toLowerCase())) {
              throw new Error(`Row ${index + 1}: Invalid State '${row["State"]}'. Must match dropdown options exactly.`);
            }
            if (row["Vehicle Type"] && !VALID_VEHICLE_TYPES.map(s => s.toLowerCase()).includes(row["Vehicle Type"].toString().trim().toLowerCase())) {
              throw new Error(`Row ${index + 1}: Invalid Vehicle Type '${row["Vehicle Type"]}'. Must match dropdown options exactly.`);
            }
            if (row["Referral Source"] && !VALID_REFERRAL_SOURCES.map(s => s.toLowerCase()).includes(row["Referral Source"].toString().trim().toLowerCase())) {
              throw new Error(`Row ${index + 1}: Invalid Referral Source '${row["Referral Source"]}'. Must match dropdown options exactly.`);
            }
            if (row["Color"] && !VALID_COLORS.map(s => s.toLowerCase()).includes(row["Color"].toString().trim().toLowerCase())) {
              throw new Error(`Row ${index + 1}: Invalid Color '${row["Color"]}'. Must match dropdown options exactly.`);
            }
            if (row["PPF Category"] && !VALID_PPF_CATEGORIES.map(s => s.toLowerCase()).includes(row["PPF Category"].toString().trim().toLowerCase())) {
              throw new Error(`Row ${index + 1}: Invalid PPF Category '${row["PPF Category"]}'. Must match dropdown options exactly.`);
            }

            // Standardize dropdown values to match system case
            const state = row["State"] ? VALID_STATES.find(s => s.toLowerCase() === row["State"].toString().trim().toLowerCase()) : "Maharashtra";
            const vehicleType = row["Vehicle Type"] ? VALID_VEHICLE_TYPES.find(s => s.toLowerCase() === row["Vehicle Type"].toString().trim().toLowerCase()) : undefined;
            const referralSource = row["Referral Source"] ? VALID_REFERRAL_SOURCES.find(s => s.toLowerCase() === row["Referral Source"].toString().trim().toLowerCase()) : undefined;
            const color = row["Color"] ? VALID_COLORS.find(s => s.toLowerCase() === row["Color"].toString().trim().toLowerCase()) : undefined;
            const ppfCategory = row["PPF Category"] ? VALID_PPF_CATEGORIES.find(s => s.toLowerCase() === row["PPF Category"].toString().trim().toLowerCase()) : undefined;

            // Date validation and parsing
            let createdAt = new Date();
            if (row["Registration Date"]) {
              const parsedDate = new Date(row["Registration Date"]);
              if (!isNaN(parsedDate.getTime())) {
                createdAt = parsedDate;
              }
            }

            // Check for duplicates
            const phone = row["Phone"]?.toString();
            const email = row["Email"];
            const plateNumber = (row["Vehicle Number"] || row["Plate Number"])?.toString();
            
            const isDuplicate = customers.some((c: any) => 
              c.phone === phone && 
              c.name === row["Name"] && 
              c.vehicles?.some((v: any) => v.plateNumber === plateNumber)
            );

            if (isDuplicate) {
              skipCount++;
              continue;
            }

            // Process detailed services and accessories
            const otherServices: any[] = [];
            
            // 1. Handle Selected Services (includes other services)
            const serviceStr = row["Selected Services"] || "";
            if (serviceStr) {
              serviceStr.split(",").forEach((s: string) => {
                const match = s.trim().match(/^(.*?)\s*\(₹(\d+)\)$/);
                if (match) {
                  const [_, name, price] = match;
                  // If it's a PPF category, it's already handled by ppfCategory/ppfPrice 
                  // but we should still add it to otherServices for the vehicle card if needed
                  if (!VALID_PPF_CATEGORIES.some(cat => name.toLowerCase().includes(cat.toLowerCase()))) {
                    otherServices.push({
                      name,
                      price: Number(price),
                      vehicleType: vehicleType || "Other"
                    });
                  }
                }
              });
            }

            // 2. Handle Selected Accessories
            const accessoryStr = row["Selected Accessories"] || "";
            if (accessoryStr) {
              accessoryStr.split(",").forEach((a: string) => {
                const match = a.trim().match(/^(.*?)\s*\(₹(\d+)\)$/);
                if (match) {
                  const [_, name, price] = match;
                  otherServices.push({
                    name,
                    price: Number(price),
                    vehicleType: "Accessory"
                  });
                }
              });
            }

            await api.customers.create({
              name: row["Name"],
              phone: phone,
              email: email,
              address: row["Address"],
              city: row["City"],
              district: row["District"],
              state: state,
              referralSource: referralSource,
              referrerName: row["Referrer Name"],
              referrerPhone: row["Referrer Phone"]?.toString(),
              requiresGST: row["GST Required"]?.toString().toLowerCase() === "yes",
              customerSuppliedMaterial: row["Material Supplied"]?.toString().toLowerCase() === "yes",
              customerMaterialDetails: row["Material Details"],
              service: row["Service"],
              serviceCost: Number(row["Service Cost"] || 0),
              createdAt: createdAt,
              vehicles: [{
                make: row["Vehicle Name"] || row["Vehicle Make"],
                model: row["Vehicle Model"],
                vehicleType: vehicleType,
                year: row["Year of Manufacture"]?.toString(),
                plateNumber: plateNumber,
                vin: row["Chassis Number"]?.toString(),
                color: color,
                image: row["Vehicle Image Link"],
                ppfCategory: ppfCategory,
                ppfVehicleType: row["PPF Vehicle Type"],
                ppfWarranty: row["PPF Warranty"],
                ppfPrice: Number(row["PPF Price"] || 0),
                laborCost: Number(row["Labor Cost"] || 0),
                otherServices: otherServices
              }]
            });
            successCount++;
          } catch (err: any) {
            console.error("Import error for row:", row, err);
            errorCount++;
            if (err.message && (err.message.includes("Invalid") || err.message.includes("Missing") || err.message.includes("required"))) {
              toast({ title: "Validation Error", description: err.message, variant: "destructive" });
            }
          }
        }

        toast({ 
          title: "Import Complete", 
          description: `Imported ${successCount}, Skipped ${skipCount} duplicates, ${errorCount} failed.` 
        });
        refetch();
      } catch (err) {
        toast({ title: "Error", description: "Failed to read Excel file", variant: "destructive" });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedDistrict("all");
    setSelectedState("all");
    setDateRange("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-6">
      {/* Comprehensive Search & Filter Section */}
      <div className="space-y-4">
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name, mobile, email, reference code, vehicle number, or chassis number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white border border-slate-200 rounded-lg focus:border-primary/50 shadow-sm"
            data-testid="input-search-comprehensive"
          />
        </div>

        {/* Filter Dropdowns and Sort & Date Filters in one line */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[150px]">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm" data-testid="select-city">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                <SelectItem value="all">All Cities</SelectItem>
                {filterOptions.cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm" data-testid="select-district">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                <SelectItem value="all">All Districts</SelectItem>
                {filterOptions.districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm" data-testid="select-state">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                <SelectItem value="all">All States</SelectItem>
                {filterOptions.states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm w-full" data-testid="select-date-range">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === "custom" && (
            <div className="flex gap-2 min-w-[300px]">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-3 h-11 w-full bg-white border border-slate-200 rounded-lg focus:border-primary/50 shadow-sm text-sm"
                  placeholder="From"
                  data-testid="input-from-date"
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-3 h-11 w-full bg-white border border-slate-200 rounded-lg focus:border-primary/50 shadow-sm text-sm"
                  placeholder="To"
                  data-testid="input-to-date"
                />
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="h-11 text-slate-700 hover:text-slate-900"
            data-testid="button-clear-filters"
          >
            Clear
          </Button>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-11 flex items-center gap-2"
              data-testid="button-export-excel"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? "Exporting..." : "Export"}
            </Button>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="h-11 flex items-center gap-2"
              data-testid="button-import-excel"
            >
              {isImporting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </div>

      {/* View Toggle and Results Header */}
      {!isLoading && filteredCustomers.length > 0 && (
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Registered Customers</h2>
            <p className="text-sm text-slate-600">{filteredCustomers.length} customers • {filteredCustomers.reduce((sum, c: any) => sum + (c.vehicles?.length || 0), 0)} vehicles</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="flex items-center gap-2"
              data-testid="button-view-card"
            >
              <Grid3X3 className="w-4 h-4" />
              Card
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
              List
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-12 h-12 bg-slate-200 rounded-lg animate-pulse mb-4 mx-auto" />
            <p className="text-slate-600 font-medium">Loading customers...</p>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl">
          <div className="w-16 h-16 bg-slate-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold mb-1">No customers found</p>
          <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer: any) => {
            const primaryVehicle = customer.vehicles?.[0];
            return (
              <Card
                key={customer._id}
                className="border border-orange-200 rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
                data-testid={`customer-card-${customer._id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4 items-stretch min-h-[120px]">
                    {/* Left Side - Customer Info */}
                    <div className="flex-1 space-y-3 flex flex-col justify-between min-w-0">
                      {/* Header with name */}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base text-slate-900 group-hover:text-primary transition-colors truncate">
                          {customer.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">CUST-{customer.customerId}</p>
                        {customer.phone && (
                          <p className="text-sm text-slate-700 font-medium mt-1">{customer.phone}</p>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5 min-w-0">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                            <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-start gap-2 text-xs text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{customer.address}</span>
                          </div>
                        )}
                        {customer.createdAt && (
                          <div className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="flex-shrink-0">Registration Date: {customer.registrationDate || new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        )}
                      </div>

                      {/* Badges and Actions */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full">
                            <Check className="w-2.5 h-2.5 text-green-600" />
                            <span className="text-xs font-semibold text-green-600">Verified</span>
                          </div>
                          {customer.vehicles && customer.vehicles.length > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 rounded-lg">
                              <Car className="w-2.5 h-2.5 text-red-500" />
                              <span className="text-xs font-semibold text-red-600">{customer.vehicles.length}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Link href={`/customer-details/${customer._id}`} className="flex-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs text-slate-700"
                              data-testid={`button-view-details-${customer._id}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Details
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setSelectedCustomerForImages(customer);
                              setUploadedImages(customer.serviceImages || []);
                              setImageDialogOpen(true);
                            }}
                            data-testid={`button-add-images-${customer._id}`}
                          >
                            <ImagePlus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={() => {
                              setCustomerToDelete(customer);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-${customer._id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Vehicle Image */}
                    <div className="relative w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                      {primaryVehicle?.image ? (
                        <img
                          src={primaryVehicle.image}
                          alt={customer.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <Car className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer: any) => {
            const primaryVehicle = customer.vehicles && customer.vehicles.length > 0 ? customer.vehicles[0] : null;
            return (
              <Link key={customer._id} href={`/customer-details/${customer._id}`}>
                <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group" data-testid={`customer-card-${customer._id}`}>
                  <CardContent className="p-3 space-y-2">
                    {/* Header with name and image */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-slate-900 group-hover:text-primary transition-colors truncate">{customer.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">ID: {customer.customerId}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{customer.phone}</p>
                      </div>
                      {primaryVehicle?.image ? (
                        <div className="relative w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={primaryVehicle.image} 
                            alt={customer.name}
                            className="w-full h-full object-cover"
                            data-testid={`img-vehicle-list-${customer._id}`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg flex-shrink-0">
                          <Car className="w-4 h-4 text-primary" />
                          {customer.vehicles && customer.vehicles.length > 0 && (
                            <span className="text-xs font-semibold text-primary">{customer.vehicles.length}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contact Info - Inline */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {customer.createdAt && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded border border-slate-200">
                          <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate text-slate-600">Reg: {new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                          <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="truncate text-slate-700">{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                          <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="truncate text-slate-700">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customerToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => customerToDelete && deleteCustomerMutation.mutate(customerToDelete._id)}
              disabled={deleteCustomerMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-delete"
            >
              {deleteCustomerMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Upload Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add After Service Images</DialogTitle>
            <DialogDescription>
              Upload up to 5 images for {selectedCustomerForImages?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadedImages.length >= 5}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input" className="cursor-pointer block">
                <ImagePlus className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">Click to select images</p>
                <p className="text-xs text-slate-500">or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">({uploadedImages.length}/5 selected)</p>
              </label>
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                    <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                      data-testid={`button-remove-image-${idx}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setImageDialogOpen(false);
                  setUploadedImages([]);
                }}
                data-testid="button-cancel-images"
              >
                Cancel
              </Button>
              <Button
                onClick={() => uploadImagesMutation.mutate()}
                disabled={uploadedImages.length === 0 || uploadImagesMutation.isPending}
                data-testid="button-save-images"
              >
                {uploadImagesMutation.isPending ? "Saving..." : "Save Images"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
