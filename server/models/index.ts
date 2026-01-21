import mongoose, { Schema, Document } from 'mongoose';

export type JobStage = 'New Lead' | 'Inspection Done' | 'Work In Progress' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';
export type TechnicianStatus = 'Available' | 'Busy' | 'Off';
export type InventoryCategory = 'Elite' | 'Garware Plus' | 'Garware Premium' | 'Garware Matt' | 'Accessories';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

export interface IOtherService {
  name: string;
  vehicleType: string;
  price: number;
}

export interface IVehicle {
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  color: string;
  vin?: string;
  image?: string;
  ppfCategory?: string;
  ppfVehicleType?: string;
  ppfWarranty?: string;
  ppfPrice?: number;
  laborCost?: number;
  otherServices?: IOtherService[];
}

export type CustomerStatus = 'Inquired' | 'Working' | 'Waiting' | 'Completed' | 'Cancelled';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  registrationDate?: string;
  customerId: string;
  status: CustomerStatus;
  referralSource?: string;
  service?: string;
  serviceCost?: number;
  vehicles: IVehicle[];
  requiresGST?: boolean;
  serviceImages?: string[];
  customerSuppliedMaterial?: boolean;
  customerMaterialDetails?: string;
  referrerName?: string;
  referrerPhone?: string;
  createdAt: Date;
}

export interface IServiceItem {
  name: string;
  price: number;
  category?: string;
  vehicleType?: string;
  warranty?: string;
  discount?: number;
  discountPercentage?: number;
  rollId?: mongoose.Types.ObjectId;
  rollName?: string;
  sizeUsed?: string;
  assignedBusiness?: 'Auto Gamma' | 'AGNX';
}

export interface IPayment {
  amount: number;
  mode: PaymentMode;
  date: Date;
  otherPaymentDetails?: string;
  notes?: string;
}

export interface IJob extends Document {
  customerId: mongoose.Types.ObjectId;
  vehicleIndex: number;
  customerName: string;
  vehicleName: string;
  plateNumber: string;
  stage: JobStage;
  technicianId?: mongoose.Types.ObjectId;
  technicianName?: string;
  notes: string;
  cancellationReason?: string;
  serviceCost: number;
  laborCost: number;
  serviceItems: IServiceItem[];
  materials: { inventoryId: mongoose.Types.ObjectId; name: string; quantity: number; cost: number }[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  payments: IPayment[];
  requiresGST?: boolean;
  checklist: { item: string; done: boolean }[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITechnician extends Document {
  name: string;
  specialty: string;
  phone?: string;
  status: TechnicianStatus;
  createdAt: Date;
}

export interface IRoll {
  _id?: mongoose.Types.ObjectId;
  name: string;
  meters: number;
  squareFeet: number;
  remaining_meters: number;
  remaining_sqft: number;
  status?: 'Available' | 'Finished';
  unit?: 'Meters' | 'Square KM' | 'Square Feet';
  createdAt?: Date;
  finishedAt?: Date;
}

export interface IInventoryHistory {
  date: Date;
  type: 'Stock In' | 'Stock Out';
  description: string;
  amount: number;
  remainingStock: number;
}

export interface IInventoryItem extends Document {
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minStock: number;
  rolls: IRoll[];
  finishedRolls: IRoll[];
  history: IInventoryHistory[];
  price?: number;
  isPpf?: boolean;
  createdAt: Date;
}

export interface IAppointment extends Document {
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleInfo: string;
  serviceType: string;
  date: Date;
  time: string;
  notes?: string;
  status: 'Scheduled' | 'Done' | 'Cancelled';
  cancelReason?: string;
  createdAt: Date;
}

export interface IWhatsAppTemplate extends Document {
  stage: JobStage;
  message: string;
  isActive: boolean;
}

export interface IPriceInquiry extends Document {
  inquiryId?: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  serviceDetailsJson?: string;
  priceOffered: number;
  priceStated: number;
  notes?: string;
  createdAt: Date;
}

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'service' | 'material' | 'ppf' | 'accessory';
  discount?: number;
  discountPercentage?: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  jobId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  vehicleName: string;
  plateNumber: string;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode?: string;
  paidDate?: Date;
  otherPaymentDetails?: string;
  notes?: string;
  business: string;
  createdAt: Date;
}

const OtherServiceSchema = new Schema<IOtherService>({
  name: { type: String },
  vehicleType: { type: String },
  price: { type: Number }
});

const VehicleSchema = new Schema<IVehicle>({
  make: { type: String, default: '' },
  model: { type: String, default: '' },
  year: { type: String, default: '' },
  plateNumber: { type: String, default: '' },
  color: { type: String, default: '' },
  vin: { type: String },
  image: { type: String },
  ppfCategory: { type: String },
  ppfVehicleType: { type: String },
  ppfWarranty: { type: String },
  ppfPrice: { type: Number },
  laborCost: { type: Number },
  otherServices: [OtherServiceSchema]
});

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  district: { type: String },
  state: { type: String },
  registrationDate: { type: String },
  referralSource: { type: String },
  customerId: { type: String, unique: true, required: true },
  status: { type: String, enum: ['Inquired', 'Working', 'Waiting', 'Completed', 'Cancelled'], default: 'Inquired' },
  service: { type: String },
  serviceCost: { type: Number, default: 0 },
  vehicles: [VehicleSchema],
  requiresGST: { type: Boolean, default: false },
  serviceImages: [{ type: String }],
  customerSuppliedMaterial: { type: Boolean, default: false },
  customerMaterialDetails: { type: String },
  referrerName: { type: String },
  referrerPhone: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ServiceItemSchema = new Schema<IServiceItem>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String },
  vehicleType: { type: String },
  warranty: { type: String },
  discount: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  rollId: { type: Schema.Types.ObjectId, ref: 'Inventory.rolls' },
  rollName: { type: String },
  sizeUsed: { type: String },
  assignedBusiness: { type: String, enum: ['Auto Gamma', 'AGNX'], default: 'Auto Gamma' }
});

