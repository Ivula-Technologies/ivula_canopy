import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { Bell, Building2, Check, ChevronDown, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/auth/AuthContext";

interface AppLayoutProps {
  children: ReactNode;
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, signOut, memberships, activeMembership, canManageChurch, switchChurch } = useAuth();
  const userEmail = session?.user?.email ?? "Dashboard user";
  const userInitials = userEmail.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people, programs..."
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex-1 sm:hidden" />

          <div className="flex items-center gap-2">
            {activeMembership && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden md:flex items-center gap-2 max-w-[280px]">
                    <Building2 className="h-4 w-4" />
                    <span className="truncate">{activeMembership.churchName}</span>
                    <span className="text-xs text-muted-foreground">{formatRole(activeMembership.role)}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Your organizations</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {memberships.map((membership) => (
                    <DropdownMenuItem
                      key={membership.id}
                      className="flex items-center justify-between gap-3"
                      onClick={() => switchChurch(membership.churchId)}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{membership.churchName}</div>
                        <div className="text-xs text-muted-foreground">{formatRole(membership.role)}</div>
                      </div>
                      {membership.churchId === activeMembership.churchId && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                  {canManageChurch && activeMembership.churchJoinCode && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>
                        <div className="space-y-1">
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">Join code</span>
                          <span className="block font-mono text-sm text-foreground">{activeMembership.churchJoinCode}</span>
                        </div>
                      </DropdownMenuLabel>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium text-sm">New registration</span>
                  <span className="text-xs text-muted-foreground">A new person registered for a program</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium text-sm">Attendance alert</span>
                  <span className="text-xs text-muted-foreground">5 people were marked as at-risk</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-primary text-sm">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span>Ivula Canopy</span>
                    {activeMembership && (
                      <span className="text-xs font-normal text-muted-foreground truncate">
                        {activeMembership.churchName} &middot; {formatRole(activeMembership.role)}
                      </span>
                    )}
                    <span className="text-xs font-normal text-muted-foreground truncate">
                      {userEmail}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={signOut}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
