import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ageDistributionData,
  mockYouths,
  mockPrograms,
} from "@/data/mockData";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Users } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const engagementRiskData = [
  { name: "High Risk", value: 5, color: "hsl(var(--disengaged))" },
  { name: "Medium Risk", value: 8, color: "hsl(var(--at-risk))" },
  { name: "Low Risk", value: 35, color: "hsl(var(--engaged))" },
];

const retentionTrendData = [
  { month: "Aug", rate: 82 },
  { month: "Sep", rate: 85 },
  { month: "Oct", rate: 83 },
  { month: "Nov", rate: 87 },
  { month: "Dec", rate: 84 },
  { month: "Jan", rate: 88 },
];

const Analytics = () => {
  const { activeMembership } = useAuth();
  const memberLabel = activeMembership?.memberLabel ?? "People";
  const programLabel = activeMembership?.programLabel ?? "Programs";
  const attendanceLabel = activeMembership?.attendanceLabel ?? "Attendance";
  const primaryFocus = activeMembership?.primaryFocus ?? "Organizational Health";

  const growthMetrics = [
    { label: `New ${memberLabel} This Quarter`, value: 8, change: 33, trend: "up" },
    { label: "Retention Rate", value: "87.5%", change: 5, trend: "up" },
    { label: "Avg. Engagement Score", value: 72, change: 3, trend: "up" },
    { label: `${memberLabel} Needing Follow-Up`, value: 5, change: -2, trend: "down" },
  ];

  const programComparison = mockPrograms.map((program) => ({
    name: program.name.split(" ").slice(0, 2).join(" "),
    engagement: program.engagementScore,
    attendance: program.averageAttendance,
    participants: program.participantCount,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics & Insights</h1>
        <p className="page-description">
          Understand {primaryFocus.toLowerCase()}, participation, retention, and {programLabel.toLowerCase()} effectiveness.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {growthMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">{metric.value}</span>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      metric.trend === "up" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {metric.change > 0 ? "+" : ""}
                      {metric.change}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="engagement" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="programs">{programLabel}</TabsTrigger>
          <TabsTrigger value="demographics">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Engagement Risk Analysis
                </CardTitle>
                <CardDescription>
                  Distribution of {memberLabel.toLowerCase()} by engagement risk level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementRiskData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {engagementRiskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {engagementRiskData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value} {memberLabel.toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Retention Rate Trend
                </CardTitle>
                <CardDescription>Monthly retention rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={retentionTrendData}>
                      <defs>
                        <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        domain={[75, 95]}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}%`, "Retention Rate"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="rate"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRetention)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{memberLabel} Needing Follow-Up</CardTitle>
              <CardDescription>
                {memberLabel} with declining engagement scores or participation gaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockYouths
                  .filter((person) => person.engagementStatus !== "engaged")
                  .slice(0, 5)
                  .map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            person.engagementStatus === "at-risk"
                              ? "bg-warning/20 text-warning"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {person.firstName[0]}{person.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {person.notes || `Last recorded ${attendanceLabel.toLowerCase()}: ${person.lastAttendance}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Engagement</p>
                          <p className="font-medium">{person.engagementScore}%</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            person.engagementStatus === "at-risk"
                              ? "status-at-risk"
                              : "status-disengaged"
                          }
                        >
                          {person.engagementStatus.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{programLabel} Effectiveness Comparison</CardTitle>
              <CardDescription>
                Compare engagement and {attendanceLabel.toLowerCase()} across {programLabel.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={programComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="engagement"
                      name="Engagement Score"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="attendance"
                      name={`Avg ${attendanceLabel}`}
                      fill="hsl(var(--chart-2))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPrograms.slice(0, 6).map((program) => (
              <Card key={program.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{program.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        program.engagementScore >= 80
                          ? "status-engaged"
                          : program.engagementScore >= 60
                          ? "status-at-risk"
                          : "status-disengaged"
                      }
                    >
                      {program.engagementScore}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Participation</span>
                      <span>
                        {program.participantCount}
                        {program.maxCapacity && ` / ${program.maxCapacity}`}
                      </span>
                    </div>
                    <Progress
                      value={
                        program.maxCapacity
                          ? (program.participantCount / program.maxCapacity) * 100
                          : 100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Avg. {program.averageAttendance} participants</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Breakdown of {memberLabel.toLowerCase()} by age group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="ageGroup"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Optional demographic profile for this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Male", value: 24 },
                          { name: "Female", value: 24 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        <Cell fill="hsl(var(--chart-1))" />
                        <Cell fill="hsl(var(--chart-2))" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Education & Work Status</CardTitle>
              <CardDescription>Distribution by education and employment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "High School", count: 14 },
                  { label: "College", count: 18 },
                  { label: "Working", count: 12 },
                  { label: "Other", count: 4 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-lg bg-muted/50 text-center"
                  >
                    <p className="text-2xl font-bold mt-2">{item.count}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
