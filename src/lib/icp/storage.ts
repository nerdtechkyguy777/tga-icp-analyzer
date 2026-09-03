import type {
  ICPKnowledgeBase,
  ICPVersionRecord,
  AnalysisResult,
} from "./types";
import icpCurrentSeed from "../../../data/icp-current.json";
import icpHistorySeed from "../../../data/icp-history.json";

const BLOB_STORE_NAME = "tga-icp-data";

const BLOB_KEYS = {
  icpCurrent: "icp-current",
  icpHistory: "icp-history",
  analyses: "analyses",
} as const;

const SEED_ICP = icpCurrentSeed as ICPKnowledgeBase;
const SEED_HISTORY = icpHistorySeed as ICPVersionRecord[];

/**
 * Detect Netlify/serverless runtime where the filesystem is read-only.
 * Note: `NETLIFY=true` is set at build time only — at runtime Netlify exposes
 * `SITE_ID`, `URL`, and `SITE_NAME` instead (see Netlify function env docs).
 */
function isNetlifyRuntime(): boolean {
  return (
    process.env.NETLIFY === "true" ||
    !!process.env.SITE_ID ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME
  );
}

async function getBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(BLOB_STORE_NAME);
}

async function blobGet<T>(key: string): Promise<T | null> {
  try {
    const store = await getBlobStore();
    const data = await store.get(key, { type: "json" });
    return (data as T) ?? null;
  } catch (error) {
    console.warn(`[storage] Blob read failed (${key}):`, error);
    return null;
  }
}

async function blobSet<T>(key: string, data: T): Promise<boolean> {
  try {
    const store = await getBlobStore();
    await store.setJSON(key, data);
    return true;
  } catch (error) {
    console.warn(`[storage] Blob write failed (${key}):`, error);
    return false;
  }
}

// ─── Local filesystem (dev only — dynamic import avoids bundling fs on Netlify) ─

async function localGetCurrentICP(): Promise<ICPKnowledgeBase> {
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "icp-current.json");
  if (!fs.existsSync(file)) return SEED_ICP;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as ICPKnowledgeBase;
  } catch {
    return SEED_ICP;
  }
}

async function localSaveCurrentICP(kb: ICPKnowledgeBase): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "icp-current.json"),
    JSON.stringify(kb, null, 2),
    "utf-8"
  );
}

async function localGetHistory(): Promise<ICPVersionRecord[]> {
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "icp-history.json");
  if (!fs.existsSync(file)) return [...SEED_HISTORY];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as ICPVersionRecord[];
  } catch {
    return [...SEED_HISTORY];
  }
}

async function localSaveHistory(history: ICPVersionRecord[]): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "icp-history.json"),
    JSON.stringify(history, null, 2),
    "utf-8"
  );
}

async function localGetAnalyses(): Promise<AnalysisResult[]> {
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "analyses.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as AnalysisResult[];
  } catch {
    return [];
  }
}

async function localSaveAnalyses(analyses: AnalysisResult[]): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "analyses.json"),
    JSON.stringify(analyses, null, 2),
    "utf-8"
  );
}

function sortHistory(history: ICPVersionRecord[]): ICPVersionRecord[] {
  return history.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function sortAnalyses(analyses: AnalysisResult[]): AnalysisResult[] {
  return analyses.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ─── ICP Current ─────────────────────────────────────────────────────────────

export async function getCurrentICP(): Promise<ICPKnowledgeBase> {
  if (!isNetlifyRuntime()) {
    return localGetCurrentICP();
  }

  const cached = await blobGet<ICPKnowledgeBase>(BLOB_KEYS.icpCurrent);
  if (cached) return cached;

  await blobSet(BLOB_KEYS.icpCurrent, SEED_ICP);
  return SEED_ICP;
}

export async function saveCurrentICP(kb: ICPKnowledgeBase): Promise<void> {
  if (!isNetlifyRuntime()) {
    await localSaveCurrentICP(kb);
    return;
  }
  await blobSet(BLOB_KEYS.icpCurrent, kb);
}

// ─── ICP History ─────────────────────────────────────────────────────────────

export async function getICPHistory(): Promise<ICPVersionRecord[]> {
  let history: ICPVersionRecord[];

  if (!isNetlifyRuntime()) {
    history = await localGetHistory();
  } else {
    const cached = await blobGet<ICPVersionRecord[]>(BLOB_KEYS.icpHistory);
    history = cached ?? [...SEED_HISTORY];

    if (!cached && history.length > 0) {
      await blobSet(BLOB_KEYS.icpHistory, history);
    }
  }

  const current = await getCurrentICP();
  if (history.length === 0) {
    history = [
      {
        version: current.version,
        updatedAt: current.metadata?.updatedAt ?? new Date().toISOString(),
        updatedBy: current.metadata?.updatedBy ?? "System",
        changeSummary: current.metadata?.changeSummary ?? "Initial version",
        knowledgeBase: current,
      },
    ];
    await persistHistory(history);
  }

  return sortHistory(history);
}

async function persistHistory(history: ICPVersionRecord[]): Promise<void> {
  if (!isNetlifyRuntime()) {
    await localSaveHistory(history);
  } else {
    await blobSet(BLOB_KEYS.icpHistory, history);
  }
}

export async function getICPVersion(version: string): Promise<ICPVersionRecord | null> {
  const history = await getICPHistory();
  return history.find((h) => h.version === version) ?? null;
}

export async function addICPVersion(record: ICPVersionRecord): Promise<void> {
  const history = await getICPHistory();
  history.unshift(record);
  await persistHistory(history);
  await saveCurrentICP(record.knowledgeBase);
}

// ─── Analyses ────────────────────────────────────────────────────────────────

export async function getAnalyses(): Promise<AnalysisResult[]> {
  if (!isNetlifyRuntime()) {
    return sortAnalyses(await localGetAnalyses());
  }

  const cached = await blobGet<AnalysisResult[]>(BLOB_KEYS.analyses);
  return sortAnalyses(cached ?? []);
}

export async function getAnalysis(id: string): Promise<AnalysisResult | null> {
  const analyses = await getAnalyses();
  return analyses.find((a) => a.id === id) ?? null;
}

export async function saveAnalysis(result: AnalysisResult): Promise<void> {
  const analyses = await getAnalyses();
  analyses.unshift(result);

  if (!isNetlifyRuntime()) {
    await localSaveAnalyses(analyses);
  } else {
    await blobSet(BLOB_KEYS.analyses, analyses);
  }
}
