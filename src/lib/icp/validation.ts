import { z } from "zod";

export const RuleOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "in",
  "not_in",
  "gte",
  "lte",
  "between",
  "exists",
]);

export const CriterionTypeSchema = z.enum([
  "industry",
  "sub_industry",
  "employee_size",
  "revenue_range",
  "country",
  "location",
  "business_model",
  "product_service",
  "technology",
  "job_title",
  "company_characteristic",
  "signal",
  "exclusion",
  "custom",
]);

export const ICPRuleSchema = z.object({
  id: z.string().min(1),
  field: z.string().min(1),
  operator: RuleOperatorSchema,
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.tuple([z.number(), z.number()]),
  ]),
  description: z.string().optional(),
  isHardRule: z.boolean(),
});

export const ICPCriterionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Criterion name is required"),
  description: z.string().optional(),
  type: CriterionTypeSchema,
  weight: z.number().min(0).max(100),
  required: z.boolean(),
  active: z.boolean(),
  order: z.number().int().min(0),
  isHardRule: z.boolean(),
  rules: z.array(ICPRuleSchema),
  positiveSignals: z.array(z.string()).optional(),
  negativeSignals: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  preferredModels: z.array(z.string()).optional(),
});

export const ICPKnowledgeBaseSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/, "Version must be in format X.Y"),
  name: z.string().min(1, "ICP name is required"),
  description: z.string(),
  criteria: z.array(ICPCriterionSchema).min(1, "At least one criterion is required"),
  metadata: z
    .object({
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
      updatedBy: z.string().optional(),
      changeSummary: z.string().optional(),
    })
    .optional(),
});

export const PublishICPSchema = z.object({
  knowledgeBase: z.object({
    name: z.string().min(1),
    description: z.string(),
    criteria: z.array(ICPCriterionSchema).min(1),
  }),
  updatedBy: z.string().min(1, "Updated by is required"),
  changeSummary: z.string().min(1, "Change summary is required"),
});

export const UpdateCriterionSchema = z.object({
  criterion: ICPCriterionSchema,
  updatedBy: z.string().min(1),
  changeSummary: z.string().optional(),
});

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export function validateICPForPublish(
  kb: z.infer<typeof ICPKnowledgeBaseSchema>
): ValidationResult {
  const errors: string[] = [];

  const activeCriteria = kb.criteria.filter((c) => c.active);
  if (activeCriteria.length === 0) {
    errors.push("At least one active criterion is required");
  }

  const totalWeight = activeCriteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) {
    errors.push("Total weight of active criteria must be greater than 0");
  }
  if (totalWeight > 100) {
    errors.push(`Total weight (${totalWeight}) exceeds 100. Adjust criterion weights.`);
  }

  const ids = kb.criteria.map((c) => c.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate criterion IDs: ${duplicateIds.join(", ")}`);
  }

  for (const criterion of kb.criteria) {
    if (criterion.type === "employee_size" || criterion.type === "revenue_range") {
      if (criterion.minValue !== undefined && criterion.maxValue !== undefined) {
        if (criterion.minValue > criterion.maxValue) {
          errors.push(
            `${criterion.name}: minimum value cannot exceed maximum value`
          );
        }
      }
    }

    if (criterion.isHardRule && criterion.rules.length === 0 && !criterion.values?.length) {
      if (criterion.type === "exclusion" && !criterion.values?.length) {
        errors.push(`${criterion.name}: hard rule exclusion requires values`);
      }
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export function parseICPKnowledgeBase(data: unknown) {
  return ICPKnowledgeBaseSchema.safeParse(data);
}

export function parsePublishRequest(data: unknown) {
  return PublishICPSchema.safeParse(data);
}

export function parseUpdateCriterion(data: unknown) {
  return UpdateCriterionSchema.safeParse(data);
}
