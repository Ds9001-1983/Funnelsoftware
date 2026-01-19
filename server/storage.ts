import { type User, type InsertUser, type Funnel, type InsertFunnel, type Lead, type InsertLead, type AnalyticsEvent, type Template, type FunnelPage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Funnels
  getFunnels(): Promise<Funnel[]>;
  getFunnel(id: string): Promise<Funnel | undefined>;
  createFunnel(funnel: InsertFunnel): Promise<Funnel>;
  updateFunnel(id: string, funnel: Partial<Funnel>): Promise<Funnel | undefined>;
  deleteFunnel(id: string): Promise<boolean>;
  
  // Leads
  getLeads(): Promise<Lead[]>;
  getLeadsByFunnel(funnelId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  
  // Analytics
  getAnalytics(funnelId: string): Promise<AnalyticsEvent[]>;
  createAnalyticsEvent(event: Omit<AnalyticsEvent, "id">): Promise<AnalyticsEvent>;
  
  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
}

// Default templates
const defaultTemplates: Template[] = [
  {
    id: "template-lead-gen",
    name: "Lead-Generierung",
    description: "Sammle qualifizierte Leads mit einem mehrstufigen Funnel",
    category: "leads",
    thumbnail: "/templates/lead-gen.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Bereit für mehr Kunden?",
        subtitle: "Entdecke, wie wir dein Business auf das nächste Level bringen",
        elements: [],
        buttonText: "Jetzt starten",
        backgroundColor: "#7C3AED",
      },
      {
        id: "page-2",
        type: "question",
        title: "Was ist deine größte Herausforderung?",
        elements: [],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "contact",
        title: "Lass uns sprechen!",
        subtitle: "Trage deine Kontaktdaten ein",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Deine Telefonnummer" },
        ],
        buttonText: "Absenden",
      },
      {
        id: "page-4",
        type: "thankyou",
        title: "Vielen Dank!",
        subtitle: "Wir melden uns innerhalb von 24 Stunden bei dir",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#7C3AED",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-webinar",
    name: "Webinar-Anmeldung",
    description: "Maximiere die Anmeldungen für dein Webinar",
    category: "webinar",
    thumbnail: "/templates/webinar.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Kostenloses Webinar",
        subtitle: "Lerne die Geheimnisse erfolgreicher Unternehmer",
        elements: [],
        buttonText: "Jetzt anmelden",
        backgroundColor: "#2563EB",
      },
      {
        id: "page-2",
        type: "contact",
        title: "Sichere dir deinen Platz",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Platz reservieren",
      },
      {
        id: "page-3",
        type: "thankyou",
        title: "Du bist dabei!",
        subtitle: "Check deine E-Mails für den Zugangslink",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#2563EB",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-quiz",
    name: "Interaktives Quiz",
    description: "Qualifiziere Leads mit einem unterhaltsamen Quiz",
    category: "quiz",
    thumbnail: "/templates/quiz.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Finde heraus, welcher Typ du bist!",
        subtitle: "Beantworte 3 kurze Fragen",
        elements: [],
        buttonText: "Quiz starten",
        backgroundColor: "#10B981",
      },
      {
        id: "page-2",
        type: "multiChoice",
        title: "Was beschreibt dich am besten?",
        elements: [
          { id: "el-1", type: "radio", options: ["Kreativ", "Analytisch", "Teamplayer", "Führungspersönlichkeit"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "multiChoice",
        title: "Wie triffst du Entscheidungen?",
        elements: [
          { id: "el-1", type: "radio", options: ["Mit dem Bauch", "Datenbasiert", "Im Team", "Spontan"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Fast geschafft!",
        subtitle: "Wohin sollen wir dein Ergebnis senden?",
        elements: [
          { id: "el-1", type: "input", placeholder: "Deine E-Mail", required: true },
        ],
        buttonText: "Ergebnis anzeigen",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Du bist ein Innovator!",
        subtitle: "Check deine E-Mail für mehr Details",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#10B981",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
  {
    id: "template-recruiting",
    name: "Schnell-Bewerbung",
    description: "Finde Top-Talente mit einem mobilen Bewerbungs-Funnel",
    category: "recruiting",
    thumbnail: "/templates/recruiting.png",
    pages: [
      {
        id: "page-1",
        type: "welcome",
        title: "Werde Teil unseres Teams!",
        subtitle: "Bewirb dich in unter 2 Minuten",
        elements: [],
        buttonText: "Jetzt bewerben",
        backgroundColor: "#F59E0B",
      },
      {
        id: "page-2",
        type: "question",
        title: "Welche Position interessiert dich?",
        elements: [
          { id: "el-1", type: "radio", options: ["Vertrieb", "Marketing", "Entwicklung", "Kundenservice"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-3",
        type: "question",
        title: "Wie viel Erfahrung bringst du mit?",
        elements: [
          { id: "el-1", type: "radio", options: ["0-1 Jahre", "2-5 Jahre", "5+ Jahre"] },
        ],
        buttonText: "Weiter",
      },
      {
        id: "page-4",
        type: "contact",
        title: "Deine Kontaktdaten",
        elements: [
          { id: "el-1", type: "input", placeholder: "Dein Name", required: true },
          { id: "el-2", type: "input", placeholder: "Deine E-Mail", required: true },
          { id: "el-3", type: "input", placeholder: "Deine Telefonnummer", required: true },
          { id: "el-4", type: "textarea", placeholder: "Erzähl uns kurz von dir..." },
        ],
        buttonText: "Bewerbung absenden",
      },
      {
        id: "page-5",
        type: "thankyou",
        title: "Bewerbung erhalten!",
        subtitle: "Wir melden uns in den nächsten Tagen bei dir",
        elements: [],
      },
    ],
    theme: {
      primaryColor: "#F59E0B",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
    },
  },
];

// Sample funnels for demo
const sampleFunnels: Funnel[] = [
  {
    id: "funnel-1",
    name: "Lead Magnet Kampagne",
    description: "Sammle qualifizierte Leads für dein Coaching",
    status: "published",
    pages: defaultTemplates[0].pages,
    theme: defaultTemplates[0].theme,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    views: 1247,
    leads: 89,
  },
  {
    id: "funnel-2",
    name: "Webinar März 2025",
    description: "Anmeldungen für das März-Webinar",
    status: "published",
    pages: defaultTemplates[1].pages,
    theme: defaultTemplates[1].theme,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 3421,
    leads: 256,
  },
  {
    id: "funnel-3",
    name: "Persönlichkeitstest",
    description: "Interaktives Quiz für Engagement",
    status: "draft",
    pages: defaultTemplates[2].pages,
    theme: defaultTemplates[2].theme,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    views: 0,
    leads: 0,
  },
];

// Sample leads for demo
const sampleLeads: Lead[] = [
  {
    id: "lead-1",
    funnelId: "funnel-1",
    funnelName: "Lead Magnet Kampagne",
    name: "Max Mustermann",
    email: "max@example.com",
    phone: "+49 171 1234567",
    status: "new",
    source: "Facebook Ads",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-2",
    funnelId: "funnel-1",
    funnelName: "Lead Magnet Kampagne",
    name: "Anna Schmidt",
    email: "anna.schmidt@company.de",
    phone: "+49 172 9876543",
    company: "Schmidt GmbH",
    status: "contacted",
    source: "Instagram",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-3",
    funnelId: "funnel-2",
    funnelName: "Webinar März 2025",
    name: "Thomas Weber",
    email: "t.weber@startup.io",
    status: "qualified",
    source: "LinkedIn",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-4",
    funnelId: "funnel-2",
    funnelName: "Webinar März 2025",
    name: "Julia Braun",
    email: "julia.b@agency.com",
    phone: "+49 173 5551234",
    company: "Digital Agency",
    status: "converted",
    source: "Google Ads",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-5",
    funnelId: "funnel-1",
    funnelName: "Lead Magnet Kampagne",
    name: "Michael Bauer",
    email: "m.bauer@consultant.de",
    status: "new",
    source: "Facebook Ads",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private funnels: Map<string, Funnel>;
  private leads: Map<string, Lead>;
  private analyticsEvents: Map<string, AnalyticsEvent>;
  private templates: Map<string, Template>;

  constructor() {
    this.users = new Map();
    this.funnels = new Map();
    this.leads = new Map();
    this.analyticsEvents = new Map();
    this.templates = new Map();
    
    // Initialize with sample data
    sampleFunnels.forEach(f => this.funnels.set(f.id, f));
    sampleLeads.forEach(l => this.leads.set(l.id, l));
    defaultTemplates.forEach(t => this.templates.set(t.id, t));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Funnels
  async getFunnels(): Promise<Funnel[]> {
    return Array.from(this.funnels.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getFunnel(id: string): Promise<Funnel | undefined> {
    return this.funnels.get(id);
  }

  async createFunnel(insertFunnel: InsertFunnel): Promise<Funnel> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const funnel: Funnel = {
      ...insertFunnel,
      id,
      createdAt: now,
      updatedAt: now,
      views: 0,
      leads: 0,
    };
    this.funnels.set(id, funnel);
    return funnel;
  }

  async updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel | undefined> {
    const funnel = this.funnels.get(id);
    if (!funnel) return undefined;
    
    const updated: Funnel = {
      ...funnel,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.funnels.set(id, updated);
    return updated;
  }

  async deleteFunnel(id: string): Promise<boolean> {
    return this.funnels.delete(id);
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getLeadsByFunnel(funnelId: string): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter(l => l.funnelId === funnelId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      createdAt: new Date().toISOString(),
    };
    this.leads.set(id, lead);
    
    // Update funnel leads count
    const funnel = this.funnels.get(insertLead.funnelId);
    if (funnel) {
      this.funnels.set(funnel.id, { ...funnel, leads: funnel.leads + 1 });
    }
    
    return lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;
    
    const updated: Lead = { ...lead, ...updates };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  // Analytics
  async getAnalytics(funnelId: string): Promise<AnalyticsEvent[]> {
    return Array.from(this.analyticsEvents.values())
      .filter(e => e.funnelId === funnelId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createAnalyticsEvent(event: Omit<AnalyticsEvent, "id">): Promise<AnalyticsEvent> {
    const id = randomUUID();
    const analyticsEvent: AnalyticsEvent = { ...event, id };
    this.analyticsEvents.set(id, analyticsEvent);
    
    // Update funnel views if it's a view event
    if (event.eventType === "view") {
      const funnel = this.funnels.get(event.funnelId);
      if (funnel) {
        this.funnels.set(funnel.id, { ...funnel, views: funnel.views + 1 });
      }
    }
    
    return analyticsEvent;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }
}

export const storage = new MemStorage();
