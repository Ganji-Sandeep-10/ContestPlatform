import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

type JudgeStatus =
    | "accepted"
    | "wrong_answer"
    | "time_limit_exceeded"
    | "runtime_error";

interface JudgeResult {
    status: JudgeStatus;
    testCasesPassed: number;
    totalTestCases: number;
}

export const judgeSolution = async (
    code: string,
    testCases: { input: string; expectedOutput: string }[],
    timeLimitMs: number
): Promise<JudgeResult> => {
    const submissionId = crypto.randomUUID();
    const workDir = path.join("/tmp", submissionId);

    await fs.mkdir(workDir, { recursive: true });

    const codeFile = path.join(workDir, "solution.js");
    await fs.writeFile(codeFile, code);

    let passed = 0;

    for (const testCase of testCases) {
        try {
            const output = await runInDocker(
                workDir,
                testCase.input,
                timeLimitMs
            );

            if (output.trim() === testCase.expectedOutput.trim()) {
                passed++;
            }
        } catch (err: any) {
            if (err === "TLE") {
                return {
                    status: "time_limit_exceeded",
                    testCasesPassed: 0,
                    totalTestCases: testCases.length,
                };
            }

            return {
                status: "runtime_error",
                testCasesPassed: 0,
                totalTestCases: testCases.length,
            };
        }
    }

    return {
        status: passed === testCases.length ? "accepted" : "wrong_answer",
        testCasesPassed: passed,
        totalTestCases: testCases.length,
    };
};

const runInDocker = (
    workDir: string,
    input: string,
    timeLimitMs: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const cmd = `
      docker run --rm \
      -v ${workDir}:/app \
      code-runner-node \
      node solution.js
    `;

        const child = exec(cmd, { timeout: timeLimitMs }, (err, stdout, stderr) => {
            if (err) {
                if (err.killed) return reject("TLE");
                return reject(stderr || err.message);
            }
            resolve(stdout);
        });

        child.stdin?.write(input);
        child.stdin?.end();
    });
};
