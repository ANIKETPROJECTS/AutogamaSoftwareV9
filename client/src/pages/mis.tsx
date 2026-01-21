import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { usePageContext } from "@/contexts/page-context";
import {
  IndianRupee,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  History,
  Truck,
  Users,
  BarChart3,
  Search,
  ShoppingCart,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#3B82F6", "#10B981", "#F97316", "#8B5CF6", "#EC4899", "#EAB308"];

export default function MISPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { setTitle, setSubtitle } = usePageContext();

  useEffect(() => {
    setTitle("MIS - Reports & Analytics");
    setSubtitle("Warehouse performance, trends, and stock health");
  }, [setTitle, setSubtitle]);

  const { data: jobsData } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list({ page: 1, limit: 1000 }),
  });
  const jobs = jobsData?.jobs || [];

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: api.inventory.list,
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list({ page: 1, limit: 1000 }),
  });
  const customers = customersData?.customers || [];

  const { data: invoicesData = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.invoices.list(),
  });
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  // Reports Logic
  const reports = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Inward/Outward (Simplified logic based on available data)
    const inwardToday = inventory.filter((item: any) => {
      const created = new Date(item.createdAt || Date.now());
      return created >= today;
    }).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    const outwardToday = jobs.filter((job: any) => {
      const updated = new Date(job.updatedAt || job.createdAt);
      return updated.toDateString() === today.toDateString() && job.stage === "Completed";
    }).reduce((sum, job) => sum + (job.paidAmount || 0), 0);

    // Top dispatched item
    const dispatchedItems: Record<string, number> = {};
    jobs.filter((j: any) => j.stage === "Completed").forEach((j: any) => {
      j.serviceItems?.forEach((si: any) => {
        dispatchedItems[si.name] = (dispatchedItems[si.name] || 0) + 1;
      });
    });
    const topDispatchedItem = Object.entries(dispatchedItems)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || "None";

    // Stock Valuation
    const totalStockValue = inventory.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    // Fast/Slow Moving (Mock logic as real tracking needs more logs)
    const inventoryItems = inventory.map((item: any) => {
      const usageCount = jobs.filter((j: any) => 
        j.serviceItems?.some((si: any) => si.name.includes(item.name))
      ).length;
      
      const lastUsed = jobs
        .filter((j: any) => j.serviceItems?.some((si: any) => si.name.includes(item.name)))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt;

      const daysSinceLastUsed = lastUsed ? Math.floor((Date.now() - new Date(lastUsed).getTime()) / (1000 * 60 * 60 * 24)) : 999;

      return {
        ...item,
        usageCount,
        daysSinceLastUsed,
        isDead: daysSinceLastUsed > 90,
      };
    });

    const deadStock = inventoryItems.filter(i => i.isDead);
    const fastMoving = [...inventoryItems].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

    // Performance trends (Last 6 months sales)
    const monthlySales = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const month = d.toLocaleString('default', { month: 'short' });
      const sales = invoices
        .filter((inv: any) => {
          const date = new Date(inv.createdAt);
          return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
        })
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      return { month, sales };
    });

    return {
      inwardToday,
      outwardToday,
      totalStockValue,
      deadStock,
      fastMoving,
      monthlySales,
      inventoryItems,
      topDispatchedItem
    };
  }, [jobs, inventory, invoices]);

  return (
    <div className="space-y-8">
      {/* Top Summary Metrics */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Inward Today"
          value={`₹${reports.inwardToday.toLocaleString()}`}
          icon={ArrowUpRight}
          description="Value of stock added today"
          className="bg-green-50/50 border-green-200"
        />
        <MetricCard
          title="Total Outward Today"
          value={`₹${reports.outwardToday.toLocaleString()}`}
          icon={ArrowDownRight}
          description="Value of jobs completed today"
          className="bg-blue-50/50 border-blue-200"
        />
        <MetricCard
          title="Stock Valuation"
          value={`₹${reports.totalStockValue.toLocaleString()}`}
          icon={IndianRupee}
          description="Total current warehouse value"
          className="bg-slate-50/50 border-slate-200"
        />
        <MetricCard
          title="Top Dispatched Item"
          value={reports.topDispatchedItem}
          icon={Truck}
          description="Most frequent item in completed jobs"
          className="bg-orange-50/50 border-orange-200"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Trends */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Monthly Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reports.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Health */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Stock Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Healthy', value: reports.inventoryItems.length - reports.deadStock.length },
                    { name: 'Dead Stock', value: reports.deadStock.length },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-4">
          <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Inventory Summary</TabsTrigger>
          <TabsTrigger value="movement" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Item Movement</TabsTrigger>
          <TabsTrigger value="deadstock" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Dead Stock Report</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6 max-w-sm">
                <Search className="w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Filter inventory..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 border-slate-200"
                />
              </div>
              <div className="relative overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Item Name</th>
                      <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold">In Stock</th>
                      <th className="px-6 py-4 font-semibold">Unit Value</th>
                      <th className="px-6 py-4 font-semibold">Total Value</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.inventoryItems
                      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                        <td className="px-6 py-4 text-slate-600">{item.category}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{item.quantity} {item.unit || 'units'}</td>
                        <td className="px-6 py-4 text-slate-600">₹{item.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">₹{(item.price * item.quantity).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <Badge variant={item.isDead ? "destructive" : "outline"} className="text-[10px] uppercase tracking-wider">
                            {item.isDead ? "Dead" : "Healthy"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Top Moving Items (Fast Moving)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.fastMoving.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">{item.usageCount} times</p>
                        <p className="text-[10px] text-slate-400">Used in services</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  Inward Summary (Recent Stock)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventory.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">Added: {new Date(item.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">+{item.quantity}</p>
                        <p className="text-[10px] text-slate-400">{item.unit || 'units'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deadstock">
          <Card className="border-red-200 bg-red-50/10">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Items with No Movement (90+ Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.deadStock.length > 0 ? (
                <div className="relative overflow-x-auto rounded-lg border border-red-100">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-red-50 text-red-700 border-b border-red-100">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Item Name</th>
                        <th className="px-6 py-4 font-semibold">Days Inactive</th>
                        <th className="px-6 py-4 font-semibold">Current Stock</th>
                        <th className="px-6 py-4 font-semibold">Dead Stock Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 bg-white">
                      {reports.deadStock.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                          <td className="px-6 py-4 text-red-600 font-bold">{item.daysSinceLastUsed} days</td>
                          <td className="px-6 py-4 text-slate-600">{item.quantity} {item.unit || 'units'}</td>
                          <td className="px-6 py-4 text-slate-900 font-semibold">₹{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 italic bg-white rounded-lg border border-dashed border-slate-300">
                  No dead stock identified. Inventory is moving well!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
