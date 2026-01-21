import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Phone, Mail, Search, X, AlertCircle, LayoutGrid, List, Download, Printer, Share2, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
const autogammaLogo = "/logo.png";

const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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
  'Foam Washing': {
    'Small Cars': 400,
    'Hatchback / Small Sedan': 500,
    'Mid-size Sedan / Compact SUV / MUV': 600,
    'SUV / MPV': 700,
  },
  'Premium Washing': {
    'Small Cars': 600,
    'Hatchback / Small Sedan': 700,
    'Mid-size Sedan / Compact SUV / MUV': 800,
    'SUV / MPV': 900,
  },
  'Interior Cleaning': {
    'Small Cars': 2500,
    'Hatchback / Small Sedan': 3000,
    'Mid-size Sedan / Compact SUV / MUV': 3500,
    'SUV / MPV': 4500,
  },
  'Interior Steam Cleaning': {
    'Small Cars': 3500,
    'Hatchback / Small Sedan': 4000,
    'Mid-size Sedan / Compact SUV / MUV': 4500,
    'SUV / MPV': 5500,
  },
  'Leather Treatment': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 5500,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 7000,
  },
  'Detailing': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 6500,
    'Mid-size Sedan / Compact SUV / MUV': 7000,
    'SUV / MPV': 9000,
  },
  'Paint Sealant Coating (Teflon)': {
    'Small Cars': 6500,
    'Hatchback / Small Sedan': 8500,
    'Mid-size Sedan / Compact SUV / MUV': 9500,
    'SUV / MPV': 11500,
  },
  'Ceramic Coating – 9H': {
    'Small Cars': 11000,
    'Hatchback / Small Sedan': 12500,
    'Mid-size Sedan / Compact SUV / MUV': 15000,
    'SUV / MPV': 18000,
  },
  'Ceramic Coating – MAFRA': {
    'Small Cars': 12500,
    'Hatchback / Small Sedan': 15000,
    'Mid-size Sedan / Compact SUV / MUV': 18000,
    'SUV / MPV': 21000,
  },
  'Ceramic Coating – MENZA PRO': {
    'Small Cars': 15000,
    'Hatchback / Small Sedan': 18000,
    'Mid-size Sedan / Compact SUV / MUV': 21000,
    'SUV / MPV': 24000,
  },
  'Ceramic Coating – KOCH CHEMIE': {
    'Small Cars': 18000,
    'Hatchback / Small Sedan': 22000,
    'Mid-size Sedan / Compact SUV / MUV': 25000,
    'SUV / MPV': 28000,
  },
  'Corrosion Treatment': {
    'Small Cars': 3500,
    'Hatchback / Small Sedan': 5000,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 7500,
  },
  'Windshield Coating': {
    'Small Cars': 2500,
    'Hatchback / Small Sedan': 3000,
    'Mid-size Sedan / Compact SUV / MUV': 3500,
    'SUV / MPV': 4000,
  },
  'Windshield Coating All Glasses': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 5500,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 6500,
  },
  'Sun Control Film – Economy': {
    'Small Cars': 5200,
    'Hatchback / Small Sedan': 6000,
    'Mid-size Sedan / Compact SUV / MUV': 6500,
    'SUV / MPV': 8400,
  },
  'Sun Control Film – Standard': {
    'Small Cars': 7500,
    'Hatchback / Small Sedan': 8300,
    'Mid-size Sedan / Compact SUV / MUV': 9500,
    'SUV / MPV': 12500,
  },
  'Sun Control Film – Premium': {
    'Small Cars': 11500,
    'Hatchback / Small Sedan': 13000,
    'Mid-size Sedan / Compact SUV / MUV': 15000,
    'SUV / MPV': 18000,
  },
  'Sun Control Film – Ceramic': {
    'Small Cars': 13500,
    'Hatchback / Small Sedan': 15500,
    'Mid-size Sedan / Compact SUV / MUV': 18000,
    'SUV / MPV': 21000,
  },
};

const CAR_TYPES = ['Small Cars', 'Hatchback / Small Sedan', 'Mid-size Sedan / Compact SUV / MUV', 'SUV / MPV'];

const PPF_SERVICES = Object.keys(PPF_CATEGORIES);
const ALL_SERVICES = [
  ...PPF_SERVICES.map(cat => `PPF - ${cat}`),
  ...Object.keys(OTHER_SERVICES),
];

