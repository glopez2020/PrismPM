import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Button, Card, CardHeader, CardTitle, CardContent, CardFooter,
  Badge, Input, PrismLogo
} from "~/components";

export const Route = createFileRoute("/suppliers/$supplierId")({
  component: SupplierDetailPage,
});

type Supplier = {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
  created_at: string;
};

function SupplierDetailPage() {
  const { supplierId } = Route.useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/suppliers");
        const data = await res.json();
        const found = (data.suppliers || []).find((s: Supplier) => s.id === supplierId);
        if (found) {
          setSupplier(found);
          setName(found.name);
          setEmail(found.contact_email);
          setPhone(found.contact_phone);
          setNotes(found.notes);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supplierId]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact_email: email.trim(), contact_phone: phone.trim(), notes: notes.trim() }),
      });
      const data = await res.json();
      if (data.supplier) {
        setSupplier(data.supplier);
        setEditing(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await fetch(`/api/suppliers/${supplierId}`, { method: "DELETE" });
      navigate({ to: "/suppliers" });
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-navy-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy-900">Supplier not found</h1>
        <Link to="/suppliers" className="mt-4 text-indigo-600 hover:underline inline-block">Back to suppliers</Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-navy-50">
      <header className="glass sticky top-0 z-50 border-b border-navy-200/50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-navy-500 hover:text-navy-700">
              <PrismLogo className="h-6 w-6" />
            </Link>
            <span className="text-navy-300">/</span>
            <Link to="/suppliers" className="text-sm text-navy-500 hover:text-navy-700">Suppliers</Link>
            <span className="text-navy-300">/</span>
            <span className="text-sm font-medium text-navy-900 truncate max-w-[200px]">{supplier.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "Edit"}
            </Button>
            <Button size="sm" variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xl">
            {supplier.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{supplier.name}</h1>
            <p className="text-sm text-navy-500">Added {new Date(supplier.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-navy-900">{supplier.contact_email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Phone</p>
                  <p className="text-sm text-navy-900">{supplier.contact_phone || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-navy-700">{supplier.notes || "No notes"}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}