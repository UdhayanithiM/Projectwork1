// lib/localExecutor.ts
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

const execFileAsync = promisify(execFile);

// Basic security checks to prevent obvious malicious imports
const BANNED_JS_KEYWORDS = /require\s*\(\s*['"](child_process|fs|os|path|vm|worker_threads)['"]\s*\)|process\./i;
const BANNED_PY_KEYWORDS = /import\s+(os|subprocess|sys|pty|shutil|pathlib)|__import__/i;

export interface ExecutionResult {
  stdout: string;
  stderr: string;
}

export async function runCodeLocal(language: string, code: string, timeoutMs: number = 3000): Promise<ExecutionResult> {
  // 1. Basic Static Security Analysis
  if (language === 'javascript' && BANNED_JS_KEYWORDS.test(code)) {
    return { stdout: '', stderr: 'Security Error: Use of restricted modules (e.g., fs, child_process, process) is not allowed.' };
  }
  if (language === 'python' && BANNED_PY_KEYWORDS.test(code)) {
    return { stdout: '', stderr: 'Security Error: Use of restricted modules (e.g., os, subprocess, sys) is not allowed.' };
  }

  // 2. Prepare Temporary File
  const ext = language === 'javascript' ? 'js' : 'py';
  const filename = `exec_${randomUUID()}.${ext}`;
  const filepath = path.join(os.tmpdir(), filename);

  // For JavaScript, we inject a slight sandbox override to nullify global sensitive objects
  const finalCode = language === 'javascript' 
    ? `const process = null; const require = null; ${code}` 
    : code;

  try {
    await fs.writeFile(filepath, finalCode, 'utf8');

    // 3. Execute the Code
    const command = language === 'javascript' ? 'node' : 'python';
    
    // execFile is safer than exec because it doesn't spawn a shell, preventing shell injection
    const { stdout, stderr } = await execFileAsync(command, [filepath], {
      timeout: timeoutMs, // Native timeout kills the process automatically
      maxBuffer: 1024 * 1024 * 5, // 5MB limit to prevent memory exhaustion
      windowsHide: true, // Prevent console windows popping up on Windows
    });

    return { stdout, stderr };

  } catch (error: any) {
    // Handle timeout specifically
    if (error.killed && error.signal === 'SIGTERM') {
      return { stdout: '', stderr: `Execution Timed Out (Exceeded ${timeoutMs / 1000}s limit). Check for infinite loops.` };
    }
    
    // Return standard compilation/runtime errors
    return { 
      stdout: error.stdout || '', 
      stderr: error.stderr || error.message || 'Unknown Execution Error' 
    };
  } finally {
    // 4. Guaranteed Cleanup
    try {
      await fs.unlink(filepath);
    } catch (cleanupError) {
      console.error(`Failed to clean up temp file: ${filepath}`, cleanupError);
    }
  }
}