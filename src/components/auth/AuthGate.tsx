import { FormEvent, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  LogIn,
  Network,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth, type JoinableChurchRole, type SignupIntent } from "@/auth/AuthContext";
import { resendSignupConfirmation } from "@/lib/supabaseRest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const platformHighlights = [
  { icon: Users, title: "People & volunteers", description: "Keep member, participant, and volunteer records in one place." },
  { icon: Network, title: "Programs & teams", description: "Coordinate groups, ministries, activities, and operating teams." },
  { icon: BarChart3, title: "Engagement insights", description: "Spot participation trends, inactive people, and organizational health." },
  { icon: ShieldCheck, title: "Role-based access", description: "Let owners, leaders, volunteers, and viewers see the right level of data." },
];

const organizationTypes = [
  { value: "youth_program", label: "Youth program" },
  { value: "church", label: "Church or ministry" },
  { value: "nonprofit", label: "Nonprofit or NGO" },
  { value: "school", label: "Campus fellowship or school group" },
  { value: "club", label: "Club or local association" },
  { value: "other", label: "Other mission-driven organization" },
];

function getAuthLinkError() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const errorCode = params.get("error_code");
  const errorDescription = params.get("error_description");
  const error = params.get("error");

  if (!error && !errorCode && !errorDescription) return null;

  return {
    code: errorCode || error || "auth_link_error",
    description: errorDescription ? errorDescription.replace(/\+/g, " ") : "This confirmation link could not be used.",
  };
}

