import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Layers,
  Users,
  BarChart3,
  Settings,
  Zap,
  Plus,
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

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Funnels",
    url: "/funnels",
    icon: Layers,
  },
  {
    title: "Kontakte",
    url: "/leads",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
];

const settingsItems = [
  {
    title: "Einstellungen",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            FunnelFlow
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <div className="px-2 mb-4">
          <Link href="/funnels/new">
            <Button className="w-full gap-2" data-testid="button-new-funnel-sidebar">
              <Plus className="h-4 w-4" />
              Neuer Funnel
            </Button>
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium px-2">
            Menü
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || (item.url !== "/" && location.startsWith(item.url))}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-medium">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">John Doe</span>
            <span className="text-xs text-muted-foreground">Pro Plan</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
