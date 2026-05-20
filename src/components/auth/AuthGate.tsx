import { FormEvent, useState, type ReactNode } from "react";
import { Building2, Clock, LogIn, UserPlus, Users } from "lucide-react";
import { useAuth, type JoinableChurchRole, type SignupIntent } from "@/auth/AuthContext";
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

export function AuthGate({ children }: { children: ReactNode }) {
  const { isConfigured, isAuthenticated, activeMembership, pendingMembership, isLoadingAccess, accessError, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupMode, setSignupMode] = useState<"register_church" | "join_church">("register_church");
  const [churchName, setChurchName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [role, setRole] = useState<JoinableChurchRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isConfigured) {
    return <>{children}</>;
  }

  if (isAuthenticated && isLoadingAccess) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <img src="/ivula-mark.svg" alt="Ivula Canopy logo" className="h-12 w-12 rounded-lg object-contain bg-white p-1" />
            <div>
              <CardTitle>Ivula Canopy</CardTitle>
              <CardDescription>Loading your church access...</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (isAuthenticated && activeMembership) {
    return <>{children}</>;
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
                Waiting for a church admin
              </div>
              Your request for {pendingMembership.role} access has been sent. An owner or admin from this church needs to approve it before you can use the dashboard.
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
      ? { type: "register_church", churchName: churchName.trim() || "My Church" }
      : { type: "join_church", joinCode: joinCode.trim(), role };

    if (intent.type === "join_church" && !intent.joinCode) {
      setError("Enter the church join code from your church leader.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await signUp(email, password, intent);
      if (result.needsEmailConfirmation) {
        setNotice("Account created. Check your email to confirm it, then sign in here to finish joining your church.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
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
            <CardTitle>Ivula Canopy</CardTitle>
            <CardDescription>Sign in or create access for your church</CardDescription>
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
                    <span className="text-left text-xs leading-tight">Register church</span>
                  </Button>
                  <Button
                    type="button"
                    variant={signupMode === "join_church" ? "default" : "outline"}
                    className="h-auto justify-start gap-2 py-3"
                    onClick={() => setSignupMode("join_church")}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-left text-xs leading-tight">Join church</span>
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
                  <div className="space-y-2">
                    <Label htmlFor="church-name">Church name</Label>
                    <Input
                      id="church-name"
                      value={churchName}
                      onChange={(event) => setChurchName(event.target.value)}
                      placeholder="Faith Community Church"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="join-code">Church join code</Label>
                      <Input
                        id="join-code"
                        value={joinCode}
                        onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                        placeholder="AB12CD34EF"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Access level</Label>
                      <Select value={role} onValueChange={(value) => setRole(value as JoinableChurchRole)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose access level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Regular member</SelectItem>
                          <SelectItem value="volunteer">Volunteer</SelectItem>
                          <SelectItem value="leader">Leader</SelectItem>
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
    </main>
  );
}
