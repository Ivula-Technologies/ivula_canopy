import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, Moon, Sun, SunMoon, User } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/auth/AuthContext";
import { deleteCurrentUser, isSupabaseConfigured, updateUserMetadata } from "@/lib/supabaseRest";
import { getStoredTheme, setTheme } from "@/lib/theme";
import { toast } from "@/hooks/use-toast";

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function StaffProfile() {
  const { session, activeMembership, signOut, updateSession } = useAuth();
  const userEmail = session?.user?.email ?? "";
  const userInitials = userEmail.slice(0, 2).toUpperCase();

  const savedName = (session?.user as any)?.user_metadata?.display_name as string | undefined;
  const savedPhone = (session?.user as any)?.user_metadata?.phone as string | undefined;

  const [displayName, setDisplayName] = useState(
    savedName ?? userEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
  const [phone, setPhone] = useState(savedPhone ?? "");

  // Sync form fields when the session user_metadata updates after a save.
  useEffect(() => {
    if (savedName !== undefined) setDisplayName(savedName);
  }, [savedName]);
  useEffect(() => {
    if (savedPhone !== undefined) setPhone(savedPhone);
  }, [savedPhone]);
  const [saving, setSaving] = useState(false);
  const [theme, setThemeState] = useState(getStoredTheme);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleThemeChange(value: string) {
    setThemeState(value as any);
    setTheme(value as any);
  }

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
      // Sync state to trimmed values so the display reflects what was saved.
      setDisplayName(trimmedName);
      setPhone(trimmedPhone);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unable to save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      if (isSupabaseConfigured) await deleteCurrentUser();
      signOut();
      toast({ title: "Account deleted", description: "Your account has been permanently removed." });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Unable to delete account.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          My Profile
        </h1>
        <p className="page-description">Manage your personal information and preferences.</p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold text-foreground text-lg truncate">{displayName}</div>
            <div className="text-sm text-muted-foreground truncate">{userEmail}</div>
            {activeMembership && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="bg-primary/10 text-primary border-0 text-xs">
                  {formatRole(activeMembership.role)}
                </Badge>
                <span className="text-xs text-muted-foreground">{activeMembership.churchName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input id="display-name" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" autoComplete="email" value={userEmail} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Contact your organization owner to change your email.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">Theme</p>
              <p className="text-xs text-muted-foreground">Choose light, dark, or follow your system setting.</p>
            </div>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <span className="flex items-center gap-2"><Sun className="h-4 w-4" />Light</span>
                </SelectItem>
                <SelectItem value="dark">
                  <span className="flex items-center gap-2"><Moon className="h-4 w-4" />Dark</span>
                </SelectItem>
                <SelectItem value="system">
                  <span className="flex items-center gap-2"><SunMoon className="h-4 w-4" />System</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
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
              This will permanently delete your account and remove all your data. This action cannot be undone.
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
