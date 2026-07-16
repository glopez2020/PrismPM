import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/logout")({
  POST: async ({ request }) => {
    try {
      const cookie = request.headers.get("cookie") || "";
      const match = cookie.match(/prism_session=([^;]+)/);
      const sessionId = match ? match[1] : null;

      if (sessionId) {
        const { logoutUser } = await import("~/lib/auth");
        await logoutUser(sessionId);
      }

      return new Response(
        JSON.stringify({ ok: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "prism_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
          },
        }
      );
    } catch {
      return new Response(
        JSON.stringify({ ok: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "prism_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
          },
        }
      );
    }
  },
});