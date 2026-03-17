import { z } from 'zod';

export const registerSchema = z.object({
  type_id: z.number().int().positive({ message: 'type_id debe ser un número positivo' }),
  number_id: z.string().min(1, { message: 'number_id es requerido' }).max(20, { message: 'number_id muy largo' }),
  name: z.string().min(1, { message: 'name es requerido' }).max(100),
  second_name: z.string().optional().nullable(),
  last_name: z.string().min(1, { message: 'last_name es requerido' }).max(100),
  second_last: z.string().optional().nullable(),
  email: z.email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Password debe tener mínimo 6 caracteres' }),
  cellphone: z.string().optional().nullable(),
  locate_district: z.string().optional().nullable(),
  type_user: z.string().optional().nullable(),
  gender: z.enum(['M', 'F', 'O'], { message: 'gender debe ser M, F u O' }).optional().nullable(),
  programa: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
}).strict();

export const loginSchema = z.object({
  email: z.email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'Password es requerido' }),
}).strict();

export const podiumLoginSchema = z.object({
  userId: z.string().min(1, { message: 'userId es requerido' }),
  podiumToken: z.string().min(1, { message: 'podiumToken es requerido' }),
}).strict();

export const refreshTokenSchema = z.object({
  // Token viene en header, no en body
}).strict();

export const logoutSchema = z.object({
  // No requiere campos adicionales
}).strict();

export const logoutAllSchema = z.object({
  // No requiere campos adicionales
}).strict();

// Type inference
export type RegisterPayload = z.infer<typeof registerSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
export type PodiumLoginPayload = z.infer<typeof podiumLoginSchema>;
export type RefreshTokenPayload = z.infer<typeof refreshTokenSchema>;
export type LogoutPayload = z.infer<typeof logoutSchema>;
export type LogoutAllPayload = z.infer<typeof logoutAllSchema>;
