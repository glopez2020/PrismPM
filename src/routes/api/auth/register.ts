import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/register")({
  POST: async ({ request }) => {
    try {
      const body = await request.json() as { email?: string; display_name?: string; password?: string };
      const { email, display_name, password } = body;

      if (!email || !display_name || !password) {
        return new Response(
          JSON.stringify({ error: "Email, display_name, and password are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { registerUser } = await import("~/lib/auth");
      const result = await registerUser(email, display_name, password);

      if ("error" in result) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ user: result.user, sessionId: result.sessionId }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `prism_session=${result.sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Registration failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});