import { createAPIFileRoute } from "@tanstack/react-start/api";
import { queryAll, queryOne, execute, uuid, now } from "~/lib/db";

export const APIRoute = createAPIFileRoute("/api/projects/$projectId/budget")({
  GET: async ({ params }) => {
    try {
      const budgetLines = await queryAll(
        "SELECT * FROM budget_line_items WHERE project_id = ?",
        [params.projectId]
      );
      return new Response(
        JSON.stringify({ budgetLines }),
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
        category?: string;
        description?: string;
        allocated?: number;
        spent?: number;
        committed?: number;
      };

      if (!body.category) {
        return new Response(
          JSON.stringify({ error: "Category is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const id = uuid();
      await execute(
        `INSERT INTO budget_line_items (id, project_id, category, description, allocated, spent, committed)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          params.projectId,
          body.category,
          body.description || "",
          body.allocated || 0,
          body.spent || 0,
          body.committed || 0,
        ]
      );

      // Update project totals
      const totals = await queryOne(
        "SELECT SUM(allocated) as total_budget, SUM(spent) as total_spent FROM budget_line_items WHERE project_id = ?",
        [params.projectId]
      ) as { total_budget: number; total_spent: number } | null;

      if (totals) {
        await execute(
          "UPDATE projects SET budget_total = ?, budget_spent = ? WHERE id = ?",
          [totals.total_budget || 0, totals.total_spent || 0, params.projectId]
        );
      }

      const line = await queryOne("SELECT * FROM budget_line_items WHERE id = ?", [id]);
      return new Response(
        JSON.stringify({ budgetLine: line }),
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