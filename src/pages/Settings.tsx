import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, Bell, Building2, CheckCircle, Database, Download, ExternalLink, Link, Moon, Palette, SlidersHorizontal, Sun, SunMoon, Upload, User } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { deleteCurrentUser, isSupabaseConfigured, supabaseRequest, updateUserMetadata } from "@/lib/supabaseRest";
import { getStoredTheme, setTheme } from "@/lib/theme";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockPrograms, mockYouths } from "@/data/mockData";
import { downloadCsv, downloadExcel, downloadTextFile } from "@/lib/exportUtils";

interface OrganizationSettingsRow {
  id: string;
  name: string;
  slug: string | null;
  join_code: string | null;
  organization_type: string;
  member_label: string;
  program_label: string;
  group_label: string;
  attendance_label: string;
  primary_focus: string;
}

const organizationTypeLabels: Record<string, string> = {
  church: "Church or ministry",
  nonprofit: "Nonprofit or NGO",
  school: "School or campus group",
  club: "Club or association",
  youth_program: "Youth program",
  other: "Other organization",
};

const presets = {
  church: {
    memberLabel: "Members",
    programLabel: "Ministries",
    groupLabel: "Small Groups",
    attendanceLabel: "Attendance",
    primaryFocus: "Youth Ministry",
  },
  nonprofit: {
    memberLabel: "Participants",
    programLabel: "Programs",
    groupLabel: "Cohorts",
    attendanceLabel: "Participation",
    primaryFocus: "Community Programs",
  },
  school: {
    memberLabel: "Students",
    programLabel: "Activities",
    groupLabel: "Clubs",
    attendanceLabel: "Attendance",
    primaryFocus: "Student Programs",
  },
  club: {
    memberLabel: "Members",
    programLabel: "Events",
    groupLabel: "Teams",
    attendanceLabel: "Check-ins",
    primaryFocus: "Member Engagement",
  },
  youth_program: {
    memberLabel: "Youth",
    programLabel: "Programs",
    groupLabel: "Groups",
    attendanceLabel: "Attendance",
    primaryFocus: "Youth Programs",
  },
  other: {
    memberLabel: "People",
    programLabel: "Programs",
    groupLabel: "Groups",
    attendanceLabel: "Attendance",
    primaryFocus: "Programs",
  },
};

