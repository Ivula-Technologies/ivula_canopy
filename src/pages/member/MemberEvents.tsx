import { Calendar, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const events = [
  {
    id: "1",
    title: "Sunday Gathering",
    date: "Sun, Jun 8, 2025",
    time: "10:00 AM – 12:00 PM",
    location: "Main Hall",
    category: "Gathering",
    description: "Join us for our weekly community gathering. Everyone is welcome.",
    spotsLeft: null,
  },
  {
    id: "2",
    title: "Leadership Development Workshop",
    date: "Sat, Jun 14, 2025",
    time: "2:00 PM – 5:00 PM",
    location: "Room 3",
    category: "Development",
    description: "A practical workshop focused on developing leadership skills for team coordinators and emerging leaders.",
    spotsLeft: 8,
  },
  {
    id: "3",
    title: "Community Outreach Day",
    date: "Sat, Jun 21, 2025",
    time: "9:00 AM – 1:00 PM",
    location: "City Park",
    category: "Outreach",
    description: "We'll be serving meals and distributing supplies at City Park. Bring comfortable clothes.",
    spotsLeft: 15,
  },
  {
    id: "4",
    title: "Fellowship Dinner",
    date: "Fri, Jun 27, 2025",
    time: "6:30 PM – 9:00 PM",
    location: "Community Centre, Hall B",
    category: "Fellowship",
    description: "An evening of food, conversation, and community. Bring a dish to share if you'd like.",
    spotsLeft: null,
  },
];

const categoryColors: Record<string, string> = {
  Gathering: "bg-primary/10 text-primary",
  Development: "bg-success/10 text-success",
  Outreach: "bg-warning/10 text-warning-foreground",
  Fellowship: "bg-chart-4/20 text-chart-1",
};

export default function MemberEvents() {
  function handleRegister(title: string) {
    toast({ title: "Registered!", description: `You've registered for "${title}". We'll send a reminder closer to the date.` });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upcoming Events</h1>
        <p className="text-muted-foreground mt-1">Stay connected with what's happening in your community.</p>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{event.title}</CardTitle>
                <Badge className={`${categoryColors[event.category] ?? "bg-muted"} border-0 flex-shrink-0`}>
                  {event.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  {event.location}
                </div>
              </div>
              <p className="text-sm text-foreground/80">{event.description}</p>
              <div className="flex items-center justify-between">
                {event.spotsLeft !== null ? (
                  <span className="text-xs text-muted-foreground">{event.spotsLeft} spots remaining</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Open to all</span>
                )}
                <Button size="sm" onClick={() => handleRegister(event.title)}>
                  Register
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
