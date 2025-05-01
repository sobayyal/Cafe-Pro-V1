import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (Admin or Staff)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("staff"), // "admin" or "staff"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

// Menu categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("ri-restaurant-line"),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
});

// Menu items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  categoryId: integer("category_id").notNull(),
  icon: text("icon").notNull().default("ri-restaurant-line"),
  active: boolean("active").notNull().default(true),
  stockQuantity: integer("stock_quantity").default(0),
  trackInventory: boolean("track_inventory").notNull().default(false),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  categoryId: true, 
  icon: true,
  active: true,
  stockQuantity: true,
  trackInventory: true,
});

// Staff (waiters)
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertStaffSchema = createInsertSchema(staff).pick({
  name: true,
  active: true,
});

// Tables
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull().default(4),
  status: text("status").notNull().default("available"), // available, occupied, reserved
});

export const insertTableSchema = createInsertSchema(tables).pick({
  name: true,
  capacity: true,
  status: true,
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(), // Like #ORD-5182
  tableId: integer("table_id").notNull(),
  staffId: integer("staff_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, preparing, completed, cancelled
  subtotal: doublePrecision("subtotal").notNull(),
  tax: doublePrecision("tax").notNull(),
  tip: doublePrecision("tip").default(0),
  total: doublePrecision("total").notNull(),
  paymentMethod: text("payment_method").default("cash"), // cash, credit_card, other
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

// Order items (items in an order)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: doublePrecision("price").notNull(), // Price at the time of order
  notes: text("notes"),
  subtotal: doublePrecision("subtotal").notNull(), // quantity * price
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Extended types for the frontend
export interface OrderWithDetails extends Order {
  items: (OrderItem & { menuItem: MenuItem })[];
  table: Table;
  server: Staff;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  activeStaff: number;
}

export interface MenuItemWithStats extends MenuItem {
  soldCount: number;
  trend: number; // percentage change
}

// Settings for cafe (receipt text, etc)
export const cafeSettings = pgTable("cafe_settings", {
  id: serial("id").primaryKey(),
  receiptHeader: text("receipt_header").default("Thank you for visiting our cafe!"),
  receiptFooter: text("receipt_footer").default("Please come again!"),
  taxRate: doublePrecision("tax_rate").notNull().default(0.10),
  cafeName: text("cafe_name").notNull().default("Cafe Management System"),
  cafeAddress: text("cafe_address").default(""),
  cafePhone: text("cafe_phone").default(""),
  logoUrl: text("logo_url").default(""),
});

export const insertCafeSettingsSchema = createInsertSchema(cafeSettings).omit({
  id: true,
});

export type CafeSettings = typeof cafeSettings.$inferSelect;
export type InsertCafeSettings = z.infer<typeof insertCafeSettingsSchema>;

// Inventory history for tracking stock changes
export const inventoryHistory = pgTable("inventory_history", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull(),
  quantityChange: integer("quantity_change").notNull(),
  reason: text("reason").notNull(), // "order", "stock_update", "adjustment", etc.
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  userId: integer("user_id").notNull(), // Who made the change
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventoryHistorySchema = createInsertSchema(inventoryHistory).omit({
  id: true,
  createdAt: true,
});

export type InventoryHistory = typeof inventoryHistory.$inferSelect;
export type InsertInventoryHistory = z.infer<typeof insertInventoryHistorySchema>;
