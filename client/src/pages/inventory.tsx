import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle, Search, Plus, Trash2, ArrowLeft, Check, ChevronsUpDown, History as HistoryIcon, Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// PPF items are now fully dynamic from MongoDB
const PPF_ITEMS: { name: string; category: string }[] = [];

const MIN_STOCK = 5;
const DEFAULT_UNIT = 'Square Feet';

const CATEGORY_COLORS: Record<string, string> = {
  'Accessories': 'bg-slate-500/20 text-slate-400'
};

function SearchableSelect({ 
  options, 
  value, 
  onValueChange, 
  placeholder, 
  emptyMessage = "No option found.",
  allowCustom = true,
  customLabel = "Add new",
  newPlaceholder = "Enter name"
}: { 
  options: string[], 
  value: string, 
  onValueChange: (val: string) => void, 
  placeholder: string,
  emptyMessage?: string,
  allowCustom?: boolean,
  customLabel?: string,
  newPlaceholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isAddingNew, setIsAddingNew] = useState(false)

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    return options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()));
  }, [options, inputValue]);

  if (isAddingNew) {
    return (
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder={newPlaceholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          autoFocus
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setIsAddingNew(false);
            onValueChange("");
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col">
          <div className="p-2 border-b">
            <div className="flex items-center bg-muted/50 rounded-md px-2 py-1">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {allowCustom && (
              <div className="border-b mb-1 pb-1">
                <div
                  className="flex items-center gap-2 cursor-pointer py-1.5 px-2 text-sm text-[#E11D48] hover:bg-[#E11D48]/10 transition-colors rounded-sm font-medium"
                  onClick={() => {
                    setIsAddingNew(true);
                    onValueChange("");
                    setOpen(false);
                    setInputValue("");
                  }}
                >
                  {customLabel}
                </div>
              </div>
            )}
            {filteredOptions.length === 0 && !inputValue && (
              <div className="p-2 text-sm text-center text-muted-foreground">{emptyMessage}</div>
            )}
            <div className="space-y-1">
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => {
                    onValueChange(option)
                    setOpen(false)
                    setInputValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function Inventory() {
  const [, setLocation] = useLocation();
  const [rollDialogOpen, setRollDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustType] = useState<'in' | 'out'>('in');
  const [adjustAmount] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [accSortBy, setAccSortBy] = useState<'name' | 'quantity'>('name');
  const [accFilterCategory, setAccFilterCategory] = useState<string>('all');
  const [rollName, setRollName] = useState('');
  const [rollQuantity, setRollQuantity] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ppf' | 'accessories'>('ppf');
  const [accessoryDialogOpen, setAccessoryDialogOpen] = useState(false);
  const [ppfCategoryDialogOpen, setPpfCategoryDialogOpen] = useState(false);
  const [editingPpfCategory, setEditingPpfCategory] = useState<any>(null);
  const [newPpfCategory, setNewPpfCategory] = useState('');
  const [initialRolls, setInitialRolls] = useState<{ name: string; quantity: string }[]>([{ name: '', quantity: '' }]);
  const [editingAccessory, setEditingAccessory] = useState<any>(null);
  const [accName, setAccName] = useState('');
  const [accQuantity, setAccQuantity] = useState('');
  const [accUnit, setAccUnit] = useState('');
  const [accCategory, setAccCategory] = useState('');
  const [accPrice, setAccPrice] = useState('');


  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const { data: ppfCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['ppf-categories'],
    queryFn: async () => {
      const res = await fetch('/api/ppf-categories');
      if (!res.ok) throw new Error('Failed to fetch PPF categories');
      return res.json();
    }
  });

  const createPpfCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; rolls: { name: string; quantity: string }[] }) => {
      // 1. Create the category
      const res = await fetch('/api/ppf-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create category');
      }
      const category = await res.json();

      // 2. Filter valid rolls
      const validRolls = data.rolls.filter(r => r.name.trim() && r.quantity.trim());

      // 3. If rolls provided, create an inventory item for this category and add rolls
      if (validRolls.length > 0) {
        const invRes = await api.inventory.create({
          name: data.name,
          category: data.name,
          quantity: 0,
          unit: DEFAULT_UNIT,
          minStock: MIN_STOCK,
          isPpf: true
        });

        if (invRes?._id || invRes?.id) {
          const itemId = invRes._id || invRes.id;
          for (const roll of validRolls) {
            const qty = parseFloat(roll.quantity);
            await api.inventory.addRoll(itemId, {
              name: roll.name,
              meters: 0,
              squareFeet: qty,
              remaining_meters: 0,
              remaining_sqft: qty,
              unit: 'Square Feet'
            });
          }
        }
      }
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppf-categories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setPpfCategoryDialogOpen(false);
      setNewPpfCategory('');
      setInitialRolls([{ name: '', quantity: '' }]);
      toast({ title: 'PPF Category added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: 'destructive' });
    }
  });

  const updatePpfCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const res = await fetch(`/api/ppf-categories/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update category');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppf-categories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setPpfCategoryDialogOpen(false);
      setEditingPpfCategory(null);
      setNewPpfCategory('');
      toast({ title: 'PPF Category updated' });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: 'destructive' });
    }
  });

  const deletePpfCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ppf-categories/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppf-categories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'PPF Category deleted' });
    }
  });

  const dynamicPpfCategories = useMemo(() => {
    const ppfCats: { name: string; category: string }[] = [];
    const existingCats = new Set<string>();
    
    // Add categories from the separate collection
    ppfCategories.forEach((cat: any) => {
      if (!existingCats.has(cat.name)) {
        ppfCats.push({ name: cat.name, category: cat.name });
        existingCats.add(cat.name);
      }
    });

    // Also include categories that exist in inventory items but might not be in the collection
    inventory.forEach((item: any) => {
      const isDynamicPpf = item.isPpf === true || item.isPpf === 'true';
      if (isDynamicPpf && item.category && !existingCats.has(item.category)) {
        ppfCats.push({ name: item.category, category: item.category });
        existingCats.add(item.category);
      }
    });
    return ppfCats;
  }, [inventory, ppfCategories]);

  const accessoryItems = useMemo(() => {
    let items = inventory.filter((inv: any) => {
      const isDynamicPpf = inv.isPpf === true || inv.isPpf === 'true';
      return !isDynamicPpf;
    });
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item: any) => 
        item.category.toLowerCase().includes(query) || 
        item.name.toLowerCase().includes(query)
      );
    }

    if (accFilterCategory !== 'all') {
      items = items.filter((item: any) => item.category === accFilterCategory);
    }

    if (accSortBy === 'quantity') {
      items.sort((a: any, b: any) => b.quantity - a.quantity);
    } else {
      items.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    return items;
  }, [inventory, searchQuery, accFilterCategory, accSortBy]);

  const isLowStock = (item: any) => (item.rolls?.filter((r: any) => r.status !== 'Finished' && (r.remaining_sqft > 0.01 || r.remaining_meters > 0.01)).length || 0) <= 1;

  const filteredAndSortedItems = useMemo(() => {
    let items = dynamicPpfCategories.map((ppfItem) => {
      const item = inventory.find((inv: any) => inv.category === ppfItem.category);
      if (item) return item;
      return { 
        name: ppfItem.name, 
        category: ppfItem.category, 
        quantity: 0, 
        unit: DEFAULT_UNIT, 
        minStock: MIN_STOCK, 
        _id: `temp-${ppfItem.category}`,
        rolls: [],
        history: [],
        isPpf: true
      };
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => 
        item.category.toLowerCase().includes(query) || 
        item.name.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      items = items.filter((item) => item.category === filterCategory);
    }

    if (sortBy === 'quantity') {
      items.sort((a, b) => (b.rolls?.length || 0) - (a.rolls?.length || 0));
    } else {
      items.sort((a, b) => a.category.localeCompare(b.category));
    }

    return items;
  }, [inventory, dynamicPpfCategories, searchQuery, filterCategory, sortBy]);

  const selectedItemForDetail = useMemo(() => {
    if (!selectedProductId) return null;
    return filteredAndSortedItems.find(item => item._id === selectedProductId);
  }, [selectedProductId, filteredAndSortedItems]);

  const lowStockItems = useMemo(() => filteredAndSortedItems.filter(isLowStock), [filteredAndSortedItems]);

  const categories = useMemo(() => {
    // Filter out PPF items from accessory categories
    const cats = new Set(inventory
      .filter((inv: any) => {
        const isDynamicPpf = inv.isPpf === true || inv.isPpf === 'true';
        return !isDynamicPpf;
      })
      .map((inv: any) => inv.category)
    );
    return Array.from(cats);
  }, [inventory]);

  const existingNames = useMemo(() => {
    // Filter by selected category if one is chosen
    const filtered = accCategory 
      ? inventory.filter((item: any) => item.category === accCategory)
      : inventory.filter((item: any) => !item.isPpf);
    
    return Array.from(new Set(filtered.map((item: any) => item.name)));
  }, [inventory, accCategory]);

  const addRollMutation = useMutation({
    mutationFn: (data: { id: string; roll: any }) => api.inventory.addRoll(data.id, data.roll),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setRollDialogOpen(false);
      setRollName('');
      setRollQuantity('');
      
      // If the ID was a temporary one, update the selection to the new database ID
      if (selectedProductId?.startsWith('temp-') && newItem?._id) {
        setSelectedProductId(newItem._id);
      }
      
      toast({ title: 'Roll added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add roll', variant: 'destructive' });
    }
  });

  const deleteRollMutation = useMutation({
    mutationFn: ({ id, rollId }: { id: string; rollId: string }) => api.inventory.deleteRoll(id, rollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Roll deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete roll', variant: 'destructive' });
    }
  });

  const upsertAccessoryMutation = useMutation({
    mutationFn: (data: any) => {
      if (data._id) {
        return api.inventory.update(data._id, data);
      }
      return api.inventory.create({
        ...data,
        category: data.category || accCategory
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setAccessoryDialogOpen(false);
      setEditingAccessory(null);
      setAccName('');
      setAccQuantity('');
      setAccUnit('');
      setAccPrice('');
      toast({ title: editingAccessory ? 'Accessory updated' : 'Accessory added' });
    }
  });

  const deleteAccessoryMutation = useMutation({
    mutationFn: (id: string) => api.inventory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Accessory deleted' });
    }
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {selectedProductId && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedProductId(null)} className="h-10 w-10">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage stock for PPF and accessories</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'ppf' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('ppf');
              setSelectedProductId(null);
            }}
            className="flex-1 sm:flex-none"
          >
            PPF Inventory
          </Button>
          <Button 
            variant={activeTab === 'accessories' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('accessories');
              setSelectedProductId(null);
            }}
            className="flex-1 sm:flex-none"
          >
            Accessories
          </Button>
          {activeTab === 'ppf' && (
            <Button 
              onClick={() => {
                setNewPpfCategory('');
                setPpfCategoryDialogOpen(true);
              }}
              className="ml-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add PPF Category
            </Button>
          )}
          {activeTab === 'ppf' && (
            <div className="ml-2 flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/ppf/export');
                    if (!response.ok) throw new Error('Export failed');
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'ppf_inventory.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast({ title: 'PPF Export successful' });
                  } catch (error) {
                    toast({ title: 'PPF Export failed', variant: 'destructive' });
                  }
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export PPF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx, .xls';
                  input.onchange = async (e: any) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (event: any) => {
                      try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        // Prefer "PPF Rolls" sheet if it exists, otherwise use first sheet
                        const sheetName = workbook.SheetNames.find(n => n.includes('Rolls')) || workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        
                        const response = await fetch('/api/ppf/import', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ items: jsonData })
                        });

                        if (response.ok) {
                          queryClient.invalidateQueries({ queryKey: ['inventory'] });
                          queryClient.invalidateQueries({ queryKey: ['ppf-categories'] });
                          toast({ title: 'PPF Import successful' });
                        } else {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Import failed');
                        }
                      } catch (error: any) {
                        toast({ 
                          title: 'PPF Import failed', 
                          description: error.message,
                          variant: 'destructive' 
                        });
                      }
                    };
                    reader.readAsArrayBuffer(file);
                  };
                  input.click();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import PPF
              </Button>
            </div>
          )}
          {activeTab === 'accessories' && (
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/inventory/export');
                    if (!response.ok) throw new Error('Export failed');
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'accessories.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast({ title: 'Export successful' });
                  } catch (error) {
                    toast({ title: 'Export failed', variant: 'destructive' });
                  }
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx, .xls';
                  input.onchange = async (e: any) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (event: any) => {
                      try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        
                        // Map Excel columns to database fields
                        const items = jsonData.map((row: any) => ({
                          name: row.Name,
                          category: row.Category,
                          quantity: Number(row.Quantity),
                          unit: row.Unit,
                          price: Number(row.Price)
                        }));

                        const response = await fetch('/api/inventory/import', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ items })
                        });

                        if (response.ok) {
                          queryClient.invalidateQueries({ queryKey: ['inventory'] });
                          toast({ title: 'Import successful' });
                        } else {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Import failed');
                        }
                      } catch (error: any) {
                        toast({ 
                          title: 'Import failed', 
                          description: error.message,
                          variant: 'destructive' 
                        });
                      }
                    };
                    reader.readAsArrayBuffer(file);
                  };
                  input.click();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
              <Button 
                onClick={() => {
                  setEditingAccessory(null);
                  setAccName('');
                  setAccCategory('');
                  setAccQuantity('');
                  setAccUnit('');
                  setAccPrice('');
                  setAccessoryDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Accessory
              </Button>
            </div>
          )}
        </div>
        
        {!selectedProductId && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {activeTab === 'ppf' ? (
              <>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'quantity')}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="quantity">Sort by Quantity</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {dynamicPpfCategories.map(i => <SelectItem key={i.category} value={i.category}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Select value={accSortBy} onValueChange={(value) => setAccSortBy(value as 'name' | 'quantity')}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="quantity">Sort by Quantity</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={accFilterCategory} onValueChange={setAccFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        )}
      </div>

      {!selectedProductId && activeTab === 'ppf' && lowStockItems.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">{lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} with low stock (1 or fewer rolls)!</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className={cn(
          "space-y-4 transition-all duration-300",
          selectedProductId ? "lg:col-span-4" : "lg:col-span-12"
        )}>
          {activeTab === 'ppf' ? (
            <div className={cn(
              "grid gap-4",
              selectedProductId ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-4"
            )}>
              {isLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">Loading inventory...</div>
              ) : filteredAndSortedItems.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">No products match your search or filters</div>
              ) : (
                filteredAndSortedItems
                  .filter(item => !selectedProductId || item._id === selectedProductId)
                  .map((displayItem, index) => {
                    const isSelected = selectedProductId === displayItem._id;
                    
                    return (
                      <Card 
                        key={`${displayItem.category}-${index}`}
                        className={cn(
                          "card-modern border cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 group relative",
                          isLowStock(displayItem) ? "border-red-200" : "border-border",
                          isSelected && "ring-2 ring-primary border-primary bg-primary/5 shadow-md scale-[1.02]"
                        )}
                        onClick={() => {
                          if (!displayItem._id || displayItem._id.toString().startsWith('temp-')) {
                            setSelectedProductId(displayItem._id);
                          } else {
                            setSelectedProductId(isSelected ? null : displayItem._id);
                          }
                        }}
                      >
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {displayItem._id && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-white/80 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Look for category in ppfCategories, fallback to creating one if it's a temp item
                                  const cat = ppfCategories.find((c: any) => c.name === displayItem.category);
                                  if (cat) {
                                    setEditingPpfCategory(cat);
                                    setNewPpfCategory(cat.name);
                                    setPpfCategoryDialogOpen(true);
                                  } else if (displayItem._id.toString().startsWith('temp-')) {
                                    // For temp items, we allow "editing" by treating it as a new category creation with the same name
                                    setEditingPpfCategory(null);
                                    setNewPpfCategory(displayItem.category);
                                    setPpfCategoryDialogOpen(true);
                                  }
                                }}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-white/80 hover:bg-white text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cat = ppfCategories.find((c: any) => c.name === displayItem.category);
                                  if (cat) {
                                    if (confirm(`Delete category "${cat.name}"?`)) {
                                      deletePpfCategoryMutation.mutate(cat._id);
                                    }
                                  } else if (displayItem._id.toString().startsWith('temp-')) {
                                    // For temp items that aren't in the ppfCategories collection yet,
                                    // we might just want to hide them or they represent empty categories.
                                    // Since they are "temp", there's no DB entry in PpfCategory to delete.
                                    toast({ title: "This category is auto-generated and cannot be deleted until saved." });
                                  }
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                              <CardTitle className="text-base">{displayItem.category}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge className={cn(CATEGORY_COLORS[displayItem.category])}>
                                  {displayItem.category}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(`/roll-history/${displayItem._id || displayItem.id}`);
                                  }}
                                >
                                  <HistoryIcon className="w-3 h-3 mr-1" />
                                  History
                                </Button>
                              </div>
                            </div>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary animate-pulse mt-2" />}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-display font-bold">
                              {displayItem.rolls?.filter((r: any) => r.status !== 'Finished' && (r.remaining_sqft > 0.01 || r.remaining_meters > 0.01)).length || 0}
                            </span>
                            <span className="text-sm text-muted-foreground">rolls</span>
                          </div>
                          
                          {!isSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('[Inventory] Setting selectedItem for Add Roll:', displayItem);
                                setSelectedItem(displayItem);
                                setRollDialogOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Roll
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">Loading inventory...</div>
              ) : accessoryItems.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                  No accessories in inventory.
                </div>
              ) : (
                accessoryItems.map((item: any) => (
                  <Card 
                    key={item._id}
                    className="card-modern border transition-all hover:ring-2 hover:ring-primary/20 group h-full flex flex-col"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold">{item.name}</CardTitle>
                          <Badge className="mt-1 bg-slate-500/20 text-slate-400">
                            {item.category}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm('Delete this accessory?')) {
                              deleteAccessoryMutation.mutate(item._id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between pt-4 space-y-6">
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-display font-bold block">{item.quantity}</span>
                          <span className="text-xs font-medium text-muted-foreground block">Quantity</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">Price</span>
                          <span className="text-lg font-display font-bold text-primary block">₹{item.price || 0}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 bg-muted/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                        onClick={() => {
                          setEditingAccessory(item);
                          setAccName(item.name);
                          setAccCategory(item.category);
                          setAccQuantity(item.quantity.toString());
                          setAccUnit(item.unit);
                          setAccPrice(item.price?.toString() || '');
                          setAccessoryDialogOpen(true);
                        }}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Edit Accessory
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {selectedProductId && selectedItemForDetail && (
          <div className="lg:col-span-8 animate-in slide-in-from-right-4 duration-300">
            <Card className="sticky top-4 border-primary/20 shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    {selectedItemForDetail.category}
                  </h2>
                  <p className="text-sm text-muted-foreground">Detailed Roll Inventory</p>
                </div>
              </div>
              
              <CardContent className="p-0">
                {(!selectedItemForDetail.rolls || selectedItemForDetail.rolls.filter((r: any) => r.status !== 'Finished' && (r.remaining_sqft > 0.01 || r.remaining_meters > 0.01)).length === 0) ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No active rolls found for this product.</p>
                    <Button variant="outline" className="mt-4" onClick={() => {
                      setSelectedItem(selectedItemForDetail);
                      setRollDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Roll
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                      {selectedItemForDetail.rolls
                        .filter((roll: any) => roll.status !== 'Finished' && (roll.remaining_sqft > 0.01 || roll.remaining_meters > 0.01))
                        .map((roll: any) => (
                        <div 
                          key={roll._id} 
                          className="group relative p-2 bg-card border rounded-lg hover:border-primary/40 transition-all shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-sm truncate">{roll.name}</p>
                                <Badge 
                                  variant={roll.status === 'Finished' ? 'outline' : 'secondary'} 
                                  className={cn(
                                    "h-3.5 px-1.5 text-[9px]",
                                    roll.status !== 'Finished' && "bg-green-500/10 text-green-600 border-green-200"
                                  )}
                                >
                                  {roll.status === 'Finished' ? 'Finished' : 'Available'}
                                </Badge>
                              </div>
                              <div className="flex gap-4 text-[10px] text-muted-foreground">
                                <div className="flex items-baseline gap-1">
                                  <span className="font-semibold uppercase text-[8px] opacity-70">Stock:</span>
                                  <span className="font-bold text-foreground">{roll.squareFeet?.toFixed(1)}</span>
                                  <span>sqft</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="font-semibold uppercase text-[8px] opacity-70">Left:</span>
                                  <span className={cn(
                                    "font-bold",
                                    (roll.remaining_sqft / roll.squareFeet) < 0.2 ? "text-destructive" : "text-primary"
                                  )}>{roll.remaining_sqft?.toFixed(1)}</span>
                                  <span>sqft</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteRollMutation.mutate({ id: selectedItemForDetail._id, rollId: roll._id })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="mt-1.5">
                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-700",
                                  (roll.remaining_sqft / roll.squareFeet) < 0.2 ? "bg-destructive" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(100, (roll.remaining_sqft / (roll.squareFeet || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-muted/20 border-t">
                      <Button className="w-full" size="sm" onClick={() => {
                        setSelectedItem(selectedItemForDetail);
                        setRollDialogOpen(true);
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Roll
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={rollDialogOpen} onOpenChange={setRollDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Roll - {selectedItem?.category}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Roll Name/ID</Label>
              <Input 
                placeholder="e.g. Roll #123"
                value={rollName}
                onChange={(e) => setRollName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Square Feet</Label>
              <Input 
                type="number"
                placeholder="e.g. 250"
                value={rollQuantity}
                onChange={(e) => setRollQuantity(e.target.value)}
              />
            </div>
            <Button 
              className="w-full"
              disabled={!rollName || !rollQuantity || addRollMutation.isPending}
              onClick={() => {
                if (selectedItem?._id) {
                  addRollMutation.mutate({
                    id: selectedItem._id,
                    roll: {
                      name: rollName,
                      meters: 0,
                      squareFeet: parseFloat(rollQuantity),
                      unit: 'Square Feet'
                    }
                  });
                } else {
                  toast({ 
                    title: 'Error', 
                    description: 'No product selected. Please try clicking Add Roll again.',
                    variant: 'destructive' 
                  });
                }
              }}
            >
              {addRollMutation.isPending ? 'Adding...' : 'Add Roll'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={ppfCategoryDialogOpen} 
        onOpenChange={(open) => {
          setPpfCategoryDialogOpen(open);
          if (!open) {
            setNewPpfCategory('');
            setInitialRolls([{ name: '', quantity: '' }]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add PPF Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input 
                placeholder="e.g. Garware Premium" 
                value={newPpfCategory}
                onChange={(e) => setNewPpfCategory(e.target.value)}
              />
            </div>
            <Button 
              className="w-full"
              disabled={!newPpfCategory.trim() || upsertAccessoryMutation.isPending}
              onClick={() => {
                // Use the API directly to ensure it doesn't use the accessory defaults
                api.inventory.create({
                  name: newPpfCategory,
                  category: newPpfCategory,
                  quantity: 0,
                  unit: DEFAULT_UNIT,
                  minStock: MIN_STOCK,
                  isPpf: true
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['inventory'] });
                  toast({ title: 'PPF Category added successfully' });
                  setPpfCategoryDialogOpen(false);
                  setNewPpfCategory('');
                }).catch(() => {
                  toast({ title: 'Failed to create PPF category', variant: 'destructive' });
                });
              }}
            >
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={accessoryDialogOpen} onOpenChange={setAccessoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingAccessory ? 'Edit Accessory' : 'Add Accessory'}</DialogTitle>
            <div className="sr-only">
              <p>Form to {editingAccessory ? 'update' : 'create'} an accessory in the inventory.</p>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category / Type</Label>
              <SearchableSelect 
                options={categories}
                value={accCategory}
                onValueChange={setAccCategory}
                placeholder="Select category"
                customLabel="+ Add New Category"
                newPlaceholder="Enter new category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Accessory Name</Label>
              <SearchableSelect 
                options={existingNames}
                value={accName}
                onValueChange={setAccName}
                placeholder="Select name"
                customLabel="+ Add New Accessory"
                newPlaceholder="Enter new accessory name"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number"
                placeholder="0"
                value={accQuantity}
                onChange={(e) => setAccQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input 
                type="number"
                placeholder="0"
                value={accPrice}
                onChange={(e) => setAccPrice(e.target.value)}
              />
            </div>
            <Button 
              className="w-full"
              disabled={!accName || !accQuantity || upsertAccessoryMutation.isPending}
              onClick={() => {
                upsertAccessoryMutation.mutate({
                  _id: editingAccessory?._id,
                  name: accName,
                  quantity: parseInt(accQuantity),
                  unit: accUnit || 'Unit',
                  price: parseFloat(accPrice) || 0,
                  category: accCategory
                });
              }}
            >
              {upsertAccessoryMutation.isPending ? 'Saving...' : 'Save Accessory'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={ppfCategoryDialogOpen} 
        onOpenChange={(open) => {
          setPpfCategoryDialogOpen(open);
          if (!open) {
            setNewPpfCategory('');
            setInitialRolls([{ name: '', quantity: '' }]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPpfCategory ? 'Edit PPF Category' : 'Add PPF Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input 
                value={newPpfCategory}
                onChange={(e) => setNewPpfCategory(e.target.value)}
                placeholder="e.g., Ultra Gloss"
              />
            </div>

            {!editingPpfCategory && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Initial Rolls (Optional)
                  </h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setInitialRolls([...initialRolls, { name: '', quantity: '' }])}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Another
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
                  {initialRolls.map((roll, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4 relative">
                      <div className="space-y-2">
                        <Label className="text-xs">Roll Name</Label>
                        <Input 
                          value={roll.name}
                          onChange={(e) => {
                            const newRolls = [...initialRolls];
                            newRolls[idx].name = e.target.value;
                            setInitialRolls(newRolls);
                          }}
                          placeholder={`Roll #${idx + 1}`}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Quantity (Sq.Ft)</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="number"
                            value={roll.quantity}
                            onChange={(e) => {
                              const newRolls = [...initialRolls];
                              newRolls[idx].quantity = e.target.value;
                              setInitialRolls(newRolls);
                            }}
                            placeholder="300"
                            className="h-8 text-sm"
                          />
                          {initialRolls.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => setInitialRolls(initialRolls.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              className="w-full"
              onClick={() => {
                if (editingPpfCategory) {
                  updatePpfCategoryMutation.mutate({ id: editingPpfCategory._id, name: newPpfCategory });
                } else {
                  createPpfCategoryMutation.mutate({ 
                    name: newPpfCategory,
                    rolls: initialRolls
                  });
                }
              }}
              disabled={!newPpfCategory.trim() || createPpfCategoryMutation.isPending || updatePpfCategoryMutation.isPending}
            >
              {createPpfCategoryMutation.isPending || updatePpfCategoryMutation.isPending ? 'Saving...' : (editingPpfCategory ? 'Update Category' : 'Add Category')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}