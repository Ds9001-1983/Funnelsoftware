import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Layers,
  Users,
  BarChart3,
  Settings,
  Zap,
  Plus,
  HelpCircle,
  Keyboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const mainMenuItems = [
  {
    title: "Dashboard",
    description: "Übersicht aller Statistiken",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Funnels",
    description: "Erstelle und verwalte Funnels",
    url: "/funnels",
    icon: Layers,
  },
  {
    title: "Kontakte",
    description: "Leads und CRM verwalten",
    url: "/leads",
    icon: Users,
  },
  {
    title: "Analytics",
    description: "Performance analysieren",
    url: "/analytics",
    icon: BarChart3,
  },
];

const settingsItems = [
  {
    title: "Einstellungen",
    description: "Konto und Präferenzen",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            FunnelFlow
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <div className="px-2 mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/funnels/new">
                <Button className="w-full gap-2" data-testid="button-new-funnel-sidebar">
                  <Plus className="h-4 w-4" />
                  Neuer Funnel
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Erstelle einen neuen Marketing-Funnel</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium px-2">
            Menü
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                        >
                          <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                      >
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild>
                      <a 
                        href="https://help.funnelflow.de" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span>Hilfe</span>
                      </a>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">Hilfe & Support</p>
                    <p className="text-xs text-muted-foreground">Tutorials und FAQ</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-medium">
                JD
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">John Doe</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">Pro</Badge>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">john@example.com</p>
            <p className="text-xs text-muted-foreground mt-1">Klicke auf Einstellungen für Kontoverwaltung</p>
          </TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
