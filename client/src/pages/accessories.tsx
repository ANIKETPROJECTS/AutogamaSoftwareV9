import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Plus, Save, History, ArrowLeft, TrendingUp, Package } from 'lucide-react';
import { usePageContext } from '@/contexts/page-context';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const PPF_ITEMS = [
  { name: 'Elite', category: 'Elite' },
  { name: 'Garware Plus', category: 'Garware Plus' },
  { name: 'Garware Premium', category: 'Garware Premium' },
  { name: 'Garware Matt', category: 'Garware Matt' }
];

export default function Accessories() {
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  
  const [name, setName] = useState('');
  const [newName, setNewName] = useState('');
  const [isAddingNewName, setIsAddingNewName] = useState(false);

  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [initialStock, setInitialStock] = useState('');
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPageTitle } = usePageContext();

  useEffect(() => {
    setPageTitle("", "");
  }, [setPageTitle]);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['accessory-sales'],
    queryFn: async () => {
      const res = await fetch('/api/accessory-sales');
      if (!res.ok) throw new Error('Failed to fetch sales');
      return res.json();
    },
    enabled: showHistory
  });

  // Better grouping for categories and names
  const accessoryInventory = inventory.filter((item: any) => !PPF_ITEMS.some(ppf => ppf.category === item.category));
  const uniqueCategories = Array.from(new Set(accessoryInventory.map((item: any) => item.category)));

  const categories = uniqueCategories;

  const filteredNames = accessoryInventory
    .filter((item: any) => item.category === category)
    .map((item: any) => item.name);

  const sellMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Ensure Inventory Item exists
      let existingItem = inventory.find(
        (item: any) => item.name === data.name && item.category === data.category
      );

      if (!existingItem) {
        existingItem = await api.inventory.create({
          name: data.name,
          category: data.category,
          quantity: data.initialStock || 0,
          unit: 'Piece',
          minStock: 5,
          price: data.price
        });
      }

      // 2. Record the Sale
      const saleRes = await fetch('/api/accessory-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: data.category,
          accessoryName: data.name,
          price: data.price,
          quantity: data.quantity,
          total: data.price * data.quantity
        })
      });

      if (!saleRes.ok) throw new Error('Failed to record sale');

      // 3. Deduct stock from inventory
      await api.inventory.adjust(existingItem._id || existingItem.id, -data.quantity);
      
      return saleRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['accessory-sales'] });
      toast({ title: 'Sale recorded and inventory updated' });
      
      // Reset form
      setCategory('');
      setNewCategory('');
      setIsAddingNewCategory(false);
      setName('');
      setNewName('');
      setIsAddingNewName(false);
      setPrice('');
      setQuantity('1');
      setInitialStock('');
      setCurrentStock(null);
    },
    onError: () => {
      toast({ title: 'Failed to process accessory', variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isAddingNewCategory ? newCategory : category;
    const finalName = isAddingNewName ? newName : name;
    
    if (!finalCategory || !finalName || !price || !quantity) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    const qtyToSell = parseInt(quantity);
    if (currentStock !== null && qtyToSell > currentStock) {
      toast({ title: `Insufficient stock. Only ${currentStock} available.`, variant: 'destructive' });
      return;
    }

    sellMutation.mutate({
      category: finalCategory,
      name: finalName,
      price: parseFloat(price),
      quantity: qtyToSell,
      initialStock: isAddingNewName ? parseInt(initialStock || '0') : 0
    });
  };

  // Analytics Calculation
  const salesByDate = sales.reduce((acc: any, sale: any) => {
    const date = format(new Date(sale.date), 'MMM dd');
    acc[date] = (acc[date] || 0) + sale.total;
    return acc;
  }, {});

  const chartData = Object.keys(salesByDate).map(date => ({
    date,
    revenue: salesByDate[date]
  }));

  const salesByCategory = sales.reduce((acc: any, sale: any) => {
    acc[sale.category] = (acc[sale.category] || 0) + sale.quantity;
    return acc;
  }, {});

  const categoryData = Object.keys(salesByCategory).map(cat => ({
    name: cat,
    quantity: salesByCategory[cat]
  }));

  if (showHistory) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setShowHistory(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sale
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Sales Analytics</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue (₹)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Category (Qty)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale: any) => (
                    <tr key={sale._id} className="border-b">
                      <td className="px-4 py-2">{format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-4 py-2">{sale.category}</td>
                      <td className="px-4 py-2">{sale.accessoryName}</td>
                      <td className="px-4 py-2 text-right">{sale.quantity}</td>
                      <td className="px-4 py-2 text-right">₹{sale.price}</td>
                      <td className="px-4 py-2 text-right font-medium">₹{sale.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowHistory(true)} variant="outline">
          <History className="w-4 h-4 mr-2" /> View Sales History
        </Button>
      </div>

      <Card className="border-2 border-red-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Sell Accessory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              {isAddingNewCategory ? (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter new category name" 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddingNewCategory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={category} onValueChange={(value) => {
                  if (value === 'new') {
                    setIsAddingNewCategory(true);
                  } else {
                    setCategory(value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCategories.map((cat: any) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-primary font-medium">
                      <Plus className="w-4 h-4 mr-2 inline" />
                      Add New Category
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Accessory Name</Label>
              {isAddingNewName ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter new accessory name" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAddingNewName(false);
                        setInitialStock('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase font-bold">Initial Stock for Inventory</Label>
                    <Input 
                      type="number" 
                      placeholder="Enter opening stock quantity" 
                      value={initialStock} 
                      onChange={(e) => setInitialStock(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select value={name} onValueChange={(value) => {
                    if (value === 'new') {
                      setIsAddingNewName(true);
                      setCurrentStock(null);
                    } else {
                      setName(value);
                      const item = accessoryInventory.find((i: any) => i.name === value && i.category === category);
                      if (item?.price) setPrice(item.price.toString());
                      if (item) setCurrentStock(item.quantity || 0);
                    }
                  }} disabled={!category && !isAddingNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={(category || isAddingNewCategory) ? "Select an accessory" : "First select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredNames.map((n: any) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                      <SelectItem value="new" className="text-primary font-medium">
                        <Plus className="w-4 h-4 mr-2 inline" />
                        Add New Accessory
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {currentStock !== null && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 p-2 rounded border border-blue-100">
                      <Package className="w-4 h-4" />
                      Current Inventory Stock: {currentStock} available
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity Sold</Label>
                <Input 
                  type="number" 
                  placeholder="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={sellMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {sellMutation.isPending ? 'Processing...' : 'Record Sale & Create Inventory'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
