type JudgeResult = {
    status: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error";
    testCasesPassed: number;
    totalTestCases: number;
};

export function judgeSolution(
    code: string,
    totalTestCases: number
): JudgeResult {
    const normalized = code.toLowerCase();

    if (
        normalized.includes("runtime_error") ||
        normalized.includes("syntaxerror") ||
        normalized.includes("null")
    ) {
        return {
            status: "runtime_error",
            testCasesPassed: 0,
            totalTestCases,
        };
    }

    if (
        normalized.includes("timeout") ||
        normalized.includes("infinite") ||
        normalized.includes("sleep")
    ) {
        return {
            status: "time_limit_exceeded",
            testCasesPassed: 0,
            totalTestCases,
        };
    }

    if (normalized.includes("wrong")) {
        const passed = Math.floor(totalTestCases / 2);
        return {
            status: "wrong_answer",
            testCasesPassed: passed,
            totalTestCases,
        };
    }

    // default → accepted
    return {
        status: "accepted",
        testCasesPassed: totalTestCases,
        totalTestCases,
    };
}