const Settings = () => {
  const { activeMembership, canManageChurch, session, signOut, reloadAccess } = useAuth();
  const navigate = useNavigate();
  const userEmail = session?.user?.email ?? "";
  const userInitials = userEmail.slice(0, 2).toUpperCase();
  const savedName = (session?.user as any)?.user_metadata?.display_name as string | undefined;
  const [displayName, setDisplayName] = useState(
    savedName ?? userEmail.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [theme, setThemeState] = useState(getStoredTheme);

  function handleThemeChange(value: string) {
    setThemeState(value as any);
    setTheme(value as any);
  }
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("other");
  const [memberLabel, setMemberLabel] = useState("People");
  const [programLabel, setProgramLabel] = useState("Programs");
  const [groupLabel, setGroupLabel] = useState("Groups");
  const [attendanceLabel, setAttendanceLabel] = useState("Attendance");
  const [primaryFocus, setPrimaryFocus] = useState("Programs");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMembership) return;

    setOrganizationName(activeMembership.churchName);
    setOrganizationType(activeMembership.organizationType || "other");
    setMemberLabel(activeMembership.memberLabel || "People");
    setProgramLabel(activeMembership.programLabel || "Programs");
    setGroupLabel(activeMembership.groupLabel || "Groups");
    setAttendanceLabel(activeMembership.attendanceLabel || "Attendance");
    setPrimaryFocus(activeMembership.primaryFocus || "Programs");
  }, [activeMembership]);

  function applyPreset(type: string) {
    const preset = presets[type as keyof typeof presets] ?? presets.other;
    setOrganizationType(type);
    setMemberLabel(preset.memberLabel);
    setProgramLabel(preset.programLabel);
    setGroupLabel(preset.groupLabel);
    setAttendanceLabel(preset.attendanceLabel);
    setPrimaryFocus(preset.primaryFocus);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (isSupabaseConfigured) {
        await updateUserMetadata({ display_name: displayName.trim() });
      }
      toast({ title: "Profile updated" });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unable to save.", variant: "destructive" });
    } finally {
      setSavingProfile(false);
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
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Unable to delete account.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  async function saveOrganizationSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeMembership) return;

    setIsSaving(true);
    setError(null);

    try {
      await supabaseRequest<OrganizationSettingsRow[]>("rpc/update_organization_settings", {
        method: "POST",
        body: JSON.stringify({
          target_church_id: activeMembership.churchId,
          requested_name: organizationName,
          requested_organization_type: organizationType,
          requested_member_label: memberLabel,
          requested_program_label: programLabel,
          requested_group_label: groupLabel,
          requested_attendance_label: attendanceLabel,
          requested_primary_focus: primaryFocus,
        }),
      });

      toast({ title: "Organization settings saved" });
      await reloadAccess();
      navigate("/settings");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save organization settings";
      setError(message);
      toast({ title: "Unable to save settings", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const peopleRows = mockYouths.map((person) => ({
    Name: `${person.firstName} ${person.lastName}`,
    Email: person.email,
    Phone: person.phone,
    Status: person.status,
    Engagement: person.engagementStatus,
    "Attendance Rate": person.attendanceRate,
  }));

  const programRows = mockPrograms.map((program) => ({
    Name: program.name,
    Category: program.category,
    Schedule: program.schedule,
    Leader: program.leader,
    Participants: program.participantCount,
  }));

  function exportAllData(format: "csv" | "excel") {
    const rows = [
      ...peopleRows.map((row) => ({ Type: memberLabel, ...row })),
      ...programRows.map((row) => ({ Type: programLabel, ...row })),
    ];

    if (format === "excel") {
      downloadExcel(`${organizationName || "Organization"} backup`, rows);
    } else {
      downloadCsv(`${organizationName || "Organization"} backup`, rows);
    }

    toast({ title: "Backup downloaded" });
  }

  function exportJsonBackup() {
    downloadTextFile(
      `${(organizationName || "organization").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-backup.json`,
      JSON.stringify({ organizationName, organizationType, people: mockYouths, programs: mockPrograms }, null, 2),
      "application/json;charset=utf-8"
    );
    toast({ title: "JSON backup downloaded" });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Tailor Ivula Canopy for your organization, programs, and team language.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Profile
              </CardTitle>
              <CardDescription>Set the type, name, and terminology your team sees across the app.</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeMembership ? (
                <p className="text-sm text-muted-foreground">Choose an active organization before editing settings.</p>
              ) : !canManageChurch ? (
                <p className="text-sm text-muted-foreground">Only owners and admins can edit organization settings.</p>
              ) : (
                <form onSubmit={saveOrganizationSettings} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organization-name">Organization name</Label>
                      <Input
                        id="organization-name"
                        autoComplete="organization"
                        value={organizationName}
                        onChange={(event) => setOrganizationName(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-type">Organization type</Label>
                      <Select value={organizationType} onValueChange={applyPreset}>
                        <SelectTrigger id="org-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(organizationTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="member-label">People label</Label>
                      <Input id="member-label" autoComplete="off" value={memberLabel} onChange={(event) => setMemberLabel(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="program-label">Program label</Label>
                      <Input id="program-label" autoComplete="off" value={programLabel} onChange={(event) => setProgramLabel(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-label">Group label</Label>
                      <Input id="group-label" autoComplete="off" value={groupLabel} onChange={(event) => setGroupLabel(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendance-label">Attendance label</Label>
                      <Input id="attendance-label" autoComplete="off" value={attendanceLabel} onChange={(event) => setAttendanceLabel(event.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary-focus">Primary focus</Label>
                    <Input id="primary-focus" autoComplete="off" value={primaryFocus} onChange={(event) => setPrimaryFocus(event.target.value)} />
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <div className="mb-2 flex items-center gap-2 font-medium">
                      <SlidersHorizontal className="h-4 w-4" />
                      Preview
                    </div>
                    <p className="text-muted-foreground">
                      {organizationName || "Your organization"} will track {memberLabel.toLowerCase()}, manage {programLabel.toLowerCase()}, organize {groupLabel.toLowerCase()}, and report on {attendanceLabel.toLowerCase()} for {primaryFocus.toLowerCase()}.
                    </p>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Organization Settings"}</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                </div>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-4 w-4" />Light</span></SelectItem>
                    <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-4 w-4" />Dark</span></SelectItem>
                    <SelectItem value="system"><span className="flex items-center gap-2"><SunMoon className="h-4 w-4" />System</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure when and how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Engagement alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when participation drops significantly</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Attendance warnings</p>
                  <p className="text-sm text-muted-foreground">Alert when someone misses 3+ consecutive meetings</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">New registration notifications</p>
                  <p className="text-sm text-muted-foreground">Notify when a new person registers</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Weekly summary email</p>
                  <p className="text-sm text-muted-foreground">Receive a weekly digest of key metrics</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                External Integrations
              </CardTitle>
              <CardDescription>Connect with calendars, email tools, and existing organization systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-muted bg-muted/40 p-4 flex items-start gap-3 mb-2">
                <SunMoon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Third-party integrations (Planning Center, Mailchimp, Google Calendar, etc.) are on the roadmap. Once connected, data will sync automatically. Check back in a future release.
                </p>
              </div>
              {[
                { name: "Planning Center", description: "Import attendance and volunteer data" },
                { name: "Mailchimp", description: "Sync contacts for email communications" },
                { name: "Google Calendar", description: "Sync program schedules and events" },
                { name: "Custom database", description: "Connect your existing people data via API" },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 rounded-lg border opacity-60">
                  <div className="space-y-0.5">
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs text-muted-foreground">Coming soon</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Import, export, and manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Import Data</p>
                    <p className="text-sm text-muted-foreground">Upload records from CSV or Excel files</p>
                  </div>
                </div>
                <Button variant="outline" onClick={exportJsonBackup}>
                  <Upload className="h-4 w-4 mr-2" />
                  Download JSON Backup
                </Button>
              </div>

              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Download className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Export All Data</p>
                    <p className="text-sm text-muted-foreground">Download a complete backup of all records</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportAllData("csv")}>Export as CSV</Button>
                  <Button variant="outline" onClick={() => exportAllData("excel")}>Export as Excel</Button>
                </div>
              </div>

              <Separator />

              <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3">
                <p className="font-medium text-destructive">Danger Zone</p>
                <p className="text-sm text-muted-foreground">These actions are irreversible. Please proceed with caution.</p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => toast({
                    title: "Protected action",
                    description: "Clearing data will be enabled after a confirmation workflow is added.",
                    variant: "destructive",
                  })}
                >
                  Clear All Test Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Account
              </CardTitle>
              <CardDescription>Manage your personal profile and account settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-sm text-muted-foreground">{userEmail}</div>
                  <Badge className="mt-1 text-xs bg-primary/10 text-primary border-0">{activeMembership?.role ?? "staff"}</Badge>
                </div>
              </div>

              <Separator />

              <form onSubmit={saveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-display-name">Display name</Label>
                  <Input
                    id="staff-display-name"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-email">Email address</Label>
                  <Input id="staff-email" autoComplete="email" value={userEmail} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Contact your organization owner to change your email.</p>
                </div>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </Button>
              </form>
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
        </TabsContent>
      </Tabs>

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
};

export default Settings;
