import { createAPIFileRoute } from "@tanstack/react-start/api";

/**
 * Health check endpoint.
 * Returns the status of the Prism PM API.
 */
export const APIRoute = createAPIFileRoute("/api/health")({
  GET: async ({ request }) => {
    try {
      // Try to import and initialize the DB (don't fail if env vars aren't set)
      const { getDb } = await import("~/lib/db");
      await getDb();
      return new Response(
        JSON.stringify({ status: "ok", service: "prism-pm", timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          status: "degraded",
          service: "prism-pm",
          message: "Database not connected. Set PRISM_DB_URL and PRISM_DB_AUTH_TOKEN in environment.",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200, // Still return 200 — the app is running, just needs config
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});