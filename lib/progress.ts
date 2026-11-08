export type Progress = {
  completed: string[];
  bookmarks: string[];
  notes: string;
  drafts: Record<string, string>;
  activity: Record<string, number>;
};
export const emptyProgress: Progress = {
  completed: [],
  bookmarks: [],
  notes: "",
  drafts: {},
  activity: {},
};
export function sanitizeProgress(value: unknown): Progress {
  if (!value || typeof value !== "object") throw Error("Invalid progress");
  const p = value as Progress;
  const ids = (a: unknown) =>
    Array.isArray(a)
      ? [
          ...new Set(
            a.filter(
              (v): v is string =>
                typeof v === "string" &&
                /^challenge-(00[1-9]|0[1-9][0-9]|100)$/.test(v),
            ),
          ),
        ]
      : [];
  const drafts: Record<string, string> = {};
  if (p.drafts && typeof p.drafts === "object")
    for (const [k, v] of Object.entries(p.drafts)) {
      if (
        /^challenge-\d{3}$/.test(k) &&
        typeof v === "string" &&
        v.length <= 30000
      )
        drafts[k] = v;
    }
  const activity: Record<string, number> = {};
  if (p.activity && typeof p.activity === "object")
    for (const [k, v] of Object.entries(p.activity)) {
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(k) &&
        Number.isInteger(v) &&
        v >= 0 &&
        v <= 100
      )
        activity[k] = v;
    }
  return {
    completed: ids(p.completed),
    bookmarks: ids(p.bookmarks),
    notes: typeof p.notes === "string" ? p.notes.slice(0, 50000) : "",
    drafts,
    activity,
  };
}
