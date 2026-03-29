// app/api/assessment/evaluate/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const evaluateCodeSchema = z.object({
  questionIds: z.array(z.string()),
  code: z.string().min(1),
  language: z.enum(["javascript", "python"]),
});

// Standard Judge0 CE v1.13.1 language IDs
// Verify yours: GET http://localhost:2358/languages
const LANGUAGE_ID: Record<string, number> = {
  javascript: 63, // Node.js 12.14.0
  python: 71,     // Python 3.8.1
};

const encodeBase64 = (str: string) => Buffer.from(str).toString("base64");
const decodeBase64 = (str: string | null) =>
  str ? Buffer.from(str, "base64").toString("utf-8") : "";

function wrapCode(language: string, code: string, functionName: string, args: any[]): string {
  if (language === "javascript") {
    const jsArgs = args.map((a) => JSON.stringify(a)).join(", ");
    return `${code}\n\ntry {\n  console.log(JSON.stringify(${functionName}(${jsArgs})));\n} catch(e) {\n  console.error(e.message);\n}`;
  }
  if (language === "python") {
    const pyArgs = args.map((a) => JSON.stringify(a)).join(", ");
    return `${code}\n\nimport json\ntry:\n    print(json.dumps(${functionName}(${pyArgs})))\nexcept Exception as e:\n    print("ERROR:", str(e))`;
  }
  return code;
}

function extractFunctionName(language: string, code: string): string {
  if (language === "javascript") {
    const match =
      code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/) ||
      code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\(|\w)/);
    return match?.[1] ?? "solve";
  }
  if (language === "python") {
    return code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/)?.[1] ?? "solve";
  }
  return "solve";
}

function parseArgs(input: any): any[] {
  if (typeof input === "string") {
    try { return parseArgs(JSON.parse(input)); } catch { return [input]; }
  }
  if (Array.isArray(input)) return input;
  if (typeof input === "object" && input !== null) return Object.values(input);
  return [input];
}

async function getLanguageId(language: string): Promise<number> {
  // First try env overrides
  if (language === "javascript" && process.env.JUDGE0_JS_LANG_ID) {
    return parseInt(process.env.JUDGE0_JS_LANG_ID);
  }
  if (language === "python" && process.env.JUDGE0_PY_LANG_ID) {
    return parseInt(process.env.JUDGE0_PY_LANG_ID);
  }

  // Fallback: fetch available languages and find best match
  const JUDGE0_URL = (process.env.JUDGE0_URL || "http://localhost:2358").replace(/\/$/, "");
  try {
    const res = await fetch(`${JUDGE0_URL}/languages`);
    const langs: { id: number; name: string }[] = await res.json();

    if (language === "javascript") {
      // Prefer Node.js entries
      const match =
        langs.find(l => l.name.toLowerCase().includes("node")) ||
        langs.find(l => l.name.toLowerCase().includes("javascript"));
      if (match) return match.id;
    }

    if (language === "python") {
      // Prefer Python 3
      const match =
        langs.find(l => l.name.toLowerCase().includes("python (3")) ||
        langs.find(l => l.name.toLowerCase().includes("python3")) ||
        langs.find(l => l.name.toLowerCase().includes("python"));
      if (match) return match.id;
    }
  } catch {
    // ignore, fall through to hardcoded defaults
  }

  // Hardcoded fallbacks
  return LANGUAGE_ID[language] ?? 71;
}

async function runCode(language: string, code: string): Promise<{ stdout: string; stderr: string }> {
  const JUDGE0_URL = (process.env.JUDGE0_URL || "http://localhost:2358").replace(/\/$/, "");
  const languageId = await getLanguageId(language);

  const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language_id: languageId,
      source_code: encodeBase64(code),
    }),
  });

  if (!submitRes.ok) {
    const txt = await submitRes.text();
    throw new Error(`Judge0 submit error ${submitRes.status}: ${txt}`);
  }

  const { token } = await submitRes.json();
  if (!token) throw new Error("Judge0 returned no token.");

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 800));

    const pollRes = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,message,status`,
      { headers: { Accept: "application/json" } }
    );

    if (!pollRes.ok) throw new Error(`Judge0 poll error ${pollRes.status}`);

    const data = await pollRes.json();
    const statusId = data.status?.id;

    if (statusId === 1 || statusId === 2) continue; // still running

    const stdout = decodeBase64(data.stdout);
    const stderr = decodeBase64(data.stderr);
    const compileOutput = decodeBase64(data.compile_output);
    const message = decodeBase64(data.message);
    const errorText = compileOutput || stderr || message || "";

    if (statusId > 4 && errorText) {
      return { stdout: "", stderr: `[${data.status?.description}] ${errorText}` };
    }

    return { stdout, stderr: errorText };
  }

  throw new Error("Execution timed out.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = evaluateCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const { questionIds, code, language } = validation.data;

    const questions = await prisma.codingQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "No valid questions found." }, { status: 404 });
    }

    const functionName = extractFunctionName(language, code);
    const results: any[] = [];

    for (const question of questions) {
      const testCases = question.testCases as any[];
      const questionResults = {
        questionId: question.id,
        title: question.title,
        testCases: [] as any[],
      };

      for (const testCase of testCases) {
        let result: any;
        try {
          const args = parseArgs(testCase.input);
          const wrappedCode = wrapCode(language, code, functionName, args);
          const { stdout, stderr } = await runCode(language, wrappedCode);

          if (stderr && stderr.trim()) {
            result = { status: "error", message: stderr.trim() };
          } else if (!stdout.trim()) {
            result = { status: "error", message: "No output. Check your function name and return value." };
          } else {
            let output: any = stdout.trim();
            try { output = JSON.parse(output); } catch { /* keep as string */ }

            const expected = testCase.expectedOutput;
            result =
              JSON.stringify(output) === JSON.stringify(expected)
                ? { status: "passed" }
                : { status: "failed", expected, actual: output };
          }
        } catch (e) {
          result = {
            status: "error",
            message: e instanceof Error ? e.message : "Execution failed.",
          };
        }

        questionResults.testCases.push(result);
      }

      results.push(questionResults);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}