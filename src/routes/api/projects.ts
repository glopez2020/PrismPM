import { createAPIFileRoute } from "@tanstack/react-start/api";
import { queryAll, queryOne, execute, uuid, now } from "~/lib/db";

export const APIRoute = createAPIFileRoute("/api/projects")({
  GET: async () => {
    try {
      // First ensure DB is initialized
      try {
        await queryAll("SELECT 1 FROM projects LIMIT 1");
      } catch {
        return new Response(
          JSON.stringify({ projects: [], error: "Database not initialized. POST to /api/init first." }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const projects = await queryAll(
        `SELECT p.*, u.display_name as pm_name 
         FROM projects p 
         LEFT JOIN users u ON p.pm_id = u.id 
         ORDER BY p.created_at DESC`
      );
      return new Response(
        JSON.stringify({ projects }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json() as {
        organization_id?: string;
        name?: string;
        description?: string;
        start_date?: string;
        end_date?: string;
        budget_total?: number;
        pm_id?: string;
      };

      if (!body.name) {
        return new Response(
          JSON.stringify({ error: "Project name is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const id = uuid();
      const createdAt = now();

      await execute(
        `INSERT INTO projects (id, organization_id, name, description, status, start_date, end_date, budget_total, budget_spent, pm_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'planning', ?, ?, ?, 0, ?, ?, ?)`,
        [
          id,
          body.organization_id || "default-org",
          body.name,
          body.description || "",
          body.start_date || null,
          body.end_date || null,
          body.budget_total || 0,
          body.pm_id || null,
          createdAt,
          createdAt,
        ]
      );

      const project = await queryOne("SELECT * FROM projects WHERE id = ?", [id]);
      return new Response(
        JSON.stringify({ project }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});