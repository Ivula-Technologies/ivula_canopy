import { useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle,
  Info,
  Megaphone,
  MessageSquare,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AnnouncementAudience = "all" | "leaders" | "volunteers" | "specific_group";
type AnnouncementCategory = "general" | "event" | "reminder" | "alert" | "update";

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  category: AnnouncementCategory;
  sentAt: string;
  sentBy: string;
  readCount: number;
  totalRecipients: number;
}

const categoryColors: Record<AnnouncementCategory, string> = {
  general: "bg-muted text-muted-foreground",
  event: "bg-primary/10 text-primary",
  reminder: "bg-warning/10 text-warning",
  alert: "bg-destructive/10 text-destructive",
  update: "bg-success/10 text-success",
};

const sampleAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Monthly team meeting — Friday 6pm",
    body: "All leaders and volunteers are invited to our monthly coordination meeting this Friday at 6pm. Agenda will be shared beforehand.",
    audience: "leaders",
    category: "event",
    sentAt: "2026-06-02T10:00:00Z",
    sentBy: "Maya Roberts",
    readCount: 9,
    totalRecipients: 11,
  },
  {
    id: "2",
    title: "Reminder: Attendance records due by Sunday",
    body: "Please ensure all attendance records for the past week are submitted before Sunday midnight so reports can be generated on time.",
    audience: "all",
    category: "reminder",
    sentAt: "2026-06-01T08:30:00Z",
    sentBy: "Jordan Ellis",
    readCount: 21,
    totalRecipients: 24,
  },
  {
    id: "3",
    title: "Welcome new members!",
    body: "We are excited to welcome 3 new members who joined this week. Please help them feel at home and connect them with the right programs.",
    audience: "all",
    category: "general",
    sentAt: "2026-05-30T14:00:00Z",
    sentBy: "Maya Roberts",
    readCount: 18,
    totalRecipients: 24,
  },
  {
    id: "4",
    title: "Follow-up needed: 5 members showing low engagement",
    body: "Our engagement report flagged 5 members with declining participation over the past 30 days. Leaders please reach out to them personally this week.",
    audience: "leaders",
    category: "alert",
    sentAt: "2026-05-28T09:00:00Z",
    sentBy: "System",
    readCount: 7,
    totalRecipients: 8,
  },
  {
    id: "5",
    title: "Program schedule update for June",
    body: "The June program schedule has been finalized. Two new sessions have been added on Wednesdays. See the Programs page for details.",
    audience: "all",
    category: "update",
    sentAt: "2026-05-26T11:00:00Z",
    sentBy: "Jordan Ellis",
    readCount: 20,
    totalRecipients: 24,
  },
];

const audienceLabels: Record<AnnouncementAudience, string> = {
  all: "Everyone",
  leaders: "Leaders & Admins",
  volunteers: "Volunteers",
  specific_group: "Specific Group",
};

const categoryLabels: Record<AnnouncementCategory, string> = {
  general: "General",
  event: "Event",
  reminder: "Reminder",
  alert: "Alert",
  update: "Update",
};

