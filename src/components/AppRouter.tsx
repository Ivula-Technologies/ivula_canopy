import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { MemberLayout } from "@/components/layout/MemberLayout";

// Admin / staff pages
import Dashboard from "@/pages/Dashboard";
import YouthDirectory from "@/pages/YouthDirectory";
import Programs from "@/pages/Programs";
import Communications from "@/pages/Communications";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import Team from "@/pages/Team";
import Admin from "@/pages/Admin";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

// Member portal pages
import MemberHome from "@/pages/member/MemberHome";
import MemberEvents from "@/pages/member/MemberEvents";
import MemberAnnouncements from "@/pages/member/MemberAnnouncements";
import MemberProfile from "@/pages/member/MemberProfile";

export function AppRouter() {
  const { isMemberPortal, canManageChurch, canExportRecords } = useAuth();

  // Regular members (viewer / member role) get the community portal
  if (isMemberPortal) {
    return (
      <MemberLayout>
        <Routes>
          <Route path="/" element={<MemberHome />} />
          <Route path="/events" element={<MemberEvents />} />
          <Route path="/announcements" element={<MemberAnnouncements />} />
          <Route path="/profile" element={<MemberProfile />} />
          {/* Redirect any admin URL a member might type to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MemberLayout>
    );
  }

  // Staff / admin portal
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/directory" element={<YouthDirectory />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/analytics" element={<Analytics />} />
        {canExportRecords && <Route path="/reports" element={<Reports />} />}
        {canManageChurch && <Route path="/team" element={<Team />} />}
        {canManageChurch && <Route path="/admin" element={<Admin />} />}
        {canManageChurch && <Route path="/settings" element={<Settings />} />}
        {/* Redirect non-admin attempts to restricted pages */}
        <Route path="/reports" element={<Navigate to="/" replace />} />
        <Route path="/team" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/settings" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}
