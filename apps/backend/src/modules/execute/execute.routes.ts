import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../../middleware/authenticate";

const router = Router();

const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  go: 60,
  rust: 73,
  ruby: 72,
  swift: 83,
  kotlin: 78,
  sql: 82,
};

const JUDGE0_URL = "https://ce.judge0.com";

interface ExecuteResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}


const pollSubmission = async (
  token: string
): Promise<ExecuteResult> => {
  const MAX_ATTEMPTS = 10;

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const response = await fetch(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,status,time,memory`
      );

      if (!response.ok) {
        throw new Error("Failed to poll Judge0");
      }

      const data = (await response.json()) as ExecuteResult;

      if (data.status.id <= 2) {
        await delay(800);
        continue;
      }

      const decode = (value: string | null) => {
        if (!value) return null;

        return Buffer.from(value, "base64").toString("utf-8");
      };

      return {
        stdout: decode(data.stdout),
        stderr: decode(data.stderr),
        compile_output: decode(data.compile_output),
        status: data.status,
        time: data.time,
        memory: data.memory,
      };
    } catch (error) {
      console.error("Judge0 polling error:", error);

      return {
        stdout: null,
        stderr: "Failed while polling Judge0",
        compile_output: null,
        status: {
          id: 0,
          description: "Polling Error",
        },
        time: null,
        memory: null,
      };
    }
  }

  return {
    stdout: null,
    stderr: "Execution timed out.",
    compile_output: null,
    status: {
      id: 0,
      description: "Timeout",
    },
    time: null,
    memory: null,
  };
};

router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { code, language, stdin } = req.body;

      if (!code || !code.trim()) {
        res.status(400).json({
          error: "Code is required",
        });

        return;
      }

      const safeLanguage =
        typeof language === "string"
          ? language.toLowerCase()
          : "javascript";

      const languageId = LANGUAGE_IDS[safeLanguage];

      if (!languageId) {
        res.status(400).json({
          error: `Unsupported language: ${language}`,
        });

        return;
      }

      const submitResponse = await fetch(
        `${JUDGE0_URL}/submissions?base64_encoded=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language_id: languageId,
            source_code: Buffer.from(code).toString("base64"),
            stdin: stdin
              ? Buffer.from(stdin).toString("base64")
              : undefined,

            cpu_time_limit: 5,
            memory_limit: 128000,
          }),
        }
      );

      const responseText = await submitResponse.text();

      if (!submitResponse.ok) {
        console.error("Judge0 submit error:", responseText);

        res.status(502).json({
          error: "Judge0 service unavailable",
        });

        return;
      }

      const { token } = JSON.parse(responseText) as {
        token: string;
      };

      const result = await pollSubmission(token);

      res.json(result);
    } catch (error: any) {
      console.error("Execute route error:", error);

      res.status(500).json({
        error: "Execution failed",
      });
    }
  }
);

export default router;