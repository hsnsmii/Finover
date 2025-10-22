import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ValidationError } from '../types/errors';
import { changePassword, getCurrentUser, login, logout, refreshTokens, register } from './auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = registerSchema;

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required')
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters')
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword']
  });

export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ValidationError('Invalid registration payload', parsed.error.flatten()));
  }

  try {
    const result = await register(parsed.data.email, parsed.data.password);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ValidationError('Invalid login payload', parsed.error.flatten()));
  }

  try {
    const result = await login(parsed.data.email, parsed.data.password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const refreshHandler = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ValidationError('Refresh token is required', parsed.error.flatten()));
  }

  try {
    const result = await refreshTokens(parsed.data.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ValidationError('Refresh token is required', parsed.error.flatten()));
  }

  try {
    await logout(parsed.data.refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const meHandler = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.sub) {
    return next(new ValidationError('Missing authenticated user'));
  }

  try {
    const user = await getCurrentUser(req.user.sub);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.sub) {
    return next(new ValidationError('Missing authenticated user'));
  }

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ValidationError('Invalid password payload', parsed.error.flatten()));
  }

  try {
    await changePassword(req.user.sub, parsed.data.currentPassword, parsed.data.newPassword);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
