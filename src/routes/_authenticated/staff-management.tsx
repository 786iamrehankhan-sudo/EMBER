import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Edit2, UserPlus, Save, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/staff-management")({
  head: () => ({
    meta: [
      { title: "Staff Management — EMBER" },
      { name: "description", content: "Manage staff members and roles." },
    ],
  }),
  component: StaffManagementPage,
});

type StaffMember = {
  id: string;
  email: string;
  role: "staff" | "admin";
  created_at: string;
  user_metadata?: {
    name?: string;
    phone?: string;
  };
};

function StaffManagementPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", role: "staff" as "staff" | "admin" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "", name: "", phone: "", role: "staff" as "staff" | "admin" });

  useEffect(() => {
    checkAdminAccess();
    loadStaff();
  }, []);

  const checkAdminAccess = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      navigate({ to: "/auth" });
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.user.id);

    const hasAdmin = roles?.some((r) => r.role === "admin");
    setIsAdmin(hasAdmin);

    if (!hasAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/kitchen" });
    }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      // Get all users with staff or admin roles
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");

      if (roles && roles.length > 0) {
        const userIds = roles.map((r) => r.user_id);
        
        // Get user details from auth.users via service role
        // Note: This requires a database function or admin API call
        // For now, we'll use a workaround with metadata
        const staffList: StaffMember[] = [];
        
        for (const roleData of roles) {
          const { data: userData } = await supabase.auth.admin.getUserById(roleData.user_id);
          if (userData.user) {
            staffList.push({
              id: userData.user.id,
              email: userData.user.email || "",
              role: roleData.role as "staff" | "admin",
              created_at: userData.user.created_at,
              user_metadata: userData.user.user_metadata,
            });
          }
        }

        setStaff(staffList);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Failed to load staff members");
    }
    setLoading(false);
  };

  const handleEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setEditForm({
      name: member.user_metadata?.name || "",
      phone: member.user_metadata?.phone || "",
      role: member.role,
    });
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      // Update user metadata
      const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          name: editForm.name,
          phone: editForm.phone,
        },
      });

      if (metaError) throw metaError;

      // Update role if changed
      const currentMember = staff.find((s) => s.id === userId);
      if (currentMember && currentMember.role !== editForm.role) {
        // Delete old role
        await supabase.from("user_roles").delete().eq("user_id", userId);
        // Insert new role
        await supabase.from("user_roles").insert({ user_id: userId, role: editForm.role });
      }

      toast.success("Staff member updated successfully");
      setEditingId(null);
      loadStaff();
    } catch (error: any) {
      console.error("Error updating staff:", error);
      toast.error(error.message || "Failed to update staff member");
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from staff?`)) return;

    try {
      // Remove role
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);

      if (error) throw error;

      toast.success("Staff member removed");
      loadStaff();
    } catch (error: any) {
      console.error("Error removing staff:", error);
      toast.error(error.message || "Failed to remove staff member");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create user
      const { data, error: signUpError } = await supabase.auth.admin.createUser({
        email: addForm.email,
        password: addForm.password,
        email_confirm: true,
        user_metadata: {
          name: addForm.name,
          phone: addForm.phone,
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("User creation failed");

      // Add role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role: addForm.role });

      if (roleError) throw roleError;

      toast.success("Staff member added successfully");
      setShowAddForm(false);
      setAddForm({ email: "", password: "", name: "", phone: "", role: "staff" });
      loadStaff();
    } catch (error: any) {
      console.error("Error adding staff:", error);
      toast.error(error.message || "Failed to add staff member");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <span className="font-display text-2xl tracking-[0.35em] text-ember">EMBER</span>
          <h1 className="mt-2 text-4xl">Staff Management</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/kitchen" })}>
            Kitchen
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Add Staff Form */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Add New Staff Member</span>
            <Button
              variant={showAddForm ? "ghost" : "ember"}
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? <X className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {showAddForm ? "Cancel" : "Add Staff"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleAddStaff} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-password">Password *</Label>
                <Input
                  id="add-password"
                  type="password"
                  required
                  minLength={6}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-role">Role</Label>
                <Select value={addForm.role} onValueChange={(v) => setAddForm({ ...addForm, role: v as "staff" | "admin" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="ember" className="w-full">
                  Add Staff Member
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Staff List */}
      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Current Staff ({staff.length})</h2>
        {staff.map((member) => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              {editingId === member.id ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Email</Label>
                    <Input value={member.email} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label htmlFor={`name-${member.id}`}>Name</Label>
                    <Input
                      id={`name-${member.id}`}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`phone-${member.id}`}>Phone</Label>
                    <Input
                      id={`phone-${member.id}`}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`role-${member.id}`}>Role</Label>
                    <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as "staff" | "admin" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2 md:col-span-2">
                    <Button onClick={() => handleSaveEdit(member.id)} variant="ember" className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={() => setEditingId(null)} variant="outline" className="flex-1">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{member.email}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {member.user_metadata?.name && <span>Name: {member.user_metadata.name}</span>}
                      {member.user_metadata?.phone && <span>Phone: {member.user_metadata.phone}</span>}
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs uppercase text-primary">
                        {member.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(member)} variant="outline" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(member.id, member.email)} variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
