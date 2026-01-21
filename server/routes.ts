import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendStageUpdateMessage } from "./whatsapp";
import { Customer, Admin, Invoice, PpfCategory, Service, Ticket, Settings } from "./models";
import type { JobStage, CustomerStatus } from "./models";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

// No hardcoded PPF categories
// const PPF_ITEMS_CATEGORIES = new Set(['Elite', 'Garware Plus', 'Garware Premium', 'Garware Matt']);

const require = createRequire(typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : `file://${process.cwd()}/server/routes.ts`);

async function seedAdminUser() {
  try {
    const existingAdmin = await Admin.findOne({ email: 'Autogarage@system.com' });
    if (!existingAdmin) {
      await Admin.create({
        email: 'Autogarage@system.com',
        password: 'Autogarage',
        name: 'Auto Garage Admin'
      });
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve public quotations directory
  const quotationsDir = path.join(process.cwd(), "public", "quotations");
  if (!fs.existsSync(quotationsDir)) {
    fs.mkdirSync(quotationsDir, { recursive: true });
  }
  app.use("/q", express.static(quotationsDir));

  app.post("/api/price-inquiries/:id/generate-pdf", async (req, res) => {
    try {
      const { id } = req.params;
      const { html } = req.body;
      
      if (!html) {
        return res.status(400).json({ message: "HTML content is required" });
      }

      // Check for existing PDF for this inquiry to avoid duplicates
      if (fs.existsSync(quotationsDir)) {
        const files = fs.readdirSync(quotationsDir);
        const existingFile = files.find(f => f.startsWith(`quote_${id}_`) && f.endsWith('.pdf'));

        if (existingFile) {
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers['host'];
          return res.json({ url: `${protocol}://${host}/q/${existingFile}` });
        }
      } else {
        fs.mkdirSync(quotationsDir, { recursive: true });
      }

      const filename = `quote_${id}_${Date.now()}.pdf`;
      const filepath = path.join(quotationsDir, filename);

      // Save as PDF
      const puppeteer = require('puppeteer-core');
      const chromium = require('chrome-aws-lambda');

      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Add a small delay to ensure styles and images are loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      await page.pdf({
        path: filepath,
        format: 'A4',
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        printBackground: true,
        preferCSSPageSize: true
      });

      await browser.close();
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const publicUrl = `${protocol}://${host}/q/${filename}`;

      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Link generation error:", error);
      res.status(500).json({ message: "Failed to generate quotation link" });
    }
  });

  // Save PDF endpoint - receives PDF binary and saves to server
  app.post("/api/save-pdf", express.raw({ type: 'application/octet-stream' }), async (req, res) => {
    try {
      const inquiryId = req.query.inquiryId as string;
      const customerName = (req.query.customerName as string || '').replace(/\s+/g, '_');
      
      if (!inquiryId) {
        return res.status(400).json({ message: "Inquiry ID is required" });
      }

      if (!fs.existsSync(quotationsDir)) {
        fs.mkdirSync(quotationsDir, { recursive: true });
      }

      // Check for existing PDF for this inquiry to avoid duplicates
      const files = fs.readdirSync(quotationsDir);
      const searchPattern = customerName ? `quote_${customerName}_${inquiryId}_` : `quote_${inquiryId}_`;
      const existingFile = files.find(f => f.startsWith(searchPattern) && f.endsWith('.pdf'));

      if (existingFile) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        return res.json({ url: `${protocol}://${host}/q/${existingFile}` });
      }

      const pdfBuffer = req.body as Buffer;
      if (!pdfBuffer || pdfBuffer.length === 0) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      const filename = customerName ? `quote_${customerName}_${inquiryId}_${Date.now()}.pdf` : `quote_${inquiryId}_${Date.now()}.pdf`;
      const filepath = path.join(quotationsDir, filename);

      fs.writeFileSync(filepath, pdfBuffer);

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const publicUrl = `${protocol}://${host}/q/${filename}`;

      res.json({ url: publicUrl });
    } catch (error) {
      console.error("PDF save error:", error);
      res.status(500).json({ message: "Failed to save PDF" });
    }
  });

  // Check if PDF exists for an inquiry
  app.get("/api/check-pdf/:inquiryId", async (req, res) => {
    try {
      const { inquiryId } = req.params;

      if (!inquiryId) {
        return res.status(400).json({ message: "Inquiry ID is required" });
      }

      if (!fs.existsSync(quotationsDir)) {
        return res.json({ exists: false, url: null });
      }

      const files = fs.readdirSync(quotationsDir);
      const pdfFile = files.find(f => f.includes(`${inquiryId}_`) && f.endsWith('.pdf'));

      if (pdfFile) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const url = `${protocol}://${host}/q/${pdfFile}`;
        return res.json({ exists: true, url });
      }

      res.json({ exists: false, url: null });
    } catch (error) {
      console.error("PDF check error:", error);
      res.status(500).json({ message: "Failed to check PDF" });
    }
  });

  // Delete PDF endpoint - removes PDF when inquiry is deleted
  app.delete("/api/delete-pdf/:inquiryId", async (req, res) => {
    try {
      const { inquiryId } = req.params;

      if (!inquiryId) {
        return res.status(400).json({ message: "Inquiry ID is required" });
      }

      if (!fs.existsSync(quotationsDir)) {
        return res.json({ message: "No PDFs directory" });
      }

      const files = fs.readdirSync(quotationsDir);
      const pdfFile = files.find(f => f.includes(`${inquiryId}_`) && f.endsWith('.pdf'));

      if (pdfFile) {
        const filepath = path.join(quotationsDir, pdfFile);
        fs.unlinkSync(filepath);
      }

      res.json({ message: "PDF deleted" });
    } catch (error) {
      console.error("PDF delete error:", error);
      res.status(500).json({ message: "Failed to delete PDF" });
    }
  });

  app.get("/api/ppf/export", async (_req, res) => {
    try {
      console.log("[PPF Export] Starting extraction...");
      const inventory = await storage.getInventory();
      const ppfCategories = await PpfCategory.find().sort({ name: 1 });
      
      console.log(`[PPF Export] Found ${ppfCategories.length} categories and ${inventory.length} total inventory items`);
      
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();

      // Sheet 1: Categories and Current Stock
      const categoriesData = ppfCategories.map(cat => {
        const normalizedCatName = cat.name.trim().toLowerCase();
        
        // Find ANY inventory item that matches the name or category
        const item = inventory.find(inv => {
          const invCategory = (inv.category || "").trim().toLowerCase();
          const invName = (inv.name || "").trim().toLowerCase();
          // Liberal match: identical OR substring match
          return invCategory === normalizedCatName || 
                 invName === normalizedCatName ||
                 invName.includes(normalizedCatName) ||
                 normalizedCatName.includes(invName);
        });
        
        if (item) {
          console.log(`[PPF Export] SUCCESS: "${cat.name}" matched inventory item "${item.name}"`);
        } else {
          console.warn(`[PPF Export] FAILED: "${cat.name}" no match found.`);
        }

        // Use toObject() to ensure we get raw data from Mongoose
        const rawItem = item?.toObject ? item.toObject() : item;
        const activeRolls = (rawItem?.rolls || []).filter((r: any) => r.status !== 'Finished');
        const finishedRolls = (rawItem?.finishedRolls || []);
        const allRolls = [...activeRolls, ...finishedRolls];
        
        return {
          'Category Name': cat.name,
          'Total Active Rolls': activeRolls.length,
          'Total Finished Rolls': finishedRolls.length,
          'Total Quantity (sqft)': activeRolls.reduce((acc: number, r: any) => acc + (r.remaining_sqft || r.remainingSqft || 0), 0),
          'Original Total (sqft)': allRolls.reduce((acc: number, r: any) => acc + (r.squareFeet || r.original_sqft || r.originalSqft || 0), 0)
        };
      });
      const wsCats = XLSX.utils.json_to_sheet(categoriesData);
      XLSX.utils.book_append_sheet(wb, wsCats, "PPF Categories");

      // Sheet 2: All Active Rolls
      const rollsData: any[] = [];
      const ppfCategoryNames = Array.from(new Set(ppfCategories.map(c => c.name.toLowerCase().trim())));
      
      inventory.forEach(inv => {
        const name = (inv.name || "").toLowerCase().trim();
        const category = (inv.category || "").toLowerCase().trim();
        const isPpfFlag = !!inv.isPpf || String(inv.isPpf) === 'true';
        
        const isPpf = isPpfFlag || 
                      ppfCategoryNames.some(catName => 
                        name === catName || 
                        category === catName ||
                        name.includes(catName) || 
                        category.includes(catName)
                      );
        
        if (isPpf) {
          console.log(`[PPF Export] Processing active rolls for: ${inv.name}`);
          
          // Use toObject() for the inventory item to avoid Mongoose property issues
          const rawInv = inv.toObject ? inv.toObject() : inv;
          const rolls = rawInv.rolls || rawInv.active_rolls || [];
          
          rolls.forEach((roll: any) => {
            // Filter out finished rolls
            if (roll.status === 'Finished') return;

            // Handle date field variations
            const dateVal = roll.dateAdded || roll.createdAt || roll.date || roll.addedAt;
            let formattedDate = 'N/A';
            if (dateVal) {
              try {
                formattedDate = new Date(dateVal).toLocaleDateString();
              } catch (e) {
                console.warn(`[PPF Export] Invalid date for roll ${roll.name}:`, dateVal);
              }
            }

            rollsData.push({
              'Category': inv.category || inv.name,
              'Roll Name': roll.rollName || roll.name || 'Unnamed Roll',
              'Original Quantity (sqft)': roll.squareFeet || roll.original_sqft || roll.originalSqft || 0,
              'Remaining (sqft)': roll.remaining_sqft || roll.remainingSqft || 0,
              'Status': roll.status || 'Active',
              'Date Added': formattedDate
            });
          });
        }
      });
      const wsRolls = XLSX.utils.json_to_sheet(rollsData);
      XLSX.utils.book_append_sheet(wb, wsRolls, "PPF Rolls");

      // Sheet 3: History
      const historyData: any[] = [];
      inventory.forEach(inv => {
        const name = (inv.name || "").toLowerCase().trim();
        const category = (inv.category || "").toLowerCase().trim();
        const isPpfFlag = !!inv.isPpf || String(inv.isPpf) === 'true';
        
        const isPpf = isPpfFlag || 
                      ppfCategoryNames.some(catName => 
                        name === catName || 
                        category === catName ||
                        name.includes(catName) || 
                        category.includes(catName)
                      );
        
        if (isPpf) {
          inv.history?.forEach((h: any) => {
            historyData.push({
              'Category': inv.category || inv.name,
              'Action': h.action || h.type,
              'Amount': h.amount,
              'Description': h.description || '',
              'Roll': h.rollName || '',
              'Customer': h.customerName || '',
              'Date': h.date ? new Date(h.date).toLocaleString() : ''
            });
          });
        }
      });
      const wsHistory = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(wb, wsHistory, "PPF History");

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=ppf_inventory.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("[PPF Export] ERROR:", error);
      res.status(500).json({ message: "Failed to export PPF inventory" });
    }
  });

  app.post("/api/ppf/import", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      const requiredColumns = ['Category Name', 'Roll Name', 'Quantity (sqft)'];
      
      for (const row of items) {
        // Validation: Category Name, Roll Name, and Quantity are mandatory
        for (const col of requiredColumns) {
          const val = row[col];
          if (val === undefined || val === null || String(val).trim() === '') {
            return res.status(400).json({ 
              message: `Validation failed: Column '${col}' is mandatory and cannot be blank. Found invalid value for: ${JSON.stringify(row)}` 
            });
          }
        }

        const categoryName = String(row['Category Name']).trim();
        const rollName = String(row['Roll Name']).trim();
        const qty = parseFloat(String(row['Quantity (sqft)']));

        if (isNaN(qty) || qty <= 0) {
          return res.status(400).json({ message: `Invalid quantity for roll ${rollName} in category ${categoryName}` });
        }

        // 1. Ensure category exists
        let category = await PpfCategory.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });
        if (!category) {
          category = await PpfCategory.create({ name: categoryName });
        }

        // 2. Ensure inventory item exists
        // We look for an item with matching category and isPpf: true
        let invItem = await storage.Inventory.findOne({ 
          category: { $regex: new RegExp(`^${categoryName}$`, 'i') }, 
          isPpf: true 
        });

        if (!invItem) {
          invItem = await storage.createInventoryItem({
            name: categoryName,
            category: categoryName,
            quantity: 0,
            unit: 'Square Feet',
            minStock: 5,
            isPpf: true
          });
        }

        // 3. Add roll
        if (invItem) {
          await storage.addRoll(invItem._id.toString(), {
            name: rollName,
            meters: 0,
            squareFeet: qty,
            remaining_meters: 0,
            remaining_sqft: qty,
            unit: 'Square Feet'
          });
        }
      }

      res.json({ message: "PPF Import successful" });
    } catch (error) {
      console.error("PPF Import error:", error);
      res.status(500).json({ message: "Failed to import PPF inventory" });
    }
  });

  app.get("/api/inventory/export", async (_req, res) => {
    try {
      const inventory = await storage.getInventory();
      const accessories = inventory.filter(item => item.category === 'Accessories' || !item.isPpf);
      
      const XLSX = require('xlsx');
      const data = accessories.map(item => ({
        Name: item.name,
        Category: item.category,
        Quantity: item.quantity,
        Unit: item.unit,
        Price: item.price || 0
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Accessories");
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=accessories.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export accessories" });
    }
  });

  app.post("/api/inventory/import", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      const requiredColumns = ['name', 'category', 'quantity', 'unit', 'price'];
      
      for (const itemData of items) {
        // Validation: All columns must exist and all data is mandatory
        for (const col of requiredColumns) {
          if (itemData[col] === undefined || itemData[col] === null || itemData[col] === '') {
            return res.status(400).json({ 
              message: `Validation failed: Column '${col}' is mandatory and cannot be blank in item: ${JSON.stringify(itemData)}` 
            });
          }
        }

        const existing = await storage.Inventory.findOne({ 
          name: itemData.name, 
          category: itemData.category 
        });

        if (existing) {
          await storage.updateInventoryItem(existing._id.toString(), itemData);
        } else {
          await storage.createInventoryItem(itemData);
        }
      }

      res.json({ message: "Import successful" });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import accessories" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const item = await storage.createInventoryItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.get("/api/services", async (_req, res) => {
    try {
      const services = await Service.find().sort({ name: 1 });
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const service = await Service.create(req.body);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const result = await Service.findByIdAndDelete(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await Settings.findOne() || { customVehicleTypes: [] };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings(req.body);
      } else {
        Object.assign(settings, req.body);
      }
      await settings.save();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.patch("/api/services/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (typeof id === 'string' && id.startsWith('hc-')) {
        return res.status(400).json({ message: "Cannot update hardcoded services directly. Please save as a new service." });
      }
      const service = await Service.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Update service error:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.get("/api/services/export", async (_req, res) => {
    try {
      const services = await Service.find().sort({ name: 1 });
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();

      const data = services.map(service => {
        const row: any = {
          'Service Name': service.name,
          'Description': service.description || '',
          'Warranty': service.warranty || '',
          'Is PPF': service.isPpf ? 'Yes' : 'No',
          'Is Warranty Based': service.isWarrantyBased ? 'Yes' : 'No'
        };

        // Add standard prices
        if (service.prices) {
          const pricesObj = service.prices instanceof Map ? Object.fromEntries(service.prices) : service.prices;
          Object.entries(pricesObj).forEach(([vType, price]) => {
            row[`Price - ${vType}`] = price;
          });
        }

        // Add warranty options as a string for reference in the main sheet
        if (service.warrantyOptions) {
          const woObj = service.warrantyOptions instanceof Map ? Object.fromEntries(service.warrantyOptions) : service.warrantyOptions;
          row['Warranty Options Summary'] = JSON.stringify(woObj);
        }

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Services");

      // Detailed Warranty Options sheet if any exist
      const detailedWarrantyData: any[] = [];
      services.forEach(service => {
        if (service.isWarrantyBased && service.warrantyOptions) {
          const woObj = service.warrantyOptions instanceof Map ? Object.fromEntries(service.warrantyOptions) : service.warrantyOptions;
          Object.entries(woObj).forEach(([vType, options]: [string, any]) => {
            options.forEach((opt: any) => {
              detailedWarrantyData.push({
                'Service Name': service.name,
                'Vehicle Type': vType,
                'Warranty Option': opt.warranty,
                'Price': opt.price
              });
            });
          });
        }
      });

      if (detailedWarrantyData.length > 0) {
        const wsDetailed = XLSX.utils.json_to_sheet(detailedWarrantyData);
        XLSX.utils.book_append_sheet(wb, wsDetailed, "Warranty Pricing Details");
      }

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=services_export.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Export services error:", error);
      res.status(500).json({ message: "Failed to export services" });
    }
  });

  app.post("/api/services/import", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      for (const row of items) {
        const serviceName = row['Service Name'] || row['name'];
        if (!serviceName) continue;

        const isWarrantyBased = row['Is Warranty Based'] === 'Yes' || row['isWarrantyBased'] === true;
        
        const serviceData: any = {
          name: serviceName,
          description: row['Description'] || row['description'] || '',
          warranty: row['Warranty'] || row['warranty'] || '',
          isPpf: row['Is PPF'] === 'Yes' || row['isPpf'] === true,
          isWarrantyBased: isWarrantyBased,
          prices: {},
          warrantyOptions: {}
        };

        // Handle Warranty Options
        if (isWarrantyBased) {
          if (row['Warranty Options Summary']) {
            try {
              serviceData.warrantyOptions = JSON.parse(row['Warranty Options Summary']);
            } catch (e) {
              console.warn(`Failed to parse warranty options for ${serviceName}`);
            }
          }
        } else {
          // Handle standard prices
          Object.entries(row).forEach(([key, value]) => {
            if (key.startsWith('Price - ')) {
              const vType = key.replace('Price - ', '');
              serviceData.prices[vType] = parseFloat(String(value)) || 0;
            }
          });
        }

        const existing = await Service.findOne({ name: serviceName });
        if (existing) {
          await Service.findByIdAndUpdate(existing._id, serviceData);
        } else {
          await Service.create(serviceData);
        }
      }

      res.json({ message: "Services imported successfully" });
    } catch (error) {
      console.error("Import services error:", error);
      res.status(500).json({ message: "Failed to import services" });
    }
  });

  app.get("/api/ppf-categories", async (_req, res) => {
    try {
      const categories = await PpfCategory.find().sort({ name: 1 });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PPF categories" });
    }
  });

  app.post("/api/ppf-categories", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Category name is required" });
      const category = await PpfCategory.create({ name });
      res.status(201).json(category);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: "Category already exists" });
      }
      res.status(500).json({ message: "Failed to create PPF category" });
    }
  });

  app.patch("/api/ppf-categories/:id", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Category name is required" });
      
      const oldCategory = await PpfCategory.findById(req.params.id);
      if (!oldCategory) return res.status(404).json({ message: "Category not found" });

      // Update all inventory items belonging to this category
      await storage.Inventory.updateMany(
        { category: oldCategory.name, isPpf: true },
        { category: name }
      );

      const category = await PpfCategory.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true }
      );
      res.json(category);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: "Category already exists" });
      }
      res.status(500).json({ message: "Failed to update PPF category" });
    }
  });

  app.delete("/api/ppf-categories/:id", async (req, res) => {
    try {
      const category = await PpfCategory.findById(req.params.id);
      if (category) {
        // Delete all inventory items belonging to this category
        await storage.Inventory.deleteMany({ category: category.name, isPpf: true });
      }
      await PpfCategory.findByIdAndDelete(req.params.id);
      res.json({ message: "Category and associated items deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Seed admin user on startup
  try {
    await seedAdminUser();
  } catch (e) {
    console.error("Seeding failed but continuing:", e);
  }

  // Add a health check endpoint for Vercel
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.VERCEL ? "vercel" : "local" });
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`[Auth] Login attempt for: ${email}`);
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Case-insensitive lookup using collation or simple regex
      const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      
      if (!admin) {
        console.log(`[Auth] User not found: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (admin.password !== password) {
        console.log(`[Auth] Password mismatch for: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      console.log(`[Auth] Login successful: ${email}`);
      res.json({ 
        success: true, 
        user: { 
          id: admin._id, 
          email: admin.email, 
          name: admin.name 
        } 
      });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      res.status(500).json({ message: "Login failed", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Check auth status
  app.get("/api/auth/me", async (req, res) => {
    res.json({ authenticated: false });
  });

  app.get("/api/customers/export", async (_req, res) => {
    try {
      const { customers } = await storage.getCustomers({ limit: 10000 });
      
      const XLSX = require('xlsx');
      const data = customers.map(customer => {
        // Direct mapping from the separate database fields
        return {
          'Customer ID': customer.customerId,
          'Name': customer.name,
          'Phone': customer.phone,
          'Email': customer.email || '',
          'Address': customer.address || '',
          'City': customer.city || '',
          'District': customer.district || '',
          'State': customer.state || '',
          'Status': customer.status || 'Inquired',
          'Referral Source': customer.referralSource || '',
          'Registration Date': customer.registrationDate || (customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''),
          'Created At': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''
        };
      });
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export customers" });
    }
  });

  app.post("/api/customers/import", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      for (const customerData of items) {
        // Normalizing keys to lowercase for easier mapping
        const normalizedData: any = {};
        Object.keys(customerData).forEach(key => {
          normalizedData[key.toLowerCase().replace(/\s+/g, '')] = customerData[key];
        });

        const phone = normalizedData.phone || normalizedData.phonenumber;
        if (!phone) continue;

        const mappedData = {
          name: normalizedData.name || normalizedData.customername || 'Unknown',
          phone: String(phone),
          email: normalizedData.email || '',
          address: normalizedData.address || '',
          city: normalizedData.city || '',
          district: normalizedData.district || '',
          state: normalizedData.state || '',
          status: normalizedData.status || 'Inquired',
          referralSource: normalizedData.referralsource || ''
        };

        const existing = await Customer.findOne({ phone: mappedData.phone });
        if (existing) {
          await storage.updateCustomer(existing._id.toString(), mappedData);
        } else {
          await storage.createCustomer(mappedData);
        }
      }

      res.json({ message: "Import successful" });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import customers" });
    }
  });

  app.get("/api/customers/check-phone/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      const customer = await Customer.findOne({ phone });
      res.json({ exists: !!customer });
    } catch (error) {
      res.status(500).json({ message: "Failed to check phone number" });
    }
  });

  app.get("/api/customers", async (req, res) => {
    try {
      const { search, page = '1', limit = '10' } = req.query;
      const result = await storage.getCustomers({
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const { phone } = req.body;
      const existingCustomer = await Customer.findOne({ phone });
      
      if (existingCustomer) {
        const updatedCustomer = await Customer.findByIdAndUpdate(
          existingCustomer._id,
          req.body,
          { new: true }
        );
        return res.json(updatedCustomer);
      }

      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error("Error creating customer:", error?.message || error);
      const message = error?.message || "Failed to create customer";
      res.status(500).json({ message });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      
      await storage.deleteCustomer(req.params.id);
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  app.post("/api/customers/:id/vehicles", async (req, res) => {
    try {
      const customer = await storage.addVehicleToCustomer(req.params.id, req.body);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to add vehicle" });
    }
  });

  app.post("/api/customers/:id/service-images", async (req, res) => {
    try {
      const { images } = req.body;
      if (!Array.isArray(images)) {
        return res.status(400).json({ message: "Images must be an array" });
      }
      const customer = await storage.addServiceImages(req.params.id, images.slice(0, 5));
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to add service images" });
    }
  });

  app.get("/api/customers/:id/jobs", async (req, res) => {
    try {
      const jobs = await storage.getJobsByCustomer(req.params.id);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer jobs" });
    }
  });

  app.get("/api/customers/:customerId/vehicles/:vehicleIndex/last-service", async (req, res) => {
    try {
      const job = await storage.getLastJobForVehicle(req.params.customerId, parseInt(req.params.vehicleIndex, 10));
      if (!job) return res.status(404).json({ message: "No previous service found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch last service" });
    }
  });

  app.get("/api/customers/:customerId/vehicles/:vehicleIndex/preferences", async (req, res) => {
    try {
      const prefs = await storage.getVehicleServicePreferences(req.params.customerId, parseInt(req.params.vehicleIndex, 10));
      if (!prefs) return res.status(404).json({ message: "No preferences found" });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const { stage, page = '1', limit = '10' } = req.query;
      const result = await storage.getJobs({
        stage: stage as JobStage,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    let createdJobId: string | undefined;
    try {
      console.log("[Job Creation DEBUG] Request body:", JSON.stringify(req.body, null, 2));
      
      // Validate customer and vehicle before proceeding
      const customer = await Customer.findById(req.body.customerId);
      if (!customer) {
        console.error("[Job Creation DEBUG] Customer not found:", req.body.customerId);
        return res.status(404).json({ message: "Customer not found" });
      }

      console.log("[Job Creation DEBUG] Customer found:", customer.name);

      const vehicle = customer.vehicles[req.body.vehicleIndex];
      if (!vehicle) {
        console.error("[Job Creation DEBUG] Invalid vehicle index:", req.body.vehicleIndex);
        return res.status(400).json({ message: "Invalid vehicle selection" });
      }

      console.log("[Job Creation DEBUG] Vehicle found:", vehicle.make, vehicle.model, "Plate:", vehicle.plateNumber);

      // Ensure plateNumber is populated from the vehicle record
      const jobData = {
        ...req.body,
        plateNumber: (req.body.plateNumber && String(req.body.plateNumber).trim() !== "") 
          ? req.body.plateNumber 
          : (vehicle.plateNumber && String(vehicle.plateNumber).trim() !== "" ? vehicle.plateNumber : "TEMP-PLATE"),
        serviceCost: Number(req.body.serviceCost) || 0,
        laborCost: Number(req.body.laborCost) || 0,
        totalAmount: Number(req.body.totalAmount) || 0,
        paidAmount: Number(req.body.paidAmount) || 0,
        materials: [], // Initialize materials as empty array to avoid validation errors
        checklist: [], // Initialize checklist to avoid validation errors
        images: [] // Initialize images to avoid validation errors
      };

      console.log("[Job Creation DEBUG] Final job data for storage:", JSON.stringify(jobData, null, 2));

      const job = await storage.createJob(jobData);
      console.log("[Job Creation DEBUG] Storage createJob success. ID:", job._id);
      createdJobId = job._id.toString();
      
      const updatedCustomer = await Customer.findById(job.customerId);
      if (updatedCustomer) {
        // Send WhatsApp message - this is non-critical, so we don't roll back if it fails
        try {
          await sendStageUpdateMessage(updatedCustomer.phone, job.stage, job.vehicleName, job.plateNumber);
        } catch (waError) {
          console.error("[Job Creation DEBUG] WhatsApp notification failed:", waError);
        }
        
        // Save vehicle service preferences
        const jobDataRaw = req.body as any;
        const ppfService = jobDataRaw.serviceItems?.find((item: any) => item.name?.startsWith('PPF'));
        const otherServices = jobDataRaw.serviceItems?.filter((item: any) => !item.name?.startsWith('PPF')).map((item: any) => ({
          name: item.name,
          vehicleType: (item.vehicleType?.toLowerCase() === 'accessory' || item.category === 'Accessories' || item.name?.toLowerCase().includes('(x')) ? 'accessory' : 'service',
          price: item.price
        })) || [];
        
        const preferences: any = {};
        if (ppfService) {
          preferences.ppfCategory = ppfService.category;
          preferences.ppfVehicleType = ppfService.vehicleType;
          preferences.ppfWarranty = ppfService.warranty;
          preferences.ppfPrice = ppfService.price;
        }
        if (req.body.laborCost) {
          preferences.laborCost = req.body.laborCost;
        }
        if (otherServices.length > 0) {
          preferences.otherServices = otherServices;
        }
        
        if (Object.keys(preferences).length > 0) {
          console.log("[Job Creation DEBUG] Updating vehicle preferences:", JSON.stringify(preferences, null, 2));
          await storage.updateVehiclePreferences(job.customerId.toString(), job.vehicleIndex, preferences);
        }
      }
      res.status(201).json(job);
    } catch (error) {
      console.error("Job creation error:", error);
      
      // Rollback: if the job was created but subsequent logic failed, delete it
      if (createdJobId) {
        try {
          await storage.deleteJob(createdJobId);
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
      }
      
      res.status(500).json({ message: "Failed to create job", error: (error as any)?.message });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.patch("/api/jobs/:id/stage", async (req, res) => {
    try {
      const { stage, discount = 0, cancellationReason } = req.body;
      
      const currentJob = await storage.getJob(req.params.id);
      if (!currentJob) return res.status(404).json({ message: "Job not found" });

      // Prevent changes once marked 'Completed' or 'Cancelled'
      if (currentJob.stage === 'Completed') {
        return res.status(403).json({ message: "Cannot change status once marked as Completed" });
      }
      if (currentJob.stage === 'Cancelled') {
        return res.status(403).json({ message: "Cannot change status once marked as Cancelled" });
      }

      // Check if THIS JOB has an invoice
      // Each job is independent - a customer can have multiple jobs, each with its own invoice
      const existingInvoice = await storage.getInvoiceByJob(req.params.id);
      if (existingInvoice && stage !== 'Completed') {
        return res.status(409).json({ message: "Cannot change stage after invoice has been created" });
      }
      
      const job = await storage.updateJob(req.params.id, { 
        stage, 
        serviceItems: req.body.serviceItems,
        requiresGST: req.body.requiresGST,
        cancellationReason 
      });
      if (!job) return res.status(404).json({ message: "Job not found" });
      
      const customer = await Customer.findById(job.customerId);
      if (customer) {
        await sendStageUpdateMessage(customer.phone, stage, job.vehicleName, job.plateNumber);
      }
      
      if (stage === 'Completed') {
        try {
          const jobObj = job.toObject();
          const taxRate = jobObj.requiresGST ? 18 : 0;
          const discount = req.body.discount || 0;

          const itemsByBusiness: Record<string, any[]> = {};
          job.serviceItems.forEach((item: any) => {
            const biz = item.assignedBusiness || 'Auto Gamma';
            if (!itemsByBusiness[biz]) itemsByBusiness[biz] = [];
            itemsByBusiness[biz].push(item);
          });

          const businesses = Object.keys(itemsByBusiness);
          console.log(`[Invoice] Found items for businesses: ${JSON.stringify(businesses)}`);
          const invoices = [];

          for (const business of businesses) {
            console.log(`[Invoice] STARTING GENERATION for Job: ${req.params.id}, Business: "${business}"`);
            const invoice = await storage.generateInvoiceForJob(req.params.id, taxRate, discount, business);
            if (invoice) {
              console.log(`[Invoice] CREATED: ${invoice.invoiceNumber}, Business: "${invoice.business}", Total: ${invoice.totalAmount}`);
              invoices.push(invoice);
              // Wait a small amount to ensure distinct timestamps or sequence handling if needed
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }

          if (invoices.length === 0) {
            return res.status(500).json({ 
              message: "Failed to generate invoice for completed job"
            });
          }
          res.json({ ...job.toObject(), message: "Service completed & invoices created!", invoices });
        } catch (invoiceError) {
          console.error("Invoice generation error for job:", req.params.id, invoiceError);
          return res.status(500).json({ 
            message: "Job marked as completed but invoice generation failed",
            error: invoiceError instanceof Error ? invoiceError.message : "Unknown error"
          });
        }
        return;
      }
      
      res.json({ ...job.toObject(), message: "Status updated" });
    } catch (error) {
      console.error("Job stage update error:", error);
      res.status(500).json({ 
        message: "Failed to update job stage",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/jobs/:id/payment", async (req, res) => {
    try {
      const payment = req.body;
      const updatedJob = await storage.addPaymentToJobWithInvoiceSync(req.params.id, payment);
      if (!updatedJob) return res.status(404).json({ message: "Job not found" });
      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ message: "Failed to add payment" });
    }
  });

  app.get("/api/technicians", async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.get("/api/technicians/workload", async (req, res) => {
    try {
      const workload = await storage.getTechnicianWorkload();
      res.json(workload);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technician workload" });
    }
  });

  app.post("/api/technicians", async (req, res) => {
    try {
      const technician = await storage.createTechnician(req.body);
      res.status(201).json(technician);
    } catch (error) {
      res.status(500).json({ message: "Failed to create technician" });
    }
  });

  app.patch("/api/technicians/:id", async (req, res) => {
    try {
      const technician = await storage.updateTechnician(req.params.id, req.body);
      if (!technician) return res.status(404).json({ message: "Technician not found" });
      res.json(technician);
    } catch (error) {
      res.status(500).json({ message: "Failed to update technician" });
    }
  });

  app.delete("/api/technicians/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const workload = await storage.getTechnicianWorkload();
      const techWorkload = workload.find((w: any) => w.technician._id.toString() === id);
      
      if (techWorkload && techWorkload.jobCount > 0) {
        return res.status(400).json({ 
          message: "Cannot delete technician with active jobs. Please reassign or complete jobs first." 
        });
      }

      const technician = await storage.getTechnician(id);
      if (!technician) return res.status(404).json({ message: "Technician not found" });

      await storage.deleteTechnician(id);
      res.json({ message: "Technician deleted successfully" });
    } catch (error) {
      console.error("Delete technician error:", error);
      res.status(500).json({ message: "Failed to delete technician" });
    }
  });

  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/accessory-sales", async (req, res) => {
    try {
      const sales = await storage.getAccessorySales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessory sales" });
    }
  });

  app.post("/api/accessory-sales", async (req, res) => {
    try {
      const sale = await storage.createAccessorySale(req.body);
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to record accessory sale" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.patch("/api/inventory/:id/consume-fifo", async (req, res) => {
    try {
      const { quantity } = req.body;
      const id = req.params.id;
      console.log(`[Inventory DEBUG] FIFO Consumption request for ${id}, qty: ${quantity}`);
      const result = await storage.consumeRollsWithFIFO(id, quantity);
      if (!result.success) {
        return res.status(400).json({ message: "Insufficient stock or item not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("[Inventory DEBUG] FIFO Consumption error:", error);
      res.status(500).json({ message: "Failed to process stock consumption" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const data = { ...req.body };
      // For new PPF categories, ensure category is set to name if missing
      if (data.isPpf && (!data.category || data.category === "") && data.name) {
        data.category = data.name;
      }
      
      const item = await storage.createInventoryItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Inventory creation error:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      await storage.deleteInventoryItem(req.params.id);
      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  app.patch("/api/inventory/:id/adjust", async (req, res) => {
    try {
      const { quantity } = req.body;
      const item = await storage.adjustInventory(req.params.id, quantity);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust inventory" });
    }
  });

  app.post("/api/inventory/:id/rolls", async (req, res) => {
    try {
      const { id } = req.params;
      const rollData = req.body;
      let inventoryId = id;

      if (id.startsWith('temp-')) {
        const category = id.replace('temp-', '');
        let item = await (storage as any).Inventory.findOne({ category });
        if (!item) {
          item = await storage.createInventoryItem({
            name: category,
            category: category,
            quantity: 0,
            unit: 'rolls',
            minStock: 1,
            isPpf: true,
            rolls: [],
            history: []
          } as any);
        }
        inventoryId = item._id.toString();
      }

      const item = await storage.addRoll(inventoryId, rollData);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Add roll error:", error);
      res.status(500).json({ message: error.message || "Failed to add roll" });
    }
  });

  app.delete("/api/inventory/:id/rolls/:rollId", async (req, res) => {
    try {
      const item = await storage.deleteRoll(req.params.id, req.params.rollId);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete roll" });
    }
  });

  app.patch("/api/inventory/:id/rolls/:rollId/deduct", async (req, res) => {
    try {
      const { metersUsed } = req.body;
      const item = await storage.deductRoll(req.params.id, req.params.rollId, metersUsed);
      if (!item) return res.status(404).json({ message: "Item or roll not found" });
      res.json(item);
    } catch (error: any) {
      console.error("Deduct roll error:", error?.message || error);
      res.status(500).json({ message: error?.message || "Failed to deduct from roll" });
    }
  });

  app.patch("/api/inventory/:id/consume-fifo", async (req, res) => {
    try {
      const { quantity } = req.body;
      const result = await storage.consumeRollsWithFIFO(req.params.id, quantity);
      if (!result.success) return res.status(400).json({ message: "Failed to consume materials" });
      res.json(result);
    } catch (error: any) {
      console.error("Consume FIFO error:", error?.message || error);
      res.status(500).json({ message: error?.message || "Failed to consume materials using FIFO" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const { date, page = '1', limit = '10' } = req.query;
      const result = await storage.getAppointments({
        date: date ? new Date(date as string) : undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appointment = await storage.createAppointment(req.body);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) return res.status(404).json({ message: "Appointment not found" });
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      await storage.deleteAppointment(req.params.id);
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  app.post("/api/appointments/:id/convert", async (req, res) => {
    try {
      const job = await storage.convertAppointmentToJob(req.params.id);
      if (!job) return res.status(404).json({ message: "Appointment not found" });
      res.json(job);
    } catch (error) {
      console.error('Convert appointment error:', error);
      res.status(500).json({ message: "Failed to convert appointment", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/whatsapp/templates", async (req, res) => {
    try {
      const templates = await storage.getWhatsAppTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.patch("/api/whatsapp/templates/:stage", async (req, res) => {
    try {
      const { message, isActive } = req.body;
      const template = await storage.updateWhatsAppTemplate(
        req.params.stage as JobStage,
        message,
        isActive
      );
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.post("/api/invoices/manual", async (req, res) => {
    try {
      console.log("[INVOICE_DEBUG] FULL REQUEST BODY:", JSON.stringify(req.body, null, 2));
      const invoiceData = req.body;
      const { items, taxRate, discount, createdAt } = invoiceData;
      
      const invoiceNumber = `INV-${Date.now()}`;
      const subtotal = items.reduce((sum: number, item: any) => sum + ((item.unitPrice || 0) * (item.quantity || 1)), 0);
      const taxRateValue = (taxRate !== undefined && taxRate !== null && taxRate !== "" && !isNaN(Number(taxRate))) ? Number(taxRate) : 0;
      const tax = (subtotal * taxRateValue) / 100;
      const totalAmount = subtotal + tax - (Number(discount) || 0);

      const finalCreatedAt = createdAt ? new Date(createdAt) : new Date();
      console.log("[INVOICE_DEBUG] STRING RECEIVED:", createdAt);
      console.log("[INVOICE_DEBUG] PARSED DATE OBJECT:", finalCreatedAt.toString());
      console.log("[INVOICE_DEBUG] PARSED DATE ISO:", finalCreatedAt.toISOString());

      const invoice = new Invoice({
        ...invoiceData,
        invoiceNumber,
        subtotal,
        tax,
        totalAmount,
        paidAmount: 0,
        paymentStatus: 'Pending',
        business: 'Auto Gamma',
        createdAt: finalCreatedAt,
        jobId: new mongoose.Types.ObjectId(), 
        customerId: new mongoose.Types.ObjectId()
      });

      // Force field
      invoice.set('createdAt', finalCreatedAt);
      
      console.log("[INVOICE_DEBUG] Document before save createdAt:", invoice.createdAt.toISOString());
      const savedInvoice = await invoice.save();
      console.log("[INVOICE_DEBUG] Document after save createdAt:", savedInvoice.createdAt.toISOString());
      console.log("[INVOICE_DEBUG] FULL SAVED DOC:", JSON.stringify(savedInvoice, null, 2));

      res.status(201).json(savedInvoice);
    } catch (error) {
      console.error("[INVOICE_ERROR]", error);
      res.status(500).json({ message: "Failed to create manual invoice" });
    }
  });

  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.get("/api/jobs/:id/invoice", async (req, res) => {
    try {
      const invoice = await storage.getInvoiceByJob(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found for this job" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/jobs/:id/invoice", async (req, res) => {
    try {
      const { taxRate = 18, discount = 0 } = req.body;
      const invoice = await storage.generateInvoiceForJob(req.params.id, taxRate, discount);
      if (!invoice) return res.status(404).json({ message: "Job not found" });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  app.post("/api/jobs/:id/materials", async (req, res) => {
    try {
      const { materials } = req.body;
      
      if (!Array.isArray(materials)) {
        return res.status(400).json({ message: "Materials must be an array" });
      }

      for (const mat of materials) {
        const item = await storage.getInventoryItem(mat.inventoryId);
        if (!item) continue;
        
        // Calculate total available across all rolls
        let totalAvailable = 0;
        if (item.rolls && item.rolls.length > 0) {
          totalAvailable = item.rolls.reduce((sum, roll) => {
            if (roll.status !== 'Finished') {
              return sum + (roll.remaining_sqft || 0);
            }
            return sum;
          }, 0);
          console.log(`[Materials] Item: ${item.name}, Rolls Total: ${totalAvailable}, Stored Quantity: ${item.quantity}`);
        } else {
          totalAvailable = item.quantity || 0;
          console.log(`[Materials] Item: ${item.name}, Total available: ${totalAvailable}`);
        }

        if (mat.quantity > totalAvailable) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name}. Available: ${totalAvailable}, Requested: ${mat.quantity}` 
          });
        }
      }

      const job = await storage.addMaterialsToJob(req.params.id, materials);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to add materials" });
    }
  });

  app.patch("/api/invoices/:id/pay", async (req, res) => {
    try {
      const { paymentMode, otherPaymentDetails, paidDate } = req.body;
      const invoice = await storage.markInvoicePaid(req.params.id, paymentMode, otherPaymentDetails, paidDate ? new Date(paidDate) : undefined);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      res.json(invoice);
    } catch (error) {
      console.error("Payment update error:", error);
      res.status(500).json({ message: "Failed to mark invoice as paid" });
    }
  });

  // Price Inquiries
  app.get("/api/price-inquiries", async (req, res) => {
    try {
      const { search, status, sortBy, sortOrder } = req.query;
      let query: any = {};
      
      if (search) {
        const regex = new RegExp(search as string, 'i');
        query.$or = [
          { name: regex },
          { phone: regex },
          { inquiryId: regex }
        ];
      }
      
      if (status && status !== 'all') {
        query.status = status;
      }

      let sort: any = { createdAt: -1 };
      if (sortBy) {
        sort = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };
      }

      const inquiries = await PriceInquiry.find(query).sort(sort);
      res.json({ inquiries });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price inquiries" });
    }
  });

  app.patch("/api/price-inquiries/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const inquiry = await PriceInquiry.findByIdAndUpdate(id, { status }, { new: true });
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.post("/api/price-inquiries", async (req, res) => {
    try {
      const inquiry = await storage.createPriceInquiry(req.body);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Price inquiry creation error:", error);
      res.status(500).json({ message: "Failed to create price inquiry", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", async (_req, res) => {
    try {
      const tickets = await storage.getTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const ticket = await storage.createTicket(req.body);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.patch("/api/tickets/:id", async (req, res) => {
    try {
      const ticket = await storage.updateTicket(req.params.id, req.body);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.delete("/api/tickets/:id", async (req, res) => {
    try {
      await storage.deleteTicket(req.params.id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  app.delete("/api/price-inquiries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete associated quotation files
      const quotationsDir = path.join(process.cwd(), "public", "quotations");
      if (fs.existsSync(quotationsDir)) {
        const files = fs.readdirSync(quotationsDir);
        files.forEach(file => {
          if (file.startsWith(`quote_${id}_`)) {
            try {
              fs.unlinkSync(path.join(quotationsDir, file));
              console.log(`Deleted quotation file: ${file}`);
            } catch (err) {
              console.error(`Error deleting file ${file}:`, err);
            }
          }
        });
      }

      await storage.deletePriceInquiry(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete inquiry error:", error);
      res.status(500).json({ message: "Failed to delete price inquiry" });
    }
  });

  app.patch("/api/settings/admin", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await Admin.findOne({ email: 'Autogarage@system.com' });
      if (!admin) return res.status(404).json({ message: "Admin not found" });
      
      const updateData: any = { name: username };
      if (password) {
        updateData.password = password;
      }
      
      const updatedAdmin = await Admin.findOneAndUpdate(
        { email: 'Autogarage@system.com' },
        updateData,
        { new: true }
      );
      
      res.json({ success: true, user: { email: updatedAdmin?.email, name: updatedAdmin?.name } });
    } catch (error) {
      res.status(500).json({ message: "Failed to update admin credentials" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  return httpServer;
}
