import { useMemo, useState } from "react";
import { Search, Plus, Grid, List, AlertTriangle, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockYouths as initialYouths, Youth } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { YouthProfileSheet } from "@/components/directory/YouthProfileSheet";
import { AddYouthDialog } from "@/components/directory/AddYouthDialog";
import { RecordAttendanceDialog } from "@/components/directory/RecordAttendanceDialog";
import { DeleteYouthDialog } from "@/components/directory/DeleteYouthDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AttendanceRecord, STORAGE_KEYS } from "@/data/attendanceRecords";
import { useAuth } from "@/auth/AuthContext";

const YouthDirectory = () => {
  const {
    activeMembership,
    canEditRecords,
    canManageChurch,
    canRecordAttendance,
    canExportRecords,
  } = useAuth();
  const memberLabel = activeMembership?.memberLabel ?? "People";
  const groupLabel = activeMembership?.groupLabel ?? "Groups";
  const attendanceLabel = activeMembership?.attendanceLabel ?? "Attendance";
  const [youths, setYouths] = useLocalStorage<Youth[]>(STORAGE_KEYS.YOUTHS, initialYouths);
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedYouth, setSelectedYouth] = useState<Youth | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingYouth, setEditingYouth] = useState<Youth | null>(null);
  const [attendanceYouth, setAttendanceYouth] = useState<Youth | null>(null);
  const [deleteYouth, setDeleteYouth] = useState<Youth | null>(null);

  const filteredYouths = useMemo(() => {
    return youths.filter((youth) => {
      const matchesSearch =
        youth.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        youth.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        youth.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || youth.status === statusFilter;
      const matchesAge = ageFilter === "all" || youth.ageGroup === ageFilter;
      const matchesEngagement = engagementFilter === "all" || youth.engagementStatus === engagementFilter;
      return matchesSearch && matchesStatus && matchesAge && matchesEngagement;
    });
  }, [youths, searchQuery, statusFilter, ageFilter, engagementFilter]);

  const roleLabel = activeMembership?.role ?? "viewer";

  const showPermissionError = (action: string) => {
    toast({
      title: "Permission needed",
      description: `${action} is not available for the ${roleLabel} role in this organization.`,
      variant: "destructive",
    });
  };

  const handleAddYouth = (newYouth: Partial<Youth>) => {
    if (!canEditRecords) {
      showPermissionError(`Adding or editing ${memberLabel.toLowerCase()} records`);
      return;
    }

    if (editingYouth) {
      setYouths((prev) => prev.map((y) => y.id === editingYouth.id ? { ...y, ...newYouth } as Youth : y));
      setEditingYouth(null);
    } else {
      setYouths((prev) => [...prev, newYouth as Youth]);
    }
  };

  const handleEditYouth = (youth: Youth) => {
    if (!canEditRecords) {
      showPermissionError(`Editing ${memberLabel.toLowerCase()} profiles`);
      return;
    }

    setSelectedYouth(null);
    setEditingYouth(youth);
    setIsAddDialogOpen(true);
  };

  const handleDeleteYouth = (youth: Youth) => {
    if (!canManageChurch) {
      showPermissionError(`Deleting ${memberLabel.toLowerCase()} records`);
      return;
    }

    setSelectedYouth(null);
    setDeleteYouth(youth);
  };

  const handleConfirmDelete = (youth: Youth) => {
    if (!canManageChurch) {
      showPermissionError(`Deleting ${memberLabel.toLowerCase()} records`);
      return;
    }

    setYouths((prev) => prev.filter((y) => y.id !== youth.id));
    setDeleteYouth(null);
    toast({
      title: "Record Deleted",
      description: `${youth.firstName} ${youth.lastName} has been removed from the directory.`,
    });
  };

  const handleRecordAttendance = (youth: Youth) => {
    if (!canRecordAttendance) {
      showPermissionError(`Recording ${attendanceLabel.toLowerCase()}`);
      return;
    }

    setSelectedYouth(null);
    setAttendanceYouth(youth);
  };

  const handleAttendanceRecorded = (youth: Youth, record: any) => {
    if (!canRecordAttendance) {
      showPermissionError(`Recording ${attendanceLabel.toLowerCase()}`);
      return;
    }

    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      youthId: youth.id,
      youthName: `${youth.firstName} ${youth.lastName}`,
      programId: record.programId,
      programName: record.programName || "Unknown Program",
      date: record.date,
      attendanceStatus: record.attendanceStatus,
      engagementLevel: record.engagementLevel,
      participatedInActivity: record.participatedInActivity,
      activityNotes: record.activityNotes,
      followUpNotes: record.followUpNotes,
      recordedAt: new Date().toISOString(),
    };

    setAttendanceRecords((prev) => [...prev, newRecord]);

    setYouths((prev) => prev.map((y) => {
      if (y.id === youth.id) {
        const isPresent = record.attendanceStatus === "present" || record.attendanceStatus === "late";
        const newAttendanceRate = isPresent ? Math.min(100, y.attendanceRate + 2) : Math.max(0, y.attendanceRate - 3);

        let engagementDelta = 0;
        if (isPresent) {
          engagementDelta = record.engagementLevel === "very_high" ? 5
            : record.engagementLevel === "high" ? 3
            : record.engagementLevel === "medium" ? 1
            : 0;
        } else {
          engagementDelta = -5;
        }

        const newEngagementScore = Math.min(100, Math.max(0, y.engagementScore + engagementDelta));
        const newEngagementStatus = newEngagementScore >= 70 ? "engaged"
          : newEngagementScore >= 40 ? "at-risk"
          : "disengaged";

        return {
          ...y,
          attendanceRate: newAttendanceRate,
          engagementScore: newEngagementScore,
          engagementStatus: newEngagementStatus,
          lastAttendance: isPresent ? record.date : y.lastAttendance,
          notes: record.followUpNotes ? `${y.notes ? y.notes + " | " : ""}${record.followUpNotes}` : y.notes,
        };
      }
      return y;
    }));

    toast({
      title: `${attendanceLabel} Recorded`,
      description: `${attendanceLabel} for ${youth.firstName} ${youth.lastName} saved successfully.`,
    });

    setAttendanceYouth(null);
  };

  const handleExport = () => {
    if (!canExportRecords) {
      showPermissionError(`Exporting ${memberLabel.toLowerCase()} records`);
      return;
    }

    const csvContent = [
      ["Name", "Email", "Phone", "Age Group", "Status", "Education", "Occupation", "Engagement"].join(","),
      ...youths.map((y) => [
        `${y.firstName} ${y.lastName}`,
        y.email,
        y.phone,
        y.ageGroup,
        y.status,
        y.educationStatus,
        y.occupation || "N/A",
        y.engagementStatus,
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${memberLabel.toLowerCase().replace(/\s+/g, "_")}_directory.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: `Exported ${youths.length} records to CSV.`,
    });
  };

  const getEngagementBadge = (status: string) => {
    const styles = {
      engaged: "status-engaged",
      "at-risk": "status-at-risk",
      disengaged: "status-disengaged",
    };
    return styles[status as keyof typeof styles] || "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">{memberLabel} Directory</h1>
          <p className="page-description">
            {activeMembership
              ? `Manage ${activeMembership.churchName} records by role-based access.`
              : "Manage and view registered people"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!canExportRecords}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)} disabled={!canEditRecords}>
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="directory-search"
            name="directory-search"
            autoComplete="off"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageFilter} onValueChange={setAgeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="under-18">Under 18</SelectItem>
              <SelectItem value="18-30">18–30</SelectItem>
              <SelectItem value="31-45">31–45</SelectItem>
              <SelectItem value="46-60">46–60</SelectItem>
              <SelectItem value="60+">60+</SelectItem>
            </SelectContent>
          </Select>
          <Select value={engagementFilter} onValueChange={setEngagementFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Engagement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="engaged">Engaged</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="disengaged">Disengaged</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setViewMode("table")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Showing {filteredYouths.length} of {youths.length} records</p>

      {viewMode === "table" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>{groupLabel}</TableHead>
                <TableHead>{attendanceLabel}</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredYouths.map((youth) => (
                <TableRow key={youth.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedYouth(youth)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={cn("text-sm font-medium", youth.engagementStatus === "engaged" && "bg-success/20 text-success", youth.engagementStatus === "at-risk" && "bg-warning/20 text-warning", youth.engagementStatus === "disengaged" && "bg-destructive/20 text-destructive")}>{youth.firstName[0]}{youth.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{youth.firstName} {youth.lastName}</p>
                          {youth.engagementStatus === "at-risk" && (
                            <Tooltip>
                              <TooltipTrigger><AlertTriangle className="h-4 w-4 text-warning" /></TooltipTrigger>
                              <TooltipContent>Needs follow-up</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{youth.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{youth.ageGroup}</TableCell>
                  <TableCell className="text-muted-foreground">{youth.smallGroup || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", youth.attendanceRate >= 80 && "bg-success", youth.attendanceRate >= 50 && youth.attendanceRate < 80 && "bg-warning", youth.attendanceRate < 50 && "bg-destructive")} style={{ width: `${youth.attendanceRate}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{youth.attendanceRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={getEngagementBadge(youth.engagementStatus)}>{youth.engagementStatus.replace("-", " ")}</Badge></TableCell>
                  <TableCell><Badge variant={youth.status === "active" ? "default" : "secondary"} className={youth.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>{youth.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedYouth(youth); }}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredYouths.map((youth) => (
            <div key={youth.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedYouth(youth)}>
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={cn("text-sm font-medium", youth.engagementStatus === "engaged" && "bg-success/20 text-success", youth.engagementStatus === "at-risk" && "bg-warning/20 text-warning", youth.engagementStatus === "disengaged" && "bg-destructive/20 text-destructive")}>{youth.firstName[0]}{youth.lastName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{youth.firstName} {youth.lastName}</p>
                    {youth.engagementStatus === "at-risk" && <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{youth.ageGroup}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{attendanceLabel}</span>
                  <span className="font-medium">{youth.attendanceRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getEngagementBadge(youth.engagementStatus)}>{youth.engagementStatus.replace("-", " ")}</Badge>
                  <Badge variant={youth.status === "active" ? "default" : "secondary"} className={youth.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>{youth.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <YouthProfileSheet youth={selectedYouth} open={!!selectedYouth} onOpenChange={(open) => !open && setSelectedYouth(null)} onEdit={handleEditYouth} onDelete={handleDeleteYouth} onRecordAttendance={handleRecordAttendance} canEdit={canEditRecords} canDelete={canManageChurch} canRecordAttendance={canRecordAttendance} />

      <AddYouthDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingYouth(null);
            return;
          }

          if (!canEditRecords) {
            showPermissionError(`Adding or editing ${memberLabel.toLowerCase()} records`);
            return;
          }

          setIsAddDialogOpen(true);
        }}
        onSave={handleAddYouth}
        editingYouth={editingYouth}
      />

      {attendanceYouth && <RecordAttendanceDialog open={!!attendanceYouth} onOpenChange={(open) => !open && setAttendanceYouth(null)} youth={attendanceYouth} onRecordAttendance={handleAttendanceRecorded} />}

      <DeleteYouthDialog open={!!deleteYouth} onOpenChange={(open) => !open && setDeleteYouth(null)} youth={deleteYouth} onConfirmDelete={handleConfirmDelete} />
    </div>
  );
};

export default YouthDirectory;
