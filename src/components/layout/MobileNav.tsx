import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Youth Directory", url: "/directory", icon: Users },
  { title: "Programs", url: "/programs", icon: Calendar },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: FileText },
];

const bottomNavItems = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex flex-row items-center h-16 px-4 border-b border-border">
          <div className="flex items-center gap-3 flex-1">
            <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="w-9 h-9 rounded-lg object-contain bg-white p-1" />
            <SheetTitle className="font-display font-semibold">Ivula Canopy</SheetTitle>
          </div>
        </SheetHeader>

        <nav className="flex flex-col h-[calc(100%-4rem)]">
          <div className="flex-1 px-3 py-4 space-y-1">
            {mainNavItems.map((item) => {
              const active = isActive(item.url);
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-primary/10",
                    active && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  activeClassName=""
                >
                  <item.icon className={cn("h-5 w-5", active && "text-primary-foreground")} />
                  <span className={cn("font-medium", active && "text-primary-foreground")}>
                    {item.title}
                  </span>
                </NavLink>
              );
            })}
          </div>

          <div className="px-3 py-4 border-t border-border space-y-1">
            {bottomNavItems.map((item) => {
              const active = isActive(item.url);
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-primary/10",
                    active && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  activeClassName=""
                >
                  <item.icon className={cn("h-5 w-5", active && "text-primary-foreground")} />
                  <span className={cn("font-medium", active && "text-primary-foreground")}>
                    {item.title}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
