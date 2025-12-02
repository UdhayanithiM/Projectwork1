// app/api/assessment/evaluate/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const evaluateCodeSchema = z.object({
  questionIds: z.array(z.string()),
  code: z.string().min(1, "Code cannot be empty."),
  language: z.enum(["javascript", "python", "java", "c"]),
});

// -------- Language Mapping for Piston --------
function getPistonLanguage(language: string): string {
  switch (language) {
    case "javascript":
      return "javascript"; // Node.js
    case "python":
      return "python3"; // Piston key
    case "java":
      return "java";
    case "c":
      return "c";
    default:
      return language;
  }
}

// ----------- Wrappers for Different Languages ----------
function wrapCode(language: string, code: string, functionName: string, args: any[]): string {
  switch (language) {
    case "javascript": {
      const jsArgs = args.map((a) => JSON.stringify(a)).join(", ");
      return `${code}\n\nconsole.log(JSON.stringify(${functionName}(${jsArgs})));`;
    }
    case "python": {
      const pyArgs = args.map((a) => JSON.stringify(a)).join(", ");
      return `${code}\n\nimport json\nprint(json.dumps(${functionName}(${pyArgs})))`;
    }
    case "java": {
      const javaArgs = args.join(", ");
      return `
public class Main {
${code}

  public static void main(String[] args) {
    System.out.println(${functionName}(${javaArgs}));
  }
}
      `;
    }
    case "c": {
      const cArgs = args.join(", ");
      return `
${code}

#include <stdio.h>
int main() {
    printf("%d", ${functionName}(${cArgs}));
    return 0;
}
      `;
    }
    default:
      return code;
  }
}

// -------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = evaluateCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }

    const { questionIds, code, language } = validation.data;

    const questions = await prisma.codingQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No valid questions found.' }, { status: 404 });
    }

    // Extract function name depending on language
    let functionName = "solve";
    if (language === "javascript" || language === "python") {
      const match = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(|def\s+([a-zA-Z0-9_]+)\s*\(/);
      if (match) functionName = match[1] || match[2];
    } else if (language === "java") {
      const match = code.match(/static\s+\w+\s+([a-zA-Z0-9_]+)\s*\(/);
      if (match) functionName = match[1];
    } else if (language === "c") {
      const match = code.match(/\w+\s+([a-zA-Z0-9_]+)\s*\(/);
      if (match) functionName = match[1];
    }

    const results: any[] = [];

    for (const question of questions) {
      const questionTestCases = question.testCases as any[];
      const questionResults = {
        questionId: question.id,
        title: question.title,
        testCases: [] as any[],
      };

      for (const testCase of questionTestCases) {
        let testCaseResult;
        try {
          const args = typeof testCase.input === "string"
            ? JSON.parse(`[${testCase.input}]`)
            : Array.isArray(testCase.input) ? testCase.input : [testCase.input];

          const testCode = wrapCode(language, code, functionName, args);

          const response = await fetch("https://emkc.org/api/v2/piston/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language: getPistonLanguage(language),
              version: "*",
              files: [{ content: testCode }],
            }),
          });

          const result = await response.json();

          if (result.run.stderr) {
            testCaseResult = { status: 'error', message: result.run.stderr };
          } else {
            let output: any = result.run.stdout.trim();
            try {
              output = JSON.parse(output);
            } catch {
              // leave raw output
            }
            const expected = testCase.expectedOutput;

            if (JSON.stringify(output) === JSON.stringify(expected)) {
              testCaseResult = { status: 'passed' };
            } else {
              testCaseResult = { status: 'failed', expected, actual: output };
            }
          }
        } catch (e) {
          testCaseResult = {
            status: 'error',
            message: e instanceof Error ? e.message : 'Failed to process test case.',
          };
        }
        questionResults.testCases.push(testCaseResult);
      }
      results.push(questionResults);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Code evaluation error:", error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