function clearAuthLinkError() {
  window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { isConfigured, isAuthenticated, activeMembership, pendingMembership, isLoadingAccess, accessError, signIn, signUp, signOut, applyIntent } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupMode, setSignupMode] = useState<"register_church" | "join_church">("register_church");
  const [organizationType, setOrganizationType] = useState("youth_program");
  const [churchName, setChurchName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [role, setRole] = useState<JoinableChurchRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const authLinkError = useMemo(() => getAuthLinkError(), []);

  if (!isConfigured) {
    return <>{children}</>;
  }

  async function handleResendConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsResending(true);

    try {
      await resendSignupConfirmation(email);
      clearAuthLinkError();
      setNotice("A fresh confirmation email has been sent. Open the newest email from Ivula Canopy.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend confirmation email");
    } finally {
      setIsResending(false);
    }
  }

  if (authLinkError && !isAuthenticated) {
    const isExpired = authLinkError.code === "otp_expired";

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="h-12 w-12 rounded-lg object-contain bg-white p-1" />
            <div>
              <CardTitle>{isExpired ? "Confirmation link expired" : "Confirmation link problem"}</CardTitle>
              <CardDescription>
                {isExpired
                  ? "Email confirmation links are time-sensitive. Send yourself a new one and use the newest email."
                  : authLinkError.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResendConfirmation} className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  This can happen if the email is old or was opened after a newer confirmation email was sent.
                </div>
                Enter the same email address you used to register and Ivula Canopy will send a fresh confirmation link.
              </div>
              <div className="space-y-2">
                <Label htmlFor="resend-email">Email</Label>
                <Input
                  id="resend-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
              <Button type="submit" className="w-full" disabled={isResending}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {isResending ? "Sending..." : "Send New Confirmation Email"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => { clearAuthLinkError(); window.location.reload(); }}>
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isAuthenticated && isLoadingAccess) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="h-12 w-12 rounded-lg object-contain bg-white p-1" />
            <div>
              <CardTitle>Ivula Canopy</CardTitle>
              <CardDescription>Loading your organization access...</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (isAuthenticated && activeMembership) {
    return <>{children}</>;
  }

  // Authenticated but not linked to any org — let them join one or create their own.
  if (isAuthenticated && !isLoadingAccess && !pendingMembership && !accessError) {
    async function handleJoinOrg(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      setIsSubmitting(true);
      try {
        if (!joinCode.trim()) { setError("Enter the join code from your administrator."); return; }
        await applyIntent({ type: "join_church", joinCode: joinCode.trim(), role });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to join organization");
      } finally {
        setIsSubmitting(false);
      }
    }

    async function handleCreateOrg(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      setIsSubmitting(true);
      try {
        await applyIntent({ type: "register_church", churchName: churchName.trim() || "My Organization", organizationType });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create organization");
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="h-12 w-12 rounded-lg object-contain bg-white p-1" />
            <div>
              <CardTitle>Join or create an organization</CardTitle>
              <CardDescription>
                Your account isn't linked to an organization yet. Enter a join code from your administrator, or register a new organization.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="join" className="space-y-4" onValueChange={() => { setError(null); setNotice(null); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="join">Join with code</TabsTrigger>
                <TabsTrigger value="create">Create new</TabsTrigger>
              </TabsList>

              <TabsContent value="join">
                <form onSubmit={handleJoinOrg} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="no-org-join-code">Join code</Label>
                    <Input
                      id="no-org-join-code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="AB12CD34EF"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="join-role">Access level</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as JoinableChurchRole)}>
                      <SelectTrigger id="join-role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Regular member</SelectItem>
                        <SelectItem value="volunteer">Volunteer / Staff</SelectItem>
                        <SelectItem value="leader">Leader / Coordinator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Joining..." : "Join Organization"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="create">
                <form onSubmit={handleCreateOrg} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="no-org-type">Organization type</Label>
                    <Select value={organizationType} onValueChange={setOrganizationType}>
                      <SelectTrigger id="no-org-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {organizationTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="no-org-name">Organization name</Label>
                    <Input
                      id="no-org-name"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      placeholder="My Organization"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Organization"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isAuthenticated && pendingMembership) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="h-12 w-12 rounded-lg object-contain bg-white p-1" />
            <div>
              <CardTitle>Access request pending</CardTitle>
              <CardDescription>{pendingMembership.churchName}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <Clock className="h-4 w-4" />
                Waiting for an organization admin
              </div>
              Your request for {pendingMembership.role} access has been sent. An owner or admin from this organization needs to approve it before you can use the dashboard.
            </div>
            {accessError && <p className="text-sm text-destructive">{accessError}</p>}
            <Button variant="outline" className="w-full" onClick={signOut}>Use another account</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    const intent: SignupIntent = signupMode === "register_church"
      ? { type: "register_church", churchName: churchName.trim() || "My Organization", organizationType }
      : { type: "join_church", joinCode: joinCode.trim(), role };

    if (intent.type === "join_church" && !intent.joinCode) {
      setError("Enter the organization join code from your administrator.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await signUp(email, password, intent);
      if (result.needsEmailConfirmation) {
        setNotice("Account created. Check your email to confirm it, then sign in here to finish joining your organization.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="h-11 w-11 rounded-lg object-contain bg-white p-1 shadow-sm" />
            <div>
              <p className="text-lg font-semibold leading-tight">Ivula Canopy</p>
              <p className="text-sm text-muted-foreground">Operations for mission-driven organizations</p>
            </div>
          </div>

          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Built for churches, nonprofits, campus groups, and community teams
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                Organize your community from one place.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                Manage people, volunteers, programs, teams, and engagement insights with a modern platform built for real organizational work.
              </p>
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {platformHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border bg-card/70 p-4 shadow-sm">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {organizationTypes.slice(1, 5).map((type) => (
              <span key={type.value} className="rounded-full border bg-background px-3 py-1">{type.label}</span>
            ))}
          </div>
        </section>

        <Card className="w-full border-border/80 shadow-xl">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3 lg:hidden">
              <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="h-10 w-10 rounded-lg object-contain bg-white p-1" />
              <div>
                <CardTitle>Ivula Canopy</CardTitle>
                <CardDescription>Create access for your organization</CardDescription>
              </div>
            </div>
            <div className="hidden lg:block">
              <CardTitle>Get started</CardTitle>
              <CardDescription>Sign in, register an organization, or join with an invitation code.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4" onValueChange={() => { setError(null); setNotice(null); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                  {(error || accessError) && <p className="text-sm text-destructive">{error || accessError}</p>}
                  {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <LogIn className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={signupMode === "register_church" ? "default" : "outline"}
                      className="h-auto justify-start gap-2 py-3"
                      onClick={() => setSignupMode("register_church")}
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="text-left text-xs leading-tight">Register organization</span>
                    </Button>
                    <Button
                      type="button"
                      variant={signupMode === "join_church" ? "default" : "outline"}
                      className="h-auto justify-start gap-2 py-3"
                      onClick={() => setSignupMode("join_church")}
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-left text-xs leading-tight">Join organization</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  {signupMode === "register_church" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="organization-type">Organization type</Label>
                        <Select value={organizationType} onValueChange={setOrganizationType}>
                          <SelectTrigger id="organization-type">
                            <SelectValue placeholder="Choose organization type" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="church-name">Organization name</Label>
                        <Input
                          id="church-name"
                          value={churchName}
                          onChange={(event) => setChurchName(event.target.value)}
                          placeholder="Bright Future Youth, local church, campus fellowship..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="join-code">Organization join code</Label>
                        <Input
                          id="join-code"
                          value={joinCode}
                          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                          placeholder="AB12CD34EF"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-role">Access level</Label>
                        <Select value={role} onValueChange={(value) => setRole(value as JoinableChurchRole)}>
                          <SelectTrigger id="register-role">
                            <SelectValue placeholder="Choose access level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Regular member</SelectItem>
                            <SelectItem value="volunteer">Volunteer / Staff</SelectItem>
                            <SelectItem value="leader">Leader / Coordinator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {(error || accessError) && <p className="text-sm text-destructive">{error || accessError}</p>}
                  {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
