import { queryClient } from './queryClient';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

export const api = {
  customers: {
    list: (options?: { search?: string; page?: number; limit?: number }) => 
      request<{ customers: any[]; total: number }>(`/customers?${new URLSearchParams({
        ...(options?.search && { search: options.search }),
        ...(options?.page && { page: options.page.toString() }),
        ...(options?.limit && { limit: options.limit.toString() }),
      })}`),
    get: (id: string) => request<any>(`/customers/${id}`),
    create: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/customers/${id}`, { method: 'DELETE' }),
    addVehicle: (id: string, vehicle: any) => request<any>(`/customers/${id}/vehicles`, { method: 'POST', body: JSON.stringify(vehicle) }),
    addServiceImages: (id: string, images: string[]) => request<any>(`/customers/${id}/service-images`, { method: 'POST', body: JSON.stringify({ images }) }),
    getJobs: (id: string) => request<any[]>(`/customers/${id}/jobs`),
    getLastService: (customerId: string, vehicleIndex: number) => request<any>(`/customers/${customerId}/vehicles/${vehicleIndex}/last-service`),
    getVehiclePreferences: (customerId: string, vehicleIndex: number) => request<any>(`/customers/${customerId}/vehicles/${vehicleIndex}/preferences`),
  },
  
  jobs: {
    list: (options?: { stage?: string; search?: string; page?: number; limit?: number }) => 
      request<{ jobs: any[]; total: number }>(`/jobs?${new URLSearchParams({
        ...(options?.stage && { stage: options.stage }),
        ...(options?.search && { search: options.search }),
        ...(options?.page && { page: options.page.toString() }),
        ...(options?.limit && { limit: options.limit.toString() }),
      })}`),
    get: (id: string) => request<any>(`/jobs/${id}`),
    create: (data: any) => request<any>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStage: (id: string, stage: string, serviceItems?: any[], cancellationReason?: string, requiresGST?: boolean, discount?: number) => 
      request<any>(`/jobs/${id}/stage`, { 
        method: 'PATCH', 
        body: JSON.stringify({ stage, serviceItems, cancellationReason, requiresGST, discount }) 
      }),
    addPayment: (id: string, payment: any) => request<any>(`/jobs/${id}/payment`, { method: 'POST', body: JSON.stringify(payment) }),
    addMaterials: (id: string, materials: { inventoryId: string; quantity: number }[]) => 
      request<any>(`/jobs/${id}/materials`, { method: 'POST', body: JSON.stringify({ materials }) }),
    getInvoice: (id: string) => request<any>(`/jobs/${id}/invoice`),
    generateInvoice: (id: string, taxRate?: number, discount?: number) => 
      request<any>(`/jobs/${id}/invoice`, { method: 'POST', body: JSON.stringify({ taxRate: taxRate ?? 18, discount: discount ?? 0 }) }),
    createManualInvoice: (data: any) => request<any>('/invoices/manual', { method: 'POST', body: JSON.stringify(data) }),
  },
  
  invoices: {
    list: () => request<any[]>('/invoices'),
    get: (id: string) => request<any>(`/invoices/${id}`),
    markPaid: (id: string, paymentMode?: string, otherPaymentDetails?: string, paidDate?: Date) => 
      request<any>(`/invoices/${id}/pay`, { method: 'PATCH', body: JSON.stringify({ paymentMode, otherPaymentDetails, paidDate }) }),
  },
  
  technicians: {
    list: () => request<any[]>('/technicians'),
    workload: () => request<any[]>('/technicians/workload'),
    create: (data: any) => request<any>('/technicians', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/technicians/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/technicians/${id}`, { method: 'DELETE' }),
  },
  
  inventory: {
    list: () => request<any[]>('/inventory'),
    lowStock: () => request<any[]>('/inventory/low-stock'),
    create: (data: any) => request<any>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/inventory/${id}`, { method: 'DELETE' }),
    adjust: (id: string, quantity: number) => request<any>(`/inventory/${id}/adjust`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    addRoll: (id: string, roll: any) => request<any>(`/inventory/${id}/rolls`, { method: 'POST', body: JSON.stringify(roll) }),
    deleteRoll: (id: string, rollId: string) => request<any>(`/inventory/${id}/rolls/${rollId}`, { method: 'DELETE' }),
    deductRoll: (id: string, rollId: string, metersUsed: number) => request<any>(`/inventory/${id}/rolls/${rollId}/deduct`, { method: 'PATCH', body: JSON.stringify({ metersUsed }) }),
    consumeRolls: (id: string, quantity: number) => request<any>(`/inventory/${id}/consume`, { method: 'POST', body: JSON.stringify({ quantity }) }),
    consumeRollsWithFIFO: (id: string, quantity: number) => request<any>(`/inventory/${id}/consume-fifo`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  },

  services: {
    list: () => request<any[]>('/services'),
    create: (data: any) => request<any>('/services', { method: 'POST', body: JSON.stringify(data) }),
  },
  
  appointments: {
    list: (options?: { date?: string; page?: number; limit?: number }) => 
      request<{ appointments: any[]; total: number }>(`/appointments?${new URLSearchParams({
        ...(options?.date && { date: options.date }),
        ...(options?.page && { page: options.page.toString() }),
        ...(options?.limit && { limit: options.limit.toString() }),
      })}`),
    create: (data: any) => request<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/appointments/${id}`, { method: 'DELETE' }),
    convert: (id: string) => request<any>(`/appointments/${id}/convert`, { method: 'POST' }),
  },

  priceInquiries: {
    list: (options?: { page?: number; limit?: number }) => 
      request<{ inquiries: any[]; total: number }>(`/price-inquiries?${new URLSearchParams({
        ...(options?.page && { page: options.page.toString() }),
        ...(options?.limit && { limit: options.limit.toString() }),
      })}`),
    create: (data: any) => request<any>('/price-inquiries', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/price-inquiries/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string) => request<any>(`/price-inquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  
  whatsapp: {
    templates: () => request<any[]>('/whatsapp/templates'),
    updateTemplate: (stage: string, message: string, isActive: boolean) => 
      request<any>(`/whatsapp/templates/${encodeURIComponent(stage)}`, { method: 'PATCH', body: JSON.stringify({ message, isActive }) }),
  },
  
  dashboard: {
    stats: () => request<any>('/dashboard'),
  },
  
  settings: {
    updateAdmin: (data: { username: string; password?: string }) => 
      request<any>('/settings/admin', { method: 'PATCH', body: JSON.stringify(data) }),
  },
};

export { queryClient };
