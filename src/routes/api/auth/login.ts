import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/login")({
  POST: async ({ request }) => {
    try {
      const body = await request.json() as { email?: string; password?: string };
      const { email, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { loginUser } = await import("~/lib/auth");
      const result = await loginUser(email, password);

      if ("error" in result) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ user: result.user, sessionId: result.sessionId }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `prism_session=${result.sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Login failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});