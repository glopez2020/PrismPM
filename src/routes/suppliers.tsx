import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, Input, PrismLogo, IconChevronRight
} from "~/components";

export const Route = createFileRoute("/suppliers")({
  component: SuppliersPage,
});

type Supplier = {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
  created_at: string;
};

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/suppliers");
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      } catch (e) {
        console.error("Failed to load suppliers:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = suppliers.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-dvh bg-navy-50">
      <header className="glass sticky top-0 z-50 border-b border-navy-200/50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-navy-500 hover:text-navy-700 transition-colors">
              <PrismLogo className="h-6 w-6" />
            </Link>
            <span className="text-navy-300">/</span>
            <span className="text-sm font-medium text-navy-900">Suppliers</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/suppliers/new">
              <Button size="sm" variant="primary">+ Add Supplier</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-navy-900">Suppliers</h1>
            <p className="mt-1 text-navy-600">Manage your project suppliers and vendors</p>
          </div>
          <div className="w-64">
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">🏭</div>
              <h2 className="text-lg font-semibold text-navy-900">
                {suppliers.length === 0 ? "No suppliers yet" : "No suppliers match your search"}
              </h2>
              <p className="mt-2 text-sm text-navy-500">
                {suppliers.length === 0
                  ? "Add your first supplier to get started with Prism PM."
                  : "Try a different search term."}
              </p>
              {suppliers.length === 0 && (
                <Link to="/suppliers/new">
                  <Button className="mt-6" variant="primary">Add Supplier</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((supplier) => (
              <Link
                key={supplier.id}
                to="/suppliers/$supplierId"
                params={{ supplierId: supplier.id }}
                className="rounded-xl border border-navy-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm">
                    {supplier.name.charAt(0)}
                  </div>
                  <IconChevronRight className="h-4 w-4 text-navy-300" />
                </div>
                <h3 className="font-semibold text-navy-900">{supplier.name}</h3>
                {supplier.contact_email && (
                  <p className="mt-1 text-sm text-navy-500 truncate">{supplier.contact_email}</p>
                )}
                {supplier.contact_phone && (
                  <p className="text-sm text-navy-400">{supplier.contact_phone}</p>
                )}
                {supplier.notes && (
                  <p className="mt-2 text-xs text-navy-400 line-clamp-2">{supplier.notes}</p>
                )}
                <p className="mt-3 text-xs text-navy-400">
                  Added {new Date(supplier.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}