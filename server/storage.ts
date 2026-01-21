import { ICustomer, IJob, ITechnician, IInventoryItem, IAppointment, IWhatsAppTemplate, IInvoice, JobStage, IPriceInquiry, IAccessorySale, ITicket } from './models';
import { Customer, Job, Technician, Inventory, Appointment, WhatsAppTemplate, Invoice, PriceInquiry, AccessorySale, Ticket } from './models';
import mongoose from 'mongoose';

export interface IStorage {
  getCustomers(options?: { page?: number; limit?: number; search?: string }): Promise<{ customers: ICustomer[]; total: number }>;
  getCustomer(id: string): Promise<ICustomer | null>;
  searchCustomers(query: string): Promise<ICustomer[]>;
  createCustomer(data: Partial<ICustomer>): Promise<ICustomer>;
  updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer | null>;
  deleteCustomer(id: string): Promise<void>;
  addVehicleToCustomer(customerId: string, vehicle: any): Promise<ICustomer | null>;
  
  getJobs(options?: { page?: number; limit?: number; stage?: JobStage }): Promise<{ jobs: IJob[]; total: number }>;
  getJob(id: string): Promise<IJob | null>;
  getJobsByCustomer(customerId: string): Promise<IJob[]>;
  getJobsByStage(stage: JobStage): Promise<IJob[]>;
  getLastJobForVehicle(customerId: string, vehicleIndex: number): Promise<IJob | null>;
  getVehicleServicePreferences(customerId: string, vehicleIndex: number): Promise<any | null>;
  updateVehiclePreferences(customerId: string, vehicleIndex: number, preferences: any): Promise<ICustomer | null>;
  createJob(data: Partial<IJob>): Promise<IJob>;
  updateJob(id: string, data: Partial<IJob>): Promise<IJob | null>;
  updateJobStage(id: string, stage: JobStage): Promise<IJob | null>;
  deleteJob(id: string): Promise<void>;
  
  getTechnicians(): Promise<ITechnician[]>;
  getTechnician(id: string): Promise<ITechnician | null>;
  createTechnician(data: Partial<ITechnician>): Promise<ITechnician>;
  updateTechnician(id: string, data: Partial<ITechnician>): Promise<ITechnician | null>;
  deleteTechnician(id: string): Promise<void>;
  getTechnicianWorkload(): Promise<{ technician: ITechnician; jobCount: number }[]>;
  
  getInventory(): Promise<IInventoryItem[]>;
  getInventoryItem(id: string): Promise<IInventoryItem | null>;
  createInventoryItem(data: Partial<IInventoryItem>): Promise<IInventoryItem>;
  updateInventoryItem(id: string, data: Partial<IInventoryItem>): Promise<IInventoryItem | null>;
  deleteInventoryItem(id: string): Promise<void>;
  adjustInventory(id: string, quantity: number): Promise<IInventoryItem | null>;
  getLowStockItems(): Promise<IInventoryItem[]>;
  getAccessorySales(): Promise<IAccessorySale[]>;
  createAccessorySale(data: Partial<IAccessorySale>): Promise<IAccessorySale>;
  
  addRoll(inventoryId: string, roll: any): Promise<IInventoryItem | null>;
  deleteRoll(inventoryId: string, rollId: string): Promise<IInventoryItem | null>;
  deductRoll(inventoryId: string, rollId: string, metersUsed: number): Promise<IInventoryItem | null>;
  consumeRollsWithFIFO(inventoryId: string, quantityNeeded: number): Promise<{ success: boolean; consumedRolls: { rollId: string; quantityUsed: number }[] }>;
  
  getAppointments(options?: { page?: number; limit?: number; date?: Date }): Promise<{ appointments: IAppointment[]; total: number }>;
  getAppointmentsByDate(date: Date): Promise<IAppointment[]>;
  createAppointment(data: Partial<IAppointment>): Promise<IAppointment>;
  updateAppointment(id: string, data: Partial<IAppointment>): Promise<IAppointment | null>;
  deleteAppointment(id: string): Promise<void>;
  convertAppointmentToJob(appointmentId: string): Promise<IJob | null>;
  
