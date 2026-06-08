import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const announcements = [
  {
    id: "1",
    title: "Welcome to our new community portal!",
    body: "We've launched a new way for members to stay connected, see upcoming events, and receive announcements in real time. Log in any time to check what's happening.",
    date: "Jun 5, 2025",
    category: "General",
    audience: "Everyone",
  },
  {
    id: "2",
    title: "Volunteer opportunities this month",
    body: "We have several openings for volunteers in our outreach and hospitality teams for June. If you're interested, please speak to your team coordinator or sign up at the front desk during Sunday's gathering.",
    date: "Jun 3, 2025",
    category: "Opportunity",
    audience: "Everyone",
  },
  {
    id: "3",
    title: "Community Outreach Day – what to bring",
    body: "For our June 21 Outreach Day, please wear comfortable, weather-appropriate clothes. We'll provide all materials. Breakfast will be available from 8:30 AM at the usual meeting point.",
    date: "Jun 1, 2025",
    category: "Event",
    audience: "Everyone",
  },
  {
    id: "4",
    title: "Reminder: Leadership workshop registration",
    body: "Registration for the June 14 Leadership Development Workshop closes on June 10. Only 8 spots remain. Reach out to confirm your place.",
    date: "May 29, 2025",
    category: "Reminder",
    audience: "Everyone",
  },
];

const categoryColors: Record<string, string> = {
  General: "bg-muted text-muted-foreground",
  Opportunity: "bg-success/10 text-success",
  Event: "bg-primary/10 text-primary",
  Reminder: "bg-warning/10 text-warning-foreground",
  Alert: "bg-destructive/10 text-destructive",
};

export default function MemberAnnouncements() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Announcements
        </h1>
        <p className="text-muted-foreground mt-1">Updates and notices from your organization.</p>
      </div>

      <div className="space-y-4">
        {announcements.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base font-semibold leading-snug">{item.title}</CardTitle>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge className={`${categoryColors[item.category] ?? "bg-muted"} border-0 text-xs`}>
                    {item.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
