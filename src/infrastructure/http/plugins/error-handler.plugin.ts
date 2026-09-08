import type { FastifyError, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

import { DomainError } from '../../../domain/errors/domain-error.js';

interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export default fp(function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof DomainError) {
      const body: ErrorBody = { error: { code: error.code, message: error.message } };
      reply.status(error.statusCode).send(body);
      return;
    }

    if (error instanceof ZodError) {
      const body: ErrorBody = {
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.issues },
      };
      reply.status(422).send(body);
      return;
    }

    if (error.validation) {
      const body: ErrorBody = {
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.validation },
      };
      reply.status(400).send(body);
      return;
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error({ error }, 'Unhandled error');
    }

    const body: ErrorBody = {
      error: {
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
        message: statusCode >= 500 ? 'An unexpected error occurred' : error.message,
      },
    };
    reply.status(statusCode).send(body);
  });
});
