import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  UserCog,
  Megaphone,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/auth/AuthContext";

const allMainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, requiresExport: false, requiresManage: false },
  { title: "People Directory", url: "/directory", icon: Users, requiresExport: false, requiresManage: false },
  { title: "Programs", url: "/programs", icon: Calendar, requiresExport: false, requiresManage: false },
  { title: "Communications", url: "/communications", icon: Megaphone, requiresExport: false, requiresManage: false },
  { title: "Analytics", url: "/analytics", icon: BarChart3, requiresExport: false, requiresManage: false },
  { title: "Reports", url: "/reports", icon: FileText, requiresExport: true, requiresManage: false },
];

const allBottomNavItems = [
  { title: "Team", url: "/team", icon: UserCog, requiresManage: true },
  { title: "Admin", url: "/admin", icon: Shield, requiresManage: true },
  { title: "Settings", url: "/settings", icon: Settings, requiresManage: true },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { canManageChurch, canExportRecords } = useAuth();

  const mainNavItems = allMainNavItems.filter(
    (item) => (!item.requiresExport || canExportRecords) && (!item.requiresManage || canManageChurch)
  );
  const bottomNavItems = allBottomNavItems.filter((item) => !item.requiresManage || canManageChurch);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ item, isBottom = false }: { item: typeof mainNavItems[0]; isBottom?: boolean }) => {
    const active = isActive(item.url);
    
    const content = (
      <NavLink
        to={item.url}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-primary/10",
          active && "bg-primary text-primary-foreground hover:bg-primary/90",
          collapsed && "justify-center px-2"
        )}
        activeClassName=""
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-primary-foreground")} />
        {!collapsed && (
          <span className={cn("font-medium text-sm", active && "text-primary-foreground")}>
            {item.title}
          </span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo/Brand */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-sidebar-border",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="w-9 h-9 rounded-lg object-contain bg-white p-1" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-display font-semibold text-sidebar-foreground">Ivula Canopy</span>
            <span className="text-xs text-muted-foreground">Organization Dashboard</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <NavItem key={item.title} item={item} isBottom />
        ))}
        
        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full mt-2 text-muted-foreground hover:text-foreground",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
