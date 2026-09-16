export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'APP_ERROR',
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