function getWarrantiesForService(service: string, carType: string): string[] {
  if (service.startsWith('PPF')) {
    const categoryName = service.replace('PPF - ', '');
    const category = PPF_CATEGORIES[categoryName as keyof typeof PPF_CATEGORIES];
    if (category && (category as any)[carType]) {
      return Object.keys((category as any)[carType]);
    }
  }
  return [];
}

function getPriceForService(service: string, carType: string, warranty?: string): number | null {
  if (service.startsWith('PPF')) {
    const categoryName = service.replace('PPF - ', '');
    const category = PPF_CATEGORIES[categoryName as keyof typeof PPF_CATEGORIES];
    if (warranty && category && (category as any)[carType]) {
      return (category as any)[carType][warranty] || null;
    }
  } else {
    const serviceData = OTHER_SERVICES[service as keyof typeof OTHER_SERVICES];
    if (serviceData && (serviceData as any)[carType]) {
      return (serviceData as any)[carType];
    }
  }
  return null;
}

type ServiceItem = {
  id: string;
  name: string;
  carType: string;
  warranty?: string;
  price: number;
  customerPrice?: number;
};

export default function PriceInquiries() {
  const [showForm, setShowForm] = useState(false);
  const [selectedServiceItems, setSelectedServiceItems] = useState<ServiceItem[]>([]);
  const [tempServiceName, setTempServiceName] = useState('');
  const [tempAccessoryCategory, setTempAccessoryCategory] = useState('');
  const [tempAccessoryId, setTempAccessoryId] = useState('');
  const [tempCarType, setTempCarType] = useState('');
  const [tempWarranty, setTempWarranty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list({ limit: 1000 }),
  });
  const customers = customersData?.customers || [];

  const filteredCustomerNames = useMemo(() => {
    if (!nameInput.trim()) return [];
    return customers.filter((c: any) => 
      c.name.toLowerCase().includes(nameInput.toLowerCase())
    ).slice(0, 5);
  }, [customers, nameInput]);

  const filteredCustomerPhones = useMemo(() => {
    if (!phoneInput.trim()) return [];
    return customers.filter((c: any) => 
      c.phone.includes(phoneInput)
    ).slice(0, 5);
  }, [customers, phoneInput]);

  const handleSelectCustomer = (customer: any) => {
    setNameInput(customer.name);
    setPhoneInput(customer.phone);
    setEmailInput(customer.email || '');
    setShowNameDropdown(false);
    setShowPhoneDropdown(false);
  };
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePrint = (inquiry: any) => {
    const serviceDetails = inquiry.serviceDetailsJson ? JSON.parse(inquiry.serviceDetailsJson) : [];
    const services = serviceDetails.filter((item: any) => item.carType !== 'Accessory');
    const accessories = serviceDetails.filter((item: any) => item.carType === 'Accessory');
    
    const receiptHtml = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${autogammaLogo}" alt="Auto Gamma Logo" style="height: 70px; display: block; margin: 0 auto 10px auto;" />
          <h1 style="font-size: 24px; font-weight: bold; color: #000; margin: 0; letter-spacing: 1px;">AUTO GAMMA</h1>
          <p style="font-size: 13px; color: #666; margin-top: 5px;">Professional Car Care & Detailing Studio</p>
        </div>

        <div style="border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 15px 0; margin-bottom: 25px; display: flex; justify-content: space-between;">
          <div>
            <h2 style="font-size: 11px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 5px 0;">Customer Details</h2>
            <p style="font-size: 15px; font-weight: bold; margin: 0;">${inquiry.name}</p>
            <p style="font-size: 13px; margin: 5px 0 0 0;">Phone: ${inquiry.phone}</p>
            ${inquiry.email ? `<p style="font-size: 13px; margin: 2px 0 0 0;">Email: ${inquiry.email}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 11px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 5px 0;">Quotation Info</h2>
            <p style="font-size: 13px; margin: 0;">ID: ${inquiry.inquiryId || `INQ${inquiry._id.slice(-6).toUpperCase()}`}</p>
            <p style="font-size: 13px; margin: 5px 0 0 0;">Date: ${format(new Date(inquiry.createdAt), 'MMMM d, yyyy')}</p>
          </div>
        </div>

        ${services.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Services Requested</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee; font-size: 13px;">Service Description</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee; font-size: 13px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${services.map((item: any) => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold; font-size: 14px;">${item.name}</div>
                    <div style="font-size: 11px; color: #666;">Vehicle Category: ${item.carType}</div>
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 14px;">
                    ₹${item.servicePrice.toLocaleString()}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${accessories.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Accessories Selected</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee; font-size: 13px;">Accessory Name</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee; font-size: 13px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${accessories.map((item: any) => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold; font-size: 14px;">${item.name}</div>
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 14px;">
                    ₹${item.servicePrice.toLocaleString()}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${inquiry.notes ? `
          <div style="margin-bottom: 25px; background: #fffcf5; border: 1px solid #fdf2d1; padding: 12px; border-radius: 4px;">
            <h3 style="font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase; margin: 0 0 4px 0;">Special Notes</h3>
            <p style="font-size: 13px; color: #451a03; margin: 0; font-style: italic;">"${inquiry.notes}"</p>
          </div>
        ` : ''}

        <div style="border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 15px; font-weight: bold; text-transform: uppercase; color: #000;">Total Quotation Amount</span>
          <span style="font-size: 18px; font-weight: bold; color: #000; background: #f3f4f6; padding: 5px 15px; border-radius: 4px;">₹${inquiry.priceOffered.toLocaleString()}</span>
        </div>

        <div style="margin-top: 35px; text-align: center; color: #999; font-size: 11px;">
          <p>This is a computer-generated quotation.</p>
          <p style="margin-top: 4px;">© ${new Date().getFullYear()} Auto Gamma Car Care Studio. All rights reserved.</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `quote_${inquiry.name}_${inquiry.inquiryId || inquiry._id.slice(-6)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    // Download immediately (fast)
    html2pdf().from(receiptHtml).set(opt).save();
    
    // Save to server in background (with delay to allow PDF generation to complete)
    setTimeout(() => {
      html2pdf().set(opt).from(receiptHtml).output('blob', (blob: Blob) => {
        fetch(`/api/save-pdf?inquiryId=${inquiry._id}&customerName=${encodeURIComponent(inquiry.name)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: blob,
        }).catch(() => {});
      });
    }, 2000);

    toast({ title: 'Quotation downloaded!' });
  };

  const handleSendWhatsApp = (inquiry: any) => {
    try {
      const serviceDetails = inquiry.serviceDetailsJson ? JSON.parse(inquiry.serviceDetailsJson) : [];
      
      // Create service list for WhatsApp message
      const serviceList = serviceDetails.length > 0 
        ? serviceDetails.map((item: any) => `• ${item.name} (${item.carType})${item.warranty ? ' - ' + item.warranty : ''}`).join('\n')
        : inquiry.service;

      // Create WhatsApp message with inquiry details
      const whatsappText = `Hi ${inquiry.name},

Thank you for your interest in Auto Gamma Car Care Studio!

*QUOTATION DETAILS:*
ID: ${inquiry.inquiryId || `INQ${inquiry._id.slice(-3).toUpperCase().padStart(3, '0')}`}
Date: ${inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')}

*SERVICES REQUESTED:*
${serviceList}

*PRICING:*
Our Quote: ₹${inquiry.priceOffered?.toLocaleString() || '0'}
Your Quote: ₹${inquiry.priceStated?.toLocaleString() || '0'}

${inquiry.notes ? `*SPECIAL NOTES:*\n${inquiry.notes}\n` : ''}
Please let me know if you have any questions!

Best regards,
Auto Gamma Car Care Studio`;

      const phoneNumber = inquiry.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, '_blank');

      toast({ title: 'Opening WhatsApp...' });

    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      toast({ title: 'Failed to open WhatsApp', variant: 'destructive' });
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['/api/price-inquiries', searchQuery, statusFilter, sortBy, sortOrder, filterService],
    queryFn: () => api.priceInquiries.list({ 
      search: searchQuery, 
      status: statusFilter, 
      sortBy, 
      sortOrder 
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.priceInquiries.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      toast({ title: 'Status updated successfully' });
    },
  });

  const inquiries = inquiriesData?.inquiries || [];

  const filteredInquiries = useMemo(() => {
    let result = inquiries || [];
    if (filterService && filterService !== 'all') {
      result = result.filter((inq: any) => inq.service.includes(filterService));
    }
    return result;
  }, [inquiries, filterService]);

  const createMutation = useMutation({
    mutationFn: api.priceInquiries.create,
    onSuccess: () => {
      setShowForm(false);
      setSelectedServiceItems([]);
      setNameInput('');
      setPhoneInput('');
      setEmailInput('');
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      toast({ title: 'Price inquiry saved successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete PDF first
      await fetch(`/api/delete-pdf/${id}`, { method: 'DELETE' }).catch(() => {});
      // Then delete inquiry
      return api.priceInquiries.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      toast({ title: 'Inquiry deleted' });
      setDeleteDialogOpen(false);
    },
  });

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ["inventory"],
    queryFn: api.inventory.list,
  });

  const accessoryOptions = useMemo(() => {
    return inventory.filter((item: any) => {
      const cat = (item.category || "").toString().trim().toLowerCase();
      const ppfBrands = ["elite", "garware plus", "garware premium", "garware matt"];
      return !ppfBrands.some(brand => cat.includes(brand)) && cat !== "";
    });
  }, [inventory]);

  const accessoryCategories = useMemo(() => {
    const categories = accessoryOptions.map(a => a.category).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  }, [accessoryOptions]);

  const filteredAccessories = useMemo(() => {
    if (!tempAccessoryCategory) return [];
    return accessoryOptions.filter(a => a.category === tempAccessoryCategory);
  }, [accessoryOptions, tempAccessoryCategory]);

  const { data: servicesData } = useQuery({
    queryKey: ['/api/services'],
    queryFn: () => api.services.list(),
  });
  const dbServices = servicesData || [];

  const ALL_SERVICE_OPTIONS = useMemo(() => {
    const dbOptions = dbServices.map((s: any) => s.name);
    return Array.from(new Set([...ALL_SERVICES, ...dbOptions])).sort();
  }, [dbServices]);

  const [serviceSearchQuery, setServiceSearchQuery] = useState('');

  const filteredServiceOptions = useMemo(() => {
    return ALL_SERVICE_OPTIONS.filter(service => 
      service.toLowerCase().includes(serviceSearchQuery.toLowerCase())
    );
  }, [ALL_SERVICE_OPTIONS, serviceSearchQuery]);

  const availableVehicleTypes = useMemo(() => {
    if (!tempServiceName) return CAR_TYPES;
    
    const dbService = dbServices.find((s: any) => s.name === tempServiceName);
    if (dbService && dbService.prices) {
      const types = Object.keys(dbService.prices);
      if (types.length > 0) return types;
    }
    
    // Check OTHER_SERVICES as fallback
    const staticService = OTHER_SERVICES[tempServiceName as keyof typeof OTHER_SERVICES];
    if (staticService) {
      return Object.keys(staticService);
    }

    return CAR_TYPES;
  }, [tempServiceName, dbServices]);

  const addServiceItem = () => {
    if (!tempServiceName || !tempCarType) return;
    
    // Check if it's a DB service
    const dbService = dbServices.find((s: any) => s.name === tempServiceName);
    let price: number | null = null;
    let warranty = tempWarranty;

    if (dbService) {
      if (dbService.warrantyOptions?.[tempCarType]) {
        const option = dbService.warrantyOptions[tempCarType].find((o: any) => o.warranty === tempWarranty);
        price = option ? option.price : null;
      } else {
        price = dbService.prices[tempCarType] || null;
      }
    } else {
      price = getPriceForService(tempServiceName, tempCarType, tempWarranty);
    }

    if (price === null) return;
    
    setSelectedServiceItems([...selectedServiceItems, {
      id: Date.now().toString(),
      name: tempServiceName,
      carType: tempCarType,
      warranty: warranty || undefined,
      price: price
    }]);
    setTempServiceName('');
    setTempCarType('');
    setTempWarranty('');
  };

  const tempWarrantyOptions = useMemo(() => {
    if (!tempServiceName || !tempCarType) return [];
    
    const dbService = dbServices.find((s: any) => s.name === tempServiceName);
    if (dbService && dbService.warrantyOptions?.[tempCarType]) {
      return dbService.warrantyOptions[tempCarType].map((o: any) => o.warranty);
    }
    
    return getWarrantiesForService(tempServiceName, tempCarType);
  }, [tempServiceName, tempCarType, dbServices]);

  const addAccessoryItem = () => {
    if (!tempAccessoryId) return;
    const accessory = accessoryOptions.find((a: any) => a._id === tempAccessoryId);
    if (accessory) {
      setSelectedServiceItems([...selectedServiceItems, {
        id: Date.now().toString(),
        name: accessory.name,
        carType: 'Accessory',
        price: accessory.price || 0,
      }]);
      setTempAccessoryId('');
      setTempAccessoryCategory('');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const serviceDetailsJson = JSON.stringify(selectedServiceItems.map(item => ({
      name: item.name,
      carType: item.carType,
      warranty: item.warranty || null,
      servicePrice: item.price,
      customerPrice: item.customerPrice
    })));
    createMutation.mutate({
      name: nameInput,
      phone: phoneInput,
      email: emailInput,
      service: selectedServiceItems.length > 0 
        ? selectedServiceItems.map(item => `${item.name} (${item.carType})`).join(', ')
        : 'General Inquiry',
      serviceDetailsJson,
      priceOffered: selectedServiceItems.reduce((sum, item) => sum + item.price, 0),
      priceStated: selectedServiceItems.reduce((sum, item) => sum + (item.customerPrice || 0), 0),
      notes: formData.get('notes') as string || '',
      status: 'Inquiry'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inquiry</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, phone or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-11"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Inquiry">Inquiry</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-11"><SelectValue placeholder="Sort By" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="priceOffered">Price</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            <ArrowUpDown className="w-4 h-4" />
          </Button>
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-[180px] h-11"><SelectValue placeholder="Filter by service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {ALL_SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>Add Inquiry</Button>
      ) : (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Customer name"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setShowNameDropdown(true);
                    }}
                    onFocus={() => setShowNameDropdown(true)}
                    autoComplete="off"
                    className="h-11"
                    data-testid="input-customer-name"
                  />
                  {showNameDropdown && filteredCustomerNames.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
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
                <div className="space-y-2 relative">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    placeholder="Phone number"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      setShowPhoneDropdown(true);
                    }}
                    onFocus={() => setShowPhoneDropdown(true)}
                    autoComplete="off"
                    className="h-11"
                    data-testid="input-customer-phone"
                  />
                  {showPhoneDropdown && filteredCustomerPhones.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
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
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email address (optional)"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="h-11"
                    data-testid="input-customer-email"
                  />
                </div>
              </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select value={tempServiceName} onValueChange={(value) => {
                    setTempServiceName(value);
                    setTempWarranty('');
                  }}>
                    <SelectTrigger className="hover-elevate">
                      <SelectValue placeholder="Select Service" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <div className="p-2 sticky top-0 bg-popover z-10 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search service..."
                            className="pl-8 h-9"
                            value={serviceSearchQuery}
                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      {filteredServiceOptions.length > 0 ? (
                        filteredServiceOptions.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No services found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={tempCarType} onValueChange={setTempCarType}>
                    <SelectTrigger className="hover-elevate">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicleTypes.map(t => (
                        <SelectItem key={t} value={t}>
                          {t}
                          {tempServiceName && !tempWarrantyOptions.length && (
                            <span className="ml-2 text-muted-foreground">
                              - ₹{(() => {
                                const dbService = dbServices.find((s: any) => s.name === tempServiceName);
                                if (dbService) {
                                  return dbService.prices[t]?.toLocaleString();
                                }
                                return getPriceForService(tempServiceName, t)?.toLocaleString();
                              })()}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Warranty</Label>
                  <Select 
                    value={tempWarranty} 
                    onValueChange={setTempWarranty}
                    disabled={tempWarrantyOptions.length === 0}
                  >
                    <SelectTrigger><SelectValue placeholder={tempWarrantyOptions.length > 0 ? "Select Warranty" : "No Warranty Options"} /></SelectTrigger>
                    <SelectContent>
                      {tempWarrantyOptions.map((w: string) => (
                        <SelectItem key={w} value={w}>
                          {w}
                          {tempServiceName && tempCarType && (
                            <span className="ml-2 text-muted-foreground">
                              - ₹{(() => {
                                const dbService = dbServices.find((s: any) => s.name === tempServiceName);
                                if (dbService && dbService.warrantyOptions?.[tempCarType]) {
                                  return dbService.warrantyOptions[tempCarType].find((o: any) => o.warranty === w)?.price?.toLocaleString();
                                }
                                return getPriceForService(tempServiceName, tempCarType, w)?.toLocaleString();
                              })()}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={addServiceItem} disabled={!tempServiceName || !tempCarType || (tempWarrantyOptions.length > 0 && !tempWarranty)}>Add Service</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Accessory Category</Label>
                  <Select value={tempAccessoryCategory} onValueChange={(value) => {
                    setTempAccessoryCategory(value);
                    setTempAccessoryId('');
                  }}>
                    <SelectTrigger data-testid="select-accessory-category"><SelectValue placeholder="Accessory Category" /></SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
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
                      {accessoryCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Accessory Name</Label>
                  <Select value={tempAccessoryId} onValueChange={(value) => {
                    setTempAccessoryId(value);
                  }} disabled={!tempAccessoryCategory}>
                    <SelectTrigger data-testid="select-accessory"><SelectValue placeholder="Accessory Name" /></SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      <div className="p-2 sticky top-0 bg-white z-10 border-b">
                        <Input
                          placeholder="Search accessory..."
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
                      {filteredAccessories.map(a => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.name} - ₹{a.price?.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-[2.25rem]" />

                <Button 
                  type="button" 
                  onClick={addAccessoryItem} 
                  disabled={!tempAccessoryId} 
                  data-testid="button-add-accessory"
                  className="w-full"
                >
                  Add Accessory
                </Button>
              </div>
            </div>
            {selectedServiceItems.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3 text-left">Service Name</th>
                      <th className="p-3 text-left">Warranty & Price</th>
                      <th className="p-3 text-right">Service Price</th>
                      <th className="p-3 text-right">Customer Price</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedServiceItems.map(item => (
                      <tr key={item.id} className="border-b hover:bg-slate-50" data-testid={`row-service-${item.id}`}>
                        <td className="p-3">
                          <div className="font-medium" data-testid={`text-servicename-${item.id}`}>{item.name}</div>
                          <div className="text-xs text-slate-500" data-testid={`text-cartype-${item.id}`}>{item.carType}</div>
                        </td>
                        <td className="p-3 text-left">
                          {item.warranty ? (
                            <div className="text-sm font-medium" data-testid={`text-warranty-${item.id}`}>{item.warranty}</div>
                          ) : (
                            <div className="text-xs text-slate-500">—</div>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium" data-testid={`text-serviceprice-${item.id}`}>₹{item.price.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <Input 
                            type="number" 
                            placeholder="Enter price" 
                            className="w-32 ml-auto" 
                            data-testid={`input-customerprice-${item.id}`}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setSelectedServiceItems(selectedServiceItems.map(i => i.id === item.id ? { ...i, customerPrice: val } : i));
                            }}
                            value={item.customerPrice || ''}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            type="button"
                            data-testid={`button-delete-service-${item.id}`}
                            onClick={() => setSelectedServiceItems(selectedServiceItems.filter(i => i.id !== item.id))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
              <Textarea 
                name="notes" 
                id="notes"
                placeholder="Add any additional notes or special requests..." 
                className="mt-2 resize-none"
                rows={4}
                data-testid="textarea-notes"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save Inquiry</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredInquiries.map((inquiry: any) => {
          const diff = (inquiry.priceStated || 0) - (inquiry.priceOffered || 0);
          const isNegative = diff < 0;
          const serviceDetails = inquiry.serviceDetailsJson ? JSON.parse(inquiry.serviceDetailsJson) : [];

          return (
            <React.Fragment key={inquiry._id}>
              <Card className="border border-orange-200 hover:shadow-lg transition-all overflow-hidden">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Customer & Service Info */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Name</Label>
                        <p className="text-lg font-semibold text-slate-900">{inquiry.name}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Phone className="w-4 h-4 text-blue-500" />
                            {inquiry.phone}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Mail className="w-4 h-4 text-blue-500" />
                            <span className="truncate">{inquiry.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Service Items Section */}
                        {serviceDetails.filter((item: any) => item.carType !== 'Accessory').length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Services Requested</Label>
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-md space-y-3">
                              {serviceDetails
                                .filter((item: any) => item.carType !== 'Accessory')
                                .map((item: any, idx: number) => (
                                  <div key={idx} className="flex flex-col border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                                    <div className="flex justify-between items-center text-sm">
                                      <div>
                                        <span className="font-bold text-slate-900">{item.name}</span>
                                        <span className="text-xs text-slate-500 ml-2">({item.carType})</span>
                                        {item.warranty && <span className="text-xs text-slate-600 ml-2 font-medium">{item.warranty}</span>}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] mt-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-500 uppercase font-black tracking-tighter">Our:</span>
                                        <span className="font-bold text-slate-700">₹{item.servicePrice.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-500 uppercase font-black tracking-tighter">Customer:</span>
                                        <span className="font-bold text-slate-900">₹{(item.customerPrice || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Accessories Section */}
                        {serviceDetails.filter((item: any) => item.carType === 'Accessory').length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accessories Selected</Label>
                            <div className="bg-emerald-50/30 border border-emerald-100 p-3 rounded-md space-y-3">
                              {serviceDetails
                                .filter((item: any) => item.carType === 'Accessory')
                                .map((item: any, idx: number) => (
                                  <div key={idx} className="flex flex-col border-b border-emerald-100 last:border-0 pb-2 last:pb-0">
                                    <div className="flex justify-between items-center text-sm">
                                      <div>
                                        <span className="font-bold text-emerald-900">{item.name}</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] mt-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-emerald-600/60 uppercase font-black tracking-tighter">Our:</span>
                                        <span className="font-bold text-emerald-800">₹{item.servicePrice.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-emerald-600/60 uppercase font-black tracking-tighter">Customer:</span>
                                        <span className="font-bold text-emerald-900">₹{(item.customerPrice || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {serviceDetails.length === 0 && inquiry.service && (
                          <div className="space-y-1 col-span-full">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Services Requested</Label>
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-md">
                              <p className="text-sm text-slate-800 font-medium">{inquiry.service}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {inquiry.notes && (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Special Notes</Label>
                          <p className="text-sm text-slate-600 bg-orange-50/50 p-2 rounded italic">"{inquiry.notes}"</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Pricing & Meta Info */}
                    <div className="flex flex-col justify-between space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="space-y-1 text-center sm:text-left">
                          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Our Price</Label>
                          <p className="text-sm font-bold text-slate-900">₹{inquiry.priceOffered?.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 text-center sm:text-left border-y sm:border-y-0 sm:border-x border-slate-200 py-2 sm:py-0 px-0 sm:px-4">
                          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Customer Price</Label>
                          <p className="text-sm font-bold text-slate-900">₹{inquiry.priceStated?.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 text-center sm:text-left">
                          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Difference</Label>
                          <div className="flex flex-col">
                            <p className={cn("text-sm font-bold", isNegative ? "text-red-600" : "text-emerald-600")}>
                              {isNegative ? '-' : '+'}₹{Math.abs(diff).toLocaleString()}
                            </p>
                            <span className={cn("text-[9px] font-bold", isNegative ? "text-red-500" : "text-emerald-500")}>
                              {isNegative ? '' : '+'}{(inquiry.priceOffered > 0 ? (diff / inquiry.priceOffered) * 100 : 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Inquiry ID: <span className="text-slate-900">{inquiry.inquiryId || `INQ${inquiry._id.slice(-3).toUpperCase().padStart(3, '0')}`}</span></span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                              inquiry.status === 'Converted' 
                                ? "bg-purple-50 text-purple-700 border-purple-200" 
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            )}>
                              {inquiry.status === 'Converted' ? 'Converted' : 'Inquiry'}
                            </span>
                          </div>
                          <span className="font-medium">Date: <span className="text-slate-900">{inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMMM d, yyyy') : 'N/A'}</span></span>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "hover-elevate text-white",
                              inquiry.status === 'Converted' 
                                ? "bg-purple-600 border-purple-600 hover:bg-purple-700" 
                                : "bg-slate-600 border-slate-600 hover:bg-slate-700"
                            )}
                            onClick={() => updateStatusMutation.mutate({ 
                              id: inquiry._id, 
                              status: inquiry.status === 'Converted' ? 'Inquiry' : 'Converted' 
                            })}
                            disabled={updateStatusMutation.isPending}
                          >
                            {inquiry.status === 'Converted' ? 'Converted' : 'Mark Converted'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover-elevate bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                            onClick={() => { setSelectedInquiry(inquiry); setViewDialogOpen(true); }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover-elevate bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
                            onClick={() => handlePrint(inquiry)}
                          >
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover-elevate bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => handleSendWhatsApp(inquiry)}
                          >
                            Send
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover-elevate bg-red-600 border-red-600 text-white hover:bg-red-700"
                            onClick={() => { setInquiryToDelete(inquiry); setDeleteDialogOpen(true); }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hidden Receipt for PDF Generation */}
              <div id={`receipt-${inquiry._id}`} className="hidden print:block p-8 bg-white text-slate-900 min-h-[297mm] w-[210mm] mx-auto">
                <div className="flex flex-col items-center mb-8">
                  <img src={autogammaLogo} alt="Auto Gamma" className="h-16 mb-2" />
                  <h1 className="text-2xl font-bold uppercase tracking-widest">Quotation</h1>
                  <div className="h-1 w-24 bg-orange-500 mt-1"></div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-6">
                  <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase mb-2">Quotation For:</h2>
                    <p className="text-lg font-bold">{inquiry.name}</p>
                    <p className="text-sm text-slate-600">{inquiry.phone}</p>
                    <p className="text-sm text-slate-600">{inquiry.email || ''}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xs font-bold text-slate-500 uppercase mb-2">Quotation Details:</h2>
                    <p className="text-sm">Quotation #: <span className="font-bold">{inquiry.inquiryId || `INQ${inquiry._id.slice(-3).toUpperCase().padStart(3, '0')}`}</span></p>
                    <p className="text-sm">Date: <span className="font-bold">{inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMMM d, yyyy') : format(new Date(), 'MMMM d, yyyy')}</span></p>
                  </div>
                </div>

                <div className="mb-8">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-3 text-left text-xs font-bold uppercase text-slate-600">Service Description</th>
                        <th className="p-3 text-right text-xs font-bold uppercase text-slate-600">Vehicle Type</th>
                        <th className="p-3 text-right text-xs font-bold uppercase text-slate-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceDetails.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">
                            <p className="font-bold">{item.name}</p>
                          </td>
                          <td className="p-3 text-right text-slate-600">{item.carType}</td>
                          <td className="p-3 text-right font-bold">₹{item.servicePrice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50">
                        <td colSpan={2} className="p-4 text-right font-bold uppercase text-slate-600">Total Amount</td>
                        <td className="p-4 text-right text-xl font-bold text-orange-600">₹{inquiry.priceOffered.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {inquiry.notes && (
                  <div className="mb-8">
                    <h2 className="text-xs font-bold text-slate-500 uppercase mb-2">Important Notes:</h2>
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded text-sm text-slate-700 italic">
                      {inquiry.notes}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-12 border-t text-center space-y-2">
                  <p className="text-sm font-bold">Auto Gamma - Premium Auto Garage</p>
                  <p className="text-xs text-slate-500">This is a system-generated quotation. Valid for 7 days from the date of issue.</p>
                  <div className="flex justify-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest pt-4">
                    <span>Quality</span>
                    <span>•</span>
                    <span>Reliability</span>
                    <span>•</span>
                    <span>Trust</span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Inquiry</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader>
          <div className="flex justify-end gap-3"><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600" onClick={() => inquiryToDelete && deleteMutation.mutate(inquiryToDelete._id)}>Delete</AlertDialogAction></div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-bold">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-bold">{selectedInquiry.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-bold">{selectedInquiry.email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3 text-left">Service Name</th>
                      <th className="p-3 text-right">Service Price</th>
                      <th className="p-3 text-right">Customer Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInquiry.serviceDetailsJson ? (
                      JSON.parse(selectedInquiry.serviceDetailsJson).map((item: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-slate-50" data-testid={`row-service-detail-${index}`}>
                          <td className="p-3">
                            <div className="font-medium" data-testid={`text-servicename-detail-${index}`}>{item.name}</div>
                            <div className="text-xs text-slate-500" data-testid={`text-cartype-detail-${index}`}>{item.carType}</div>
                          </td>
                          <td className="p-3 text-right font-medium" data-testid={`text-serviceprice-detail-${index}`}>₹{item.servicePrice.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium" data-testid={`text-customerprice-detail-${index}`}>₹{(item.customerPrice || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-muted-foreground">No service details available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold">Our Price</p>
                  <p className="text-lg font-bold">₹{selectedInquiry.priceOffered?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold">Customer Price</p>
                  <p className="text-lg font-bold">₹{selectedInquiry.priceStated?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold">Difference</p>
                  <p className={cn("text-lg font-bold", ((selectedInquiry.priceStated || 0) - (selectedInquiry.priceOffered || 0)) < 0 ? "text-red-600" : "text-green-600")}>
                    {((selectedInquiry.priceStated || 0) - (selectedInquiry.priceOffered || 0)) < 0 ? '-' : '+'}₹{Math.abs((selectedInquiry.priceStated || 0) - (selectedInquiry.priceOffered || 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedInquiry.notes && (
                <div className="pt-4 border-t">
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-2">Notes</p>
                  <p className="text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-200" data-testid="text-notes-display">{selectedInquiry.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
