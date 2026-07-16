import { createAPIFileRoute } from "@tanstack/react-start/api";
import { queryAll, queryOne, execute, uuid, now } from "~/lib/db";

export const APIRoute = createAPIFileRoute("/api/projects/$projectId/schedule")({
  GET: async ({ params }) => {
    try {
      const milestones = await queryAll(
        "SELECT * FROM schedules WHERE project_id = ? ORDER BY sort_order",
        [params.projectId]
      );
      return new Response(
        JSON.stringify({ milestones }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  POST: async ({ request, params }) => {
    try {
      const body = await request.json() as {
        title?: string;
        description?: string;
        planned_start?: string;
        planned_end?: string;
        progress_pct?: number;
        sort_order?: number;
      };

      if (!body.title) {
        return new Response(
          JSON.stringify({ error: "Milestone title is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const id = uuid();
      await execute(
        `INSERT INTO schedules (id, project_id, title, description, planned_start, planned_end, progress_pct, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [
          id,
          params.projectId,
          body.title,
          body.description || "",
          body.planned_start || null,
          body.planned_end || null,
          body.progress_pct || 0,
          body.sort_order || 0,
        ]
      );

      const milestone = await queryOne("SELECT * FROM schedules WHERE id = ?", [id]);
      return new Response(
        JSON.stringify({ milestone }),
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