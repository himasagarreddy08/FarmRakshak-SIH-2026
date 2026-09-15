import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Rakshak Error Handler]', err?.message || err);

  // Never leak raw stack traces to the client
  res.status(200).json({
    success: false,
    reply: 'Rakshak AI is refreshing its connection. Please try asking again.',
    error: 'Handled gracefully without stack trace',
  });
}

export default errorHandler;
