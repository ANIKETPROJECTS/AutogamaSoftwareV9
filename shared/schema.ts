import { z } from "zod";

export type JobStage = 'New Lead' | 'Inspection Done' | 'Work In Progress' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';
export type TechnicianStatus = 'Available' | 'Busy' | 'Off';
export type InventoryCategory = string;
export type CustomerStatus = 'Inquired' | 'Working' | 'Waiting' | 'Completed' | 'Cancelled';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque' | 'Other';

export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'];
export const CUSTOMER_STATUSES: CustomerStatus[] = ['Inquired', 'Working', 'Waiting', 'Completed', 'Cancelled'];

export const JOB_STAGES: JobStage[] = [
  'New Lead',
  'Inspection Done', 
  'Work In Progress',
  'Completed',
  'Cancelled'
];

export const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.string(),
  plateNumber: z.string().optional(),
  color: z.string().min(1),
  vin: z.string().optional()
});

export const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(['Inquired', 'Working', 'Waiting', 'Completed', 'Cancelled']).optional(),
  registrationDate: z.string().optional(),
  createdAt: z.date().optional(),
  vehicles: z.array(vehicleSchema).default([]),
  referralSource: z.string().optional(),
  referrerName: z.string().optional(),
  referrerPhone: z.string().optional()
});

export const serviceItemSchema = z.object({
  description: z.string().min(1),
  cost: z.number().min(0),
  type: z.enum(['part', 'labor']),
  assignedBusiness: z.enum(['Auto Gamma', 'AGNX']).default('Auto Gamma')
});

export const paymentSchema = z.object({
  amount: z.number().min(0),
  mode: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer']),
  notes: z.string().optional()
});

export const jobSchema = z.object({
  customerId: z.string(),
  vehicleIndex: z.number().min(0),
  customerName: z.string(),
  vehicleName: z.string(),
  plateNumber: z.string(),
  stage: z.enum(['New Lead', 'Inspection Done', 'Work In Progress', 'Completed', 'Cancelled']).default('New Lead'),
  technicianId: z.string().optional(),
  technicianName: z.string().optional(),
  notes: z.string().default(''),
  serviceItems: z.array(serviceItemSchema).default([]),
  totalAmount: z.number().default(0),
  paidAmount: z.number().default(0),
  paymentStatus: z.enum(['Pending', 'Partially Paid', 'Paid']).default('Pending')
});

export const warrantyOptionSchema = z.object({
  warranty: z.string().min(1),
  price: z.number().min(0)
});

export const serviceSchema = z.object({
  name: z.string().min(1),
  prices: z.record(z.string(), z.number()).default({}), // Record<vehicleType, price>
  warrantyOptions: z.record(z.string(), z.array(warrantyOptionSchema)).optional(), // Record<vehicleType, Array<{warranty, price}>>
  description: z.string().optional(),
  warranty: z.string().optional(),
  isWarrantyBased: z.boolean().default(false),
  isPpf: z.boolean().default(false),
  createdAt: z.date().optional()
});

export type Service = z.infer<typeof serviceSchema> & { _id: string };
export type InsertService = z.infer<typeof serviceSchema>;

export const rollSchema = z.object({
  name: z.string().min(1).default('Unnamed Roll'),
  meters: z.number().min(0),
  squareFeet: z.number().min(0),
  remaining_meters: z.number().min(0),
  remaining_sqft: z.number().min(0),
  status: z.enum(['Available', 'Finished']).default('Available'),
  createdAt: z.date().optional()
});

export const inventorySchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().min(0).default(0),
  unit: z.string().min(1),
  minStock: z.number().min(0).default(0),
  rolls: z.array(rollSchema).default([]),
  finishedRolls: z.array(rollSchema).default([]),
  price: z.number().optional(),
  isPpf: z.boolean().default(false)
});

export const ticketSchema = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  note: z.string().min(1),
  createdAt: z.date().optional()
});

export type Ticket = z.infer<typeof ticketSchema> & { _id: string };
export type InsertTicket = z.infer<typeof ticketSchema>;
