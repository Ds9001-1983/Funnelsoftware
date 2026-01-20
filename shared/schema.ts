import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

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
    "divider", "spacer", "progressBar", "icon"
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

// Funnel schema for in-memory storage
export const funnelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  pages: z.array(funnelPageSchema),
  theme: z.object({
    primaryColor: z.string(),
    backgroundColor: z.string(),
    textColor: z.string(),
    fontFamily: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  views: z.number(),
  leads: z.number(),
});

export type Funnel = z.infer<typeof funnelSchema>;

export const insertFunnelSchema = funnelSchema.omit({ id: true, createdAt: true, updatedAt: true, views: true, leads: true });
export type InsertFunnel = z.infer<typeof insertFunnelSchema>;

// Lead schema for in-memory storage
export const leadSchema = z.object({
  id: z.string(),
  funnelId: z.string(),
  funnelName: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  answers: z.record(z.string(), z.any()).optional(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
  source: z.string().optional(),
  createdAt: z.string(),
});

export type Lead = z.infer<typeof leadSchema>;

export const insertLeadSchema = leadSchema.omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;

// Analytics schema
export const analyticsEventSchema = z.object({
  id: z.string(),
  funnelId: z.string(),
  eventType: z.enum(["view", "pageView", "click", "submit", "complete"]),
  pageId: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

// Template schema for funnel templates
export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["leads", "sales", "recruiting", "webinar", "quiz"]),
  thumbnail: z.string(),
  pages: z.array(funnelPageSchema),
  theme: z.object({
    primaryColor: z.string(),
    backgroundColor: z.string(),
    textColor: z.string(),
    fontFamily: z.string(),
  }),
});

export type Template = z.infer<typeof templateSchema>;
