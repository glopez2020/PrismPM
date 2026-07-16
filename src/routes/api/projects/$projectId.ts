import { createAPIFileRoute } from "@tanstack/react-start/api";
import { queryOne, execute, uuid } from "~/lib/db";

export const APIRoute = createAPIFileRoute("/api/projects/$projectId")({
  GET: async ({ params }) => {
    try {
      const project = await queryOne(
        `SELECT p.*, u.display_name as pm_name 
         FROM projects p 
         LEFT JOIN users u ON p.pm_id = u.id 
         WHERE p.id = ?`,
        [params.projectId]
      );

      if (!project) {
        return new Response(
          JSON.stringify({ error: "Project not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get milestones
      const milestones = await queryOne(
        "SELECT * FROM schedules WHERE project_id = ? ORDER BY sort_order",
        [params.projectId]
      );

      // Get budget lines
      const budgetLines = await queryOne(
        "SELECT * FROM budget_line_items WHERE project_id = ?",
        [params.projectId]
      );

      return new Response(
        JSON.stringify({ project, milestones: milestones || [], budgetLines: budgetLines || [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  PATCH: async ({ request, params }) => {
    try {
      const body = await request.json() as Record<string, unknown>;
      const allowedFields = ["name", "description", "status", "start_date", "end_date", "budget_total", "budget_spent", "pm_id"];

      const updates: string[] = [];
      const values: unknown[] = [];

      for (const [key, value] of Object.entries(body)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid fields to update" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      updates.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(params.projectId);

      await execute(
        `UPDATE projects SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      const project = await queryOne("SELECT * FROM projects WHERE id = ?", [params.projectId]);
      return new Response(
        JSON.stringify({ project }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  DELETE: async ({ params }) => {
    try {
      await execute("DELETE FROM projects WHERE id = ?", [params.projectId]);
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});