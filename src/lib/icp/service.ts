import { v4 as uuidv4 } from "uuid";
import { incrementVersion } from "@/lib/utils";
import type {
  ICPKnowledgeBase,
  ICPCriterion,
  ICPVersionRecord,
  PublishICPRequest,
} from "./types";
import {
  getCurrentICP,
  saveCurrentICP,
  getICPHistory,
  addICPVersion,
  getICPVersion,
} from "./storage";
import { validateICPForPublish, parsePublishRequest } from "./validation";

export async function getICP(): Promise<ICPKnowledgeBase> {
  return getCurrentICP();
}

export async function getHistory(): Promise<ICPVersionRecord[]> {
  return getICPHistory();
}

export async function getVersion(version: string): Promise<ICPVersionRecord | null> {
  return getICPVersion(version);
}

export async function publishICP(
  request: PublishICPRequest
): Promise<{ success: true; version: string } | { success: false; errors: string[] }> {
  const parsed = parsePublishRequest(request);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }

  const current = await getCurrentICP();
  const newVersion = incrementVersion(current.version);

  const newKB: ICPKnowledgeBase = {
    ...parsed.data.knowledgeBase,
    version: newVersion,
    metadata: {
      createdAt: current.metadata?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: parsed.data.updatedBy,
      changeSummary: parsed.data.changeSummary,
    },
  };

  const validation = validateICPForPublish(newKB);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const record: ICPVersionRecord = {
    version: newVersion,
    updatedAt: newKB.metadata!.updatedAt!,
    updatedBy: parsed.data.updatedBy,
    changeSummary: parsed.data.changeSummary,
    knowledgeBase: newKB,
  };

  await addICPVersion(record);
  return { success: true, version: newVersion };
}

export async function addCriterion(
  criterion: ICPCriterion,
  updatedBy: string,
  changeSummary?: string
): Promise<{ success: true; version: string } | { success: false; errors: string[] }> {
  const current = await getCurrentICP();
  const criteria = [...current.criteria, criterion];

  return publishICP({
    knowledgeBase: {
      name: current.name,
      description: current.description,
      criteria,
    },
    updatedBy,
    changeSummary: changeSummary ?? `Added criterion: ${criterion.name}`,
  });
}

export async function updateCriterion(
  criterionId: string,
  updated: ICPCriterion,
  updatedBy: string,
  changeSummary?: string
): Promise<{ success: true; version: string } | { success: false; errors: string[] }> {
  const current = await getCurrentICP();
  const idx = current.criteria.findIndex((c) => c.id === criterionId);
  if (idx === -1) {
    return { success: false, errors: [`Criterion not found: ${criterionId}`] };
  }

  const criteria = [...current.criteria];
  criteria[idx] = updated;

  return publishICP({
    knowledgeBase: {
      name: current.name,
      description: current.description,
      criteria,
    },
    updatedBy,
    changeSummary: changeSummary ?? `Updated criterion: ${updated.name}`,
  });
}

export async function deleteCriterion(
  criterionId: string,
  updatedBy: string
): Promise<{ success: true; version: string } | { success: false; errors: string[] }> {
  const current = await getCurrentICP();
  const criterion = current.criteria.find((c) => c.id === criterionId);
  if (!criterion) {
    return { success: false, errors: [`Criterion not found: ${criterionId}`] };
  }

  const criteria = current.criteria.filter((c) => c.id !== criterionId);

  return publishICP({
    knowledgeBase: {
      name: current.name,
      description: current.description,
      criteria,
    },
    updatedBy,
    changeSummary: `Removed criterion: ${criterion.name}`,
  });
}

export async function reorderCriteria(
  orderedIds: string[],
  updatedBy: string
): Promise<{ success: true; version: string } | { success: false; errors: string[] }> {
  const current = await getCurrentICP();
  const criteriaMap = new Map(current.criteria.map((c) => [c.id, c]));

  const reordered: ICPCriterion[] = [];
  for (let i = 0; i < orderedIds.length; i++) {
    const c = criteriaMap.get(orderedIds[i]);
    if (c) {
      reordered.push({ ...c, order: i });
      criteriaMap.delete(orderedIds[i]);
    }
  }

  for (const c of criteriaMap.values()) {
    reordered.push({ ...c, order: reordered.length });
  }

  return publishICP({
    knowledgeBase: {
      name: current.name,
      description: current.description,
      criteria: reordered,
    },
    updatedBy,
    changeSummary: "Reordered criteria",
  });
}

export async function restoreVersion(
  version: string,
  updatedBy: string
): Promise<{ success: true; version: string } | { success: false; errors: string[] }> {
  const record = await getICPVersion(version);
  if (!record) {
    return { success: false, errors: [`Version not found: ${version}`] };
  }

  const current = await getCurrentICP();
  const newVersion = incrementVersion(current.version);

  const restoredKB: ICPKnowledgeBase = {
    ...record.knowledgeBase,
    version: newVersion,
    metadata: {
      createdAt: record.knowledgeBase.metadata?.createdAt,
      updatedAt: new Date().toISOString(),
      updatedBy,
      changeSummary: `Restored from version ${version}`,
    },
  };

  const validation = validateICPForPublish(restoredKB);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const newRecord: ICPVersionRecord = {
    version: newVersion,
    updatedAt: restoredKB.metadata!.updatedAt!,
    updatedBy,
    changeSummary: `Restored from version ${version}`,
    knowledgeBase: restoredKB,
  };

  await addICPVersion(newRecord);
  return { success: true, version: newVersion };
}

export async function toggleCriterion(
  criterionId: string,
  active: boolean,
  updatedBy: string
): Promise<{ success: true; version: string } | { success: false; errors: string[] }> {
  const current = await getCurrentICP();
  const criterion = current.criteria.find((c) => c.id === criterionId);
  if (!criterion) {
    return { success: false, errors: [`Criterion not found: ${criterionId}`] };
  }

  return updateCriterion(
    criterionId,
    { ...criterion, active },
    updatedBy,
    `${active ? "Enabled" : "Disabled"} criterion: ${criterion.name}`
  );
}

export async function saveDraft(
  kb: Omit<ICPKnowledgeBase, "version"> & { version?: string }
): Promise<void> {
  const current = await getCurrentICP();
  await saveCurrentICP({
    ...current,
    ...kb,
    version: current.version,
    metadata: {
      ...current.metadata,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function generateCriterionId(): string {
  return uuidv4();
}
