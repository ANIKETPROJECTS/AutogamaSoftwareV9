import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth } from "@/contexts/auth-context";
import { PageProvider } from "@/contexts/page-context";
import { Layout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ServiceFunnel from "@/pages/funnel";
import Accessories from "@/pages/accessories";
import RollHistory from "@/pages/roll-history";
import Customers from "@/pages/customers";
import CustomerRegistration from "@/pages/register";
import RegisteredCustomers from "@/pages/registered-customers";
import CustomerDetails from "@/pages/customer-details";
import CustomerService from "@/pages/customer-service";
import Technicians from "@/pages/technicians";
import ManageServices from "@/pages/manage-services";
import Inventory from "@/pages/inventory";
import Tickets from "@/pages/tickets";
import Appointments from "@/pages/appointments";
import PriceInquiries from "@/pages/price-inquiries";
import Invoices from "@/pages/invoices";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function ProtectedRoutes() {
  return (
    <RequireAuth>
      <PageProvider>
        <Layout>
          <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/register" component={CustomerRegistration} />
          <Route path="/registered-customers" component={RegisteredCustomers} />
          <Route path="/customer-details/:id" component={CustomerDetails} />
          <Route path="/funnel" component={ServiceFunnel} />
          <Route path="/customers" component={Customers} />
          <Route path="/customer-service" component={CustomerService} />
          <Route path="/jobs" component={ServiceFunnel} />
          <Route path="/technicians" component={Technicians} />
          <Route path="/manage-services" component={ManageServices} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/tickets" component={Tickets} />
          <Route path="/roll-history/:id" component={RollHistory} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/price-inquiries" component={PriceInquiries} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
          </Switch>
        </Layout>
      </PageProvider>
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
