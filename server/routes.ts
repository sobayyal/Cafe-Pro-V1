import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertMenuItemSchema, 
  insertStaffSchema, 
  insertTableSchema, 
  insertOrderSchema, 
  insertOrderItemSchema,
  insertCafeSettingsSchema,
  insertInventoryHistorySchema
} from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "cafe-management-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Set up passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user || user.password !== password) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Error handling middleware for Zod validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const formattedError = fromZodError(error);
      res.status(400).json({ message: formattedError.message });
    } else {
      res.status(500).json({ message: String(error) });
    }
  };

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && (req.user as any)?.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // ==================
  // AUTH ROUTES
  // ==================

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          role: user.role 
        });
      });
    })(req, res, next);
  });

  // Get current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user as any;
    res.json({ 
      id: user.id, 
      username: user.username, 
      name: user.name, 
      role: user.role 
    });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  // ==================
  // USER ROUTES
  // ==================

  // Create a new user (admin only)
  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    const users = await storage.listUsers();
    res.json(users);
  });

  // ==================
  // CATEGORY ROUTES
  // ==================

  // Create category
  app.post("/api/categories", isAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Get all categories
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    const categories = await storage.listCategories();
    res.json(categories);
  });

  // Get a specific category
  app.get("/api/categories/:id", isAuthenticated, async (req, res) => {
    const categoryId = parseInt(req.params.id);
    const category = await storage.getCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(category);
  });

  // Update a category
  app.patch("/api/categories/:id", isAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      
      const updatedCategory = await storage.updateCategory(categoryId, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Delete a category
  app.delete("/api/categories/:id", isAdmin, async (req, res) => {
    const categoryId = parseInt(req.params.id);
    const result = await storage.deleteCategory(categoryId);
    
    if (!result) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.status(204).end();
  });

  // ==================
  // MENU ITEM ROUTES
  // ==================

  // Create menu item
  app.post("/api/menu-items", isAdmin, async (req, res) => {
    try {
      const menuItemData = insertMenuItemSchema.parse(req.body);
      const newMenuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(newMenuItem);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Get all menu items
  app.get("/api/menu-items", isAuthenticated, async (req, res) => {
    const menuItems = await storage.listMenuItems();
    res.json(menuItems);
  });

  // Get active menu items
  app.get("/api/menu-items/active", isAuthenticated, async (req, res) => {
    const menuItems = await storage.getActiveMenuItems();
    res.json(menuItems);
  });

  // Get menu items by category
  app.get("/api/menu-items/category/:categoryId", isAuthenticated, async (req, res) => {
    const categoryId = parseInt(req.params.categoryId);
    const menuItems = await storage.getMenuItemsByCategory(categoryId);
    res.json(menuItems);
  });

  // Get a specific menu item
  app.get("/api/menu-items/:id", isAuthenticated, async (req, res) => {
    const menuItemId = parseInt(req.params.id);
    const menuItem = await storage.getMenuItem(menuItemId);
    
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.json(menuItem);
  });

  // Update a menu item
  app.patch("/api/menu-items/:id", isAdmin, async (req, res) => {
    try {
      const menuItemId = parseInt(req.params.id);
      const menuItemData = insertMenuItemSchema.partial().parse(req.body);
      
      const updatedMenuItem = await storage.updateMenuItem(menuItemId, menuItemData);
      
      if (!updatedMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(updatedMenuItem);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Delete a menu item
  app.delete("/api/menu-items/:id", isAdmin, async (req, res) => {
    const menuItemId = parseInt(req.params.id);
    const result = await storage.deleteMenuItem(menuItemId);
    
    if (!result) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.status(204).end();
  });

  // ==================
  // STAFF ROUTES
  // ==================

  // Create staff member
  app.post("/api/staff", isAdmin, async (req, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);
      const newStaff = await storage.createStaff(staffData);
      res.status(201).json(newStaff);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Get all staff
  app.get("/api/staff", isAuthenticated, async (req, res) => {
    const staffList = await storage.listStaff();
    res.json(staffList);
  });

  // Get active staff
  app.get("/api/staff/active", isAuthenticated, async (req, res) => {
    const staffList = await storage.getActiveStaff();
    res.json(staffList);
  });

  // Get a specific staff member
  app.get("/api/staff/:id", isAuthenticated, async (req, res) => {
    const staffId = parseInt(req.params.id);
    const staff = await storage.getStaff(staffId);
    
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    
    res.json(staff);
  });

  // Update a staff member
  app.patch("/api/staff/:id", isAdmin, async (req, res) => {
    try {
      const staffId = parseInt(req.params.id);
      const staffData = insertStaffSchema.partial().parse(req.body);
      
      const updatedStaff = await storage.updateStaff(staffId, staffData);
      
      if (!updatedStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json(updatedStaff);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Delete a staff member
  app.delete("/api/staff/:id", isAdmin, async (req, res) => {
    const staffId = parseInt(req.params.id);
    const result = await storage.deleteStaff(staffId);
    
    if (!result) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    
    res.status(204).end();
  });

  // ==================
  // TABLE ROUTES
  // ==================

  // Create table
  app.post("/api/tables", isAdmin, async (req, res) => {
    try {
      const tableData = insertTableSchema.parse(req.body);
      const newTable = await storage.createTable(tableData);
      res.status(201).json(newTable);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Get all tables
  app.get("/api/tables", isAuthenticated, async (req, res) => {
    const tables = await storage.listTables();
    res.json(tables);
  });

  // Get available tables
  app.get("/api/tables/available", isAuthenticated, async (req, res) => {
    const tables = await storage.getAvailableTables();
    res.json(tables);
  });

  // Get a specific table
  app.get("/api/tables/:id", isAuthenticated, async (req, res) => {
    const tableId = parseInt(req.params.id);
    const table = await storage.getTable(tableId);
    
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    res.json(table);
  });

  // Update a table
  app.patch("/api/tables/:id", isAuthenticated, async (req, res) => {
    try {
      const tableId = parseInt(req.params.id);
      const tableData = insertTableSchema.partial().parse(req.body);
      
      const updatedTable = await storage.updateTable(tableId, tableData);
      
      if (!updatedTable) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(updatedTable);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Delete a table
  app.delete("/api/tables/:id", isAdmin, async (req, res) => {
    const tableId = parseInt(req.params.id);
    const result = await storage.deleteTable(tableId);
    
    if (!result) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    res.status(204).end();
  });

  // ==================
  // ORDER ROUTES
  // ==================

  // Create order with items
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { order, items } = req.body;
      
      // Validate order data
      const orderData = insertOrderSchema.parse(order);
      
      // Create order
      const newOrder = await storage.createOrder(orderData);
      
      // Create order items
      const createdItems = [];
      for (const item of items) {
        const orderItemData = insertOrderItemSchema.parse({
          ...item,
          orderId: newOrder.id
        });
        
        const newOrderItem = await storage.createOrderItem(orderItemData);
        createdItems.push(newOrderItem);
      }
      
      res.status(201).json({
        order: newOrder,
        items: createdItems
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Get all orders
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    const orders = await storage.listOrders();
    res.json(orders);
  });

  // Get recent orders with details
  app.get("/api/orders/recent", isAuthenticated, async (req, res) => {
    const limit = parseInt(req.query.limit as string || "5");
    const orders = await storage.getRecentOrders(limit);
    res.json(orders);
  });

  // Get a specific order with details
  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = await storage.getOrderWithDetails(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  });

  // Update an order
  app.patch("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const orderData = insertOrderSchema.partial().parse(req.body);
      
      const updatedOrder = await storage.updateOrder(orderId, orderData);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // ==================
  // DASHBOARD ROUTES
  // ==================

  // Get dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Get top menu items
  app.get("/api/dashboard/top-menu-items", isAuthenticated, async (req, res) => {
    const limit = parseInt(req.query.limit as string || "5");
    const topItems = await storage.getTopMenuItems(limit);
    res.json(topItems);
  });

  // ==================
  // INVENTORY MANAGEMENT ROUTES
  // ==================

  // Update menu item stock
  app.post("/api/inventory/menu-items/:id/stock", isAdmin, async (req, res) => {
    try {
      const menuItemId = parseInt(req.params.id);
      const { quantity, reason } = req.body;
      
      if (typeof quantity !== 'number') {
        return res.status(400).json({ message: "Quantity must be a number" });
      }
      
      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ message: "Reason is required" });
      }
      
      const userId = (req.user as any).id;
      const updatedMenuItem = await storage.updateMenuItemStock(menuItemId, quantity, reason, userId);
      
      if (!updatedMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(updatedMenuItem);
    } catch (error) {
      res.status(500).json({ message: String(error) });
    }
  });

  // Check menu item stock
  app.get("/api/inventory/menu-items/:id/stock", isAuthenticated, async (req, res) => {
    try {
      const menuItemId = parseInt(req.params.id);
      const stockInfo = await storage.checkMenuItemStock(menuItemId);
      res.json(stockInfo);
    } catch (error) {
      res.status(500).json({ message: String(error) });
    }
  });

  // Get inventory history
  app.get("/api/inventory/history", isAdmin, async (req, res) => {
    try {
      const menuItemId = req.query.menuItemId ? parseInt(req.query.menuItemId as string) : undefined;
      const history = await storage.getInventoryHistory(menuItemId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: String(error) });
    }
  });

  // ==================
  // CAFE SETTINGS ROUTES
  // ==================

  // Get cafe settings
  app.get("/api/cafe-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getCafeSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: String(error) });
    }
  });

  // Update cafe settings
  app.patch("/api/cafe-settings", isAdmin, async (req, res) => {
    try {
      const settingsData = insertCafeSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateCafeSettings(settingsData);
      res.json(updatedSettings);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