  getWhatsAppTemplates(): Promise<IWhatsAppTemplate[]>;
  updateWhatsAppTemplate(stage: JobStage, message: string, isActive: boolean): Promise<IWhatsAppTemplate | null>;
  
  getPriceInquiries(options?: { page?: number; limit?: number }): Promise<{ inquiries: IPriceInquiry[]; total: number }>;
  createPriceInquiry(data: Partial<IPriceInquiry>): Promise<IPriceInquiry>;
  deletePriceInquiry(id: string): Promise<void>;
  
  getInvoices(): Promise<IInvoice[]>;
  getInvoice(id: string): Promise<IInvoice | null>;
  getInvoiceByJob(jobId: string): Promise<IInvoice | null>;
  createInvoice(data: Partial<IInvoice>): Promise<IInvoice>;
  generateInvoiceForJob(jobId: string, taxRate?: number, discount?: number, business?: string): Promise<IInvoice | null>;
  
  getDashboardStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    pendingPayments: number;
    totalRevenue: number;
    jobsByStage: { stage: string; count: number }[];
  }>;
  addPaymentToJobWithInvoiceSync(jobId: string, payment: any): Promise<IJob | null>;
  addMaterialsToJob(jobId: string, materials: { inventoryId: string; quantity: number }[]): Promise<IJob | null>;
  markInvoicePaid(invoiceId: string, paymentMode?: string, otherPaymentDetails?: string, paidDate?: Date): Promise<IInvoice | null>;
  deleteInvoice(id: string): Promise<void>;

  getTickets(): Promise<ITicket[]>;
  createTicket(data: Partial<ITicket>): Promise<ITicket>;
  updateTicket(id: string, data: Partial<ITicket>): Promise<ITicket | null>;
  deleteTicket(id: string): Promise<void>;
}

export class MongoStorage implements IStorage {
  public Inventory = Inventory;
  
