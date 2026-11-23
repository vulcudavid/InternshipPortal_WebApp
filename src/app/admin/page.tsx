import { getCurrentUser } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  return (
    <AdminDashboard
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }}
    />
  );
}
