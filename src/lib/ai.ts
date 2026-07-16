/**
 * AI Integration Module for Prism PM.
 *
 * Handles:
 * 1. Daily report parsing — extract structured data from free-text reports
 * 2. Risk analysis — compare progress vs schedule, spend vs budget
 * 3. Supplier communication drafting — generate professional emails
 *
 * Uses OpenAI API (configurable) for NLP tasks.
 */

const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o";
const AI_API_URL = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";

interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call the AI API with a structured prompt.
 */
async function callAi(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error("AI_API_KEY (or OPENAI_API_KEY) environment variable is not set");
  }

  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.1, // Low temperature for structured output
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error (${response.status}): ${error}`);
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "";
}

// ======================
// Report Parsing
// ======================

const REPORT_PARSE_SYSTEM_PROMPT = `You are an AI assistant for project managers in construction and engineering. Parse the daily report text and extract structured information as JSON. The JSON must have this structure:
{
  "date": "ISO date string or inferred date",
  "site_conditions": "weather, safety, access issues",
  "progress": [
    { "milestone": "name", "status": "on_track|ahead|behind|completed", "progress_pct": 0-100, "notes": "details" }
  ],
  "issues": [
    { "type": "schedule|budget|supplier|resource|safety|other", "description": "issue details", "severity": "low|medium|high|critical" }
  ],
  "budget_notes": "any cost-related mentions",
  "supplier_updates": "any supplier-related mentions",
  "next_steps": ["step1", "step2"],
  "summary": "one-line summary"
}`;

/**
 * Parse a free-text daily report using AI.
 */
export async function parseDailyReport(rawText: string): Promise<{
  parsedData: Record<string, unknown>;
  confidence: number;
}> {
  const result = await callAi(REPORT_PARSE_SYSTEM_PROMPT, rawText);

  // Try to extract JSON from the response
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON");
  }

  const parsedData = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  // Estimate confidence based on how well-structured the response is
  const confidence = parsedData.progress && Array.isArray(parsedData.progress) ? 0.85 : 0.5;

  return { parsedData, confidence };
}

// ======================
// Risk Analysis
// ======================

const RISK_ANALYSIS_SYSTEM_PROMPT = `You are a risk analyst for construction projects. Analyze the project data and identify risks. Output JSON:
{
  "risks": [
    {
      "type": "schedule|budget|supplier|resource|other",
      "severity": "low|medium|high|critical",
      "title": "short title",
      "description": "detailed analysis",
      "recommended_action": "what the PM should do"
    }
  ]
}`;

/**
 * Analyze schedule and budget data for risks.
 */
export async function analyzeRisks(projectData: {
  projectName: string;
  milestones: { title: string; status: string; progress_pct: number; planned_end: string }[];
  budgetItems: { category: string; allocated: number; spent: number; committed: number }[];
  recentReportCount: number;
}): Promise<{ risks: Record<string, unknown>[] }> {
  const userPrompt = JSON.stringify(projectData, null, 2);
  const result = await callAi(RISK_ANALYSIS_SYSTEM_PROMPT, userPrompt);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI risk analysis response did not contain valid JSON");
  return JSON.parse(jsonMatch[0]) as { risks: Record<string, unknown>[] };
}

// ======================
// Supplier Communication Drafting
// ======================

const SUPPLIER_COMMS_SYSTEM_PROMPT = `You are a project manager drafting professional emails to suppliers. Write a clear, concise email based on the context provided. Output JSON:
{
  "subject": "email subject line",
  "body": "email body text"
}`;

/**
 * Draft a supplier communication email.
 */
export async function draftSupplierComms(context: {
  type: "quote_request" | "quote_received" | "order" | "delivery_update" | "general";
  supplierName: string;
  projectName: string;
  details: string;
}): Promise<{ subject: string; body: string }> {
  const userPrompt = JSON.stringify(context, null, 2);
  const result = await callAi(SUPPLIER_COMMS_SYSTEM_PROMPT, userPrompt);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI comms response did not contain valid JSON");
  return JSON.parse(jsonMatch[0]) as { subject: string; body: string };
}