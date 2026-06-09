import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/auth/AuthContext";
import { deleteCurrentUser, isSupabaseConfigured, updateUserMetadata } from "@/lib/supabaseRest";
import { toast } from "@/hooks/use-toast";

export default function MemberProfile() {
  const { session, activeMembership, signOut, updateSession } = useAuth();
  const userEmail = session?.user?.email ?? "";
  const userInitials = userEmail.slice(0, 2).toUpperCase();

  const savedName = (session?.user as any)?.user_metadata?.display_name as string | undefined;
  const savedPhone = (session?.user as any)?.user_metadata?.phone as string | undefined;

  const [displayName, setDisplayName] = useState(
    savedName ?? userEmail.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
  const [phone, setPhone] = useState(savedPhone ?? "");

  useEffect(() => {
    if (savedName !== undefined) setDisplayName(savedName);
  }, [savedName]);
  useEffect(() => {
    if (savedPhone !== undefined) setPhone(savedPhone);
  }, [savedPhone]);

  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [notifEvents, setNotifEvents] = useState(true);
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const trimmedName = displayName.trim();
      const trimmedPhone = phone.trim();
      if (isSupabaseConfigured) {
        const updated = await updateUserMetadata({ display_name: trimmedName, phone: trimmedPhone });
        updateSession(updated);
      }
      setDisplayName(trimmedName);
      setPhone(trimmedPhone);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unable to save profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      if (isSupabaseConfigured) {
        await deleteCurrentUser();
      }
      signOut();
      toast({ title: "Account deleted", description: "Your account has been permanently removed." });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unable to delete account.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
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
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" autoComplete="email" value={userEmail} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Contact your administrator to change your email.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
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

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and remove all your data from our servers.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
