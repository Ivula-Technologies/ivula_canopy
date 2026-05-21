import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Copy, RefreshCw, Shield, UserCog, UserX, Users } from "lucide-react";
import { useAuth, type ChurchMembershipStatus, type ChurchRole } from "@/auth/AuthContext";
import { supabaseRequest } from "@/lib/supabaseRest";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TeamRole = ChurchRole;
type TeamStatus = ChurchMembershipStatus;

interface TeamMember {
  membership_id: string;
  user_id: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  created_at: string;
  updated_at: string;
}

const roleLabels: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  leader: "Leader",
  volunteer: "Volunteer",
  viewer: "Regular member",
};

const statusLabels: Record<TeamStatus, string> = {
  active: "Active",
  invited: "Pending",
  disabled: "Disabled",
};

const statusClassNames: Record<TeamStatus, string> = {
  active: "bg-success/10 text-success border-success/20",
  invited: "bg-warning/10 text-warning border-warning/20",
  disabled: "bg-muted text-muted-foreground border-muted",
};

const manageableRoles: TeamRole[] = ["owner", "admin", "leader", "volunteer", "viewer"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Team() {
  const { activeMembership, canManageChurch, session } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => members.filter((member) => member.status === "invited").length,
    [members]
  );
  const activeCount = useMemo(
    () => members.filter((member) => member.status === "active").length,
    [members]
  );

  async function loadTeam() {
    if (!activeMembership?.churchId || !canManageChurch) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rows = await supabaseRequest<TeamMember[]>("rpc/list_church_team", {
        method: "POST",
        body: JSON.stringify({ target_church_id: activeMembership.churchId }),
      });
      setMembers(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load team members";
      setError(message);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, [activeMembership?.churchId, canManageChurch]);

  async function updateMember(member: TeamMember, requestedRole: TeamRole, requestedStatus: TeamStatus) {
    setSavingId(member.membership_id);
    setError(null);

    try {
      const rows = await supabaseRequest<TeamMember[]>("rpc/update_church_team_member", {
        method: "POST",
        body: JSON.stringify({
          target_membership_id: member.membership_id,
          requested_role: requestedRole,
          requested_status: requestedStatus,
        }),
      });

      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember.membership_id === member.membership_id ? rows[0] ?? currentMember : currentMember
        )
      );

      toast({ title: "Team access updated" });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Unable to update team access";
      setError(message);
      toast({ title: "Unable to update access", description: message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  }

  async function copyJoinCode() {
    const code = activeMembership?.churchJoinCode;
    if (!code) return;

    await navigator.clipboard.writeText(code);
    toast({ title: "Join code copied" });
  }

  if (!activeMembership) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Team Management</h1>
          <p className="page-description">Choose an active organization before managing access.</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No active organization is selected.</CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageChurch) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Team Management</h1>
          <p className="page-description">Owner or admin access is required.</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Ask your organization owner or an admin to manage team access.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Team Management</h1>
        <p className="page-description">Approve join requests and control access for {activeMembership.churchName}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <UserCog className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Organization join code</p>
                <p className="text-2xl font-bold tracking-wide">{activeMembership.churchJoinCode ?? "Unavailable"}</p>
              </div>
              <Button variant="outline" size="icon" onClick={copyJoinCode} disabled={!activeMembership.churchJoinCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Organization Team</CardTitle>
            <CardDescription>New members who use the join code stay pending until approved.</CardDescription>
          </div>
          <Button variant="outline" onClick={loadTeam} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Loading team members...
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No team members found.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const isSaving = savingId === member.membership_id;
                  const isCurrentUser = member.user_id === session?.user?.id;
                  const canDisable = !(isCurrentUser && member.role === "owner");

                  return (
                    <TableRow key={member.membership_id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{member.email}</p>
                          {isCurrentUser && <p className="text-xs text-muted-foreground">Current user</p>}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-40">
                        <Select
                          value={member.role}
                          disabled={isSaving || member.status === "disabled"}
                          onValueChange={(value) => updateMember(member, value as TeamRole, member.status)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {manageableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {roleLabels[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusClassNames[member.status]}>
                          {statusLabels[member.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(member.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {member.status === "invited" && (
                            <Button
                              size="sm"
                              onClick={() => updateMember(member, member.role, "active")}
                              disabled={isSaving}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          )}
                          {member.status !== "disabled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => updateMember(member, member.role, "disabled")}
                              disabled={isSaving || !canDisable}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Disable
                            </Button>
                          )}
                          {member.status === "disabled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMember(member, member.role, "active")}
                              disabled={isSaving}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
