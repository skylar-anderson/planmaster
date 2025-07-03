import { z } from 'zod';

export const PRDSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  markdown: z.string(),
  updatedAt: z.date(),
  createdAt: z.date(),
  sourceContextItemIds: z.array(z.string()),
  version: z.number().positive().default(1),
  isDraft: z.boolean().default(true),
  metadata: z.object({
    author: z.string().optional(),
    lastModifiedBy: z.string().optional(),
    tags: z.array(z.string()).default([]),
    estimatedReadTime: z.number().optional(),
  }).optional(),
});

export type PRD = z.infer<typeof PRDSchema>;

export const PRDSectionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  order: z.number(),
  type: z.enum(['problem-statement', 'goals', 'requirements', 'user-stories', 'acceptance-criteria', 'technical-specs', 'timeline', 'risks', 'custom']),
  linkedContextIds: z.array(z.string()).default([]),
});

export type PRDSection = z.infer<typeof PRDSectionSchema>;

export const PRDMetadataSchema = z.object({
  totalSections: z.number(),
  wordCount: z.number(),
  lastSaved: z.date(),
  autoSaveEnabled: z.boolean().default(true),
  collaborators: z.array(z.string()).default([]),
});

export type PRDMetadata = z.infer<typeof PRDMetadataSchema>;

// Validation helper functions
export const validatePRD = (data: unknown): PRD => {
  return PRDSchema.parse(data);
};

export const validatePRDSection = (data: unknown): PRDSection => {
  return PRDSectionSchema.parse(data);
};

export const validatePRDMetadata = (data: unknown): PRDMetadata => {
  return PRDMetadataSchema.parse(data);
};

// Helper to create a new PRD
export const createNewPRD = (
  title: string,
  markdown: string = '',
  sourceContextItemIds: string[] = []
): PRD => {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title,
    markdown,
    updatedAt: now,
    createdAt: now,
    sourceContextItemIds,
    version: 1,
    isDraft: true,
    metadata: {
      tags: [],
      estimatedReadTime: Math.ceil(markdown.split(' ').length / 200), // Assume 200 words per minute
    },
  };
};