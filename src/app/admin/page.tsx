import { supabase } from "@/lib/supabaseClient";

export default async function AdminPage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <main className="p-6">Please <a href="/login">log in</a></main>;
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!admin) {
    return <main className="p-6">You are not an admin.</main>;
  }
  

  return (
    <main className="p-6">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user.email}</p>
      {/* admin tools go here */}
    </main>
  );
}