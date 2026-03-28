import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, funnels, leads, templates, analyticsEvents, passwordResetTokens,
  teams, teamMembers, apiKeys,
  type User, type InsertUser, type Funnel, type InsertFunnel,
  type Lead, type InsertLead, type AnalyticsEvent, type Template,
  type FunnelPage, type Theme,
  type Team, type InsertTeam, type TeamMember, type ApiKey, type InsertApiKey,
} from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void>;
  updateSubscriptionFromStripe(userId: number, updates: {
    isPro?: boolean;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    stripeSubscriptionId?: string | null;
    subscriptionStartedAt?: Date | null;
  }): Promise<void>;

  // Funnels
  getFunnels(userId: number): Promise<Funnel[]>;
  getFunnel(id: number, userId: number): Promise<Funnel | undefined>;
  getFunnelByUuid(uuid: string): Promise<Funnel | undefined>;
  getFunnelBySlug(slug: string): Promise<Funnel | undefined>;
  getFunnelBySlugOrUuid(identifier: string): Promise<Funnel | undefined>;
  isSlugAvailable(slug: string, excludeFunnelId?: number): Promise<boolean>;
  createFunnel(funnel: InsertFunnel, userId: number): Promise<Funnel>;
  updateFunnel(id: number, userId: number, funnel: Partial<Funnel>): Promise<Funnel | undefined>;
  deleteFunnel(id: number, userId: number): Promise<boolean>;

  // Leads
  getLeads(userId: number): Promise<Lead[]>;
  getLeadsByFunnel(funnelId: number, userId: number): Promise<Lead[]>;
  getLead(id: number, userId: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead, userId: number): Promise<Lead>;
  updateLead(id: number, userId: number, lead: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: number, userId: number): Promise<boolean>;

  // Analytics
  getAnalytics(funnelId: number): Promise<AnalyticsEvent[]>;
  createAnalyticsEvent(event: Omit<AnalyticsEvent, "id" | "timestamp">): Promise<AnalyticsEvent>;

  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  seedTemplates(): Promise<void>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // ============ USERS ============

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(insertUser.password);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();
    return user;
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
    await db.update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateSubscriptionFromStripe(userId: number, updates: {
    isPro?: boolean;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    stripeSubscriptionId?: string | null;
    subscriptionStartedAt?: Date | null;
  }): Promise<void> {
    await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // ============ FUNNELS ============

  async getFunnels(userId: number): Promise<Funnel[]> {
    const result = await db.select().from(funnels)
      .where(and(eq(funnels.userId, userId), sql`${funnels.deletedAt} IS NULL`))
      .orderBy(desc(funnels.updatedAt));

    return result.map(f => this.mapFunnelToResponse(f));
  }

  async getFunnel(id: number, userId: number): Promise<Funnel | undefined> {
    const [funnel] = await db.select().from(funnels)
      .where(and(eq(funnels.id, id), eq(funnels.userId, userId), sql`${funnels.deletedAt} IS NULL`));

    return funnel ? this.mapFunnelToResponse(funnel) : undefined;
  }

  async getFunnelByUuid(uuid: string): Promise<Funnel | undefined> {
    const [funnel] = await db.select().from(funnels)
      .where(and(eq(funnels.uuid, uuid), sql`${funnels.deletedAt} IS NULL`));
    return funnel ? this.mapFunnelToResponse(funnel) : undefined;
  }

  async getFunnelBySlug(slug: string): Promise<Funnel | undefined> {
    const [funnel] = await db.select().from(funnels)
      .where(and(eq(funnels.slug, slug), sql`${funnels.deletedAt} IS NULL`));
    return funnel ? this.mapFunnelToResponse(funnel) : undefined;
  }

  async getFunnelBySlugOrUuid(identifier: string): Promise<Funnel | undefined> {
    // UUID pattern: 8-4-4-4-12 hex chars
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (isUuid) {
      return this.getFunnelByUuid(identifier);
    }
    // Try slug first, fall back to UUID (in case of non-standard UUID format)
    const bySlug = await this.getFunnelBySlug(identifier);
    if (bySlug) return bySlug;
    return this.getFunnelByUuid(identifier);
  }

  async isSlugAvailable(slug: string, excludeFunnelId?: number): Promise<boolean> {
    const conditions = [eq(funnels.slug, slug), sql`${funnels.deletedAt} IS NULL`];
    if (excludeFunnelId) {
      conditions.push(sql`${funnels.id} != ${excludeFunnelId}`);
    }
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(funnels)
      .where(and(...conditions));
    return Number(result?.count || 0) === 0;
  }

  async createFunnel(insertFunnel: InsertFunnel, userId: number): Promise<Funnel> {
    const [funnel] = await db.insert(funnels).values({
      userId,
      name: insertFunnel.name,
      description: insertFunnel.description || null,
      status: insertFunnel.status || "draft",
      pages: insertFunnel.pages || [],
      theme: insertFunnel.theme || {
        primaryColor: "#7C3AED",
        backgroundColor: "#ffffff",
        textColor: "#1a1a1a",
        fontFamily: "Inter",
      },
    }).returning();

    return this.mapFunnelToResponse(funnel);
  }

  async updateFunnel(id: number, userId: number, updates: Partial<Funnel>): Promise<Funnel | undefined> {
    // Only allow updating specific fields
    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.pages !== undefined) updateData.pages = updates.pages;
    if (updates.theme !== undefined) updateData.theme = updates.theme;
    if (updates.webhookUrl !== undefined) updateData.webhookUrl = updates.webhookUrl;
    if (updates.webhookEnabled !== undefined) updateData.webhookEnabled = updates.webhookEnabled;
    if (updates.webhookSecret !== undefined) updateData.webhookSecret = updates.webhookSecret;
    if (updates.gtmId !== undefined) updateData.gtmId = updates.gtmId;
    if (updates.views !== undefined) updateData.views = updates.views;
    if (updates.leads !== undefined) updateData.leads = updates.leads;

    updateData.updatedAt = new Date();

    const [funnel] = await db.update(funnels)
      .set(updateData)
      .where(and(eq(funnels.id, id), eq(funnels.userId, userId)))
      .returning();

    return funnel ? this.mapFunnelToResponse(funnel) : undefined;
  }

  async deleteFunnel(id: number, userId: number): Promise<boolean> {
    // Soft-Delete: setze deletedAt statt physischem Löschen
    const result = await db.update(funnels)
      .set({ deletedAt: new Date() })
      .where(and(eq(funnels.id, id), eq(funnels.userId, userId), sql`${funnels.deletedAt} IS NULL`))
      .returning({ id: funnels.id });

    return result.length > 0;
  }

  private mapFunnelToResponse(funnel: typeof funnels.$inferSelect): Funnel {
    return {
      id: funnel.id,
      uuid: funnel.uuid,
      slug: funnel.slug,
      userId: funnel.userId,
      name: funnel.name,
      description: funnel.description,
      status: funnel.status as "draft" | "published" | "archived",
      pages: funnel.pages as FunnelPage[],
      theme: funnel.theme as Theme,
      webhookUrl: funnel.webhookUrl,
      webhookEnabled: funnel.webhookEnabled,
      webhookSecret: funnel.webhookSecret,
      gtmId: funnel.gtmId,
      views: funnel.views,
      leads: funnel.leads,
      createdAt: funnel.createdAt.toISOString(),
      updatedAt: funnel.updatedAt.toISOString(),
    };
  }

  // ============ LEADS ============

  async getLeads(userId: number): Promise<Lead[]> {
    const result = await db
      .select({
        lead: leads,
        funnelName: funnels.name,
      })
      .from(leads)
      .leftJoin(funnels, eq(leads.funnelId, funnels.id))
      .where(eq(leads.userId, userId))
      .orderBy(desc(leads.createdAt));

    return result.map(r => this.mapLeadToResponse(r.lead, r.funnelName));
  }

  async getLeadsByFunnel(funnelId: number, userId: number): Promise<Lead[]> {
    const result = await db
      .select({
        lead: leads,
        funnelName: funnels.name,
      })
      .from(leads)
      .leftJoin(funnels, eq(leads.funnelId, funnels.id))
      .where(and(eq(leads.funnelId, funnelId), eq(leads.userId, userId)))
      .orderBy(desc(leads.createdAt));

    return result.map(r => this.mapLeadToResponse(r.lead, r.funnelName));
  }

  async getLead(id: number, userId: number): Promise<Lead | undefined> {
    const [result] = await db
      .select({
        lead: leads,
        funnelName: funnels.name,
      })
      .from(leads)
      .leftJoin(funnels, eq(leads.funnelId, funnels.id))
      .where(and(eq(leads.id, id), eq(leads.userId, userId)));

    return result ? this.mapLeadToResponse(result.lead, result.funnelName) : undefined;
  }

  async createLead(insertLead: InsertLead, userId: number): Promise<Lead> {
    // Transaction: Lead erstellen + Counter erhöhen atomar
    return await db.transaction(async (tx) => {
      const [lead] = await tx.insert(leads).values({
        ...insertLead,
        userId,
      }).returning();

      // Increment leads count on funnel
      await tx.update(funnels)
        .set({ leads: sql`${funnels.leads} + 1` })
        .where(eq(funnels.id, insertLead.funnelId));

      // Get funnel name
      const [funnel] = await tx.select({ name: funnels.name })
        .from(funnels)
        .where(eq(funnels.id, insertLead.funnelId));

      return this.mapLeadToResponse(lead, funnel?.name);
    });
  }

  async updateLead(id: number, userId: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.message !== undefined) updateData.message = updates.message;
    if (updates.answers !== undefined) updateData.answers = updates.answers;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.source !== undefined) updateData.source = updates.source;

    const [lead] = await db.update(leads)
      .set(updateData)
      .where(and(eq(leads.id, id), eq(leads.userId, userId)))
      .returning();

    if (!lead) return undefined;

    const [funnel] = await db.select({ name: funnels.name })
      .from(funnels)
      .where(eq(funnels.id, lead.funnelId));

    return this.mapLeadToResponse(lead, funnel?.name);
  }

  async deleteLead(id: number, userId: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const result = await tx.delete(leads)
        .where(and(eq(leads.id, id), eq(leads.userId, userId)))
        .returning({ id: leads.id, funnelId: leads.funnelId });

      if (result.length === 0) return false;

      // Decrement leads count on funnel
      await tx.update(funnels)
        .set({ leads: sql`GREATEST(${funnels.leads} - 1, 0)` })
        .where(eq(funnels.id, result[0].funnelId));

      return true;
    });
  }

  private mapLeadToResponse(lead: typeof leads.$inferSelect, funnelName?: string | null): Lead {
    return {
      id: lead.id,
      uuid: lead.uuid,
      funnelId: lead.funnelId,
      userId: lead.userId,
      funnelName: funnelName || undefined,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      message: lead.message,
      answers: lead.answers as Record<string, any> | null,
      status: lead.status as "new" | "contacted" | "qualified" | "converted" | "lost",
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
    };
  }

  // ============ ANALYTICS ============

  async getAnalytics(funnelId: number): Promise<AnalyticsEvent[]> {
    const result = await db.select().from(analyticsEvents)
      .where(eq(analyticsEvents.funnelId, funnelId))
      .orderBy(desc(analyticsEvents.timestamp));

    return result.map(e => ({
      id: e.id,
      funnelId: e.funnelId,
      eventType: e.eventType as "view" | "pageView" | "click" | "submit" | "complete",
      pageId: e.pageId,
      metadata: e.metadata as Record<string, any> | null,
      timestamp: e.timestamp.toISOString(),
    }));
  }

  async createAnalyticsEvent(event: Omit<AnalyticsEvent, "id" | "timestamp">): Promise<AnalyticsEvent> {
    const [result] = await db.insert(analyticsEvents).values({
      funnelId: event.funnelId,
      eventType: event.eventType,
      pageId: event.pageId || null,
      metadata: event.metadata || {},
    }).returning();

    // Update views count if it's a view event
    if (event.eventType === "view") {
      await db.update(funnels)
        .set({ views: sql`${funnels.views} + 1` })
        .where(eq(funnels.id, event.funnelId));
    }

    return {
      id: result.id,
      funnelId: result.funnelId,
      eventType: result.eventType as "view" | "pageView" | "click" | "submit" | "complete",
      pageId: result.pageId,
      metadata: result.metadata as Record<string, any> | null,
      timestamp: result.timestamp.toISOString(),
    };
  }

  // ============ TEMPLATES ============

  async getTemplates(): Promise<Template[]> {
    const result = await db.select().from(templates);
    return result.map(t => this.mapTemplateToResponse(t));
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template ? this.mapTemplateToResponse(template) : undefined;
  }

  private mapTemplateToResponse(template: typeof templates.$inferSelect): Template {
    return {
      id: template.id,
      uuid: template.uuid,
      name: template.name,
      description: template.description,
      category: template.category as "leads" | "sales" | "recruiting" | "webinar" | "quiz",
      thumbnail: template.thumbnail,
      pages: template.pages as FunnelPage[],
      theme: template.theme as Theme,
      createdAt: template.createdAt.toISOString(),
    };
  }

  // Restore soft-deleted funnel
  async restoreFunnel(id: number, userId: number): Promise<boolean> {
    const result = await db.update(funnels)
      .set({ deletedAt: null })
      .where(and(eq(funnels.id, id), eq(funnels.userId, userId), sql`${funnels.deletedAt} IS NOT NULL`))
      .returning({ id: funnels.id });

    return result.length > 0;
  }

  // Email Verification
  async verifyEmail(token: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(and(
        eq(users.emailVerificationToken, token),
        sql`${users.emailVerifiedAt} IS NULL`
      ));

    if (!user) return undefined;

    await db.update(users)
      .set({
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return user;
  }

  // Update email verification token (for resend)
  async updateEmailVerificationToken(userId: number, token: string): Promise<void> {
    await db.update(users)
      .set({ emailVerificationToken: token, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Password Reset Tokens
  async createPasswordResetToken(userId: number): Promise<string> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Stunde

    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<number | null> {
    const [result] = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        sql`${passwordResetTokens.expiresAt} > NOW()`,
        sql`${passwordResetTokens.usedAt} IS NULL`
      ));

    return result ? result.userId : null;
  }

  async markTokenUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Seed templates if they don't exist
  async seedTemplates(): Promise<void> {
    const existingTemplates = await db.select({ id: templates.id }).from(templates).limit(1);
    if (existingTemplates.length > 0) return;

    const defaultTemplates = [
      {
        name: "Lead-Generierung",
        description: "Sammle qualifizierte Leads mit einem mehrstufigen Funnel",
        category: "leads",
        thumbnail: "/templates/lead-gen.png",
        pages: [
          { id: "page-1", type: "welcome", title: "Bereit für mehr Kunden?", subtitle: "Entdecke, wie wir dein Business auf das nächste Level bringen", elements: [], buttonText: "Jetzt starten", backgroundColor: "#7C3AED" },
          { id: "page-2", type: "question", title: "Was ist deine größte Herausforderung?", elements: [], buttonText: "Weiter" },
          { id: "page-3", type: "contact", title: "Lass uns sprechen!", subtitle: "Trage deine Kontaktdaten ein", elements: [{ id: "el-1", type: "input", placeholder: "Dein Name", required: true }, { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true }, { id: "el-3", type: "input", placeholder: "Deine Telefonnummer" }], buttonText: "Absenden" },
          { id: "page-4", type: "thankyou", title: "Vielen Dank!", subtitle: "Wir melden uns innerhalb von 24 Stunden bei dir", elements: [] },
        ],
        theme: { primaryColor: "#7C3AED", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
      },
      {
        name: "Webinar-Anmeldung",
        description: "Maximiere die Anmeldungen für dein Webinar",
        category: "webinar",
        thumbnail: "/templates/webinar.png",
        pages: [
          { id: "page-1", type: "welcome", title: "Kostenloses Webinar", subtitle: "Lerne die Geheimnisse erfolgreicher Unternehmer", elements: [], buttonText: "Jetzt anmelden", backgroundColor: "#2563EB" },
          { id: "page-2", type: "contact", title: "Sichere dir deinen Platz", elements: [{ id: "el-1", type: "input", placeholder: "Dein Name", required: true }, { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true }], buttonText: "Platz reservieren" },
          { id: "page-3", type: "thankyou", title: "Du bist dabei!", subtitle: "Check deine E-Mails für den Zugangslink", elements: [] },
        ],
        theme: { primaryColor: "#2563EB", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
      },
      {
        name: "Interaktives Quiz",
        description: "Qualifiziere Leads mit einem unterhaltsamen Quiz",
        category: "quiz",
        thumbnail: "/templates/quiz.png",
        pages: [
          { id: "page-1", type: "welcome", title: "Finde heraus, welcher Typ du bist!", subtitle: "Beantworte 3 kurze Fragen", elements: [], buttonText: "Quiz starten", backgroundColor: "#10B981" },
          { id: "page-2", type: "multiChoice", title: "Was beschreibt dich am besten?", elements: [{ id: "el-1", type: "radio", options: ["Kreativ", "Analytisch", "Teamplayer", "Führungspersönlichkeit"] }], buttonText: "Weiter" },
          { id: "page-3", type: "multiChoice", title: "Wie triffst du Entscheidungen?", elements: [{ id: "el-1", type: "radio", options: ["Mit dem Bauch", "Datenbasiert", "Im Team", "Spontan"] }], buttonText: "Weiter" },
          { id: "page-4", type: "contact", title: "Fast geschafft!", subtitle: "Wohin sollen wir dein Ergebnis senden?", elements: [{ id: "el-1", type: "input", placeholder: "Deine E-Mail", required: true }], buttonText: "Ergebnis anzeigen" },
          { id: "page-5", type: "thankyou", title: "Du bist ein Innovator!", subtitle: "Check deine E-Mail für mehr Details", elements: [] },
        ],
        theme: { primaryColor: "#10B981", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
      },
      {
        name: "Schnell-Bewerbung",
        description: "Finde Top-Talente mit einem mobilen Bewerbungs-Funnel",
        category: "recruiting",
        thumbnail: "/templates/recruiting.png",
        pages: [
          { id: "page-1", type: "welcome", title: "Werde Teil unseres Teams!", subtitle: "Bewirb dich in unter 2 Minuten", elements: [], buttonText: "Jetzt bewerben", backgroundColor: "#F59E0B" },
          { id: "page-2", type: "question", title: "Welche Position interessiert dich?", elements: [{ id: "el-1", type: "radio", options: ["Vertrieb", "Marketing", "Entwicklung", "Kundenservice"] }], buttonText: "Weiter" },
          { id: "page-3", type: "question", title: "Wie viel Erfahrung bringst du mit?", elements: [{ id: "el-1", type: "radio", options: ["0-1 Jahre", "2-5 Jahre", "5+ Jahre"] }], buttonText: "Weiter" },
          { id: "page-4", type: "contact", title: "Deine Kontaktdaten", elements: [{ id: "el-1", type: "input", placeholder: "Dein Name", required: true }, { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true }, { id: "el-3", type: "input", placeholder: "Deine Telefonnummer", required: true }, { id: "el-4", type: "textarea", placeholder: "Erzähl uns kurz von dir..." }], buttonText: "Bewerbung absenden" },
          { id: "page-5", type: "thankyou", title: "Bewerbung erhalten!", subtitle: "Wir melden uns in den nächsten Tagen bei dir", elements: [] },
        ],
        theme: { primaryColor: "#F59E0B", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
      },
      {
        name: "Produkt-Launch",
        description: "Verkaufe dein Produkt mit einem überzeugenden Funnel",
        category: "sales",
        thumbnail: "/templates/sales.png",
        pages: [
          { id: "page-1", type: "welcome", title: "Exklusiver Zugang", subtitle: "Sichere dir unser neues Produkt zum Einführungspreis", elements: [], buttonText: "Mehr erfahren", backgroundColor: "#DC2626" },
          { id: "page-2", type: "multiChoice", title: "Was interessiert dich am meisten?", elements: [{ id: "el-1", type: "radio", options: ["Zeitersparnis", "Kostensenkung", "Qualitätssteigerung", "Automatisierung"] }], buttonText: "Weiter" },
          { id: "page-3", type: "contact", title: "Sichere dir deinen Platz", elements: [{ id: "el-1", type: "input", placeholder: "Dein Name", required: true }, { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true }], buttonText: "Zugang sichern" },
          { id: "page-4", type: "thankyou", title: "Perfekt!", subtitle: "Prüfe deine E-Mails für exklusive Infos", elements: [], showConfetti: true },
        ],
        theme: { primaryColor: "#DC2626", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
      },
    ];

    await db.insert(templates).values(defaultTemplates);
    console.log("Default templates seeded successfully");
  }

  // ============ ADMIN METHODS ============

  // Get all users (admin only)
  async getAllUsers(limit = 50, offset = 0, search?: string): Promise<{
    users: Array<{
      id: number;
      username: string;
      email: string;
      displayName: string | null;
      isAdmin: boolean;
      trialEndsAt: Date | null;
      isPro: boolean;
      subscriptionStatus: string;
      subscriptionPlan: string | null;
      subscriptionStartedAt: Date | null;
      lastLoginAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      funnelCount: number;
      leadCount: number;
    }>;
    total: number;
  }> {
    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(search ? sql`${users.username} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`}` : undefined);

    // Get users with funnel and lead counts in a single query (no N+1)
    const searchCondition = search
      ? sql`${users.username} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`}`
      : undefined;

    const usersWithCounts = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      isAdmin: users.isAdmin,
      trialEndsAt: users.trialEndsAt,
      isPro: users.isPro,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionPlan: users.subscriptionPlan,
      subscriptionStartedAt: users.subscriptionStartedAt,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      funnelCount: sql<number>`(SELECT count(*) FROM ${funnels} WHERE ${funnels.userId} = ${users.id})`,
      leadCount: sql<number>`(SELECT count(*) FROM ${leads} WHERE ${leads.userId} = ${users.id})`,
    })
      .from(users)
      .where(searchCondition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      users: usersWithCounts.map(u => ({
        ...u,
        funnelCount: Number(u.funnelCount || 0),
        leadCount: Number(u.leadCount || 0),
      })),
      total: Number(countResult?.count || 0),
    };
  }

  // Update user (admin only)
  async updateUserAdmin(userId: number, updates: {
    isPro?: boolean;
    isAdmin?: boolean;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    trialEndsAt?: Date | null;
    subscriptionStartedAt?: Date | null;
  }): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  // Update user profile (self-service)
  async updateUserProfile(userId: number, updates: {
    displayName?: string;
    email?: string;
    company?: string;
  }): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  // Delete user (admin only)
  async deleteUserAdmin(userId: number): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    return result.length > 0;
  }

  // Update last login timestamp
  async updateLastLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Get admin statistics
  async getAdminStats(): Promise<{
    totalUsers: number;
    activeTrials: number;
    proUsers: number;
    cancelledUsers: number;
    expiredTrials: number;
    totalFunnels: number;
    totalLeads: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    // Subscription plan breakdown
    plansBreakdown: { plan: string; count: number }[];
  }> {
    // Single query for scalar stats
    const [stats] = await db.select({
      totalUsers: sql<number>`(SELECT count(*) FROM ${users})`,
      activeTrials: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.subscriptionStatus} = 'trial' AND ${users.trialEndsAt} > NOW())`,
      proUsers: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.isPro} = true)`,
      cancelledUsers: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.subscriptionStatus} = 'cancelled')`,
      expiredTrials: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.subscriptionStatus} = 'trial' AND (${users.trialEndsAt} IS NULL OR ${users.trialEndsAt} <= NOW()))`,
      totalFunnels: sql<number>`(SELECT count(*) FROM ${funnels})`,
      totalLeads: sql<number>`(SELECT count(*) FROM ${leads})`,
      newUsersToday: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.createdAt} >= CURRENT_DATE)`,
      newUsersThisWeek: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.createdAt} >= NOW() - INTERVAL '7 days')`,
      newUsersThisMonth: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.createdAt} >= date_trunc('month', NOW()))`,
    }).from(sql`(SELECT 1) AS _dummy`);

    // Plan breakdown
    const planRows = await db.select({
      plan: sql<string>`COALESCE(${users.subscriptionPlan}, 'none')`,
      count: sql<number>`count(*)`,
    })
      .from(users)
      .where(sql`${users.isPro} = true`)
      .groupBy(sql`COALESCE(${users.subscriptionPlan}, 'none')`);

    return {
      totalUsers: Number(stats?.totalUsers || 0),
      activeTrials: Number(stats?.activeTrials || 0),
      proUsers: Number(stats?.proUsers || 0),
      cancelledUsers: Number(stats?.cancelledUsers || 0),
      expiredTrials: Number(stats?.expiredTrials || 0),
      totalFunnels: Number(stats?.totalFunnels || 0),
      totalLeads: Number(stats?.totalLeads || 0),
      newUsersToday: Number(stats?.newUsersToday || 0),
      newUsersThisWeek: Number(stats?.newUsersThisWeek || 0),
      newUsersThisMonth: Number(stats?.newUsersThisMonth || 0),
      plansBreakdown: planRows.map(r => ({ plan: String(r.plan), count: Number(r.count) })),
    };
  }

  // Create or ensure admin user exists
  async ensureAdminUser(username: string, password: string, email: string): Promise<User> {
    const existingAdmin = await this.getUserByUsername(username);
    if (existingAdmin) {
      // Update to admin if not already
      if (!existingAdmin.isAdmin) {
        await db.update(users)
          .set({ isAdmin: true })
          .where(eq(users.id, existingAdmin.id));
      }
      return existingAdmin;
    }

    // Create admin user
    const hashedPassword = await hashPassword(password);
    const [admin] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      isAdmin: true,
      isPro: true,
      subscriptionStatus: "active",
      subscriptionPlan: "enterprise",
    }).returning();

    return admin;
  }

  // ============ TEAMS ============

  async createTeam(name: string, ownerId: number): Promise<any> {
    const [team] = await db.insert(teams).values({ name, ownerId }).returning();
    // Add owner as team member
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: ownerId,
      role: "owner",
      acceptedAt: new Date(),
    });
    return team;
  }

  async getTeam(teamId: number, userId: number): Promise<any> {
    // User must be a member of the team
    const membership = await db.select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1);
    if (membership.length === 0) return undefined;

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    return team;
  }

  async getTeamsByUser(userId: number): Promise<any[]> {
    const memberships = await db.select({
      team: teams,
      role: teamMembers.role,
    })
      .from(teamMembers)
      .innerJoin(teams, eq(teams.id, teamMembers.teamId))
      .where(eq(teamMembers.userId, userId));

    return memberships.map((m) => ({ ...m.team, role: m.role }));
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    const members = await db.select({
      id: teamMembers.id,
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      role: teamMembers.role,
      invitedEmail: teamMembers.invitedEmail,
      acceptedAt: teamMembers.acceptedAt,
      createdAt: teamMembers.createdAt,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
    })
      .from(teamMembers)
      .leftJoin(users, eq(users.id, teamMembers.userId))
      .where(eq(teamMembers.teamId, teamId));

    return members;
  }

  async addTeamMember(teamId: number, email: string, role: string = "member"): Promise<any> {
    // Check if user exists
    const user = await this.getUserByEmail(email);

    const [member] = await db.insert(teamMembers).values({
      teamId,
      userId: user?.id || 0, // 0 for pending invite (user doesn't exist yet)
      role,
      invitedEmail: email,
      acceptedAt: user ? new Date() : null,
    }).returning();

    return member;
  }

  async removeTeamMember(teamId: number, memberId: number): Promise<boolean> {
    const result = await db.delete(teamMembers)
      .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId)));
    return (result as any).rowCount > 0;
  }

  async isTeamOwnerOrAdmin(teamId: number, userId: number): Promise<boolean> {
    const [membership] = await db.select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
      ))
      .limit(1);

    return membership?.role === "owner" || membership?.role === "admin";
  }

  async deleteTeam(teamId: number, ownerId: number): Promise<boolean> {
    const [team] = await db.select().from(teams).where(and(eq(teams.id, teamId), eq(teams.ownerId, ownerId)));
    if (!team) return false;
    await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    await db.delete(teams).where(eq(teams.id, teamId));
    return true;
  }

  // ============ API KEYS ============

  async createApiKey(userId: number, name: string, keyHash: string, keyPrefix: string): Promise<any> {
    const [key] = await db.insert(apiKeys).values({
      userId,
      name,
      keyHash,
      keyPrefix,
    }).returning();
    return key;
  }

  async getApiKeys(userId: number): Promise<any[]> {
    return db.select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByHash(keyHash: string): Promise<any> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return key;
  }

  async deleteApiKey(keyId: number, userId: number): Promise<boolean> {
    const result = await db.delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
    return (result as any).rowCount > 0;
  }

  async updateApiKeyLastUsed(keyId: number): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyId));
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