  async getCustomers(options: { page?: number; limit?: number; search?: string } = {}): Promise<{ customers: ICustomer[]; total: number }> {
    const { page = 1, limit = 10, search } = options;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: regex },
          { phone: regex },
          { 'vehicles.plateNumber': regex }
        ]
      };
    }
    
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(query)
    ]);
    
    return { customers, total };
  }

  async getCustomer(id: string): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findById(id);
  }

  async searchCustomers(query: string): Promise<ICustomer[]> {
    const regex = new RegExp(query, 'i');
    return Customer.find({
      $or: [
        { name: regex },
        { phone: regex },
        { 'vehicles.plateNumber': regex }
      ]
    });
  }

  async createCustomer(data: Partial<ICustomer>): Promise<ICustomer> {
    try {
      if (!data.name) throw new Error("Name is required");
      if (!data.phone) throw new Error("Phone number is required");

      const existingCustomer = await Customer.findOne({ phone: data.phone });
      if (existingCustomer) {
        throw new Error(`Customer with mobile number ${data.phone} already exists`);
      }
      
      const highestCustomer = await Customer.findOne({ customerId: { $regex: '^cus' } })
        .sort({ customerId: -1 })
        .select('customerId');
      
      let nextNumber = 1;
      if (highestCustomer && highestCustomer.customerId) {
        const currentNumber = parseInt(highestCustomer.customerId.replace('cus', ''), 10);
        nextNumber = currentNumber + 1;
      }
      
      const customerId = `cus${String(nextNumber).padStart(3, '0')}`;
      const customer = new Customer({ 
        ...data, 
        customerId 
      });
      return await customer.save();
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create customer in database");
    }
  }

  async updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Job.deleteMany({ customerId: id });
    await PriceInquiry.deleteMany({ customerId: id });
    await Customer.findByIdAndDelete(id);
  }

  async addVehicleToCustomer(customerId: string, vehicle: any): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    return Customer.findByIdAndUpdate(
      customerId,
      { $push: { vehicles: vehicle } },
      { new: true }
    );
  }

  async addServiceImages(customerId: string, images: string[]): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    return Customer.findByIdAndUpdate(
      customerId,
      { serviceImages: images },
      { new: true }
    );
  }

  async getJobs(options: { page?: number; limit?: number; stage?: JobStage } = {}): Promise<{ jobs: IJob[]; total: number }> {
    const { page = 1, limit = 10, stage } = options;
    const skip = (page - 1) * limit;
    let query = stage ? { stage } : {};
    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query)
    ]);
    return { jobs, total };
  }

  async getJob(id: string): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findById(id);
  }

  async getJobsByCustomer(customerId: string): Promise<IJob[]> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return [];
    return Job.find({ customerId }).sort({ createdAt: -1 });
  }

  async getJobsByStage(stage: JobStage): Promise<IJob[]> {
    return Job.find({ stage }).sort({ updatedAt: -1 });
  }

  async getLastJobForVehicle(customerId: string, vehicleIndex: number): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    return Job.findOne({ customerId, vehicleIndex }).sort({ createdAt: -1 });
  }

  async getVehicleServicePreferences(customerId: string, vehicleIndex: number): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.vehicles[vehicleIndex]) return null;
    const vehicle = customer.vehicles[vehicleIndex];
    return {
      ppfCategory: vehicle.ppfCategory,
      ppfVehicleType: vehicle.ppfVehicleType,
      ppfWarranty: vehicle.ppfWarranty,
      ppfPrice: vehicle.ppfPrice,
      laborCost: vehicle.laborCost,
      otherServices: vehicle.otherServices,
      customerSuppliedMaterial: customer.customerSuppliedMaterial,
      customerMaterialDetails: customer.customerMaterialDetails
    };
  }

  async updateVehiclePreferences(customerId: string, vehicleIndex: number, preferences: any): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.vehicles[vehicleIndex]) return null;
    const vehicle = customer.vehicles[vehicleIndex];
    if (preferences.ppfCategory) vehicle.ppfCategory = preferences.ppfCategory;
    if (preferences.ppfVehicleType) vehicle.ppfVehicleType = preferences.ppfVehicleType;
    if (preferences.ppfWarranty) vehicle.ppfWarranty = preferences.ppfWarranty;
    if (typeof preferences.ppfPrice === 'number') vehicle.ppfPrice = preferences.ppfPrice;
    if (typeof preferences.laborCost === 'number') vehicle.laborCost = preferences.laborCost;
    if (Array.isArray(preferences.otherServices)) {
      vehicle.otherServices = preferences.otherServices;
      const serviceNames = preferences.otherServices
        .filter((s: any) => s.vehicleType?.toLowerCase() !== 'accessory' && !s.name?.toLowerCase().includes('(x'))
        .map((s: any) => s.name);
      if (preferences.ppfCategory) serviceNames.unshift(preferences.ppfCategory);
      customer.service = serviceNames.length > 0 ? serviceNames.join(' + ') : '';
    }
    await customer.save();
    return customer;
  }

  async createJob(data: Partial<IJob>): Promise<IJob> {
    const job = new Job(data);
    return job.save();
  }

  async updateJob(id: string, data: Partial<IJob>): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true });
  }

  async updateJobStage(id: string, stage: JobStage): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findByIdAndUpdate(id, { stage, updatedAt: new Date() }, { new: true });
  }

  async deleteJob(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Job.findByIdAndDelete(id);
  }

  async getTechnicians(): Promise<ITechnician[]> {
    return Technician.find().sort({ name: 1 });
  }

  async getTechnician(id: string): Promise<ITechnician | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Technician.findById(id);
  }

  async createTechnician(data: Partial<ITechnician>): Promise<ITechnician> {
    const technician = new Technician(data);
    return technician.save();
  }

  async updateTechnician(id: string, data: Partial<ITechnician>): Promise<ITechnician | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Technician.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteTechnician(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Technician.findByIdAndDelete(id);
  }

  async getTechnicianWorkload(): Promise<{ technician: ITechnician; jobCount: number }[]> {
    const technicians = await Technician.find();
    return Promise.all(
      technicians.map(async (tech) => {
        const jobCount = await Job.countDocuments({
          technicianId: tech._id,
          stage: { $nin: ['Completed', 'Cancelled'] }
        });
        return { technician: tech, jobCount };
      })
    );
  }

  async getInventory(): Promise<IInventoryItem[]> {
    return Inventory.find().sort({ category: 1, name: 1 });
  }

  async getInventoryItem(id: string): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findById(id);
  }

  async createInventoryItem(data: any): Promise<IInventoryItem> {
    const itemData = {
      ...data,
      isPpf: data.isPpf === true || data.isPpf === 'true'
    };
    const item = new Inventory(itemData);
    return item.save();
  }

  async updateInventoryItem(id: string, data: Partial<IInventoryItem>): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findByIdAndUpdate(id, data, { new: true });
  }

  async adjustInventory(id: string, quantity: number): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findByIdAndUpdate(id, { $inc: { quantity } }, { new: true });
  }

  async deleteInventoryItem(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Inventory.findByIdAndDelete(id);
  }

  async getLowStockItems(): Promise<IInventoryItem[]> {
    return Inventory.find({ $expr: { $lte: ['$quantity', '$minStock'] } });
  }

  async getAccessorySales(): Promise<IAccessorySale[]> {
    return AccessorySale.find().sort({ date: -1 });
  }

  async createAccessorySale(data: Partial<IAccessorySale>): Promise<IAccessorySale> {
    const sale = new AccessorySale(data);
    return sale.save();
  }

  async addRoll(inventoryId: string, roll: any): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
      // If it's a temporary ID for a new PPF category, we need to create the item first
      if (inventoryId.startsWith('temp-')) {
        const category = inventoryId.replace('temp-', '');
        const newItem = await this.createInventoryItem({
          name: category,
          category: category as any,
          quantity: 0,
          unit: 'Square Feet',
          minStock: 5,
          isPpf: true,
          rolls: []
        });
        inventoryId = newItem._id.toString();
      } else {
        return null;
      }
    }
    const newRoll = {
      _id: new mongoose.Types.ObjectId(),
      name: roll.name,
      meters: roll.meters,
      squareFeet: roll.squareFeet,
      remaining_meters: roll.meters,
      remaining_sqft: roll.squareFeet,
      status: 'Available' as const,
      unit: (roll.unit === 'Square Feet' || roll.unit === 'Meters' || roll.unit === 'Square KM') ? roll.unit : 'Meters',
      createdAt: new Date()
    };
    const item = await Inventory.findById(inventoryId);
    if (!item) return null;
    item.rolls.push(newRoll);
    const qtyToAdd = roll.unit === 'Square Feet' ? roll.squareFeet : roll.meters;
    item.quantity = (item.quantity || 0) + qtyToAdd;
    if (!item.history) item.history = [];
    item.history.push({
      date: new Date(),
      type: 'Stock In',
      description: `New Roll Added: ${roll.name}`,
      amount: qtyToAdd,
      remainingStock: item.quantity
    });
    return await item.save();
  }

  async deleteRoll(inventoryId: string, rollId: string): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) return null;
    const item = await Inventory.findById(inventoryId);
    if (!item) return null;
    const rollIndex = item.rolls.findIndex(r => r._id?.toString() === rollId);
    if (rollIndex !== -1) {
      item.rolls.splice(rollIndex, 1);
      item.quantity = item.rolls.reduce((sum, r) => sum + (r.remaining_sqft || 0), 0);
      return await item.save();
    }
    return item;
  }

  async consumeRollsWithFIFO(inventoryId: string, quantityNeeded: number): Promise<{ success: boolean; consumedRolls: { rollId: string; quantityUsed: number }[] }> {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) return { success: false, consumedRolls: [] };
    const item = await Inventory.findById(inventoryId);
    if (!item) return { success: false, consumedRolls: [] };
    if (!item.rolls || item.rolls.length === 0) return { success: false, consumedRolls: [] };
    const consumedRolls: { rollId: string; quantityUsed: number }[] = [];
    let remaining = quantityNeeded;
    const sortedRolls = [...item.rolls].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    for (const roll of sortedRolls) {
      if (remaining <= 0) break;
      if (!roll._id || roll.status === 'Finished') continue;
      let availableQty = roll.remaining_sqft || 0;
      if (availableQty <= 0) continue;
      const toConsume = Math.min(remaining, availableQty);
      consumedRolls.push({ rollId: roll._id.toString(), quantityUsed: toConsume });
      remaining = Number((remaining - toConsume).toFixed(2));
      roll.remaining_sqft = Number((Math.max(0, (roll.remaining_sqft || 0) - toConsume)).toFixed(2));
      if (roll.squareFeet > 0 && roll.meters > 0) {
        roll.remaining_meters = Number(((roll.remaining_sqft / roll.squareFeet) * roll.meters).toFixed(2));
      }
      if (roll.remaining_sqft <= 0.01) {
        roll.status = 'Finished';
        (roll as any).finishedAt = new Date();
        item.finishedRolls.push(roll);
        if (!item.history) item.history = [];
        item.history.push({
          date: new Date(),
          type: 'Stock Out',
          description: `Roll Finished: ${roll.name}`,
          amount: -(roll.squareFeet || 0),
          remainingStock: 0
        });
      }
    }
    item.rolls = item.rolls.filter(r => r.status !== 'Finished');
    if (remaining > 0.01) return { success: false, consumedRolls: [] };
    item.quantity = Number((item.rolls.reduce((sum, r) => sum + (r.remaining_sqft || 0), 0)).toFixed(2));
    if (item.history && item.history.length > 0) {
      const lastHistory = item.history[item.history.length - 1];
      if (lastHistory.description.startsWith('Roll Finished')) lastHistory.remainingStock = item.quantity;
    }
    await item.save();
    return { success: true, consumedRolls };
  }

  async deductRoll(inventoryId: string, rollId: string, metersUsed: number): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) return null;
    const item = await Inventory.findById(inventoryId);
    if (!item) return null;
    const rollIndex = item.rolls.findIndex(r => r._id?.toString() === rollId);
    if (rollIndex === -1) return null;
    const roll = item.rolls[rollIndex];
    if (roll.remaining_sqft && roll.remaining_sqft > 0) {
      roll.remaining_sqft = Math.max(0, roll.remaining_sqft - metersUsed);
      if (roll.squareFeet > 0 && roll.meters > 0) roll.remaining_meters = (roll.remaining_sqft / roll.squareFeet) * roll.meters;
    } else {
      roll.remaining_meters = Math.max(0, roll.remaining_meters - metersUsed);
      if (roll.meters > 0) roll.remaining_sqft = (roll.remaining_meters / roll.meters) * roll.squareFeet;
    }
    if ((roll.remaining_meters || 0) <= 0.01 && (roll.remaining_sqft || 0) <= 0.01) {
      const rollObj = (roll as any).toObject ? (roll as any).toObject() : { ...roll };
      const finishedRoll = { ...rollObj, remaining_meters: 0, remaining_sqft: 0, status: 'Finished', finishedAt: new Date() };
      await Inventory.findByIdAndUpdate(item._id, { $push: { finishedRolls: finishedRoll }, $pull: { rolls: { _id: roll._id } } });
      return Inventory.findById(item._id);
    }
    await item.save();
    return item;
  }

  async getAppointments(options: { page?: number; limit?: number; date?: Date } = {}): Promise<{ appointments: IAppointment[]; total: number }> {
    const { page = 1, limit = 10, date } = options;
    const skip = (page - 1) * limit;
    let query = {};
    if (date) {
      const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
      query = { date: { $gte: startOfDay, $lte: endOfDay } };
    }
    const [appointments, total] = await Promise.all([
      Appointment.find(query).sort({ date: 1, time: 1 }).skip(skip).limit(limit),
      Appointment.countDocuments(query)
    ]);
    return { appointments, total };
  }

  async getAppointmentsByDate(date: Date): Promise<IAppointment[]> {
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
    return Appointment.find({ date: { $gte: startOfDay, $lte: endOfDay } }).sort({ time: 1 });
  }

  async createAppointment(data: Partial<IAppointment>): Promise<IAppointment> {
    const appointment = new Appointment(data);
    return appointment.save();
  }

  async updateAppointment(id: string, data: Partial<IAppointment>): Promise<IAppointment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Appointment.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteAppointment(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Appointment.findByIdAndDelete(id);
  }

  async convertAppointmentToJob(appointmentId: string): Promise<IJob | null> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return null;
    const jobData: Partial<IJob> = {
      customerId: appointment.customerId,
      vehicleName: appointment.vehicleInfo,
      stage: 'New Lead',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const job = new Job(jobData);
    await job.save();
    appointment.status = 'Done';
    await appointment.save();
    return job;
  }

  async getWhatsAppTemplates(): Promise<IWhatsAppTemplate[]> {
    return WhatsAppTemplate.find();
  }

  async updateWhatsAppTemplate(stage: JobStage, message: string, isActive: boolean): Promise<IWhatsAppTemplate | null> {
    return WhatsAppTemplate.findOneAndUpdate({ stage }, { message, isActive }, { new: true, upsert: true });
  }

  async getPriceInquiries(options: { page?: number; limit?: number } = {}): Promise<{ inquiries: IPriceInquiry[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    const [inquiries, total] = await Promise.all([
      PriceInquiry.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      PriceInquiry.countDocuments()
    ]);
    return { inquiries, total };
  }

  async createPriceInquiry(data: Partial<IPriceInquiry>): Promise<IPriceInquiry> {
    const inquiry = new PriceInquiry(data);
    return inquiry.save();
  }

  async deletePriceInquiry(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await PriceInquiry.findByIdAndDelete(id);
  }

  async getInvoices(): Promise<IInvoice[]> {
    return Invoice.find().sort({ createdAt: -1 });
  }

  async getInvoice(id: string): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Invoice.findById(id);
  }

  async getInvoiceByJob(jobId: string): Promise<IInvoice | null> {
    return Invoice.findOne({ jobId }).sort({ createdAt: -1 });
  }

  async createInvoice(data: Partial<IInvoice>): Promise<IInvoice> {
    const invoice = new Invoice(data);
    return invoice.save();
  }

  async generateInvoiceForJob(jobId: string, taxRate: number = 18, discount: number = 0, business: string = 'Auto Gamma'): Promise<IInvoice | null> {
    const job = await Job.findById(jobId);
    if (!job) return null;
    const businessItems = job.serviceItems.filter((item: any) => (item.assignedBusiness || 'Auto Gamma') === business);
    if (businessItems.length === 0) return null;
    const subtotal = businessItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
    const itemDiscounts = businessItems.reduce((sum: number, item: any) => sum + (item.discount || 0), 0);
    const taxableAmount = Math.max(0, subtotal - itemDiscounts - discount);
    const taxAmount = job.requiresGST ? (taxableAmount * taxRate) / 100 : 0;
    const totalAmount = taxableAmount + taxAmount;
    const lastInvoice = await Invoice.findOne({ business }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const prefix = business === 'Auto Gamma' ? 'AG' : 'OT';
    const invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    
    // Fetch customer details for the invoice
    const customer = await Customer.findById(job.customerId);
    if (!customer) return null;

    // Map service items to invoice items
    const invoiceItems = businessItems.map((item: any) => {
      const itemDiscount = item.discount ?? item.discountAmount ?? 0;
      return {
        description: item.name,
        quantity: 1,
        unitPrice: item.price,
        total: item.price - itemDiscount,
        type: 'service' as const,
        discount: itemDiscount
      };
    });

    const invoice = new Invoice({ 
      jobId, 
      customerId: job.customerId, 
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAddress: customer.address,
      vehicleName: job.vehicleName,
      plateNumber: job.plateNumber,
      business, 
      invoiceNumber, 
      items: invoiceItems, 
      subtotal, 
      discount, 
      taxRate, 
      taxAmount, 
      totalAmount, 
      paymentStatus: 'Pending', 
      createdAt: new Date() 
    });
    return invoice.save();
  }

  async getDashboardStats(): Promise<{ totalJobs: number; activeJobs: number; completedJobs: number; pendingPayments: number; totalRevenue: number; jobsByStage: { stage: string; count: number }[] }> {
    const [totalJobs, activeJobs, completedJobs, jobsByStageRaw, totalRevenueRaw] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ stage: { $nin: ['Completed', 'Cancelled'] } }),
      Job.countDocuments({ stage: 'Completed' }),
      Job.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
      Job.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount' } } }])
    ]);
    const jobsByStage = jobsByStageRaw.map(item => ({ stage: item._id, count: item.count }));
    const totalRevenue = totalRevenueRaw[0]?.total || 0;
    return { totalJobs, activeJobs, completedJobs, pendingPayments: 0, totalRevenue, jobsByStage };
  }

  async addPaymentToJobWithInvoiceSync(jobId: string, payment: any): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
    const job = await Job.findById(jobId);
    if (!job) return null;
    job.payments.push({ ...payment, date: new Date() });
    job.paidAmount = (job.paidAmount || 0) + payment.amount;
    const invoice = await Invoice.findOne({ jobId });
    if (invoice) {
      const totalPaid = job.paidAmount;
      if (totalPaid >= invoice.totalAmount) invoice.paymentStatus = 'Paid';
      else if (totalPaid > 0) invoice.paymentStatus = 'Partially Paid';
      await invoice.save();
    }
    return job.save();
  }

  async addMaterialsToJob(jobId: string, materials: { inventoryId: string; quantity: number }[]): Promise<IJob | null> {
    const job = await Job.findById(jobId);
    if (!job) return null;
    for (const mat of materials) {
      const inventory = await Inventory.findById(mat.inventoryId);
      if (inventory) {
        job.materials.push({
          inventoryId: inventory._id,
          name: inventory.name,
          quantity: mat.quantity,
          cost: (inventory.price || 0) * mat.quantity
        });
      }
    }
    return job.save();
  }

  async markInvoicePaid(invoiceId: string, paymentMode?: string, otherPaymentDetails?: string, paidDate?: Date): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) return null;
    
    // First find the invoice to get its total amount
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return null;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { 
        paymentStatus: 'Paid',
        paidAmount: invoice.totalAmount,
        paymentMode,
        otherPaymentDetails,
        paidDate: paidDate || new Date()
      },
      { new: true }
    );

    // Also update the associated job if it exists
    if (updatedInvoice && updatedInvoice.jobId) {
      await Job.findByIdAndUpdate(updatedInvoice.jobId, {
        paymentStatus: 'Paid',
        paidAmount: updatedInvoice.totalAmount,
        updatedAt: new Date()
      });
    }

    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Invoice.findByIdAndDelete(id);
  }

  async getTickets(): Promise<ITicket[]> {
    return Ticket.find().sort({ createdAt: -1 });
  }

  async createTicket(data: Partial<ITicket>): Promise<ITicket> {
    const ticket = new Ticket(data);
    return ticket.save();
  }

  async updateTicket(id: string, data: Partial<ITicket>): Promise<ITicket | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Ticket.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteTicket(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Ticket.findByIdAndDelete(id);
  }
}

export const storage = new MongoStorage();
