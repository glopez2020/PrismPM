import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/me")({
  GET: async ({ request }) => {
    try {
      const cookie = request.headers.get("cookie") || "";
      const match = cookie.match(/prism_session=([^;]+)/);
      const sessionId = match ? match[1] : null;

      if (!sessionId) {
        return new Response(
          JSON.stringify({ user: null }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const { getUserFromSession } = await import("~/lib/auth");
      const user = await getUserFromSession(sessionId);

      return new Response(
        JSON.stringify({ user }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch {
      return new Response(
        JSON.stringify({ user: null }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});