import { useState } from "react";
import { mockPrograms, mockYouths, type Program } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Music,
  BookOpen,
  Heart,
  Megaphone,
  Crown,
  GraduationCap,
  Briefcase,
  UserX,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/data/attendanceRecords";
import { toast } from "@/hooks/use-toast";

const categoryIcons: Record<string, typeof Music> = {
  worship: Music,
  discipleship: BookOpen,
  fellowship: Heart,
  outreach: Megaphone,
  leadership: Crown,
  sabbath_school: GraduationCap,
};

const categoryLabels: Record<string, string> = {
  worship: "Gathering",
  discipleship: "Learning",
  fellowship: "Community",
  outreach: "Outreach",
  leadership: "Leadership",
  sabbath_school: "Study Group",
};

const categoryColors: Record<string, string> = {
  worship: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  discipleship: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  fellowship: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  outreach: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  leadership: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  sabbath_school: "bg-primary/10 text-primary border-primary/20",
};

const scheduleTypeLabels: Record<string, { label: string; className: string }> = {
  sabbath: { label: "Weekend", className: "bg-primary/10 text-primary border-primary/20" },
  weekday: { label: "Weekday", className: "bg-muted text-muted-foreground border-border" },
  special: { label: "Special Event", className: "bg-accent/10 text-accent border-accent/20" },
};

const memberStats = {
  students: mockYouths.filter(y => y.educationStatus === "high_school" || y.educationStatus === "college").length,
  employed: mockYouths.filter(y => y.educationStatus === "working").length,
  unemployed: mockYouths.filter(y => y.educationStatus === "unemployed").length,
};

type ProgramDraft = {
  name: string;
  description: string;
  category: Program["category"];
  schedule: string;
  scheduleType: Program["scheduleType"];
  leader: string;
  maxCapacity: string;
};

const emptyDraft: ProgramDraft = {
  name: "",
  description: "",
  category: "outreach",
  schedule: "",
  scheduleType: "weekday",
  leader: "",
  maxCapacity: "",
};

