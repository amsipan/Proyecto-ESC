import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function getCorsOptions(
  allowedOrigins = process.env.CORS_ORIGINS ?? '',
): CorsOptions {
  const origins = allowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: origins.length > 0 ? origins : false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  };
}
