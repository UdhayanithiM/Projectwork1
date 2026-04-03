// app/api/assessment/evaluate/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { runCodeLocal } from '@/lib/localExecutor';

const evaluateCodeSchema = z.object({
  questionIds: z.array(z.string()),
  code: z.string().min(1),
  language: z.enum(["javascript", "python"]),
});

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
          
          // 1. Wrap code with test case arguments
          const wrappedCode = wrapCode(language, code, functionName, args);
          
          // 2. Execute locally (Timeout set to 2.5 seconds)
          const { stdout, stderr } = await runCodeLocal(language, wrappedCode, 2500);

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