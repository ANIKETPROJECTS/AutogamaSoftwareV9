import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Car, Mail, User, X, Plus, Package, Users, ArrowLeft, ImagePlus, History as HistoryIcon, Calendar } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function CustomerDetails() {
  const [match, params] = useRoute("/customer-details/:id");
  const customerId = params?.id;
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list({ page: 1, limit: 1000 }),
  });

  const { data: jobsData } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list({ page: 1, limit: 1000 }),
  });

  const customers = customersData?.customers || [];
  const jobs = jobsData?.jobs || [];

  const customer = customers.find((c: any) => c._id === customerId);
  const jobHistory = jobs.filter((job: any) => job.customerId === customerId);

  if (!customer) {
    return (
      <div className="space-y-4 p-6">
        <Link href="/registered-customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
        <div className="text-center py-12 text-muted-foreground">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/registered-customers">
          <Button variant="ghost" size="sm" className="hover:bg-slate-100" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
      </div>

      {/* Customer Info Card */}
      <Card className="border-none shadow-md overflow-hidden bg-white max-w-5xl mx-auto" data-testid={`customer-details-${customerId}`}>
        <div className="h-2 bg-gradient-to-r from-red-500 to-red-600" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-100 overflow-hidden">
                  {customer.vehicles?.[0]?.image ? (
                    <img src={customer.vehicles[0].image} alt="Vehicle" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-red-600" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-4">
                    Active Customer
                  </Badge>
                </div>
              </div>
            </div>
            
            <Link href={`/customer-service?customerId=${customer._id}`}>
              <Button className="bg-red-600 hover:bg-red-700 shadow-sm h-9" data-testid={`button-create-service-${customer._id}`}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Service
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Contact Details */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                Contact Details
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                    <Phone className="w-3 h-3 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-slate-900">{customer.phone}</p>
                  </div>
                </div>
                {customer.email && (
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                    <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                      <Mail className="w-3 h-3 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Email</p>
                      <p className="text-sm font-semibold text-slate-900 break-all">{customer.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                  <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                    <Calendar className="w-3 h-3 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Registration Date</p>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {customer.registrationDate ? (
                        customer.registrationDate.includes('/') && customer.registrationDate.split('/')[0].length <= 2 ? 
                        (() => {
                          const parts = customer.registrationDate.split('/');
                          if (parts.length === 3) {
                            // If first part > 12, it's definitely DD/MM/YYYY. 
                            // If user says outer is DD/MM/YYYY (20/1/2026), and detailed is 1/20/2026
                            // We want DD/MM/YYYY
                            const day = parts[0].padStart(2, '0');
                            const month = parts[1].padStart(2, '0');
                            const year = parts[2];
                            // Check if it looks like MM/DD/YYYY to swap
                            if (parseInt(parts[0]) <= 12 && parseInt(parts[1]) > 12) {
                              return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`;
                            }
                            return `${day}/${month}/${year}`;
                          }
                          return customer.registrationDate;
                        })() : customer.registrationDate
                      ) : (customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB') : 'N/A')}
                    </p>
                  </div>
                </div>
                {customer.address && (
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                    <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                      <MapPin className="w-3 h-3 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Address</p>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {[
                          customer.address,
                          customer.city,
                          customer.district,
                          customer.state
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Fleet */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Car className="w-3.5 h-3.5" />
                Vehicles
              </h3>
              <div className="space-y-2">
                {customer.vehicles && customer.vehicles.length > 0 ? (
                  customer.vehicles.map((vehicle: any, i: number) => (
                    <div key={i} className="group bg-slate-50 hover:bg-red-50/50 rounded-xl p-3 border border-slate-100 hover:border-red-200 transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-full">
                            <p className="text-sm font-bold text-slate-900">{vehicle.make} {vehicle.model}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {vehicle.plateNumber && (
                                <Badge variant="secondary" className="bg-white text-[9px] h-4 py-0 px-1.5 font-mono border-slate-200 uppercase">
                                  {vehicle.plateNumber}
                                </Badge>
                              )}
                              {vehicle.year && <span className="text-[10px] text-slate-400 font-medium">{vehicle.year}</span>}
                            </div>
                            {vehicle.otherServices && vehicle.otherServices.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {vehicle.otherServices.some((s: any) => s.vehicleType?.toLowerCase() !== "accessory" && (s.category !== "Accessories" && !s.name?.toLowerCase().includes('(x'))) && (
                                  <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Services</p>
                                    <div className="flex flex-wrap gap-1">
                                      {vehicle.otherServices
                                        .filter((s: any) => s.vehicleType?.toLowerCase() !== "accessory" && (s.category !== "Accessories" && !s.name?.toLowerCase().includes('(x')))
                                        .map((service: any, idx: number) => (
                                          <Badge key={idx} variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-100 py-0 h-4">
                                            {service.name}
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                )}
                                {vehicle.otherServices.some((s: any) => s.vehicleType?.toLowerCase() === "accessory" || s.category === "Accessories" || s.name?.toLowerCase().includes('(x')) && (
                                  <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Accessories</p>
                                    <div className="flex flex-wrap gap-1">
                                      {vehicle.otherServices
                                        .filter((s: any) => s.vehicleType?.toLowerCase() === "accessory" || s.category === "Accessories" || s.name?.toLowerCase().includes('(x'))
                                        .map((acc: any, idx: number) => (
                                          <Badge key={idx} variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100 py-0 h-4">
                                            {acc.name}
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400">No vehicles registered</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Service Plan */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                Service Interest
              </h3>
              {customer.service ? (
                <div className="bg-red-50/30 rounded-xl p-4 border border-red-100 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                      <Package className="w-3 h-3 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Selected Services</p>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {customer.service?.split(' + ').filter((s: string) => {
                          const vehicle = customer.vehicles?.[0];
                          if (!vehicle?.otherServices) return true;
                          const normalizedS = s.replace(/\s*\(x\d+\)\s*/g, '').trim().toLowerCase();
                          const isAccessory = vehicle.otherServices.some((as: any) => 
                            (as.vehicleType?.toLowerCase() === "accessory" || as.category === "Accessories" || as.name?.toLowerCase().includes('(x')) && 
                            (normalizedS === as.name.replace(/\s*\(x\d+\)\s*/g, '').trim().toLowerCase())
                          );
                          return !isAccessory;
                        }).join(' + ') || 'None'}
                      </p>
                    </div>
                  </div>

                  {customer.vehicles?.[0]?.otherServices?.some((s: any) => s.vehicleType?.toLowerCase() === "accessory" || s.category === "Accessories" || s.name?.toLowerCase().includes('(x')) && (
                    <div className="flex items-start gap-3 pt-3 border-t border-red-200/60">
                      <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                        <Package className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Selected Accessories</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {customer.vehicles[0].otherServices
                            .filter((s: any) => s.vehicleType?.toLowerCase() === "accessory" || s.category === "Accessories" || s.name?.toLowerCase().includes('(x'))
                            .map((acc: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                                {acc.name}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {customer.serviceCost && (
                    <div className="pt-3 border-t border-red-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Total</span>
                      <span className="text-lg font-bold text-red-700">₹{customer.serviceCost.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400">No active service plan</p>
                </div>
              )}
            </div>

            {/* Referral Information */}
            {(customer.referralSource || customer.referrerName || customer.referrerPhone) && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Referral Information
                </h3>
                <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100 space-y-3">
                  {customer.referralSource && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Referral Source</p>
                        <p className="text-sm font-semibold text-slate-900">{customer.referralSource}</p>
                      </div>
                    </div>
                  )}

                  {customer.referrerName && (
                    <div className="flex items-start gap-3 pt-3 border-t border-blue-200/60">
                      <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                        <User className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Referred By</p>
                        <p className="text-sm font-semibold text-slate-900">{customer.referrerName}</p>
                      </div>
                    </div>
                  )}
                  
                  {customer.referrerPhone && (
                    <div className="flex items-start gap-3 pt-3 border-t border-blue-200/60">
                      <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                        <Phone className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Referrer Phone</p>
                        <p className="text-sm font-semibold text-slate-900">{customer.referrerPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* After Service Images */}
      {customer?.serviceImages && customer.serviceImages.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-slate-400" />
            After Service Images ({customer.serviceImages.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {customer.serviceImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 hover:ring-2 hover:ring-red-500 transition-all group"
              >
                <img src={img} alt={`Service Image ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service History */}
      {jobHistory.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-slate-400" />
            Service History ({jobHistory.length})
          </h2>
          <div className="grid gap-4">
            {jobHistory.map((job: any) => (
              <Card key={job._id} className="border-none shadow-md overflow-hidden bg-white max-w-5xl mx-auto w-full">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{job.serviceName || "Service Job"}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Car className="w-3 h-3" /> {job.vehicleName} ({job.plateNumber})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{new Date(job.createdAt).toLocaleDateString('en-IN')}</p>
                      <Badge variant="outline" className="text-[10px] mt-1 bg-slate-50">{job.stage?.toUpperCase()}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Technician</p>
                      <p className="text-sm font-semibold">{job.technicianName || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                      <p className="text-sm font-semibold">{job.stage || 'In Progress'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                      <p className="text-sm font-bold text-red-600">₹{job.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Job ID</p>
                      <p className="text-sm font-mono text-slate-500 truncate">{job._id.substring(0, 8)}...</p>
                    </div>
                  </div>

                  {job.serviceItems && job.serviceItems.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Items Included</p>
                      <div className="flex flex-wrap gap-2">
                        {job.serviceItems.map((item: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="bg-slate-50 text-[10px] border-slate-200">
                            {item.name} {item.price ? `(₹${item.price})` : ''}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          {selectedImage && (
            <div className="relative">
              <img src={selectedImage} alt="Service" className="w-full h-auto rounded-lg" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-black/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
