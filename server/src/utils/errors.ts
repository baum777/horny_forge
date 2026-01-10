import type { ForgeError } from '../types';

export function createError(
  code: ForgeError['code'],
  message: string,
  generationId?: string
): ForgeError {
  return {
    error: message,
    code,
    ...(generationId && { generation_id: generationId }),
  };
}