const PaymentSchema = new Schema<IPayment>({
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'], required: true },
  date: { type: Date, default: Date.now },
  otherPaymentDetails: { type: String },
  notes: { type: String }
});

const JobSchema = new Schema<IJob>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleIndex: { type: Number, required: true },
  customerName: { type: String, required: true },
  vehicleName: { type: String, required: true },
  plateNumber: { type: String, required: true },
  stage: { 
    type: String, 
    enum: ['New Lead', 'Inspection Done', 'Work In Progress', 'Completed', 'Cancelled'],
    default: 'New Lead'
  },
  technicianId: { type: Schema.Types.ObjectId, ref: 'Technician' },
  technicianName: { type: String },
  notes: { type: String, default: '' },
  cancellationReason: { type: String },
  serviceCost: { type: Number, default: 0, required: true },
  laborCost: { type: Number, default: 0, required: true },
  serviceItems: [ServiceItemSchema],
  materials: [{
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
    name: String,
    quantity: Number,
    cost: Number,
    rollDetails: [{
      rollId: String,
      rollName: String,
      quantityUsed: Number
    }]
  }],
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Partially Paid', 'Paid'], default: 'Pending' },
  payments: [PaymentSchema],
  requiresGST: { type: Boolean, default: false },
  checklist: [{ item: String, done: Boolean }],
  images: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TechnicianSchema = new Schema<ITechnician>({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  phone: { type: String },
  status: { type: String, enum: ['Available', 'Busy', 'Off'], default: 'Available' },
  createdAt: { type: Date, default: Date.now }
});

const RollSchema = new Schema<IRoll>({
  name: { type: String, required: true, default: 'Unnamed Roll' },
  meters: { type: Number, required: true, default: 0 },
  squareFeet: { type: Number, required: true, default: 0 },
  remaining_meters: { type: Number, required: true, default: 0 },
  remaining_sqft: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Available', 'Finished'], default: 'Available' },
  unit: { type: String, enum: ['Meters', 'Square KM', 'Square Feet'], default: 'Meters' },
  finishedAt: { type: Date }
});

const InventorySchema = new Schema<IInventoryItem>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  minStock: { type: Number, required: true, default: 0 },
  rolls: [RollSchema],
  finishedRolls: [RollSchema],
  history: [{
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['Stock In', 'Stock Out'] },
    description: String,
    amount: Number,
    remainingStock: Number
  }],
  price: { type: Number },
  isPpf: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export interface IAccessorySale extends Document {
  category: string;
  accessoryName: string;
  price: number;
  quantity: number;
  total: number;
  date: Date;
}

const AccessorySaleSchema = new Schema<IAccessorySale>({
  category: { type: String, required: true },
  accessoryName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export const AccessorySale = mongoose.model<IAccessorySale>('AccessorySale', AccessorySaleSchema);

const AppointmentSchema = new Schema<IAppointment>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  vehicleInfo: { type: String, required: true },
  serviceType: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ['Scheduled', 'Done', 'Cancelled'], default: 'Scheduled' },
  cancelReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const WhatsAppTemplateSchema = new Schema<IWhatsAppTemplate>({
  stage: { 
    type: String, 
    enum: ['New Lead', 'Inspection Done', 'Work In Progress', 'Ready for Delivery', 'Completed', 'Cancelled'],
    required: true,
    unique: true
  },
  message: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

const PriceInquirySchema = new Schema<IPriceInquiry>({
  inquiryId: { type: String },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  service: { type: String, required: true },
  serviceDetailsJson: { type: String },
  priceOffered: { type: Number, required: true },
  priceStated: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  type: { type: String, enum: ['service', 'material', 'ppf', 'accessory'], required: true },
  discount: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 }
});

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  customerAddress: { type: String },
  vehicleName: { type: String, required: true },
  plateNumber: { type: String, default: '' },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Partially Paid', 'Paid'], default: 'Pending' },
  paymentMode: { type: String },
  paidDate: { type: Date },
  otherPaymentDetails: { type: String },
  notes: { type: String },
  business: { type: String, default: 'Auto Gamma' },
  createdAt: { type: Date, default: Date.now }
});

// Admin Schema
export interface IAdmin extends Document {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  note: string;
  createdAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  note: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

export interface IPpfCategory extends Document {
  name: string;
  createdAt: Date;
}

const PpfCategorySchema = new Schema<IPpfCategory>({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export const PpfCategory = mongoose.model<IPpfCategory>('PpfCategory', PpfCategorySchema);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Job = mongoose.model<IJob>('Job', JobSchema);
export const Technician = mongoose.model<ITechnician>('Technician', TechnicianSchema);
export const Inventory = mongoose.model<IInventoryItem>('Inventory', InventorySchema);
export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export const WhatsAppTemplate = mongoose.model<IWhatsAppTemplate>('WhatsAppTemplate', WhatsAppTemplateSchema);
export const PriceInquiry = mongoose.model<IPriceInquiry>('PriceInquiry', PriceInquirySchema);
export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);

export const Service = mongoose.model('Service', new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  prices: { type: Map, of: Number, default: {} },
  description: String,
  isPpf: { type: Boolean, default: false },
  isWarrantyBased: { type: Boolean, default: false },
  warrantyOptions: { type: Map, of: [Schema.Types.Mixed], default: {} },
  createdAt: { type: Date, default: Date.now }
}));

const settingsSchema = new mongoose.Schema({
  customVehicleTypes: { type: [String], default: [] }
});

export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
