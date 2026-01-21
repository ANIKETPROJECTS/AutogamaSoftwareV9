import { useQuery, useMutation } from "@tanstack/react-query";
import { api, queryClient } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  IndianRupee,
  FileText,
  Download,
  Search,
  Eye,
  Printer,
  Car,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Filter,
  ArrowUpDown,
  CreditCard,
  Trash2,
} from "lucide-react";
import { useState, useRef, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Invoices() {
  const [manualInvoiceOpen, setManualInvoiceOpen] = useState(false);
  const [manualInvoiceDate, setManualInvoiceDate] = useState<Date>(new Date());
  const [manualInvoiceData, setManualInvoiceData] = useState<any>({
    customerName: "",
    customerPhone: "",
    vehicleName: "",
    plateNumber: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, type: "service" }],
    taxRate: 18,
    discount: 0,
    notes: "",
    technicianId: "",
    rollId: "",
  });
  const [search, setSearch] = useState("");

  const createManualInvoiceMutation = useMutation({
    mutationFn: (data: any) => api.jobs.createManualInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setManualInvoiceOpen(false);
      toast({ title: "Invoice generated successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to generate invoice", variant: "destructive" });
    }
  });

  const handleManualInvoiceSubmit = () => {
    console.log("[INVOICE_DEBUG] manualInvoiceDate:", manualInvoiceDate);
    const dateToSend = manualInvoiceDate.toISOString();
    console.log("[INVOICE_DEBUG] Submitting manual invoice with ISO date:", dateToSend);
    createManualInvoiceMutation.mutate({
      ...manualInvoiceData,
      createdAt: dateToSend
    });
  };

  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isDirect = queryParams.get("direct") === "true";

  useEffect(() => {
    if (isDirect) {
      const itemsFromUrl = queryParams.get("items");
      const technicianId = queryParams.get("technicianId");
      const rollId = queryParams.get("rollId");
      const autoSubmit = queryParams.get("autoSubmit") === "true";
      const invoiceDateParam = queryParams.get("invoiceDate");
      let initialItems = [{ description: "", quantity: 1, unitPrice: 0, type: "service" }];
      
      let parsedDate = new Date();
      if (invoiceDateParam) {
        try {
          const date = new Date(invoiceDateParam);
          if (!isNaN(date.getTime())) {
            parsedDate = date;
            setManualInvoiceDate(date);
          }
        } catch (e) {
          console.error("Failed to parse invoice date from URL", e);
        }
      }

      if (itemsFromUrl) {
        try {
          initialItems = JSON.parse(decodeURIComponent(itemsFromUrl));
        } catch (e) {
          console.error("Failed to parse items from URL", e);
        }
      }

      const taxRateParam = queryParams.get("tax");
      const newInvoiceData = {
        ...manualInvoiceData,
        customerName: queryParams.get("customerName") || "",
        customerPhone: queryParams.get("customerPhone") || "",
        vehicleName: queryParams.get("vehicleName") || "",
        plateNumber: queryParams.get("plateNumber") || "",
        items: initialItems,
        technicianId: technicianId || "",
        rollId: rollId || "",
        discount: Number(queryParams.get("discount")) || 0,
        taxRate: (taxRateParam !== null && taxRateParam !== "") ? Number(taxRateParam) : 18,
        notes: queryParams.get("notes") || "",
      };

      setManualInvoiceData(newInvoiceData);
      
      if (autoSubmit) {
        console.log("Auto-submitting direct invoice with date:", parsedDate.toISOString());
        createManualInvoiceMutation.mutate({
          ...newInvoiceData,
          createdAt: parsedDate.toISOString()
        });
      } else {
        setManualInvoiceOpen(true);
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isDirect, queryParams]);

  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: rolls = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory/rolls"],
  });

  const addManualItem = () => {
    setManualInvoiceData({
      ...manualInvoiceData,
      items: [...manualInvoiceData.items, { description: "", quantity: 1, unitPrice: 0, type: "service" }]
    });
  };

  const { data: dbServices = [] } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ["inventory"],
    queryFn: api.inventory.list,
  });

  const ppfInventory = useMemo(() => inventory.filter(i => i.isPpf), [inventory]);
  const accessoryInventory = useMemo(() => inventory.filter(i => !i.isPpf && i.category !== 'PPF'), [inventory]);

  const updateManualItem = (index: number, field: string, value: any) => {
    const items = [...manualInvoiceData.items];
    items[index] = { ...items[index], [field]: value, total: field === 'unitPrice' ? value * (items[index].quantity || 1) : (items[index].unitPrice * (field === 'quantity' ? value : items[index].quantity)) };
    setManualInvoiceData({ ...manualInvoiceData, items });
  };

  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "created-desc">("created-desc");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [filterBusiness, setFilterBusiness] = useState<string>("all");
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [otherPaymentDetails, setOtherPaymentDetails] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.invoices.list(),
  });

  const markPaidMutation = useMutation({
    mutationFn: (data: { invoiceId: string; paymentMode: string; otherPaymentDetails?: string; paidDate: Date }) => 
      api.invoices.markPaid(data.invoiceId, data.paymentMode, data.otherPaymentDetails, data.paidDate),
    onSuccess: (updatedInvoice: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (selectedInvoice && updatedInvoice) {
        setSelectedInvoice(updatedInvoice);
        setViewDialogOpen(true);
      }
      setPaymentDialogOpen(false);
      toast({ title: "Invoice marked as paid" });
    },
    onError: () => {
      toast({ title: "Failed to mark invoice as paid", variant: "destructive" });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Invoice deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  });

  let filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch =
      invoice.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "paid" && invoice.paymentStatus === "Paid") ||
      (filterStatus === "unpaid" && invoice.paymentStatus !== "Paid");
    
    const matchesPaymentMode =
      filterPaymentMode === "all" ||
      invoice.paymentMode === filterPaymentMode;

    const matchesBusiness =
      filterBusiness === "all" ||
      (filterBusiness === "Auto Gamma" && !invoice.businessId?.includes("business_2") && !invoice.business?.includes("AGNX")) ||
      (filterBusiness === "AGNX" && (invoice.businessId?.includes("business_2") || invoice.business?.includes("AGNX")));
    
    const matchesDate = (() => {
      if (timeFilter !== "all") {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const invoiceDate = new Date(invoice.createdAt);
        
        if (timeFilter === "today") {
          return invoiceDate >= startOfToday;
        }
        if (timeFilter === "week") {
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
          return invoiceDate >= startOfWeek;
        }
        if (timeFilter === "month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return invoiceDate >= startOfMonth;
        }
      }
      
      const matchesCustomDate = (!fromDate || new Date(invoice.createdAt) >= fromDate) && 
                      (!toDate || new Date(invoice.createdAt) <= new Date(new Date(toDate).setHours(23, 59, 59, 999)));
      return matchesCustomDate;
    })();
    
    return matchesSearch && matchesStatus && matchesPaymentMode && matchesBusiness && matchesDate;
  });

  filteredInvoices = [...filteredInvoices].sort((a: any, b: any) => {
    switch (sortBy) {
      case "created-desc":
        // Sort by the actual MongoDB ID which is strictly chronological for creation time
        // Using localeCompare for hex string IDs or numeric comparison for other types
        return String(b._id).localeCompare(String(a._id));
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "amount-desc":
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      case "amount-asc":
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      default:
        return 0;
    }
  });

  const totalRevenue = invoices
    .filter((inv: any) => inv.paymentStatus === "Paid")
    .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
  
  const paidInvoices = invoices.filter((inv: any) => inv.paymentStatus === "Paid").length;
  const unpaidInvoices = invoices.filter((inv: any) => inv.paymentStatus !== "Paid").length;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

    const getInvoiceHTML = (invoice: any): string => {
    if (!invoice) return "";
    
    const getPaymentModeHTML = () => {
      if (invoice.paymentStatus === "Paid" && invoice.paymentMode) {
        const details = invoice.paymentMode === 'Other' && invoice.otherPaymentDetails 
          ? ` (${invoice.otherPaymentDetails})` 
          : '';
        const paidDateText = invoice.paidDate 
          ? ` on ${new Date(invoice.paidDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
          : '';
        return `<div style="background-color: #d1fae5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 8px; width: fit-content; margin-top: 16px; display: flex; align-items: center; gap: 8px;">
          <span style="color: #047857; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Paid via ${invoice.paymentMode}${details}${paidDateText}
          </span>
        </div>`;
      }
      return "";
    };

    const rawBiz = String(invoice.business || "");
    const isBusiness2 = rawBiz === "AGNX" || 
                       rawBiz.toLowerCase().includes("AGNX") || 
                       rawBiz.toLowerCase().includes("business2") || 
                       invoice.businessId === "business_2" ||
                       (invoice.items && invoice.items.some((item: any) => 
                         item.assignedBusiness === 'AGNX' || 
                         (item.description && item.description.toLowerCase().includes('AGNX')) ||
                         (item.assignedBusiness && item.assignedBusiness.toLowerCase().includes('AGNX'))
                       )) ||
                       (invoice.serviceItems && invoice.serviceItems.some((item: any) => 
                         item.assignedBusiness === 'AGNX' || 
                         (item.description && item.description.toLowerCase().includes('AGNX')) ||
                         (item.assignedBusiness && item.assignedBusiness.toLowerCase().includes('AGNX'))
                       ));
    
    console.log("Invoice Branding Check:", {
      invoiceNumber: invoice.invoiceNumber,
      rawBiz,
      isBusiness2,
      businessId: invoice.businessId,
      itemCount: invoice.items?.length,
      serviceItemCount: invoice.serviceItems?.length,
      hasBusiness2Item: invoice.items?.some((i: any) => i.assignedBusiness === 'AGNX' || i.assignedBusiness?.toLowerCase().includes('AGNX')),
      hasBusiness2ServiceItem: invoice.serviceItems?.some((i: any) => i.assignedBusiness === 'AGNX' || i.assignedBusiness?.toLowerCase().includes('AGNX'))
    });

    const currentBusinessName = isBusiness2 ? "AGNX" : "AUTOGAMMA";
    const currentFooterText = isBusiness2 ? "AGNX" : "AUTOGAMMA - Premium Auto Detailing Studio";
    const currentLogo = isBusiness2 ? "logo2.png" : "logo.png";

    // Use absolute paths for the images to ensure they load correctly in all contexts
    const logoUrl = `/${currentLogo}`;
    console.log("Logo selected:", { currentLogo, logoUrl, isBusiness2 });
    const calculatedSubtotal = invoice.items.reduce((sum: number, item: any) => sum + ((item.unitPrice * (item.quantity || 1)) - (item.discount || 0)), 0);
    const calculatedGrandTotal = (invoice.totalAmount || (calculatedSubtotal + (invoice.taxAmount || 0) - (invoice.discount || 0)));
    const calculatedGST = Math.max(0, calculatedGrandTotal - calculatedSubtotal);

    const gstLabel = (invoice.taxRate === 0 || calculatedGST < 0.01) ? "NON GST" : "With GST";
    console.log(`[Invoice ${invoice.invoiceNumber}] GST Check (Real-time):`, {
      calculatedSubtotal,
      calculatedGrandTotal,
      calculatedGST,
      taxRate: invoice.taxRate,
      gstLabel
    });

    const logoHtml = `<div style="text-align: center; width: 100%; min-height: 80px; margin-bottom: 10px;">
      <img src="${logoUrl}" 
           alt="${currentBusinessName} Logo" 
           style="height: 80px; width: auto; max-width: 250px; object-fit: contain; margin: 0 auto; display: block;" />
    </div>`;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 0;">
        <div style="text-align: center; margin-bottom: 30px;">
          ${logoHtml}
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Invoice</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; flex-wrap: wrap;">
          <div>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Invoice Number</p>
            <p style="font-weight: bold; font-size: 14px; margin: 4px 0 0 0;">${invoice.invoiceNumber}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Date</p>
            <p style="font-weight: bold; font-size: 14px; margin: 4px 0 0 0;">${new Date(invoice.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}</p>
          </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0; margin: 30px 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Customer Details</h3>
              <p style="font-weight: 500; margin: 4px 0; font-size: 13px;">${invoice.customerName}</p>
              ${invoice.customerPhone ? `<p style="color: #6b7280; font-size: 12px; margin: 2px 0;">Tel: ${invoice.customerPhone}</p>` : ""}
              ${invoice.customerEmail ? `<p style="color: #6b7280; font-size: 12px; margin: 2px 0;">Email: ${invoice.customerEmail}</p>` : ""}
              ${invoice.customerAddress ? `<p style="color: #6b7280; font-size: 12px; margin: 2px 0;">Address: ${invoice.customerAddress}</p>` : ""}
            </div>
            <div>
              <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Vehicle Details</h3>
              <p style="font-weight: 500; margin: 4px 0; font-size: 13px;">${invoice.vehicleName}</p>
              <p style="color: #6b7280; font-size: 12px; margin: 2px 0;">Plate: ${invoice.plateNumber}</p>
            </div>
          </div>
        </div>

        <div style="margin: 30px 0;">
          <h3 style="font-weight: 600; margin: 0 0 12px 0; font-size: 14px;">Items & Services</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="text-align: left; padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Description</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Unit Price</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Discount</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map((item: any) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.description}</td>
                  <td style="text-align: right; padding: 10px; border: 1px solid #e5e7eb;">₹${item.unitPrice.toLocaleString("en-IN")}</td>
                  <td style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; color: #dc2626;">${item.discount > 0 ? `-₹${item.discount.toLocaleString("en-IN")}` : "—"}</td>
                  <td style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 500;">₹${(item.total - (item.discount || 0)).toLocaleString("en-IN")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 280px; gap: 30px; margin: 30px 0;">
          <div>
            ${invoice.notes ? `
              <div style="font-size: 12px; margin-bottom: 20px;">
                <p style="font-weight: 600; margin: 0 0 4px 0;">Notes:</p>
                <p style="color: #6b7280; margin: 0; font-style: italic;">${invoice.notes}</p>
              </div>
            ` : ""}
            ${getPaymentModeHTML()}
          </div>
          <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; background-color: #f9fafb;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin-bottom: 8px;">
              <span>Subtotal:</span>
              <span>₹${calculatedSubtotal.toLocaleString("en-IN")}</span>
            </div>
            ${invoice.tax > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin-bottom: 8px;">
                <span>Tax (${invoice.taxRate}%):</span>
                <span>₹${invoice.tax.toLocaleString("en-IN")}</span>
              </div>
            ` : ""}
            ${invoice.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #dc2626; margin-bottom: 8px;">
                <span>Total Discount:</span>
                <span>-₹${invoice.discount.toLocaleString("en-IN")}</span>
              </div>
            ` : ""}
            <div style="border-top: 1px solid #d1d5db; padding-top: 8px; margin-bottom: 8px;"></div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin-bottom: 8px;">
              <span>GST:</span>
              <span>₹${calculatedGST.toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 8px;">
              <span>Grand Total:</span>
              <span>₹${calculatedGrandTotal.toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              <span>Amount Paid:</span>
              <span>₹${invoice.paidAmount.toLocaleString("en-IN")}</span>
            </div>
            ${(invoice.totalAmount - invoice.paidAmount) > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #dc2626;">
                <span>Balance Due:</span>
                <span>₹${(invoice.totalAmount - invoice.paidAmount).toLocaleString("en-IN")}</span>
              </div>
            ` : ""}
          </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; text-align: center; padding-top: 20px; margin-top: 30px;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">This is a computer-generated invoice. No signature is required.</p>
          <p style="color: #111827; font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">${currentFooterText}</p>
        </div>
      </div>
    `;
  };

  const handlePrint = () => {
    if (!selectedInvoice) return;
    
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    const printWindow = printFrame.contentWindow;
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Invoice ${selectedInvoice.invoiceNumber}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #111827;
                padding: 20px;
              }
              @media print {
                body {
                  padding: 10mm;
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            ${getInvoiceHTML(selectedInvoice)}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 100);
      }, 300);
    }
  };

  const handleDownload = async (invoice?: any) => {
    const invoiceToDownload = invoice || selectedInvoice;
    if (!invoiceToDownload) {
      toast({ title: "No invoice selected", variant: "destructive" });
      return;
    }
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.createElement('div');
      element.innerHTML = getInvoiceHTML(invoiceToDownload);
      element.style.padding = '20px';
      element.style.background = 'white';
      
      const opt = {
        margin: 5,
        filename: `Invoice_${invoiceToDownload.invoiceNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4', 
          orientation: 'portrait' as const,
          compress: true
        }
      };

      await html2pdf().set(opt).from(element).save();
      toast({ title: "Invoice downloaded successfully" });
    } catch (error) {
      console.error("Download error:", error);
      toast({ title: "Failed to download invoice", variant: "destructive" });
    }
  };

  const isLoading = invoicesLoading;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoices & Tracking</h1>
      </div>

      <Dialog open={manualInvoiceOpen} onOpenChange={setManualInvoiceOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Manual Invoice</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input 
                value={manualInvoiceData.customerName}
                onChange={(e) => setManualInvoiceData({...manualInvoiceData, customerName: e.target.value})}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Phone *</Label>
              <Input 
                value={manualInvoiceData.customerPhone}
                onChange={(e) => setManualInvoiceData({...manualInvoiceData, customerPhone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Name *</Label>
              <Input 
                value={manualInvoiceData.vehicleName}
                onChange={(e) => setManualInvoiceData({...manualInvoiceData, vehicleName: e.target.value})}
                placeholder="e.g. Toyota Fortuner"
              />
            </div>
            <div className="space-y-2">
              <Label>Plate Number</Label>
              <Input 
                value={manualInvoiceData.plateNumber}
                onChange={(e) => setManualInvoiceData({...manualInvoiceData, plateNumber: e.target.value})}
                placeholder="e.g. MH01 AB 1234"
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(manualInvoiceDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={manualInvoiceDate}
                    onSelect={(date) => date && setManualInvoiceDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Technician</Label>
            <Select
              value={manualInvoiceData.technicianId}
              onValueChange={(val) => setManualInvoiceData({ ...manualInvoiceData, technicianId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech: any) => (
                  <SelectItem key={tech._id} value={tech._id}>{tech.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>PPF Roll</Label>
            <Select
              value={manualInvoiceData.rollId}
              onValueChange={(val) => setManualInvoiceData({ ...manualInvoiceData, rollId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select roll" />
              </SelectTrigger>
              <SelectContent>
                {rolls.map((roll: any) => (
                  <SelectItem key={roll._id || roll.name} value={roll._id || roll.name}>{roll.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items & Services</h3>
              <Button type="button" variant="outline" size="sm" onClick={addManualItem}>Add Item</Button>
            </div>
            {manualInvoiceData.items.map((item: any, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end border p-2 rounded relative">
                <div className="md:col-span-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Description / Selection</Label>
                    {(item.category || item.type) && (
                      <Badge variant="outline" className="text-[10px] h-4 py-0">
                        {item.category || (item.type === 'accessory' ? 'Accessory' : item.type === 'service' ? 'Service' : 'PPF')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Select 
                      value={item.description} 
                      onValueChange={(val) => updateManualItem(index, "description", val)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select service or item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Entry...</SelectItem>
                        <Separator className="my-1" />
                        <div className="px-2 py-1 text-xs font-bold text-muted-foreground bg-muted/50">Services</div>
                        {dbServices.filter((s: any) => !s.isPpf).map((s: any) => (
                          <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                        ))}
                        <Separator className="my-1" />
                        <div className="px-2 py-1 text-xs font-bold text-muted-foreground bg-muted/50">Accessories</div>
                        {accessoryInventory.map((i: any) => (
                          <SelectItem key={i._id} value={i.name}>{i.name} ({i.quantity} {i.unit})</SelectItem>
                        ))}
                        <Separator className="my-1" />
                        <div className="px-2 py-1 text-xs font-bold text-muted-foreground bg-muted/50">PPF Items</div>
                        {ppfInventory.map((i: any) => (
                          <SelectItem key={i._id} value={i.name}>{i.name} ({i.quantity} {i.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(item.description === 'custom' || (item.description && !dbServices.find((s:any) => s.name === item.description) && !inventory.find((i:any) => i.name === item.description))) && (
                      <Input 
                        placeholder="Type custom description" 
                        value={item.description === 'custom' ? '' : item.description}
                        onChange={(e) => updateManualItem(index, "description", e.target.value)}
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price</Label>
                  <Input 
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateManualItem(index, "unitPrice", parseFloat(e.target.value))}
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500"
                  onClick={() => {
                    const newItems = manualInvoiceData.items.filter((_: any, i: number) => i !== index);
                    setManualInvoiceData({...manualInvoiceData, items: newItems});
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input 
                type="number"
                value={manualInvoiceData.taxRate}
                onChange={(e) => setManualInvoiceData({...manualInvoiceData, taxRate: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Discount</Label>
              <Input 
                type="number"
                value={manualInvoiceData.discount}
                onChange={(e) => setManualInvoiceData({...manualInvoiceData, discount: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setManualInvoiceOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleManualInvoiceSubmit}
              disabled={createManualInvoiceMutation.isPending || !manualInvoiceData.customerName || !manualInvoiceData.vehicleName}
            >
              Generate Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-white border-red-300 shadow-sm" data-testid="card-total-revenue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wider">Total Revenue</p>
                <p className="text-3xl font-bold mt-3 text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-6 h-6" />
                  {totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <IndianRupee className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-red-300 shadow-sm" data-testid="card-paid-invoices">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wider">Paid Invoices</p>
                <p className="text-3xl font-bold mt-3 text-slate-700">
                  {paidInvoices}
                </p>
              </div>
              <div className="p-4 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-100 to-white border-red-300 shadow-sm" data-testid="card-unpaid-invoices">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-700 font-semibold uppercase tracking-wider">Unpaid Invoices</p>
                <p className="text-3xl font-bold mt-3 text-slate-900">
                  {unpaidInvoices}
                </p>
              </div>
              <div className="p-4 bg-slate-200 rounded-lg">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          placeholder="Search by customer name, vehicle number, or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-9 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
          data-testid="input-search-billing"
        />
        
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40 h-9" data-testid="select-filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-600" />
            <Select value={timeFilter} onValueChange={(value: any) => {
              setTimeFilter(value);
              if (value !== "all") {
                setFromDate(undefined);
                setToDate(undefined);
              }
            }}>
              <SelectTrigger className="w-40 h-9" data-testid="select-filter-time">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-4 h-4 p-0 flex items-center justify-center border-slate-600 text-slate-600">B</Badge>
            <Select value={filterBusiness} onValueChange={(value: any) => setFilterBusiness(value)}>
              <SelectTrigger className="w-40 h-9" data-testid="select-filter-business">
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                <SelectItem value="Auto Gamma">Auto Gamma</SelectItem>
                <SelectItem value="AGNX">AGNX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-600" />
            <Select value={filterPaymentMode} onValueChange={(value: any) => setFilterPaymentMode(value)}>
              <SelectTrigger className="w-40 h-9" data-testid="select-filter-payment-mode">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-600" />
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40 h-9" data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created-desc">Recently Created</SelectItem>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">From:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    size="sm"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal h-9 border-slate-300",
                      !fromDate && "text-muted-foreground"
                    )}
                    data-testid="button-from-date-filter"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "LLL dd, y") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">To:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    size="sm"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal h-9 border-slate-300",
                      !toDate && "text-muted-foreground"
                    )}
                    data-testid="button-to-date-filter"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "LLL dd, y") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(fromDate || toDate) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setFromDate(undefined);
                  setToDate(undefined);
                }}
                className="text-xs h-9 text-slate-500 hover:text-red-500"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
            <FileText className="w-5 h-5 text-primary" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-slate-500 text-center py-8">Loading...</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No invoices found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice: any) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 rounded-lg hover:shadow-md transition-all flex-wrap gap-4 border border-slate-200 hover-elevate"
                  data-testid={`invoice-item-${invoice._id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-slate-600">
                        {invoice.customerName} - {invoice.plateNumber}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 h-4 border-slate-300 text-slate-500">
                          {invoice.business || invoice.businessId || "Auto Gamma"}
                        </Badge>
                        <p className="text-xs text-slate-500">
                          {new Date(invoice.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-right">
                      <p className="font-bold text-slate-900 flex items-center justify-end gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {(invoice.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                      <div className="flex flex-col items-end gap-0.5 mt-1">
                        <p className="text-xs text-slate-500">
                          Paid: <IndianRupee className="w-3 h-3 inline" />
                          {(invoice.paidAmount || 0).toLocaleString("en-IN")}
                        </p>
                        {invoice.paymentStatus === "Paid" && invoice.paidDate && (
                          <p className="text-[10px] text-green-600 font-semibold">
                            Paid on: {format(new Date(invoice.paidDate), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
                      {invoice.paymentStatus}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-slate-200 text-slate-700"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setViewDialogOpen(true);
                        }}
                        data-testid={`button-view-invoice-${invoice._id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-slate-200 text-slate-700"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setTimeout(handlePrint, 100);
                        }}
                        data-testid={`button-print-invoice-${invoice._id}`}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-slate-200 text-slate-700"
                        onClick={() => handleDownload(invoice)}
                        data-testid={`button-download-invoice-${invoice._id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {invoice.paymentStatus !== "Paid" && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:shadow-lg transition-all"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentDialogOpen(true);
                          }}
                          disabled={markPaidMutation.isPending}
                          data-testid={`button-mark-paid-${invoice._id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this invoice?")) {
                            deleteInvoiceMutation.mutate(invoice._id);
                          }
                        }}
                        disabled={deleteInvoiceMutation.isPending}
                        data-testid={`button-delete-invoice-${invoice._id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span>Invoice {selectedInvoice?.invoiceNumber}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (() => {
            const rawBiz = String(selectedInvoice.business || "");
            const isBusiness2 = rawBiz === "AGNX" || 
                               rawBiz.toLowerCase().includes("AGNX") || 
                               rawBiz.toLowerCase().includes("business2") || 
                               selectedInvoice.businessId === "business_2" ||
                               (selectedInvoice.items && selectedInvoice.items.some((item: any) => 
                                 item.assignedBusiness === 'AGNX' || 
                                 (item.description && item.description.toLowerCase().includes('AGNX')) ||
                                 (item.assignedBusiness && item.assignedBusiness.toLowerCase().includes('AGNX'))
                               )) ||
                               (selectedInvoice.serviceItems && selectedInvoice.serviceItems.some((item: any) => 
                                 item.assignedBusiness === 'AGNX' || 
                                 (item.description && item.description.toLowerCase().includes('AGNX')) ||
                                 (item.assignedBusiness && item.assignedBusiness.toLowerCase().includes('AGNX'))
                               ));
            
            const currentBusinessName = isBusiness2 ? "AGNX" : "AUTOGAMMA";
            const currentFooterText = isBusiness2 ? "AGNX" : "AUTOGAMMA - Premium Auto Detailing Studio";
            const currentLogo = isBusiness2 ? "logo2.png" : "logo.png";
            const logoUrl = `/${currentLogo}`;
            const gstAmount = (selectedInvoice.taxAmount || 0);
            // const gstLabel = gstAmount > 0 ? "With GST" : "NON GST";

            const calculatedSubtotal = selectedInvoice.items.reduce((sum: number, item: any) => sum + ((item.unitPrice * (item.quantity || 1)) - (item.discount || 0)), 0);
            const calculatedGrandTotal = (selectedInvoice.totalAmount || (calculatedSubtotal + (selectedInvoice.taxAmount || 0) - (selectedInvoice.discount || 0)));
            const calculatedGST = Math.max(0, calculatedGrandTotal - calculatedSubtotal);
            const gstLabel = calculatedGST > 1 ? "With GST" : "NON GST";

            return (
              <div ref={printRef} className="space-y-6">
                <div className="header text-center">
                  <img src={logoUrl} alt={`${currentBusinessName} Logo`} className="h-10 mx-auto mb-2 object-contain" />
                  <p className="text-muted-foreground uppercase font-bold text-sm tracking-wider">{gstLabel}</p>
                  <p className="text-muted-foreground">Invoice</p>
                </div>

                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-bold">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-bold">
                      {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {selectedInvoice.paymentStatus === "Paid" && selectedInvoice.paidDate && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Paid Date</p>
                        <p className="font-bold text-green-600">
                          {new Date(selectedInvoice.paidDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Details</h3>
                    <p className="font-medium">{selectedInvoice.customerName}</p>
                    {selectedInvoice.customerPhone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {selectedInvoice.customerPhone}
                      </p>
                    )}
                    {selectedInvoice.customerEmail && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {selectedInvoice.customerEmail}
                      </p>
                    )}
                    {selectedInvoice.customerAddress && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {selectedInvoice.customerAddress}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Vehicle Details</h3>
                    <p className="font-medium flex items-center gap-1">
                      <Car className="w-4 h-4" /> {selectedInvoice.vehicleName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Plate: {selectedInvoice.plateNumber}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Items & Services</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Description</th>
                          <th className="text-right p-3">Unit Price</th>
                          <th className="text-right p-3">Discount</th>
                          <th className="text-right p-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items?.filter((item: any) => item.type === 'service').map((item: any, index: number) => (
                          <tr key={`item-${index}`} className="border-t">
                            <td className="p-3">
                              {item.description}
                              <Badge variant="outline" className="ml-2 text-xs bg-slate-50">
                                {item.type}
                              </Badge>
                            </td>
                            <td className="text-right p-3">
                              <IndianRupee className="w-3 h-3 inline" />
                              {item.unitPrice.toLocaleString("en-IN")}
                            </td>
                            <td className="text-right p-3 text-red-600">
                              {item.discount > 0 ? (
                                <>
                                  -<IndianRupee className="w-3 h-3 inline" />
                                  {item.discount.toLocaleString("en-IN")}
                                </>
                              ) : "—"}
                            </td>
                            <td className="text-right p-3 font-semibold">
                              <IndianRupee className="w-3 h-3 inline" />
                              {(item.total - (item.discount || 0)).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-start gap-8">
                  <div className="flex-1">
                    {selectedInvoice.notes && (
                      <div className="text-sm">
                        <p className="font-semibold mb-1">Notes:</p>
                        <p className="text-muted-foreground italic">{selectedInvoice.notes}</p>
                      </div>
                    )}
                    {selectedInvoice.paymentStatus === "Paid" && selectedInvoice.paymentMode && (
                      <div className="mt-4 flex flex-col gap-1 text-green-700 bg-green-50 p-2 rounded-md w-fit border border-green-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm font-semibold uppercase tracking-wider">
                            Paid via {selectedInvoice.paymentMode}
                          </span>
                        </div>
                        {selectedInvoice.paymentMode === 'Other' && selectedInvoice.otherPaymentDetails && (
                          <p className="text-xs font-medium ml-6">
                            Details: {selectedInvoice.otherPaymentDetails}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {calculatedSubtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {calculatedGST.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Total Discount:</span>
                        <span className="flex items-center">
                          -<IndianRupee className="w-3 h-3" />
                          {selectedInvoice.discount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg text-slate-900 pt-2">
                      <span>Grand Total:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {calculatedGrandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Amount Paid:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {selectedInvoice.paidAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {(selectedInvoice.totalAmount - selectedInvoice.paidAmount) > 0 && (
                      <div className="flex justify-between text-sm font-semibold text-red-600">
                        <span>Balance Due:</span>
                        <span className="flex items-center">
                          <IndianRupee className="w-3 h-3" />
                          {(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="footer mt-12 text-center text-xs text-slate-400">
                  <p>This is a computer-generated invoice. No signature is required.</p>
                  <p className="mt-1 font-bold">{currentFooterText}</p>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex justify-end items-center gap-3 mt-6 sm:justify-end">
            <Button 
              className="flex items-center gap-2"
              onClick={handlePrint}
              data-testid="button-print-modal"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => handleDownload(selectedInvoice)}
              data-testid="button-download-modal"
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        setPaymentDialogOpen(open);
        if (!open) {
          setPaymentDate(new Date());
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Date</label>
              <Input
                type="date"
                value={paymentDate ? format(paymentDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) setPaymentDate(new Date(val));
                }}
                className="w-full"
                data-testid="input-payment-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger data-testid="select-payment-mode">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMode === "Other" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <label className="text-sm font-medium">Specify Payment Details</label>
                <Input
                  placeholder="Enter payment details (e.g. Reference No.)"
                  value={otherPaymentDetails}
                  onChange={(e) => setOtherPaymentDetails(e.target.value)}
                  data-testid="input-other-payment-details"
                />
              </div>
            )}
            <p className="text-sm text-slate-500">
              This will record a full payment for invoice <span className="font-bold">{selectedInvoice?.invoiceNumber}</span>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => markPaidMutation.mutate({ 
                invoiceId: selectedInvoice?._id, 
                paymentMode,
                otherPaymentDetails: paymentMode === "Other" ? otherPaymentDetails : undefined,
                paidDate: paymentDate
              })}
              disabled={markPaidMutation.isPending || (paymentMode === "Other" && !otherPaymentDetails.trim())}
              data-testid="button-confirm-payment"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
