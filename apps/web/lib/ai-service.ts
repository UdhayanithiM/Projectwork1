// apps/web/lib/ai-service.ts

// This runs on the server, so it talks directly to Python on localhost:8000
const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export class AIService {
  static async startSession(data: {
    session_id: string;
    candidate_id: string;
    candidate_name?: string;
    job_title: string;
    company: string;
    personality?: string;
  }) {
    const res = await fetch(`${AI_URL}/interview/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI Service Start Failed: ${err}`);
    }

    return res.json();
  }

  static async nextTurn(data: {
    session_id: string;
    candidate_answer: string;
  }) {
    const res = await fetch(`${AI_URL}/interview/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI Service Chat Failed: ${err}`);
    }

    return res.json();
  }

  // --- NEW METHOD: END SESSION & SCORE ---
  static async endSession(session_id: string) {
    const res = await fetch(`${AI_URL}/interview/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI Scoring Failed: ${err}`);
    }

    return res.json();
  }
}



