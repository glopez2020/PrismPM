import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/init")({
  POST: async () => {
    try {
      const { initDb } = await import("~/lib/db");
      await initDb();
      return new Response(
        JSON.stringify({ ok: true, message: "Database schema initialized successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ ok: false, error: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});