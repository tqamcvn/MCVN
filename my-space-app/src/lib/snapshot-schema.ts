import {z} from 'zod';
const page=z.string().startsWith('page:');
const shape=z.string().startsWith('shape:');
export const sessionSchema=z.object({version:z.literal(0),currentPageId:page.optional(),isFocusMode:z.boolean().optional(),exportBackground:z.boolean().optional(),isDebugMode:z.boolean().optional(),isToolLocked:z.boolean().optional(),isGridMode:z.boolean().optional(),pageStates:z.array(z.object({pageId:page,camera:z.object({x:z.number(),y:z.number(),z:z.number().positive()}).strict().optional(),selectedShapeIds:z.array(shape).optional(),focusedGroupId:shape.nullable().optional()}).strict()).optional()}).strict();
