import { Youth } from "@/data/mockData";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Phone,
  MapPin,
  Users,
  Award,
  TrendingUp,
  Edit,
  MessageSquare,
  AlertTriangle,
  Trash2,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface YouthProfileSheetProps {
  youth: Youth | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (youth: Youth) => void;
  onDelete?: (youth: Youth) => void;
  onRecordAttendance?: (youth: Youth) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canRecordAttendance?: boolean;
}

export function YouthProfileSheet({
  youth,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onRecordAttendance,
  canEdit = false,
  canDelete = false,
  canRecordAttendance = false,
}: YouthProfileSheetProps) {
  if (!youth) return null;

  const getEngagementColor = (status: string) => {
    const colors = {
      engaged: "bg-success text-success-foreground",
      "at-risk": "bg-warning text-warning-foreground",
      disengaged: "bg-destructive text-destructive-foreground",
    };
    return colors[status as keyof typeof colors] || "";
  };

  const getLeadershipLabel = (level: string) => {
    const labels = {
      none: "Not in Leadership",
      emerging: "Emerging Leader",
      developing: "Developing Leader",
      established: "Established Leader",
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getDiscipleshipLabel = (status: string) => {
    const labels = {
      new_believer: "New Believer",
      growing: "Growing",
      mature: "Mature",
      leader: "Spiritual Leader",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback
                  className={cn(
                    "text-xl font-semibold",
                    youth.engagementStatus === "engaged" && "bg-success/20 text-success",
                    youth.engagementStatus === "at-risk" && "bg-warning/20 text-warning",
                    youth.engagementStatus === "disengaged" && "bg-destructive/20 text-destructive"
                  )}
                >
                  {youth.firstName[0]}{youth.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">
                  {youth.firstName} {youth.lastName}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getEngagementColor(youth.engagementStatus)}>
                    {youth.engagementStatus.replace("-", " ")}
                  </Badge>
                  {youth.engagementStatus === "at-risk" && (
                    <Badge variant="outline" className="status-at-risk">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Needs follow-up
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => onRecordAttendance?.(youth)}
              disabled={!canRecordAttendance}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Record Attendance
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onEdit?.(youth)}
              disabled={!canEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete?.(youth)}
              disabled={!canDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

          {youth.notes && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Notes</p>
                  <p className="text-sm text-muted-foreground">{youth.notes}</p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="engagement" className="flex-1">Engagement</TabsTrigger>
              <TabsTrigger value="growth" className="flex-1">Growth</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{youth.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{youth.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{youth.address}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Demographics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-medium">{calculateAge(youth.dateOfBirth)} years old</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{youth.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Education/Work</p>
                    <p className="font-medium capitalize">{youth.educationStatus.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(youth.joinDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Ministry Involvement
                </h4>
                {youth.ministryAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {youth.ministryAreas.map((area) => (
                      <Badge key={area} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not involved in any ministry areas</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="mt-4 space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Engagement Score</span>
                  <span className="text-2xl font-bold">{youth.engagementScore}%</span>
                </div>
                <Progress value={youth.engagementScore} className="h-2" />
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Attendance
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                    <p className="text-xl font-bold">{youth.attendanceRate}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Last Attended</p>
                    <p className="text-xl font-bold">
                      {youth.lastAttendance
                        ? new Date(youth.lastAttendance).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Small Group
                </h4>
                {youth.smallGroup ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">{youth.smallGroup}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned to a small group</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="growth" className="mt-4 space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Spiritual Growth
                </h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Discipleship Status</p>
                      <p className="font-medium">{getDiscipleshipLabel(youth.discipleshipStatus)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Leadership Development
                </h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Leadership Level</p>
                      <p className="font-medium">{getLeadershipLabel(youth.leadershipLevel)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Mentorship
                </h4>
                {youth.mentor ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {youth.mentor.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">Mentor</p>
                      <p className="font-medium">{youth.mentor}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No mentor assigned</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
