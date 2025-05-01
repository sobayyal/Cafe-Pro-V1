import {
  users, User, InsertUser,
  categories, Category, InsertCategory,
  menuItems, MenuItem, InsertMenuItem,
  staff, Staff, InsertStaff,
  tables, Table, InsertTable,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem,
  cafeSettings, CafeSettings, InsertCafeSettings,
  inventoryHistory, InventoryHistory, InsertInventoryHistory,
  OrderWithDetails, DashboardStats, MenuItemWithStats
} from "@shared/schema";

// Storage interface for all CRUD operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;

  // Categories
  createCategory(category: InsertCategory): Promise<Category>;
  listCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Menu Items
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  listMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  getActiveMenuItems(): Promise<MenuItem[]>;

  // Staff
  createStaff(staffMember: InsertStaff): Promise<Staff>;
  listStaff(): Promise<Staff[]>;
  getStaff(id: number): Promise<Staff | undefined>;
  updateStaff(id: number, staffMember: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<boolean>;
  getActiveStaff(): Promise<Staff[]>;

  // Tables
  createTable(table: InsertTable): Promise<Table>;
  listTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;
  getAvailableTables(): Promise<Table[]>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  listOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByOrderId(orderId: string): Promise<Order | undefined>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  getRecentOrders(limit: number): Promise<OrderWithDetails[]>;
  getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined>;

  // Order Items
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  getTopMenuItems(limit: number): Promise<MenuItemWithStats[]>;
  
  // Inventory Management
  updateMenuItemStock(id: number, quantity: number, reason: string, userId: number): Promise<MenuItem | undefined>;
  checkMenuItemStock(id: number): Promise<{ available: boolean; quantity: number }>;
  getInventoryHistory(menuItemId?: number): Promise<InventoryHistory[]>;
  
  // Cafe Settings (Receipt Text)
  getCafeSettings(): Promise<CafeSettings>;
  updateCafeSettings(settings: Partial<InsertCafeSettings>): Promise<CafeSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private menuItems: Map<number, MenuItem>;
  private staffMembers: Map<number, Staff>;
  private tables: Map<number, Table>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private cafeSettings: CafeSettings | null;
  private inventoryHistories: Map<number, InventoryHistory>;
  
  private userId: number;
  private categoryId: number;
  private menuItemId: number;
  private staffId: number;
  private tableId: number;
  private orderId: number;
  private orderItemId: number;
  private orderIdCounter: number;
  private inventoryHistoryId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.menuItems = new Map();
    this.staffMembers = new Map();
    this.tables = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.inventoryHistories = new Map();
    this.cafeSettings = null;
    
    this.userId = 1;
    this.categoryId = 1;
    this.menuItemId = 1;
    this.staffId = 1;
    this.tableId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.inventoryHistoryId = 1;
    this.orderIdCounter = 5182; // Start with #ORD-5182

    // Initialize with default data
    this.initDefaultData();
  }

  // Initialize with some default data
  private initDefaultData(): void {
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Admin User",
      role: "admin"
    });

    // Create default staff user
    this.createUser({
      username: "staff",
      password: "staff123",
      name: "Staff User",
      role: "staff"
    });

    // Create some default categories
    const hotDrinks = this.createCategory({ name: "Hot Drinks", icon: "ri-cup-line" });
    const coldDrinks = this.createCategory({ name: "Cold Drinks", icon: "ri-ice-cream-line" });
    const bakery = this.createCategory({ name: "Bakery", icon: "ri-cake-3-line" });
    
    // Create some default menu items
    this.createMenuItem({
      name: "Cappuccino",
      description: "Rich espresso with steamed milk",
      price: 450, // In PKR
      categoryId: hotDrinks.id,
      icon: "ri-cup-line",
      active: true,
      stockQuantity: 50,
      trackInventory: true
    });

    this.createMenuItem({
      name: "Latte",
      description: "Espresso with steamed milk",
      price: 425, // In PKR
      categoryId: hotDrinks.id,
      icon: "ri-cup-line",
      active: true,
      stockQuantity: 45,
      trackInventory: true
    });

    this.createMenuItem({
      name: "Espresso",
      description: "Double shot of espresso",
      price: 325, // In PKR
      categoryId: hotDrinks.id,
      icon: "ri-goblet-line",
      active: true,
      stockQuantity: 100,
      trackInventory: true
    });

    this.createMenuItem({
      name: "Iced Latte",
      description: "Espresso with cold milk and ice",
      price: 525, // In PKR
      categoryId: coldDrinks.id,
      icon: "ri-ice-cream-line",
      active: true,
      stockQuantity: 30,
      trackInventory: true
    });

    this.createMenuItem({
      name: "Croissant",
      description: "Buttery, flaky pastry",
      price: 395, // In PKR
      categoryId: bakery.id,
      icon: "ri-bread-line",
      active: true,
      stockQuantity: 25,
      trackInventory: true
    });

    this.createMenuItem({
      name: "Cheesecake",
      description: "Creamy NY style cheesecake",
      price: 675, // In PKR
      categoryId: bakery.id,
      icon: "ri-cake-3-line",
      active: true,
      stockQuantity: 15,
      trackInventory: true
    });

    // Create some default staff
    this.createStaff({ name: "Sarah K.", active: true });
    this.createStaff({ name: "Mike J.", active: true });
    this.createStaff({ name: "Lisa M.", active: true });
    this.createStaff({ name: "David R.", active: true });

    // Create some default tables
    for (let i = 1; i <= 12; i++) {
      this.createTable({
        name: `Table ${i}`,
        capacity: 4,
        status: i % 3 === 0 ? "occupied" : "available"
      });
    }

    // Create some sample orders
    const order1 = this.createOrder({
      orderId: `#ORD-${this.orderIdCounter++}`,
      tableId: 8,
      staffId: 1,
      status: "completed",
      subtotal: 4850, // PKR
      tax: 390, // PKR
      tip: 700, // PKR
      total: 5940, // PKR
      paymentMethod: "credit_card"
    });

    const order2 = this.createOrder({
      orderId: `#ORD-${this.orderIdCounter++}`,
      tableId: 12,
      staffId: 2,
      status: "in_progress",
      subtotal: 3500, // PKR
      tax: 280, // PKR
      total: 3780, // PKR
      paymentMethod: "cash"
    });

    const order3 = this.createOrder({
      orderId: `#ORD-${this.orderIdCounter++}`,
      tableId: 5,
      staffId: 3,
      status: "completed",
      subtotal: 2600, // PKR
      tax: 210, // PKR
      total: 2810, // PKR
      paymentMethod: "credit_card"
    });

    const order4 = this.createOrder({
      orderId: `#ORD-${this.orderIdCounter++}`,
      tableId: 3,
      staffId: 1,
      status: "preparing",
      subtotal: 4060, // PKR
      tax: 330, // PKR
      total: 4390, // PKR
      paymentMethod: "cash"
    });

    const order5 = this.createOrder({
      orderId: `#ORD-${this.orderIdCounter++}`,
      tableId: 9,
      staffId: 2,
      status: "completed",
      subtotal: 1800, // PKR
      tax: 150, // PKR
      total: 1950, // PKR
      paymentMethod: "credit_card"
    });

    // Add order items to the sample orders
    this.createOrderItem({
      orderId: order1.id,
      menuItemId: 1, // Cappuccino
      quantity: 2,
      price: 450, // PKR
      subtotal: 900 // PKR
    });

    this.createOrderItem({
      orderId: order1.id,
      menuItemId: 6, // Cheesecake
      quantity: 1,
      price: 675, // PKR
      subtotal: 675 // PKR
    });

    this.createOrderItem({
      orderId: order2.id,
      menuItemId: 4, // Iced Latte
      quantity: 2,
      price: 525, // PKR
      subtotal: 1050 // PKR
    });

    this.createOrderItem({
      orderId: order3.id,
      menuItemId: 2, // Latte
      quantity: 1,
      price: 425, // PKR
      subtotal: 425 // PKR
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Categories
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Menu Items
  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemId++;
    const menuItem: MenuItem = { ...insertMenuItem, id };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }

  async listMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async updateMenuItem(id: number, menuItemData: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) return undefined;

    const updatedMenuItem = { ...menuItem, ...menuItemData };
    this.menuItems.set(id, updatedMenuItem);
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      item => item.categoryId === categoryId
    );
  }

  async getActiveMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      item => item.active
    );
  }

  // Staff
  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const id = this.staffId++;
    const staff: Staff = { ...insertStaff, id };
    this.staffMembers.set(id, staff);
    return staff;
  }

  async listStaff(): Promise<Staff[]> {
    return Array.from(this.staffMembers.values());
  }

  async getStaff(id: number): Promise<Staff | undefined> {
    return this.staffMembers.get(id);
  }

  async updateStaff(id: number, staffData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const staff = this.staffMembers.get(id);
    if (!staff) return undefined;

    const updatedStaff = { ...staff, ...staffData };
    this.staffMembers.set(id, updatedStaff);
    return updatedStaff;
  }

  async deleteStaff(id: number): Promise<boolean> {
    return this.staffMembers.delete(id);
  }

  async getActiveStaff(): Promise<Staff[]> {
    return Array.from(this.staffMembers.values()).filter(
      staff => staff.active
    );
  }

  // Tables
  async createTable(insertTable: InsertTable): Promise<Table> {
    const id = this.tableId++;
    const table: Table = { ...insertTable, id };
    this.tables.set(id, table);
    return table;
  }

  async listTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }

  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }

  async updateTable(id: number, tableData: Partial<InsertTable>): Promise<Table | undefined> {
    const table = this.tables.get(id);
    if (!table) return undefined;

    const updatedTable = { ...table, ...tableData };
    this.tables.set(id, updatedTable);
    return updatedTable;
  }

  async deleteTable(id: number): Promise<boolean> {
    return this.tables.delete(id);
  }

  async getAvailableTables(): Promise<Table[]> {
    return Array.from(this.tables.values()).filter(
      table => table.status === "available"
    );
  }

  // Orders
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const now = new Date();
    const order: Order = { 
      ...insertOrder, 
      id,
      createdAt: now
    };
    this.orders.set(id, order);
    return order;
  }

  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      order => order.orderId === orderId
    );
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, ...orderData };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getRecentOrders(limit: number): Promise<OrderWithDetails[]> {
    const allOrders = Array.from(this.orders.values())
      .sort((a, b) => {
        // Sort by createdAt in descending order (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);

    const result = [];
    
    for (const order of allOrders) {
      const items = await this.getOrderItems(order.id);
      const itemsWithMenuItems = [];
      
      for (const item of items) {
        const menuItem = await this.getMenuItem(item.menuItemId);
        if (menuItem) {
          itemsWithMenuItems.push({
            ...item,
            menuItem
          });
        }
      }
      
      const table = await this.getTable(order.tableId);
      const server = await this.getStaff(order.staffId);
      
      if (table && server) {
        result.push({
          ...order,
          items: itemsWithMenuItems,
          table,
          server
        });
      }
    }

    return result;
  }

  async getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const items = await this.getOrderItems(order.id);
    const itemsWithMenuItems = [];
    
    for (const item of items) {
      const menuItem = await this.getMenuItem(item.menuItemId);
      if (menuItem) {
        itemsWithMenuItems.push({
          ...item,
          menuItem
        });
      }
    }
    
    const table = await this.getTable(order.tableId);
    const server = await this.getStaff(order.staffId);
    
    if (!table || !server) return undefined;
    
    return {
      ...order,
      items: itemsWithMenuItems,
      table,
      server
    };
  }

  // Order Items
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemId++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      item => item.orderId === orderId
    );
  }

  async updateOrderItem(id: number, orderItemData: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return undefined;

    const updatedOrderItem = { ...orderItem, ...orderItemData };
    this.orderItems.set(id, updatedOrderItem);
    return updatedOrderItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const allOrders = await this.listOrders();
    const totalOrders = allOrders.length;
    
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
    
    const avgOrderValue = totalOrders > 0 
      ? parseFloat((totalRevenue / totalOrders).toFixed(2)) 
      : 0;
    
    const activeStaff = (await this.getActiveStaff()).length;
    
    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      activeStaff
    };
  }

  async getTopMenuItems(limit: number): Promise<MenuItemWithStats[]> {
    const allOrderItems = Array.from(this.orderItems.values());
    const menuItemSales = new Map<number, { count: number, trend: number }>();
    
    // Count sales for each menu item
    for (const orderItem of allOrderItems) {
      const { menuItemId, quantity } = orderItem;
      const current = menuItemSales.get(menuItemId) || { count: 0, trend: 0 };
      current.count += quantity;
      menuItemSales.set(menuItemId, current);
    }
    
    const result: MenuItemWithStats[] = [];
    
    for (const [menuItemId, stats] of menuItemSales.entries()) {
      const menuItem = await this.getMenuItem(menuItemId);
      if (menuItem) {
        // Generate a random trend between -10 and +15 for demo
        const trend = Math.floor(Math.random() * 25) - 10;
        result.push({
          ...menuItem,
          soldCount: stats.count,
          trend
        });
      }
    }
    
    // Sort by soldCount in descending order and take top items
    return result
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, limit);
  }
  
  // Inventory Management
  async updateMenuItemStock(id: number, quantity: number, reason: string, userId: number): Promise<MenuItem | undefined> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) return undefined;
    
    // Get current stock
    const previousStock = menuItem.stockQuantity || 0;
    const newStock = previousStock + quantity;
    
    // Update menu item stock
    const updatedMenuItem = { 
      ...menuItem, 
      stockQuantity: newStock,
      trackInventory: true // Enable tracking if updating stock
    };
    this.menuItems.set(id, updatedMenuItem);
    
    // Record inventory history
    const historyId = this.inventoryHistoryId++;
    const history: InventoryHistory = {
      id: historyId,
      menuItemId: id,
      quantityChange: quantity,
      reason,
      previousStock,
      newStock,
      userId,
      createdAt: new Date()
    };
    this.inventoryHistories.set(historyId, history);
    
    return updatedMenuItem;
  }
  
  async checkMenuItemStock(id: number): Promise<{ available: boolean; quantity: number }> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) {
      return { available: false, quantity: 0 };
    }
    
    if (!menuItem.trackInventory) {
      return { available: true, quantity: -1 }; // -1 indicates unlimited stock
    }
    
    const quantity = menuItem.stockQuantity || 0;
    return { 
      available: quantity > 0, 
      quantity
    };
  }
  
  async getInventoryHistory(menuItemId?: number): Promise<InventoryHistory[]> {
    let history = Array.from(this.inventoryHistories.values());
    
    // Filter by menuItemId if provided
    if (menuItemId) {
      history = history.filter(h => h.menuItemId === menuItemId);
    }
    
    // Sort by date (newest first)
    return history.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  // Cafe Settings (Receipt Text)
  async getCafeSettings(): Promise<CafeSettings> {
    if (!this.cafeSettings) {
      // Create default settings if none exist
      this.cafeSettings = {
        id: 1,
        receiptHeader: "Thank you for visiting our cafe!",
        receiptFooter: "Please come again!",
        taxRate: 0.10,
        cafeName: "Cafe Management System",
        cafeAddress: "",
        cafePhone: "",
        logoUrl: ""
      };
    }
    
    return this.cafeSettings;
  }
  
  async updateCafeSettings(settings: Partial<InsertCafeSettings>): Promise<CafeSettings> {
    // Get current settings or create default
    const currentSettings = await this.getCafeSettings();
    
    // Update settings
    this.cafeSettings = {
      ...currentSettings,
      ...settings
    };
    
    return this.cafeSettings;
  }
}

export const storage = new MemStorage();
