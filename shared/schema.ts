import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============ DATABASE TABLES ============

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  trialEndsAt: timestamp("trial_ends_at"),
  isPro: boolean("is_pro").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Funnels table
export const funnels = pgTable("funnels", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  pages: jsonb("pages").notNull().default([]),
  theme: jsonb("theme").notNull().default({}),
  views: integer("views").notNull().default(0),
  leads: integer("leads_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique().default(sql`gen_random_uuid()`),
  funnelId: integer("funnel_id").notNull().references(() => funnels.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  message: text("message"),
  answers: jsonb("answers").default({}),
  status: text("status").notNull().default("new"), // new, contacted, qualified, converted, lost
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Templates table (global, not user-specific)
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // leads, sales, recruiting, webinar, quiz
  thumbnail: text("thumbnail"),
  pages: jsonb("pages").notNull().default([]),
  theme: jsonb("theme").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analytics events table
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  funnelId: integer("funnel_id").notNull().references(() => funnels.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // view, pageView, click, submit, complete
  pageId: text("page_id"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Sessions table for express-session with connect-pg-simple
export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// ============ ZOD SCHEMAS & TYPES ============

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
  trialEndsAt: true,
  isPro: true,
});

export const selectUserSchema = createSelectSchema(users);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Funnel Page Types
export type PageType = "welcome" | "question" | "multiChoice" | "contact" | "calendar" | "thankyou";

// Page element schema
export const pageElementSchema = z.object({
  id: z.string(),
  type: z.enum([
    "heading", "text", "image", "button", "input", "textarea",
    "select", "checkbox", "radio", "fileUpload", "video", "date",
    "slider", "testimonial", "faq", "list", "timer", "socialProof",
    "divider", "spacer", "progressBar", "icon", "quiz"
  ]),
  content: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  label: z.string().optional(),
  acceptedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  maxFiles: z.number().optional(),
  // Video element properties
  videoUrl: z.string().optional(),
  videoType: z.enum(["youtube", "vimeo", "upload"]).optional(),
  // Date element properties
  dateFormat: z.string().optional(),
  includeTime: z.boolean().optional(),
  // Slider/Testimonial properties
  slides: z.array(z.object({
    id: z.string(),
    image: z.string().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    author: z.string().optional(),
    role: z.string().optional(),
    rating: z.number().optional(),
  })).optional(),
  // FAQ properties
  faqItems: z.array(z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  })).optional(),
  // List properties
  listItems: z.array(z.object({
    id: z.string(),
    text: z.string(),
    icon: z.string().optional(),
  })).optional(),
  listStyle: z.enum(["bullet", "number", "check", "icon"]).optional(),
  // Timer properties
  timerEndDate: z.string().optional(),
  timerStyle: z.enum(["countdown", "stopwatch"]).optional(),
  timerShowDays: z.boolean().optional(),
  // Social Proof properties
  socialProofType: z.enum(["badges", "logos", "stats", "reviews"]).optional(),
  socialProofItems: z.array(z.object({
    id: z.string(),
    image: z.string().optional(),
    text: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  // Divider properties
  dividerStyle: z.enum(["solid", "dashed", "dotted", "gradient"]).optional(),
  // Spacer properties
  spacerHeight: z.number().optional(),
  // Icon properties
  iconName: z.string().optional(),
  iconSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
  // Image properties
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  // Quiz properties
  quizConfig: z.object({
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      answers: z.array(z.object({
        id: z.string(),
        text: z.string(),
        points: z.record(z.string(), z.number()),
      })),
    })),
    results: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      minPoints: z.number(),
      maxPoints: z.number(),
      color: z.string(),
    })),
    showProgressBar: z.boolean(),
    shuffleQuestions: z.boolean(),
    shuffleAnswers: z.boolean(),
  }).optional(),
  // General styles
  styles: z.object({
    fontSize: z.string().optional(),
    fontWeight: z.string().optional(),
    textAlign: z.string().optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    padding: z.string().optional(),
    margin: z.string().optional(),
    borderRadius: z.string().optional(),
  }).optional(),
});

export type PageElement = z.infer<typeof pageElementSchema>;

// Page transition animation types
export type PageAnimation = "fade" | "slide" | "scale" | "none";

// Conditional logic for page routing
export const pageConditionSchema = z.object({
  elementId: z.string(),
  operator: z.enum(["equals", "notEquals", "contains", "isEmpty"]),
  value: z.string().optional(),
  targetPageId: z.string(),
});

export type PageCondition = z.infer<typeof pageConditionSchema>;

// Funnel page schema
export const funnelPageSchema = z.object({
  id: z.string(),
  type: z.enum(["welcome", "question", "multiChoice", "contact", "calendar", "thankyou"]),
  title: z.string(),
  subtitle: z.string().optional(),
  elements: z.array(pageElementSchema),
  buttonText: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  // Animation settings
  animation: z.enum(["fade", "slide", "scale", "none"]).optional(),
  // Conditional logic for branching
  conditions: z.array(pageConditionSchema).optional(),
  // Simple conditional routing (option -> pageId mapping)
  conditionalRouting: z.record(z.string(), z.string()).optional(),
  // Default next page ID (overrides sequential navigation)
  nextPageId: z.string().optional(),
  // Show confetti on this page
  showConfetti: z.boolean().optional(),
});

export type FunnelPage = z.infer<typeof funnelPageSchema>;

// Theme schema
export const themeSchema = z.object({
  primaryColor: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
  fontFamily: z.string(),
});

export type Theme = z.infer<typeof themeSchema>;

// Funnel schema (for API responses)
export const funnelSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  userId: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  pages: z.array(funnelPageSchema),
  theme: themeSchema,
  views: z.number(),
  leads: z.number(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Funnel = z.infer<typeof funnelSchema>;

// Insert funnel schema
export const insertFunnelSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  pages: z.array(funnelPageSchema).default([]),
  theme: themeSchema.default({
    primaryColor: "#7C3AED",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Inter",
  }),
});

export type InsertFunnel = z.infer<typeof insertFunnelSchema>;

// Lead schema (for API responses)
export const leadSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  funnelId: z.number(),
  userId: z.number(),
  funnelName: z.string().optional(), // Joined from funnel
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  answers: z.record(z.string(), z.any()).optional().nullable(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
  source: z.string().optional().nullable(),
  createdAt: z.string().or(z.date()),
});

export type Lead = z.infer<typeof leadSchema>;

// Insert lead schema
export const insertLeadSchema = z.object({
  funnelId: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  answers: z.record(z.string(), z.any()).optional(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).default("new"),
  source: z.string().optional(),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;

// Analytics schema
export const analyticsEventSchema = z.object({
  id: z.number(),
  funnelId: z.number(),
  eventType: z.enum(["view", "pageView", "click", "submit", "complete"]),
  pageId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  timestamp: z.string().or(z.date()),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

// Insert analytics schema
export const insertAnalyticsSchema = z.object({
  funnelId: z.number(),
  eventType: z.enum(["view", "pageView", "click", "submit", "complete"]),
  pageId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

// Template schema (for API responses)
export const templateSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["leads", "sales", "recruiting", "webinar", "quiz"]),
  thumbnail: z.string().optional().nullable(),
  pages: z.array(funnelPageSchema),
  theme: themeSchema,
  createdAt: z.string().or(z.date()),
});

export type Template = z.infer<typeof templateSchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
  displayName: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
