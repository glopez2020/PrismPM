import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Button, Card, CardHeader, CardTitle, CardContent, CardFooter,
  Badge, Input, PrismLogo
} from "~/components";

export const Route = createFileRoute("/suppliers/new")({
  component: NewSupplierPage,
});

function NewSupplierPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Supplier name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact_email: email.trim(), contact_phone: phone.trim(), notes: notes.trim() }),
      });
      const data = await res.json();
      if (data.supplier) {
        navigate({ to: "/suppliers/$supplierId", params: { supplierId: data.supplier.id } });
      } else {
        setError(data.error || "Failed to create supplier");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setSaving(false);
    }
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
            <span className="text-sm font-medium text-navy-900">New</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 mb-8">Add Supplier</h1>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Supplier Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BuildRite Materials Co." />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Contact Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="orders@supplier.com" type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Contact Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1-555-0100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, lead times, special instructions..."
                  className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
                />
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Link to="/suppliers"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : "Add Supplier"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}