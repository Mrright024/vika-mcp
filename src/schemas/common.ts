import * as z from 'zod/v4';

export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)]),
);

export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);

export const optionalStringArraySchema = z.array(z.string().min(1)).optional();

export const destructiveFlagSchema = z.boolean().optional().default(false);

export const spaceIdSchema = z.string().min(1).describe('Space ID, usually starts with spc.');
export const nodeIdSchema = z.string().min(1).describe('Node ID, usually starts with dst/fld/form prefixes.');
export const datasheetIdSchema = z.string().min(1).describe('Datasheet ID, usually starts with dst.');
export const fieldIdSchema = z.string().min(1).describe('Field ID, usually starts with fld.');
export const viewIdSchema = z.string().min(1).describe('View ID.');
export const recordIdSchema = z.string().min(1).describe('Record ID, usually starts with rec.');

export const paginationShape = {
  pageSize: z.number().int().min(1).max(1000).optional(),
  pageNum: z.number().int().min(1).optional(),
};
