export type StudyTool = {
  id: string;
  name: string;
  category: string;
  description: string;
  example: string;
  run: (input: string) => unknown;
};
const j = (s: string) => JSON.parse(s);
const nums = (s: string) => {
  const a = j(s);
  if (
    !Array.isArray(a) ||
    !a.length ||
    !a.every((x) => typeof x === "number" && Number.isFinite(x))
  )
    throw Error("Enter a nonempty JSON array of numbers.");
  return a as number[];
};
const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
const sorted = (s: string) => nums(s).sort((a, b) => a - b);
const factorial = (n: number): number => {
  if (!Number.isInteger(n) || n < 0 || n > 170)
    throw Error("Use an integer from 0 to 170.");
  let v = 1;
  for (let i = 2; i <= n; i++) v *= i;
  return v;
};
const entries: Omit<StudyTool, "id">[] = [
  {
    name: "JSON formatter",
    category: "Developer",
    description: "Validate and pretty-print JSON.",
    example: '{"course":"JavaScript","lessons":[1,2]}',
    run: (s) => JSON.stringify(j(s), null, 2),
  },
  {
    name: "JSON minifier",
    category: "Developer",
    description: "Remove unnecessary whitespace from JSON.",
    example: '{ "name": "DevStudy", "active": true }',
    run: (s) => JSON.stringify(j(s)),
  },
  {
    name: "JSON → CSV",
    category: "Developer",
    description: "Convert flat JSON records to CSV with escaped cells.",
    example: '[{"name":"Ada","score":95},{"name":"Saad","score":90}]',
    run: (s) => {
      const a = j(s);
      if (
        !Array.isArray(a) ||
        !a.every((x) => x && typeof x === "object" && !Array.isArray(x))
      )
        throw Error("Enter an array of flat objects.");
      const keys = [...new Set(a.flatMap(Object.keys))] as string[];
      const cell = (v: unknown) =>
        '"' + String(v ?? "").replaceAll('"', '""') + '"';
      return [
        keys.map(cell).join(","),
        ...a.map((r) => keys.map((k) => cell(r[k])).join(",")),
      ].join("\n");
    },
  },
  {
    name: "URL encoder",
    category: "Developer",
    description: "Encode text for a URL component.",
    example: "hello world & code",
    run: encodeURIComponent,
  },
  {
    name: "URL decoder",
    category: "Developer",
    description: "Decode a percent-encoded URL component.",
    example: "hello%20world%20%26%20code",
    run: decodeURIComponent,
  },
  {
    name: "Base64 encoder",
    category: "Developer",
    description: "Encode UTF-8 text as Base64.",
    example: "Bonjour étudiant!",
    run: (s) =>
      btoa(
        Array.from(new TextEncoder().encode(s), (b) =>
          String.fromCharCode(b),
        ).join(""),
      ),
  },
  {
    name: "Base64 decoder",
    category: "Developer",
    description: "Decode Base64 to UTF-8 text.",
    example: "SGVsbG8gd29ybGQ=",
    run: (s) =>
      new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0)),
      ),
  },
  {
    name: "HTML entity encoder",
    category: "Developer",
    description: "Escape text for HTML display.",
    example: "<h1>Hello & welcome</h1>",
    run: (s) =>
      s.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c]!,
      ),
  },
  {
    name: "Color converter",
    category: "Developer",
    description: "Convert a three or six digit hex color to RGB.",
    example: "#7c5cff",
    run: (s) => {
      let h = s.trim().replace(/^#/, "");
      if (/^[\da-f]{3}$/i.test(h))
        h = h
          .split("")
          .map((c) => c + c)
          .join("");
      if (!/^[\da-f]{6}$/i.test(h))
        throw Error("Enter a 3 or 6 digit hex color.");
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
      };
    },
  },
  {
    name: "HTTP status reference",
    category: "Developer",
    description: "Look up common HTTP status meanings.",
    example: "404",
    run: (s) => {
      const codes: Record<string, string> = {
        "200": "OK — request succeeded",
        "201": "Created — resource created",
        "204": "No Content — succeeded without a body",
        "301": "Moved Permanently",
        "302": "Found — temporary redirect",
        "304": "Not Modified — use cached response",
        "400": "Bad Request — invalid request",
        "401": "Unauthorized — authentication required",
        "403": "Forbidden — insufficient permission",
        "404": "Not Found",
        "405": "Method Not Allowed",
        "409": "Conflict",
        "422": "Unprocessable Content — validation failed",
        "429": "Too Many Requests",
        "500": "Internal Server Error",
        "502": "Bad Gateway",
        "503": "Service Unavailable",
        "504": "Gateway Timeout",
      };
      return codes[s.trim()] ?? "Status not included in this reference.";
    },
  },
  {
    name: "Word & character counter",
    category: "Writing",
    description:
      "Count words, Unicode characters, lines and estimated reading minutes.",
    example: "Build something useful.\nLearn something new.",
    run: (s) => ({
      words: s.trim() ? s.trim().split(/\s+/).length : 0,
      characters: [...s].length,
      lines: s ? s.split("\n").length : 0,
      readingMinutes: Math.ceil(
        (s.trim() ? s.trim().split(/\s+/).length : 0) / 200,
      ),
    }),
  },
  {
    name: "Uppercase converter",
    category: "Writing",
    description: "Convert text to uppercase.",
    example: "study smarter",
    run: (s) => s.toUpperCase(),
  },
  {
    name: "Lowercase converter",
    category: "Writing",
    description: "Convert text to lowercase.",
    example: "HELLO WORLD",
    run: (s) => s.toLowerCase(),
  },
  {
    name: "Title case converter",
    category: "Writing",
    description: "Capitalize the first letter of each word.",
    example: "my learning journey",
    run: (s) => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()),
  },
  {
    name: "Slug generator",
    category: "Writing",
    description: "Make an ASCII URL slug from a title.",
    example: "My First Coding Project!",
    run: (s) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
  },
  {
    name: "Remove duplicate lines",
    category: "Writing",
    description: "Keep each line once in its original order.",
    example: "JavaScript\nPython\nJavaScript",
    run: (s) => [...new Set(s.split("\n"))].join("\n"),
  },
  {
    name: "Sort lines",
    category: "Writing",
    description: "Sort lines alphabetically.",
    example: "Zebra\nApple\nMango",
    run: (s) =>
      s
        .split("\n")
        .sort((a, b) => a.localeCompare(b))
        .join("\n"),
  },
  {
    name: "Whitespace cleaner",
    category: "Writing",
    description: "Trim lines and collapse repeated horizontal whitespace.",
    example: "  hello    world  \n  study   better ",
    run: (s) =>
      s
        .split("\n")
        .map((l) => l.trim().replace(/[\t ]+/g, " "))
        .join("\n")
        .trim(),
  },
  {
    name: "Text reverser",
    category: "Writing",
    description: "Reverse text by Unicode code points.",
    example: "Hello 👋",
    run: (s) => [...s].reverse().join(""),
  },
  {
    name: "Outline builder",
    category: "Writing",
    description: "Turn one topic per line into a numbered study outline.",
    example: "Variables\nFunctions\nArrays",
    run: (s) =>
      s
        .split("\n")
        .filter((x) => x.trim())
        .map(
          (x, i) =>
            `${i + 1}. ${x.trim()}\n   Key idea:\n   Example:\n   Questions:`,
        )
        .join("\n\n"),
  },
  {
    name: "Mean calculator",
    category: "Math",
    description: "Compute the arithmetic mean of a JSON array.",
    example: "[12, 14, 18, 20]",
    run: (s) => {
      const a = nums(s);
      return sum(a) / a.length;
    },
  },
  {
    name: "Median calculator",
    category: "Math",
    description: "Find the middle of a numeric dataset.",
    example: "[4, 1, 9, 3]",
    run: (s) => {
      const a = sorted(s),
        i = Math.floor(a.length / 2);
      return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
    },
  },
  {
    name: "Mode calculator",
    category: "Math",
    description: "Return all values with maximum frequency.",
    example: "[1, 2, 2, 3, 3]",
    run: (s) => {
      const m = new Map<number, number>();
      nums(s).forEach((n) => m.set(n, (m.get(n) ?? 0) + 1));
      const max = Math.max(...m.values());
      return [...m].filter(([, v]) => v === max).map(([k]) => k);
    },
  },
  {
    name: "Standard deviation",
    category: "Math",
    description: "Calculate population variance and standard deviation.",
    example: "[2, 4, 4, 4, 5, 5, 7, 9]",
    run: (s) => {
      const a = nums(s),
        m = sum(a) / a.length,
        v = sum(a.map((x) => (x - m) ** 2)) / a.length;
      return { mean: m, variance: v, standardDeviation: Math.sqrt(v) };
    },
  },
  {
    name: "Percentage calculator",
    category: "Math",
    description: "Input {part,whole} to calculate percentage.",
    example: '{"part":18,"whole":24}',
    run: (s) => {
      const { part, whole } = j(s);
      if (!whole) throw Error("Whole must not be zero.");
      return (part / whole) * 100;
    },
  },
  {
    name: "Percentage change",
    category: "Math",
    description: "Input {before,after} to find percentage change.",
    example: '{"before":80,"after":100}',
    run: (s) => {
      const { before, after } = j(s);
      if (!before) throw Error("Before must not be zero.");
      return ((after - before) / Math.abs(before)) * 100;
    },
  },
  {
    name: "Quadratic solver",
    category: "Math",
    description: "Solve ax² + bx + c = 0 for real roots.",
    example: '{"a":1,"b":-5,"c":6}',
    run: (s) => {
      const { a, b, c } = j(s);
      if (a === 0) {
        if (b === 0) return c === 0 ? "Every real number" : "No solution";
        return [-c / b];
      }
      const d = b * b - 4 * a * c;
      return d < 0
        ? "No real roots"
        : d === 0
          ? [-b / (2 * a)]
          : [(-b + Math.sqrt(d)) / (2 * a), (-b - Math.sqrt(d)) / (2 * a)];
    },
  },
  {
    name: "GCD & LCM",
    category: "Math",
    description: "Input two nonnegative safe integers.",
    example: "[12,18]",
    run: (s) => {
      const a = nums(s);
      if (a.length !== 2 || a.some((n) => !Number.isSafeInteger(n) || n < 0))
        throw Error("Enter two nonnegative safe integers.");
      let [x, y] = a;
      while (y) [x, y] = [y, x % y];
      return { gcd: x, lcm: x ? (a[0] * a[1]) / x : 0 };
    },
  },
  {
    name: "Factorial calculator",
    category: "Math",
    description: "Calculate n! for integers 0–170.",
    example: "6",
    run: (s) => factorial(Number(s)),
  },
  {
    name: "Prime checker",
    category: "Math",
    description: "Check integers up to one billion for primality.",
    example: "97",
    run: (s) => {
      const n = Number(s);
      if (!Number.isSafeInteger(n) || n > 1e9)
        throw Error("Enter an integer ≤ 1,000,000,000.");
      if (n < 2) return false;
      for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
      return true;
    },
  },
  {
    name: "Number base converter",
    category: "Computer science",
    description:
      "Convert a safe nonnegative decimal integer to binary, octal and hex.",
    example: "255",
    run: (s) => {
      const n = Number(s);
      if (!Number.isSafeInteger(n) || n < 0)
        throw Error("Enter a nonnegative safe integer.");
      return {
        binary: n.toString(2),
        octal: n.toString(8),
        hex: n.toString(16).toUpperCase(),
      };
    },
  },
  {
    name: "Binary decoder",
    category: "Computer science",
    description: "Convert up to 52 binary digits to decimal.",
    example: "101010",
    run: (s) => {
      if (!/^[01]{1,52}$/.test(s.trim()))
        throw Error("Enter 1–52 binary digits.");
      return parseInt(s, 2);
    },
  },
  {
    name: "Truth table",
    category: "Computer science",
    description: "Generate a two-variable table for AND, OR, XOR, NAND or NOR.",
    example: "XOR",
    run: (s) => {
      const op = s.trim().toUpperCase();
      if (!["AND", "OR", "XOR", "NAND", "NOR"].includes(op))
        throw Error("Use AND, OR, XOR, NAND or NOR.");
      return [false, true].flatMap((a) =>
        [false, true].map((b) => ({
          a,
          b,
          result:
            op === "AND"
              ? a && b
              : op === "OR"
                ? a || b
                : op === "XOR"
                  ? a !== b
                  : op === "NAND"
                    ? !(a && b)
                    : !(a || b),
        })),
      );
    },
  },
  {
    name: "ASCII inspector",
    category: "Computer science",
    description: "Inspect Unicode code points of each character.",
    example: "Code!",
    run: (s) =>
      [...s].map((c) => ({
        character: c,
        decimal: c.codePointAt(0),
        hex:
          "U+" + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0"),
      })),
  },
  {
    name: "Complexity growth explorer",
    category: "Computer science",
    description: "Compare common complexity operation counts for n (1–100).",
    example: "10",
    run: (s) => {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 1 || n > 100)
        throw Error("Enter an integer 1–100.");
      return {
        "O(1)": 1,
        "O(log₂n)": Math.log2(n),
        "O(n)": n,
        "O(n log₂n)": n * Math.log2(n),
        "O(n²)": n * n,
        "O(2ⁿ)": 2 ** n,
      };
    },
  },
  {
    name: "Temperature converter",
    category: "Converters",
    description: "Input {value,unit} where unit is C, F or K.",
    example: '{"value":25,"unit":"C"}',
    run: (s) => {
      const { value, unit } = j(s);
      if (!["C", "F", "K"].includes(unit))
        throw Error("Unit must be C, F or K.");
      const c =
        unit === "C"
          ? value
          : unit === "F"
            ? ((value - 32) * 5) / 9
            : value - 273.15;
      if (c < -273.15) throw Error("Temperature is below absolute zero.");
      return { C: c, F: (c * 9) / 5 + 32, K: c + 273.15 };
    },
  },
  {
    name: "Length converter",
    category: "Converters",
    description: "Input {value,from,to}; units: mm, cm, m, km, in, ft, mi.",
    example: '{"value":10,"from":"km","to":"mi"}',
    run: (s) => {
      const { value, from, to } = j(s),
        u: Record<string, number> = {
          mm: 0.001,
          cm: 0.01,
          m: 1,
          km: 1000,
          in: 0.0254,
          ft: 0.3048,
          mi: 1609.344,
        };
      if (!u[from] || !u[to]) throw Error("Unknown length unit.");
      return (value * u[from]) / u[to];
    },
  },
  {
    name: "Mass converter",
    category: "Converters",
    description: "Input {value,from,to}; units: mg, g, kg, lb, oz.",
    example: '{"value":70,"from":"kg","to":"lb"}',
    run: (s) => {
      const { value, from, to } = j(s),
        u: Record<string, number> = {
          mg: 0.000001,
          g: 0.001,
          kg: 1,
          lb: 0.45359237,
          oz: 0.028349523125,
        };
      if (!u[from] || !u[to]) throw Error("Unknown mass unit.");
      return (value * u[from]) / u[to];
    },
  },
  {
    name: "Data size converter",
    category: "Converters",
    description: "Convert bytes to decimal and binary storage units.",
    example: "1048576",
    run: (s) => {
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0) throw Error("Enter nonnegative bytes.");
      return {
        bytes: n,
        KB: n / 1000,
        MB: n / 1e6,
        GB: n / 1e9,
        KiB: n / 1024,
        MiB: n / 1048576,
        GiB: n / 1073741824,
      };
    },
  },
  {
    name: "Duration formatter",
    category: "Converters",
    description:
      "Convert nonnegative whole seconds to days, hours, minutes and seconds.",
    example: "90061",
    run: (s) => {
      let n = Number(s);
      if (!Number.isSafeInteger(n) || n < 0)
        throw Error("Enter nonnegative whole seconds.");
      const days = Math.floor(n / 86400);
      n %= 86400;
      const hours = Math.floor(n / 3600);
      n %= 3600;
      return { days, hours, minutes: Math.floor(n / 60), seconds: n % 60 };
    },
  },
  {
    name: "Weighted grade calculator",
    category: "Study planning",
    description: "Input [{grade,weight}]. Weights may use any common scale.",
    example: '[{"grade":80,"weight":40},{"grade":95,"weight":60}]',
    run: (s) => {
      const a = j(s);
      if (
        !Array.isArray(a) ||
        !a.length ||
        a.some(
          (x) =>
            !Number.isFinite(x.grade) ||
            !Number.isFinite(x.weight) ||
            x.weight < 0,
        )
      )
        throw Error("Enter grades with nonnegative weights.");
      const w = sum(a.map((x) => x.weight));
      if (!w) throw Error("Weights must total more than zero.");
      return sum(a.map((x) => x.grade * x.weight)) / w;
    },
  },
  {
    name: "Required exam grade",
    category: "Study planning",
    description:
      "Input {current,target,examWeight} with examWeight between 0 and 1.",
    example: '{"current":70,"target":80,"examWeight":0.4}',
    run: (s) => {
      const { current, target, examWeight } = j(s);
      if (!(examWeight > 0 && examWeight <= 1))
        throw Error("Exam weight must be > 0 and ≤ 1.");
      const needed = (target - current * (1 - examWeight)) / examWeight;
      return { needed, feasible: needed <= 100, alreadySecured: needed <= 0 };
    },
  },
  {
    name: "Study time allocator",
    category: "Study planning",
    description:
      "Input {minutes,subjects:[{name,weight}]}. Allocate study minutes proportionally.",
    example:
      '{"minutes":120,"subjects":[{"name":"Math","weight":3},{"name":"Code","weight":2}]}',
    run: (s) => {
      const { minutes, subjects } = j(s);
      if (
        !Number.isFinite(minutes) ||
        minutes < 0 ||
        !Array.isArray(subjects) ||
        subjects.some((x) => !Number.isFinite(x.weight) || x.weight < 0)
      )
        throw Error("Use nonnegative minutes and weights.");
      const total = sum(subjects.map((x) => x.weight));
      if (!total) throw Error("Include positive subject weights.");
      return subjects.map((x) => ({
        subject: x.name,
        minutes: (minutes * x.weight) / total,
      }));
    },
  },
  {
    name: "Revision schedule",
    category: "Study planning",
    description:
      "Input YYYY-MM-DD. Plan reviews after 1, 3, 7, 14 and 30 days.",
    example: "2026-11-08",
    run: (s) => {
      const d = new Date(s.trim() + "T00:00:00Z");
      if (!Number.isFinite(+d) || d.toISOString().slice(0, 10) !== s.trim())
        throw Error("Use a valid YYYY-MM-DD date.");
      return [1, 3, 7, 14, 30].map((day) => ({
        reviewAfterDays: day,
        date: new Date(+d + day * 86400000).toISOString().slice(0, 10),
      }));
    },
  },
  {
    name: "Flashcard deck builder",
    category: "Study planning",
    description:
      "One question | answer per line. Create an exportable JSON deck.",
    example:
      "What is a closure? | A function retaining access to its lexical scope\nWhat is a stack? | A last-in-first-out structure",
    run: (s) =>
      s
        .split("\n")
        .filter((x) => x.trim())
        .map((l, i) => {
          const split = l.indexOf("|");
          if (split < 1 || !l.slice(split + 1).trim())
            throw Error(`Line ${i + 1}: use question | answer.`);
          return {
            question: l.slice(0, split).trim(),
            answer: l.slice(split + 1).trim(),
          };
        }),
  },
  {
    name: "Cornell notes template",
    category: "Study planning",
    description: "Turn a topic into a structured notes template.",
    example: "JavaScript closures",
    run: (s) =>
      `# ${s.trim()}\n\n## Cue questions\n- What is the central idea?\n- When should I use it?\n\n## Notes\n\n## Worked example\n\n## Summary in my own words\n\n## Questions to revisit\n`,
  },
  {
    name: "Task prioritizer",
    category: "Study planning",
    description:
      "Input [{task,impact,effort}]. Sort by impact / positive effort.",
    example:
      '[{"task":"Practice arrays","impact":8,"effort":2},{"task":"Review notes","impact":4,"effort":3}]',
    run: (s) => {
      const a = j(s);
      if (
        !Array.isArray(a) ||
        a.some(
          (x) =>
            !Number.isFinite(x.impact) ||
            !Number.isFinite(x.effort) ||
            x.effort <= 0,
        )
      )
        throw Error("Each task needs finite impact and positive effort.");
      return a
        .map((x) => ({ ...x, priority: x.impact / x.effort }))
        .sort((a, b) => b.priority - a.priority);
    },
  },
  {
    name: "Reading plan",
    category: "Study planning",
    description: "Input {pages,days}. Distribute pages across whole days.",
    example: '{"pages":125,"days":7}',
    run: (s) => {
      const { pages, days } = j(s);
      if (
        !Number.isInteger(pages) ||
        pages < 0 ||
        !Number.isInteger(days) ||
        days < 1 ||
        days > 366
      )
        throw Error("Use nonnegative whole pages and 1–366 days.");
      let page = 1;
      return Array.from({ length: days }, (_, i) => {
        const count = Math.floor(pages / days) + (i < pages % days ? 1 : 0),
          start = page;
        page += count;
        return {
          day: i + 1,
          pages: count,
          range: count ? `${start}–${page - 1}` : "Rest",
        };
      });
    },
  },
  {
    name: "Exam countdown",
    category: "Study planning",
    description: "Input {today,exam} as YYYY-MM-DD. Return days remaining.",
    example: '{"today":"2026-11-08","exam":"2026-12-01"}',
    run: (s) => {
      const { today, exam } = j(s);
      const dates = [today, exam].map((v) => {
        const d = new Date(v + "T00:00:00Z");
        if (!Number.isFinite(+d) || d.toISOString().slice(0, 10) !== v)
          throw Error("Use valid YYYY-MM-DD dates.");
        return +d;
      });
      return { daysRemaining: (dates[1] - dates[0]) / 86400000 };
    },
  },
  {
    name: "Pomodoro session planner",
    category: "Study planning",
    description:
      "Input {sessions,focus,shortBreak,longBreak}. Long break after every fourth session, no final break.",
    example: '{"sessions":4,"focus":25,"shortBreak":5,"longBreak":15}',
    run: (s) => {
      const { sessions, focus, shortBreak, longBreak } = j(s);
      if (
        !Number.isInteger(sessions) ||
        sessions < 1 ||
        sessions > 48 ||
        ![focus, shortBreak, longBreak].every(
          (x) => Number.isFinite(x) && x >= 0,
        )
      )
        throw Error("Use 1–48 sessions and nonnegative durations.");
      const plan = [];
      for (let i = 1; i <= sessions; i++) {
        plan.push({ type: "Focus", minutes: focus });
        if (i < sessions)
          plan.push({
            type: i % 4 === 0 ? "Long break" : "Short break",
            minutes: i % 4 === 0 ? longBreak : shortBreak,
          });
      }
      return { totalMinutes: sum(plan.map((x) => x.minutes)), plan };
    },
  },
];
export const studyTools: StudyTool[] = entries.map((t, i) => ({
  ...t,
  id: `tool-${String(i + 1).padStart(2, "0")}`,
}));
export function runTool(tool: StudyTool, input: string) {
  if (input.length > 100000)
    throw Error("Input too large. Maximum 100,000 characters.");
  const result = tool.run(input);
  const check = (v: unknown): void => {
    if (typeof v === "number" && !Number.isFinite(v))
      throw Error("Result is not finite. Check the input values.");
    if (Array.isArray(v)) v.forEach(check);
    else if (v && typeof v === "object") Object.values(v).forEach(check);
  };
  check(result);
  return typeof result === "string" ? result : JSON.stringify(result, null, 2);
}
