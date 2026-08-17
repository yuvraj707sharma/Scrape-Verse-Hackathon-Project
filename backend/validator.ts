import { z } from 'zod';

export class SchemaDriftError extends Error {
  constructor(public issues: z.ZodIssue[]) {
    super('Schema drift detected. Missing or invalid fields.');
    this.name = 'SchemaDriftError';
  }
}

export const DocPayloadSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1, "Title is missing"),
  version: z.string().default("latest"),
  codeBlocks: z.array(z.string()).default([]),
  breakingChanges: z.array(z.object({
    heading: z.string(),
    content: z.string()
  })).default([]),
  rawHtmlSnippet: z.string().optional()
});

export function validateDocPayload(data: unknown) {
  const result = DocPayloadSchema.safeParse(data);
  if (!result.success) {
    throw new SchemaDriftError(result.error.issues);
  }
  return result.data;
}

export const TrendPayloadSchema = z.object({
  repoName: z.string().min(1),
  stars: z.number().or(z.string().transform(s => parseInt(s.replace(/[^0-9]/g, '')) || 0)),
  language: z.string().default('Unknown'),
  description: z.string().default('')
});

export function validateTrendPayload(data: unknown) {
  const result = TrendPayloadSchema.safeParse(data);
  if (!result.success) {
    throw new SchemaDriftError(result.error.issues);
  }
  return result.data;
}
