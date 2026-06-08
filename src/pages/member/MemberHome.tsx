import { Calendar, Megaphone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/auth/AuthContext";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const upcomingEvents = [
  {
    id: "1",
    title: "Sunday Gathering",
    date: "Sun, Jun 8 · 10:00 AM",
    location: "Main Hall",
    category: "Gathering",
  },
  {
    id: "2",
    title: "Leadership Development Workshop",
    date: "Sat, Jun 14 · 2:00 PM",
    location: "Room 3",
    category: "Development",
  },
  {
    id: "3",
    title: "Community Outreach Day",
    date: "Sat, Jun 21 · 9:00 AM",
    location: "City Park",
    category: "Outreach",
  },
];

const recentAnnouncements = [
  {
    id: "1",
    title: "Welcome to our new community portal!",
    body: "We've launched a new way for members to stay connected, see upcoming events, and receive announcements.",
    date: "Jun 5",
    category: "General",
  },
  {
    id: "2",
    title: "Volunteer opportunities this month",
    body: "We have several openings for volunteers in our outreach and hospitality teams. Sign up at the front desk.",
    date: "Jun 3",
    category: "Opportunity",
  },
];

const categoryColors: Record<string, string> = {
  Gathering: "bg-primary/10 text-primary",
  Development: "bg-success/10 text-success",
  Outreach: "bg-accent/10 text-accent-foreground",
  Fellowship: "bg-chart-4/20 text-chart-1",
  General: "bg-muted text-muted-foreground",
  Opportunity: "bg-success/10 text-success",
};

export default function MemberHome() {
  const { session, activeMembership } = useAuth();
  const userEmail = session?.user?.email ?? "";
  const firstName = userEmail.split("@")[0].split(".")[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/70 p-6 text-primary-foreground">
        <p className="text-sm font-medium opacity-80">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold">{displayName} 👋</h1>
        <p className="mt-1 text-sm opacity-80">{activeMembership?.churchName}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">3</div>
          <div className="text-xs text-muted-foreground mt-1">Upcoming events</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-success">2</div>
          <div className="text-xs text-muted-foreground mt-1">New announcements</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-accent-foreground">1</div>
          <div className="text-xs text-muted-foreground mt-1">My teams</div>
        </Card>
      </div>

      {/* Upcoming events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Events
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <NavLink to="/events">View all</NavLink>
          </Button>
        </div>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="space-y-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{event.title}</div>
                  <div className="text-xs text-muted-foreground">{event.date}</div>
                  <div className="text-xs text-muted-foreground">{event.location}</div>
                </div>
                <Badge className={`${categoryColors[event.category] ?? "bg-muted text-muted-foreground"} border-0 flex-shrink-0 text-xs`}>
                  {event.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent announcements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Megaphone className="h-4 w-4 text-primary" />
            Announcements
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <NavLink to="/announcements">View all</NavLink>
          </Button>
        </div>
        <div className="space-y-3">
          {recentAnnouncements.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{item.date}</span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* My teams */}
      <section>
        <h2 className="flex items-center gap-2 font-semibold text-foreground mb-3">
          <Users className="h-4 w-4 text-primary" />
          My Teams
        </h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">General Community</div>
                <div className="text-xs text-muted-foreground mt-0.5">All members · Active</div>
              </div>
              <Badge className="bg-success/10 text-success border-0">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
