import fs from "fs";
import path from "path";
import type {
  ICPKnowledgeBase,
  ICPVersionRecord,
  AnalysisResult,
} from "./types";
import { DEFAULT_ICP_KNOWLEDGE_BASE } from "./knowledge-base";

const DATA_DIR = path.join(process.cwd(), "data");
const ICP_CURRENT_FILE = path.join(DATA_DIR, "icp-current.json");
const ICP_HISTORY_FILE = path.join(DATA_DIR, "icp-history.json");
const ANALYSES_FILE = path.join(DATA_DIR, "analyses.json");
const BLOB_STORE_NAME = "tga-icp-data";

const BLOB_KEYS = {
  icpCurrent: "icp-current",
  icpHistory: "icp-history",
  analyses: "analyses",
} as const;

/** Netlify serverless has a read-only filesystem — use Netlify Blobs in production. */
function useBlobStorage(): boolean {
  return process.env.NETLIFY === "true";
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    writeJsonFile(filePath, fallback);
    return fallback;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/** Seed ICP from committed repo files when Blobs are empty on first deploy. */
function readSeedICP(): ICPKnowledgeBase {
  if (fs.existsSync(ICP_CURRENT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ICP_CURRENT_FILE, "utf-8")) as ICPKnowledgeBase;
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_ICP_KNOWLEDGE_BASE;
}

function readSeedHistory(): ICPVersionRecord[] {
  if (fs.existsSync(ICP_HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ICP_HISTORY_FILE, "utf-8")) as ICPVersionRecord[];
    } catch {
      /* fall through */
    }
  }
  return [];
}

async function getBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(BLOB_STORE_NAME);
}

async function blobGet<T>(key: string): Promise<T | null> {
  const store = await getBlobStore();
  const data = await store.get(key, { type: "json" });
  return (data as T) ?? null;
}

async function blobSet<T>(key: string, data: T): Promise<void> {
  const store = await getBlobStore();
  await store.setJSON(key, data);
}

// ─── ICP Current ─────────────────────────────────────────────────────────────

export async function getCurrentICP(): Promise<ICPKnowledgeBase> {
  if (useBlobStorage()) {
    const cached = await blobGet<ICPKnowledgeBase>(BLOB_KEYS.icpCurrent);
    if (cached) return cached;

    const seeded = readSeedICP();
    await saveCurrentICP(seeded);
    return seeded;
  }

  return readJsonFile(ICP_CURRENT_FILE, DEFAULT_ICP_KNOWLEDGE_BASE);
}

export async function saveCurrentICP(kb: ICPKnowledgeBase): Promise<void> {
  if (useBlobStorage()) {
    await blobSet(BLOB_KEYS.icpCurrent, kb);
    return;
  }
  writeJsonFile(ICP_CURRENT_FILE, kb);
}

// ─── ICP History ─────────────────────────────────────────────────────────────

export async function getICPHistory(): Promise<ICPVersionRecord[]> {
  let history: ICPVersionRecord[];

  if (useBlobStorage()) {
    const cached = await blobGet<ICPVersionRecord[]>(BLOB_KEYS.icpHistory);
    if (cached) {
      history = cached;
    } else {
      history = readSeedHistory();
      if (history.length === 0) {
        const current = await getCurrentICP();
        history = [
          {
            version: current.version,
            updatedAt: current.metadata?.updatedAt ?? new Date().toISOString(),
            updatedBy: current.metadata?.updatedBy ?? "System",
            changeSummary: current.metadata?.changeSummary ?? "Initial version",
            knowledgeBase: current,
          },
        ];
      }
      await blobSet(BLOB_KEYS.icpHistory, history);
    }
  } else {
    history = readJsonFile<ICPVersionRecord[]>(ICP_HISTORY_FILE, []);
  }

  const current = await getCurrentICP();
  const hasCurrent = history.some((h) => h.version === current.version);
  if (!hasCurrent && history.length === 0) {
    const initial: ICPVersionRecord = {
      version: current.version,
      updatedAt: current.metadata?.updatedAt ?? new Date().toISOString(),
      updatedBy: current.metadata?.updatedBy ?? "System",
      changeSummary: current.metadata?.changeSummary ?? "Initial version",
      knowledgeBase: current,
    };
    history.push(initial);
    await blobSetHistory(history);
  }

  return history.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

async function blobSetHistory(history: ICPVersionRecord[]): Promise<void> {
  if (useBlobStorage()) {
    await blobSet(BLOB_KEYS.icpHistory, history);
  } else {
    writeJsonFile(ICP_HISTORY_FILE, history);
  }
}

export async function getICPVersion(version: string): Promise<ICPVersionRecord | null> {
  const history = await getICPHistory();
  return history.find((h) => h.version === version) ?? null;
}

export async function addICPVersion(record: ICPVersionRecord): Promise<void> {
  const history = await getICPHistory();
  history.unshift(record);
  await blobSetHistory(history);
  await saveCurrentICP(record.knowledgeBase);
}

// ─── Analyses ────────────────────────────────────────────────────────────────

export async function getAnalyses(): Promise<AnalysisResult[]> {
  if (useBlobStorage()) {
    const cached = await blobGet<AnalysisResult[]>(BLOB_KEYS.analyses);
    return (cached ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return readJsonFile<AnalysisResult[]>(ANALYSES_FILE, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAnalysis(id: string): Promise<AnalysisResult | null> {
  const analyses = await getAnalyses();
  return analyses.find((a) => a.id === id) ?? null;
}

export async function saveAnalysis(result: AnalysisResult): Promise<void> {
  const analyses = await getAnalyses();
  analyses.unshift(result);

  if (useBlobStorage()) {
    await blobSet(BLOB_KEYS.analyses, analyses);
  } else {
    writeJsonFile(ANALYSES_FILE, analyses);
  }
}
