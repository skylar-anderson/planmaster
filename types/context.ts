import { z } from 'zod';

// Define categories for context items
export const ContextCategoryEnum = z.enum([
  'requirement',
  'feature',
  'constraint',
  'assumption',
  'note',
  'other'
]);

export type ContextCategory = z.infer<typeof ContextCategoryEnum>;

// Define the main ContextItem schema with comprehensive validation
export const ContextItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  contentMd: z.string()
    .max(10000, 'Content must be less than 10,000 characters'),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
  category: ContextCategoryEnum.default('note'),
  createdAt: z.date(),
  updatedAt: z.date(),
  isArchived: z.boolean().default(false),
  metadata: z.record(z.string(), z.any()).optional()
});

// Type inference for TypeScript
export type ContextItem = z.infer<typeof ContextItemSchema>;

// Schema for creating a new context item (without id and dates)
export const CreateContextItemSchema = ContextItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type CreateContextItem = z.infer<typeof CreateContextItemSchema>;

// Schema for updating a context item (all fields optional except id)
export const UpdateContextItemSchema = ContextItemSchema.partial().required({
  id: true
});

export type UpdateContextItem = z.infer<typeof UpdateContextItemSchema>;

// Schema for filtering context items
export const ContextFilterSchema = z.object({
  categories: z.array(ContextCategoryEnum).optional(),
  tags: z.array(z.string()).optional(),
  searchTerm: z.string().optional(),
  isArchived: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type ContextFilter = z.infer<typeof ContextFilterSchema>;

// Validation helper functions
export const validateContextItem = (data: unknown): ContextItem => {
  return ContextItemSchema.parse(data);
};

export const validateCreateContextItem = (data: unknown): CreateContextItem => {
  return CreateContextItemSchema.parse(data);
};

export const validateUpdateContextItem = (data: unknown): UpdateContextItem => {
  return UpdateContextItemSchema.parse(data);
};

export const validateContextFilter = (data: unknown): ContextFilter => {
  return ContextFilterSchema.parse(data);
};