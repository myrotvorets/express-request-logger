import { before, beforeEach, describe, it } from 'node:test';
import { equal } from 'node:assert/strict';
import request from 'supertest';
import type { WritableBufferStream } from '@myrotvorets/buffer-stream';
import type { Express } from 'express';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

await describe(':res', async () => {
    before(beforeSuite);

    beforeEach(beforeTest);

    const checker = (app: Express, stream: WritableBufferStream, expected: string): Promise<unknown> =>
        request(app)
            .get('/')
            .expect(() => equal(stream.toString().trimEnd(), expected));

    await it('should handle the case when header is not available', () => {
        app.use(requestLogger({ format: ':res[x-ping]', stream }), genericHandler);

        return checker(app, stream, '-') as Promise<void>;
    });

    await it('should handle the case with no parameters', () => {
        app.use(requestLogger({ format: ':res', stream }), genericHandler);

        return checker(app, stream, '-') as Promise<void>;
    });

    await it('should handle the case when header is available', () => {
        const expected = 'pong';
        app.use(
            requestLogger({ format: ':res[x-ping]', stream }),
            (_req, res, next) => {
                res.set('x-ping', expected);
                next();
            },
            genericHandler,
        );

        return checker(app, stream, expected) as Promise<void>;
    });

    await it('should handle the case when header is available, but empty', () => {
        app.use(
            requestLogger({ format: ':res[x-ping]', stream }),
            (_req, res, next) => {
                res.set('x-ping', '');
                next();
            },
            genericHandler,
        );

        return checker(app, stream, '-') as Promise<void>;
    });

    await it('should handle the case when header is available, but array', () => {
        app.use(
            requestLogger({ format: ':res[x-ping]', stream }),
            (_req, res, next) => {
                res.set('x-ping', ['pong', 'pong']);
                next();
            },
            genericHandler,
        );

        return checker(app, stream, 'pong, pong') as Promise<void>;
    });
});
