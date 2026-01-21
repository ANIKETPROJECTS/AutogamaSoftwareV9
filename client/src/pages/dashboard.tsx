import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/metric-card";
import { useAuth } from "@/contexts/auth-context";
import { usePageContext } from "@/contexts/page-context";
import { useLocation } from "wouter";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  Activity,
  Zap,
  LogOut,
  MessageSquare,
  Bell,
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
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#3B82F6", "#EAB308", "#F97316", "#10B981", "#22C55E", "#dc2626"];

const JOB_STAGES = [
  { key: "New Lead", label: "New Lead", color: "#3B82F6" },
  { key: "Inspection Done", label: "Inspection Done", color: "#EAB308" },
  { key: "Work In Progress", label: "Work In Progress", color: "#F97316" },
  { key: "Completed", label: "Completed", color: "#22C55E" },
  { key: "Cancelled", label: "Cancelled", color: "#dc2626" },
];

const STATUS_COLORS: Record<string, string> = {
  "New Lead": "#3B82F6",
  "Inspection Done": "#EAB308",
  "Work In Progress": "#F97316",
  Completed: "#22C55E",
  Cancelled: "#dc2626",
};

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard.stats,
  });

  const { data: jobsData } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list({ page: 1, limit: 1000 }),
  });
  const jobs = jobsData?.jobs || [];

  const { data: inquiriesData } = useQuery({
    queryKey: ["/api/price-inquiries"],
    queryFn: () => api.priceInquiries.list({ page: 1, limit: 1000 }),
  });
  const inquiries = inquiriesData?.inquiries || [];

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list({ page: 1, limit: 1000 }),
  });
  const customers = customersData?.customers || [];

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: api.inventory.list,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => api.appointments.list({ page: 1, limit: 1000 }),
  });
  const appointments = appointmentsData?.appointments || [];

  const { data: invoicesData = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.invoices.list(),
  });
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  const customerStatusCount = JOB_STAGES.reduce((acc: Record<string, number>, stage) => {
    acc[stage.key] = jobs.filter((job: any) => {
      if (job.stage !== stage.key) return false;

      // Filter out paid completed jobs from the counts (matching Funnel logic)
      if (stage.key === 'Completed') {
        const jobInvoices = invoices.filter((inv: any) => {
          const invJobId = (inv.jobId?._id || inv.jobId || "").toString();
          const currentJobId = (job._id?._id || job._id || "").toString();
          return invJobId === currentJobId;
        });

        if (jobInvoices.length > 0 && jobInvoices.every((inv: any) => {
          const status = (inv.paymentStatus || inv.status || "").toString().toLowerCase();
          return status === 'paid';
        })) {
          return false;
        }
      }
      return true;
    }).length;
    return acc;
  }, {});

  const customerStatusData = JOB_STAGES.map(stage => ({
    name: stage.label,
    value: customerStatusCount[stage.key] || 0,
  })).filter(item => item.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayJobs = jobs.filter((job: any) => {
      const jobDate = new Date(job.createdAt);
      return jobDate >= dayStart && jobDate <= dayEnd;
    });
    
    const daySales = dayJobs.reduce((sum: number, job: any) => sum + (job.paidAmount || 0), 0);
    
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      sales: daySales,
    };
  });

  const customerGrowth = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const customersUpToMonth = customers.filter((c: any) => {
      const created = new Date(c.createdAt);
      return created <= monthEnd;
    }).length;
    
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      customers: customersUpToMonth,
    };
  });

  const inventoryStats = inventory.reduce(
    (acc: Record<string, { sqft: number; rolls: number }>, item: any) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = { sqft: 0, rolls: 0 };
      
      const rolls = item.rolls || [];
      acc[cat].sqft += rolls.reduce((sum: number, roll: any) => sum + (roll.remaining_sqft || 0), 0);
      acc[cat].rolls += rolls.length;
      return acc;
    },
    {},
  );

  const categories = ['Elite', 'Garware Plus', 'Garware Premium', 'Garware Matt'];
  const inventoryData = categories.map(cat => ({
    name: cat,
    sqft: Math.round((inventoryStats[cat]?.sqft || 0) * 100) / 100,
    rolls: inventoryStats[cat]?.rolls || 0,
  }));

  const activeJobs = jobs
    .filter((j: any) => j.stage !== "Completed" && j.stage !== "Cancelled");

  const [, setLocation] = useLocation();

  const todaySales = jobs.reduce((sum: number, job: any) => {
    const jobDate = new Date(job.createdAt);
    const today = new Date();
    if (jobDate.toDateString() === today.toDateString()) {
      return sum + (job.paidAmount || 0);
    }
    return sum;
  }, 0);

  const todayInquiries = inquiries.filter((inquiry: any) => {
    const inquiryDate = new Date(inquiry.createdAt);
    const today = new Date();
    return inquiryDate.toDateString() === today.toDateString();
  }).length;

  const todayCompletedJobs = jobs.filter((job: any) => {
    const jobDate = new Date(job.createdAt);
    const today = new Date();
    return job.stage === "Completed" && jobDate.toDateString() === today.toDateString();
  }).length;

  const todayAppointments = appointments.filter((appt: any) => {
    const apptDate = new Date(appt.date);
    const today = new Date();
    return apptDate.toDateString() === today.toDateString() && appt.status !== 'Cancelled';
  }).length;

  const completedJobs = jobs.filter((j: any) => j.stage === "Completed").length;
  const stageCounts = customerStatusCount;

  return (
    <div className="space-y-8">
      {/* Summary Metric Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Sales"
          value={`₹${todaySales}`}
          icon={IndianRupee}
          description="Total sales generated today"
          data-testid="card-todays-sales"
        />

        <Link href="/funnel">
          <MetricCard
            title="Active Service Jobs"
            value={jobs.filter((j: any) => j.stage !== "Completed" && j.stage !== "Cancelled").length}
            icon={Package}
            description="Service jobs in progress"
            data-testid="card-active-jobs-count"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>

        <Link href="/price-inquiries">
          <MetricCard
            title="Inquiries Today"
            value={todayInquiries}
            icon={MessageSquare}
            description="Inquiries received today"
            data-testid="card-inquiries-today"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>

        <Link href="/registered-customers">
          <MetricCard
            title="Total Customers"
            value={customers.length}
            icon={Users}
            description="Registered customers"
            data-testid="card-total-customers"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-red-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-red-400 transition-all"
          data-testid="card-sales-trends"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Sales Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="day" stroke="rgba(0,0,0,0.6)" />
                <YAxis stroke="rgba(0,0,0,0.6)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(59,130,246,0.3)' }}
                />
                <Bar dataKey="sales" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-red-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-red-400 transition-all"
          data-testid="card-customer-status"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <Activity className="w-5 h-5 text-primary" />
              Customer Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={customerStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#dc2626"
                  dataKey="value"
                >
                  {customerStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(220,38,38,0.3)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-red-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-red-400 transition-all"
          data-testid="card-customer-growth"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <Users className="w-5 h-5 text-green-600" />
              Customer Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="month" stroke="rgba(0,0,0,0.6)" />
                <YAxis stroke="rgba(0,0,0,0.6)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(34,197,94,0.3)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-red-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-red-400 transition-all"
          data-testid="card-inventory-categories"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <Package className="w-5 h-5 text-orange-600" />
              Inventory by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={inventoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis type="number" stroke="rgba(0,0,0,0.6)" />
                <YAxis dataKey="name" type="category" stroke="rgba(0,0,0,0.6)" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(249,115,22,0.3)' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'sqft') return [`${value} sqft`, 'Remaining Area'];
                    if (name === 'rolls') return [`${value}`, 'Number of Rolls'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="rolls" name="rolls" fill="#F97316" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs Table */}
      <div className="grid gap-6">
        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-red-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-red-400 transition-all"
          data-testid="card-active-jobs"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <Clock className="w-5 h-5 text-primary" />
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.slice(0, 5).map((job: any, index: number) => (
                  <Link key={job.id || job._id || `job-${index}`} href="/funnel">
                    <div
                      className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-all border border-slate-200 hover:border-slate-300 cursor-pointer mb-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{job.customerName}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{job.vehicleName}</p>
                        </div>
                        <Badge variant="outline" className="text-primary border-primary/50 text-[10px]">
                          {job.stage}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
                {activeJobs.length > 5 && (
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setLocation('/funnel')}>
                    View all active jobs
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="font-medium">No active jobs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