const Programs = () => {
  const { activeMembership, canEditRecords, canManageChurch } = useAuth();
  const programLabel = activeMembership?.programLabel ?? "Programs";
  const memberLabel = activeMembership?.memberLabel ?? "People";
  const primaryFocus = activeMembership?.primaryFocus ?? "Programs";
  const [programs, setPrograms] = useLocalStorage<Program[]>(STORAGE_KEYS.PROGRAMS, mockPrograms);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");

  // Create / Edit dialog
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programDraft, setProgramDraft] = useState<ProgramDraft>(emptyDraft);

  // View details dialog
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Delete confirmation
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);

  const filteredPrograms = programs.filter((program) => {
    const categoryMatch = categoryFilter === "all" || program.category === categoryFilter;
    const scheduleMatch = scheduleFilter === "all" || program.scheduleType === scheduleFilter;
    return categoryMatch && scheduleMatch;
  });

  const activePrograms = programs.filter((p) => p.isActive);
  const totalParticipants = programs.reduce((sum, p) => sum + p.participantCount, 0);
  const avgEngagement = Math.round(
    programs.reduce((sum, p) => sum + p.engagementScore, 0) / Math.max(programs.length, 1)
  );
  const weekendPrograms = programs.filter((p) => p.scheduleType === "sabbath").length;

  const openAddProgram = () => {
    setEditingProgramId(null);
    setProgramDraft(emptyDraft);
    setIsProgramDialogOpen(true);
  };

  const openEditProgram = (program: Program) => {
    setEditingProgramId(program.id);
    setProgramDraft({
      name: program.name,
      description: program.description,
      category: program.category,
      schedule: program.schedule,
      scheduleType: program.scheduleType,
      leader: program.leader,
      maxCapacity: program.maxCapacity ? String(program.maxCapacity) : "",
    });
    setSelectedProgram(null);
    setIsProgramDialogOpen(true);
  };

  const saveProgram = () => {
    if (!programDraft.name.trim() || !programDraft.description.trim()) {
      toast({
        title: "Program details needed",
        description: `Add a name and description before saving.`,
        variant: "destructive",
      });
      return;
    }

    if (editingProgramId) {
      // Update existing
      setPrograms((current) =>
        current.map((p) =>
          p.id === editingProgramId
            ? {
                ...p,
                name: programDraft.name.trim(),
                description: programDraft.description.trim(),
                category: programDraft.category,
                schedule: programDraft.schedule.trim() || p.schedule,
                scheduleType: programDraft.scheduleType,
                leader: programDraft.leader.trim() || p.leader,
                maxCapacity: programDraft.maxCapacity ? Number(programDraft.maxCapacity) : undefined,
              }
            : p
        )
      );
      toast({ title: `${programLabel} updated`, description: `${programDraft.name} has been saved.` });
    } else {
      // Create new
      const nextProgram: Program = {
        id: crypto.randomUUID(),
        name: programDraft.name.trim(),
        description: programDraft.description.trim(),
        category: programDraft.category,
        startDate: new Date().toISOString().split("T")[0],
        isActive: true,
        participantCount: 0,
        maxCapacity: programDraft.maxCapacity ? Number(programDraft.maxCapacity) : undefined,
        leader: programDraft.leader.trim() || "Unassigned",
        schedule: programDraft.schedule.trim() || "Schedule not set",
        scheduleType: programDraft.scheduleType,
        averageAttendance: 0,
        engagementScore: 0,
        memberBreakdown: { students: 0, employed: 0, unemployed: 0 },
      };
      setPrograms((current) => [nextProgram, ...current]);
      toast({ title: `${programLabel} saved`, description: `${nextProgram.name} is now available.` });
    }

    setIsProgramDialogOpen(false);
    setEditingProgramId(null);
  };

  const confirmDelete = () => {
    if (!deletingProgram) return;
    setPrograms((current) => current.filter((p) => p.id !== deletingProgram.id));
    toast({ title: `${programLabel} deleted`, description: `${deletingProgram.name} has been removed.` });
    setDeletingProgram(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">{programLabel} & Activities</h1>
          <p className="page-description">Track and manage {primaryFocus.toLowerCase()} for your organization.</p>
        </div>
        {canEditRecords && (
          <Button size="sm" onClick={openAddProgram}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePrograms.length}</p>
                <p className="text-sm text-muted-foreground">Active {programLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekendPrograms}</p>
                <p className="text-sm text-muted-foreground">Weekend {programLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-3/10">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgEngagement}%</p>
                <p className="text-sm text-muted-foreground">Avg Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{memberLabel} Status Overview</CardTitle>
          <CardDescription>Overview by education and work status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-chart-2/10 border border-chart-2/20">
              <GraduationCap className="h-8 w-8 text-chart-2" />
              <div>
                <p className="text-2xl font-bold text-chart-2">{memberStats.students}</p>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-xs text-muted-foreground">High School & College</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
              <Briefcase className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{memberStats.employed}</p>
                <p className="text-sm text-muted-foreground">Employed</p>
                <p className="text-xs text-muted-foreground">Working Professionals</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
              <UserX className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{memberStats.unemployed}</p>
                <p className="text-sm text-muted-foreground">Seeking Employment</p>
                <p className="text-xs text-muted-foreground">Job Seekers</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="worship">Gathering</SelectItem>
            <SelectItem value="sabbath_school">Study Group</SelectItem>
            <SelectItem value="discipleship">Learning</SelectItem>
            <SelectItem value="fellowship">Community</SelectItem>
            <SelectItem value="outreach">Outreach</SelectItem>
            <SelectItem value="leadership">Leadership</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Schedules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schedules</SelectItem>
            <SelectItem value="sabbath">Weekend</SelectItem>
            <SelectItem value="weekday">Weekday</SelectItem>
            <SelectItem value="special">Special Events</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Showing {filteredPrograms.length} {programLabel.toLowerCase()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => {
          const Icon = categoryIcons[program.category] || Calendar;
          const scheduleInfo = scheduleTypeLabels[program.scheduleType];
          return (
            <Card key={program.id} className="group hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg border", categoryColors[program.category])}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge variant="outline" className="capitalize text-xs">
                          {categoryLabels[program.category] ?? program.category.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", scheduleInfo.className)}>
                          {scheduleInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={program.isActive ? "default" : "secondary"}
                    className={program.isActive ? "bg-success/10 text-success border-success/20" : ""}
                  >
                    {program.isActive ? "Active" : "Past"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-2">{program.description}</CardDescription>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{program.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{program.participantCount}{program.maxCapacity && ` / ${program.maxCapacity}`} participants</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status Breakdown</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <GraduationCap className="h-3 w-3 text-chart-2" />
                        <span className="text-sm font-semibold">{program.memberBreakdown.students}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Briefcase className="h-3 w-3 text-success" />
                        <span className="text-sm font-semibold">{program.memberBreakdown.employed}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Employed</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <UserX className="h-3 w-3 text-warning" />
                        <span className="text-sm font-semibold">{program.memberBreakdown.unemployed}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Seeking</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Engagement Score</span>
                    <span className="font-medium">{program.engagementScore}%</span>
                  </div>
                  <Progress value={program.engagementScore} className="h-2" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedProgram(program)}>
                    View Details
                  </Button>
                  {canEditRecords && (
                    <Button variant="outline" size="icon" onClick={() => openEditProgram(program)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canManageChurch && (
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingProgram(program)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={isProgramDialogOpen} onOpenChange={(open) => { setIsProgramDialogOpen(open); if (!open) setEditingProgramId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProgramId ? `Edit ${programLabel}` : `Add ${programLabel}`}</DialogTitle>
            <DialogDescription>
              {editingProgramId ? "Update the details for this program." : "Create a program, activity, team rhythm, or event for this organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Name</Label>
              <Input id="program-name" value={programDraft.name} onChange={(e) => setProgramDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-description">Description</Label>
              <Textarea id="program-description" value={programDraft.description} onChange={(e) => setProgramDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program-category">Category</Label>
                <Select value={programDraft.category} onValueChange={(v) => setProgramDraft((d) => ({ ...d, category: v as Program["category"] }))}>
                  <SelectTrigger id="program-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worship">Gathering</SelectItem>
                    <SelectItem value="sabbath_school">Study Group</SelectItem>
                    <SelectItem value="discipleship">Learning</SelectItem>
                    <SelectItem value="fellowship">Community</SelectItem>
                    <SelectItem value="outreach">Outreach</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-schedule-type">Schedule Type</Label>
                <Select value={programDraft.scheduleType} onValueChange={(v) => setProgramDraft((d) => ({ ...d, scheduleType: v as Program["scheduleType"] }))}>
                  <SelectTrigger id="program-schedule-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sabbath">Weekend</SelectItem>
                    <SelectItem value="weekday">Weekday</SelectItem>
                    <SelectItem value="special">Special Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program-leader">Lead</Label>
                <Input id="program-leader" value={programDraft.leader} onChange={(e) => setProgramDraft((d) => ({ ...d, leader: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-schedule">Schedule</Label>
                <Input id="program-schedule" value={programDraft.schedule} onChange={(e) => setProgramDraft((d) => ({ ...d, schedule: e.target.value }))} placeholder="Tuesdays at 6 PM" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-capacity">Capacity</Label>
                <Input id="program-capacity" type="number" min="0" value={programDraft.maxCapacity} onChange={(e) => setProgramDraft((d) => ({ ...d, maxCapacity: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgramDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProgram}>{editingProgramId ? "Save Changes" : `Save ${programLabel}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View details dialog */}
      <Dialog open={!!selectedProgram} onOpenChange={(open) => !open && setSelectedProgram(null)}>
        <DialogContent>
          {selectedProgram && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProgram.name}</DialogTitle>
                <DialogDescription>{selectedProgram.description}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{categoryLabels[selectedProgram.category]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Schedule</p>
                  <p className="font-medium">{selectedProgram.schedule}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lead</p>
                  <p className="font-medium">{selectedProgram.leader}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Participants</p>
                  <p className="font-medium">{selectedProgram.participantCount}{selectedProgram.maxCapacity ? ` / ${selectedProgram.maxCapacity}` : ""}</p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                {canEditRecords && (
                  <Button variant="outline" onClick={() => openEditProgram(selectedProgram)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedProgram(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingProgram} onOpenChange={(open) => !open && setDeletingProgram(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {programLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingProgram?.name}</strong> will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Programs;
