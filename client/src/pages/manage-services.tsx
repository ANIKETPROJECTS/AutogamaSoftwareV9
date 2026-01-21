import { apiRequest } from "@/lib/queryClient";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, ShieldCheck, Eye, Search, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export default function ManageServices() {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingService, setViewingService] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      window.location.href = "/api/services/export";
      toast({ title: "Export started" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const data = XLSX.utils.sheet_to_json(ws);

        const response = await fetch("/api/services/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: data }),
        });

        if (!response.ok) throw new Error("Import failed");

        queryClient.invalidateQueries({ queryKey: ["/api/services"] });
        toast({ title: "Services imported successfully" });
      } catch (error) {
        console.error("Import error:", error);
        toast({ title: "Import failed", variant: "destructive" });
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const [formData, setFormData] = useState({
    name: "",
    prices: {} as Record<string, number>,
    warranty: "",
    isWarrantyBased: false,
    isPpf: false,
    warrantyOptions: {} as Record<string, { warranty: string; price: string }[]>,
  });

  const { data: dbServices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  const vehicleTypes = useMemo(() => {
    const baseTypes = ["Small Cars", "Hatchback / Small Sedan", "Mid-size Sedan / Compact SUV / MUV", "SUV / MPV"];
    if (settings?.customVehicleTypes && Array.isArray(settings.customVehicleTypes)) {
      return [...baseTypes, ...settings.customVehicleTypes];
    }
    return baseTypes;
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => 
      apiRequest("PATCH", "/api/settings", newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings updated successfully" });
    },
  });

  const [newVehicleType, setNewVehicleType] = useState("");
  const [showAddVehicleType, setShowAddVehicleType] = useState(false);

  const handleAddVehicleType = () => {
    if (!newVehicleType.trim()) return;
    const currentCustom = settings?.customVehicleTypes || [];
    if (currentCustom.includes(newVehicleType.trim()) || ["Small Cars", "Hatchback / Small Sedan", "Mid-size Sedan / Compact SUV / MUV", "SUV / MPV"].includes(newVehicleType.trim())) {
      toast({ title: "Vehicle type already exists", variant: "destructive" });
      return;
    }
    updateSettingsMutation.mutate({
      customVehicleTypes: [...currentCustom, newVehicleType.trim()]
    });
    setNewVehicleType("");
    setShowAddVehicleType(false);
  };

  const handleRemoveVehicleType = (type: string) => {
    const currentCustom = settings?.customVehicleTypes || [];
    updateSettingsMutation.mutate({
      customVehicleTypes: currentCustom.filter((t: string) => t !== type)
    });
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  const services = useMemo(() => {
    // Combine DB services with hardcoded services
    const combined = [...dbServices];
    
    // Define the full hardcoded service data structure
    const hardcodedServiceData: Record<string, any> = {
      "Foam Washing": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 400,
          'Hatchback / Small Sedan': 500,
          'Mid-size Sedan / Compact SUV / MUV': 600,
          'SUV / MPV': 700,
        }
      },
      "Premium Washing": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 600,
          'Hatchback / Small Sedan': 700,
          'Mid-size Sedan / Compact SUV / MUV': 800,
          'SUV / MPV': 900,
        }
      },
      "Interior Cleaning": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 2500,
          'Hatchback / Small Sedan': 3000,
          'Mid-size Sedan / Compact SUV / MUV': 3500,
          'SUV / MPV': 4500,
        }
      },
      "Interior Steam Cleaning": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 3500,
          'Hatchback / Small Sedan': 4000,
          'Mid-size Sedan / Compact SUV / MUV': 4500,
          'SUV / MPV': 5500,
        }
      },
      "Leather Treatment": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 5000,
          'Hatchback / Small Sedan': 5500,
          'Mid-size Sedan / Compact SUV / MUV': 6000,
          'SUV / MPV': 7000,
        }
      },
      "Detailing": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 5000,
          'Hatchback / Small Sedan': 6500,
          'Mid-size Sedan / Compact SUV / MUV': 7000,
          'SUV / MPV': 9000,
        }
      },
      "Paint Sealant Coating (Teflon)": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 6500,
          'Hatchback / Small Sedan': 8500,
          'Mid-size Sedan / Compact SUV / MUV': 9500,
          'SUV / MPV': 11500,
        }
      },
      "Ceramic Coating – 9H": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 11000,
          'Hatchback / Small Sedan': 12500,
          'Mid-size Sedan / Compact SUV / MUV': 15000,
          'SUV / MPV': 18000,
        }
      },
      "Ceramic Coating – MAFRA": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 12500,
          'Hatchback / Small Sedan': 15000,
          'Mid-size Sedan / Compact SUV / MUV': 18000,
          'SUV / MPV': 21000,
        }
      },
      "Ceramic Coating – MENZA PRO": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 15000,
          'Hatchback / Small Sedan': 18000,
          'Mid-size Sedan / Compact SUV / MUV': 21000,
          'SUV / MPV': 24000,
        }
      },
      "Ceramic Coating – KOCH CHEMIE": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 18000,
          'Hatchback / Small Sedan': 22000,
          'Mid-size Sedan / Compact SUV / MUV': 25000,
          'SUV / MPV': 28000,
        }
      },
      "Corrosion Treatment": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 3500,
          'Hatchback / Small Sedan': 5000,
          'Mid-size Sedan / Compact SUV / MUV': 6000,
          'SUV / MPV': 7500,
        }
      },
      "Windshield Coating": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 2500,
          'Hatchback / Small Sedan': 3000,
          'Mid-size Sedan / Compact SUV / MUV': 3500,
          'SUV / MPV': 4000,
        }
      },
      "Windshield Coating All Glasses": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 5000,
          'Hatchback / Small Sedan': 5500,
          'Mid-size Sedan / Compact SUV / MUV': 6000,
          'SUV / MPV': 6500,
        }
      },
      "Sun Control Film – Economy": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 5200,
          'Hatchback / Small Sedan': 6000,
          'Mid-size Sedan / Compact SUV / MUV': 6500,
          'SUV / MPV': 8400,
        }
      },
      "Sun Control Film – Standard": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 7500,
          'Hatchback / Small Sedan': 8300,
          'Mid-size Sedan / Compact SUV / MUV': 9500,
          'SUV / MPV': 12500,
        }
      },
      "Sun Control Film – Premium": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 11500,
          'Hatchback / Small Sedan': 13000,
          'Mid-size Sedan / Compact SUV / MUV': 15000,
          'SUV / MPV': 18000,
        }
      },
      "Sun Control Film – Ceramic": {
        isWarrantyBased: false,
        prices: {
          'Small Cars': 13500,
          'Hatchback / Small Sedan': 15500,
          'Mid-size Sedan / Compact SUV / MUV': 18000,
          'SUV / MPV': 21000,
        }
      },
    };

    Object.entries(hardcodedServiceData).forEach(([name, data]) => {
      if (!combined.some(s => s.name === name)) {
        combined.push({
          _id: `hc-${name}`,
          name: name,
          isHardcoded: true,
          isWarrantyBased: !!data.warrantyOptions,
          ...data
        });
      }
    });

    return combined
      .filter((service) => {
        const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isWarrantyBased = service.isWarrantyBased === true || (service.isWarrantyBased === undefined && !!service.warrantyOptions);
        const matchesFilter = 
          filterType === "all" || 
          (filterType === "warranty" && isWarrantyBased) || 
          (filterType === "standard" && !isWarrantyBased);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        return 0;
      });
  }, [dbServices, searchQuery, filterType, sortBy]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.services.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service created successfully" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/services/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({ 
      name: "", 
      prices: {}, 
      warranty: "", 
      isWarrantyBased: false,
      isPpf: false,
      warrantyOptions: {} 
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (service: any) => {
    setFormData({
      name: service.name,
      prices: service.prices || {},
      warranty: service.warranty || "",
      isWarrantyBased: service.isWarrantyBased === true || !!service.warrantyOptions,
      isPpf: service.isPpf === true,
      warrantyOptions: service.warrantyOptions ? 
        Object.fromEntries(
          Object.entries(service.warrantyOptions).map(([k, v]: [string, any]) => [
            k,
            v.map((opt: any) => ({ ...opt, price: opt.price.toString() }))
          ])
        ) : {}
    });
    setEditingId(service._id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePriceChange = (vehicleType: string, price: string) => {
    setFormData((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [vehicleType]: parseFloat(price) || 0,
      },
    }));
  };

  const addWarrantyOption = (vehicleType: string) => {
    setFormData(prev => ({
      ...prev,
      warrantyOptions: {
        ...prev.warrantyOptions,
        [vehicleType]: [
          ...(prev.warrantyOptions[vehicleType] || []),
          { warranty: "", price: "" }
        ]
      }
    }));
  };

  const removeWarrantyOption = (vehicleType: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      warrantyOptions: {
        ...prev.warrantyOptions,
        [vehicleType]: prev.warrantyOptions[vehicleType].filter((_, i) => i !== index)
      }
    }));
  };

  const updateWarrantyOption = (vehicleType: string, index: number, field: "warranty" | "price", value: string) => {
    setFormData(prev => ({
      ...prev,
      warrantyOptions: {
        ...prev.warrantyOptions,
        [vehicleType]: prev.warrantyOptions[vehicleType].map((opt, i) => 
          i === index ? { ...opt, [field]: value } : opt
        )
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      isPpf: !!formData.isPpf,
      isWarrantyBased: !!formData.isWarrantyBased,
      prices: formData.isWarrantyBased ? {} : formData.prices,
      warrantyOptions: formData.isWarrantyBased ? 
        Object.fromEntries(
          Object.entries(formData.warrantyOptions).map(([k, v]) => [
            k, 
            v.map(opt => ({ ...opt, price: parseFloat(opt.price) || 0 }))
          ])
        ) : {}
    };
    
    if (editingId) {
      if (typeof editingId === 'string' && editingId.startsWith('hc-')) {
        createMutation.mutate(submissionData);
      } else {
        updateMutation.mutate({ id: editingId, data: submissionData });
      }
    } else {
      createMutation.mutate(submissionData);
    }
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Services</h1>
          <p className="text-muted-foreground">Configure services and pricing across vehicle types</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Services
          </Button>
          <div className="relative">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <Button variant="outline" disabled={isImporting}>
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Importing..." : "Import Services"}
            </Button>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus className="mr-2 h-4 w-4" />
            {isAdding ? "Cancel" : "Add Service"}
          </Button>
        </div>
      </div>

      {isAdding && (
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Service" : "Add New Service"}</CardTitle>
            <CardDescription>Enter service details and pricing for each vehicle type</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ceramic Coating"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warranty (Optional)</Label>
                  <Input
                    value={formData.warranty}
                    onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                    placeholder="e.g. 3 Years"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="warrantyBased"
                  checked={formData.isWarrantyBased}
                  onChange={(e) => setFormData({ ...formData, isWarrantyBased: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="warrantyBased">Warranty-based Pricing (Multiple options per vehicle)</Label>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="isPpf"
                  checked={formData.isPpf}
                  onChange={(e) => setFormData({ ...formData, isPpf: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isPpf">Mark as PPF Service</Label>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Pricing by Vehicle Type</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddVehicleType(!showAddVehicleType)}
                  >
                    {showAddVehicleType ? "Hide" : "Manage Vehicle Types"}
                  </Button>
                </div>

                {showAddVehicleType && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <Label className="text-sm font-bold">Manage Vehicle Types</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="New Vehicle Type Name" 
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value)}
                      />
                      <Button type="button" onClick={handleAddVehicleType}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings?.customVehicleTypes?.map((type: string) => (
                        <div key={type} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                          <span>{type}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            type="button"
                            className="h-4 w-4 text-destructive"
                            onClick={() => handleRemoveVehicleType(type)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-6">
                  {vehicleTypes.map((type) => (
                    <div key={type} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-bold uppercase tracking-wider">{type}</Label>
                        <div className="flex items-center gap-2">
                          {formData.isWarrantyBased && (
                            <div className="text-xs text-muted-foreground italic">
                              {formData.warrantyOptions[type]?.length || 0} options
                            </div>
                          )}
                          {!["Small Cars", "Hatchback / Small Sedan", "Mid-size Sedan / Compact SUV / MUV", "SUV / MPV"].includes(type) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              type="button"
                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveVehicleType(type)}
                              title={`Delete ${type}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {!formData.isWarrantyBased ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Single Price</Label>
                          <Input
                            type="number"
                            placeholder="Price"
                            value={formData.prices[type] || ""}
                            onChange={(e) => handlePriceChange(type, e.target.value)}
                            required={!formData.isWarrantyBased}
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(formData.warrantyOptions[type] || []).map((opt, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">Warranty Name</Label>
                                <Input
                                  placeholder="e.g. TPU 5 Years Gloss"
                                  value={opt.warranty}
                                  onChange={(e) => updateWarrantyOption(type, index, "warranty", e.target.value)}
                                  required
                                />
                              </div>
                              <div className="w-32 space-y-1">
                                <Label className="text-xs">Price</Label>
                                <Input
                                  type="number"
                                  placeholder="Price"
                                  value={opt.price}
                                  onChange={(e) => updateWarrantyOption(type, index, "price", e.target.value)}
                                  required
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeWarrantyOption(type, index)}
                                className="text-destructive h-9 w-9"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addWarrantyOption(type)}
                            className="w-full"
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Add Warranty Option
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Service"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Existing Services</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="warranty">Warranty-based</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service._id}>
                  <TableCell className="font-medium">
                    {service.name}
                    {service.warranty && <div className="text-xs text-muted-foreground">{service.warranty}</div>}
                  </TableCell>
                  <TableCell>
                    {service.isWarrantyBased === true ? (
                      <span className="flex items-center gap-1 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-semibold">Warranty-based</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Standard</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingService(service)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(service)}
                        title="Edit Service"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(service._id)}
                        className="text-destructive"
                        title="Delete Service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    No services found. Add your first service above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewingService} onOpenChange={() => setViewingService(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewingService?.name}</DialogTitle>
            <DialogDescription>
              Service details and pricing across vehicle types
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div className="font-medium">{viewingService?.isWarrantyBased === true ? "Warranty-based" : "Standard"}</div>
              </div>
              {viewingService?.warranty && (
                <div>
                  <Label className="text-muted-foreground">Default Warranty</Label>
                  <div className="font-medium">{viewingService.warranty}</div>
                </div>
              )}
            </div>
            
            <div className="space-y-4 mt-2">
              <Label className="text-lg font-semibold">Pricing</Label>
              <div className="grid grid-cols-2 gap-4">
                {vehicleTypes.map((type) => (
                  <Card key={type} className="bg-muted/30">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider">{type}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      {viewingService?.isWarrantyBased === true ? (
                        <div className="space-y-2">
                          {viewingService.warrantyOptions[type].map((opt: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{opt.warranty}</span>
                              <span className="font-bold">₹{opt.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-lg font-bold">
                          ₹{viewingService?.prices?.[type]?.toLocaleString() || "0"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
