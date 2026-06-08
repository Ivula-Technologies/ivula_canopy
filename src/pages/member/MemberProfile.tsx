import { FormEvent, useState } from "react";
import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function MemberProfile() {
  const { session, activeMembership } = useAuth();
  const userEmail = session?.user?.email ?? "";
  const userInitials = userEmail.slice(0, 2).toUpperCase();

  const [displayName, setDisplayName] = useState(
    userEmail.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [notifEvents, setNotifEvents] = useState(true);
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }, 600);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">View and update your personal information.</p>
      </div>

      {/* Profile summary */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-foreground text-lg">{displayName}</div>
            <div className="text-sm text-muted-foreground">{userEmail}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-success/10 text-success border-0 text-xs">Active member</Badge>
              <span className="text-xs text-muted-foreground">{activeMembership?.churchName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" value={userEmail} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Contact your administrator to change your email.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "notif-events", label: "Upcoming events", description: "Reminders about events you may attend", value: notifEvents, set: setNotifEvents },
            { id: "notif-announcements", label: "Announcements", description: "New posts from your organization", value: notifAnnouncements, set: setNotifAnnouncements },
            { id: "notif-reminders", label: "Activity reminders", description: "Follow-up reminders for registered activities", value: notifReminders, set: setNotifReminders },
          ].map((pref) => (
            <div key={pref.id} className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={pref.id} className="font-medium cursor-pointer">{pref.label}</Label>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Switch
                id={pref.id}
                checked={pref.value}
                onCheckedChange={pref.set}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