const Communications = () => {
  const { activeMembership, canEditRecords, canManageChurch } = useAuth();
  const memberLabel = activeMembership?.memberLabel ?? "People";
  const programLabel = activeMembership?.programLabel ?? "Programs";

  const [announcements, setAnnouncements] = useState<Announcement[]>(sampleAnnouncements);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [category, setCategory] = useState<AnnouncementCategory>("general");

  const [notifAttendance, setNotifAttendance] = useState(true);
  const [notifNewMembers, setNotifNewMembers] = useState(true);
  const [notifEngagement, setNotifEngagement] = useState(true);
  const [notifReports, setNotifReports] = useState(false);
  const [notifEventReminders, setNotifEventReminders] = useState(true);

  function confirmDelete() {
    if (!deletingId) return;
    setAnnouncements((prev) => prev.filter((a) => a.id !== deletingId));
    setDeletingId(null);
    toast({ title: "Announcement deleted" });
  }

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Missing content", description: "Title and message body are required.", variant: "destructive" });
      return;
    }

    const newAnnouncement: Announcement = {
      id: String(Date.now()),
      title: title.trim(),
      body: body.trim(),
      audience,
      category,
      sentAt: new Date().toISOString(),
      sentBy: activeMembership?.churchName ?? "You",
      readCount: 0,
      totalRecipients: audience === "all" ? 24 : audience === "leaders" ? 8 : 6,
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setTitle("");
    setBody("");
    setAudience("all");
    setCategory("general");
    toast({ title: "Announcement sent", description: `Delivered to ${audienceLabels[newAnnouncement.audience]}.` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Communications</h1>
        <p className="page-description">
          Send announcements, manage notifications, and keep your team and {memberLabel.toLowerCase()} informed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Megaphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{announcements.length}</p>
                <p className="text-sm text-muted-foreground">Announcements sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(
                    (announcements.reduce((sum, a) => sum + a.readCount, 0) /
                      announcements.reduce((sum, a) => sum + a.totalRecipients, 0)) *
                      100
                  )}%
                </p>
                <p className="text-sm text-muted-foreground">Average read rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Active notification rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="announcements" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Announce
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-4">
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs capitalize", categoryColors[announcement.category])}
                        >
                          {categoryLabels[announcement.category]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {audienceLabels[announcement.audience]}
                        </Badge>
                      </div>
                      <p className="font-semibold leading-tight">{announcement.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{announcement.body}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span>
                          {new Date(announcement.sentAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>by {announcement.sentBy}</span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-success" />
                          {announcement.readCount}/{announcement.totalRecipients} read
                        </span>
                      </div>
                    </div>
                    {canEditRecords && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => setDeletingId(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compose" className="space-y-4">
          {canEditRecords ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>New Announcement</CardTitle>
                    <CardDescription>
                      Send a message to your team, {memberLabel.toLowerCase()}, or a specific group.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="announcement-title">Title</Label>
                      <Input
                        id="announcement-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Monthly meeting — this Friday"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="announcement-body">Message</Label>
                      <Textarea
                        id="announcement-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your announcement here..."
                        rows={5}
                      />
                    </div>
                    <Button className="w-full sm:w-auto" onClick={handleSend}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Announcement
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Delivery Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="announcement-audience">Send to</Label>
                      <Select value={audience} onValueChange={(v) => setAudience(v as AnnouncementAudience)}>
                        <SelectTrigger id="announcement-audience">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everyone</SelectItem>
                          <SelectItem value="leaders">Leaders & Admins</SelectItem>
                          <SelectItem value="volunteers">Volunteers</SelectItem>
                          <SelectItem value="specific_group">Specific Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="announcement-category">Category</Label>
                      <Select value={category} onValueChange={(v) => setCategory(v as AnnouncementCategory)}>
                        <SelectTrigger id="announcement-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="alert">Alert</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Event reminder", t: "Upcoming event reminder", b: "A reminder that our next event is coming up. Please confirm your attendance and bring any required materials.", cat: "reminder" as AnnouncementCategory },
                      { label: "Attendance due", t: "Attendance records due", b: "A reminder to submit attendance records for the current period before the deadline.", cat: "reminder" as AnnouncementCategory },
                      { label: "Welcome new member", t: "Welcome to our community!", b: "We are excited to welcome new members who recently joined. Please reach out and make them feel welcome.", cat: "general" as AnnouncementCategory },
                    ].map((template) => (
                      <Button
                        key={template.label}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => { setTitle(template.t); setBody(template.b); setCategory(template.cat); }}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-2" />
                        {template.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Info className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">You need leader or admin access to send announcements.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which events automatically trigger alerts for your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">New {memberLabel} joined</p>
                  <p className="text-sm text-muted-foreground">Notify leaders when a new member registers</p>
                </div>
                <Switch checked={notifNewMembers} onCheckedChange={setNotifNewMembers} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Attendance submitted</p>
                  <p className="text-sm text-muted-foreground">Notify admins when attendance records are recorded</p>
                </div>
                <Switch checked={notifAttendance} onCheckedChange={setNotifAttendance} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Engagement risk alert</p>
                  <p className="text-sm text-muted-foreground">
                    Notify leaders when {memberLabel.toLowerCase()} drop below an engagement threshold
                  </p>
                </div>
                <Switch checked={notifEngagement} onCheckedChange={setNotifEngagement} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Event reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Send reminders 24 hours before scheduled {programLabel.toLowerCase()}
                  </p>
                </div>
                <Switch checked={notifEventReminders} onCheckedChange={setNotifEventReminders} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Report ready</p>
                  <p className="text-sm text-muted-foreground">Notify when a scheduled report has been generated</p>
                </div>
                <Switch checked={notifReports} onCheckedChange={setNotifReports} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notifications are sent to each team member's registered email address. Email delivery requires a configured Supabase project with email sending enabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This announcement will be permanently removed and recipients will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Communications;
