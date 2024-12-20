import { before, beforeEach, describe, it } from 'node:test';
import { equal } from 'node:assert/strict';
import type { RequestListener } from 'node:http';
import request from 'supertest';
import type { WritableBufferStream } from '@myrotvorets/buffer-stream';
import type { Express } from 'express';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

await describe(':remote-user', async () => {
    before(beforeSuite);

    beforeEach(beforeTest);

    const checker = (app: Express, stream: WritableBufferStream, expected: string): Promise<unknown> =>
        request(app as RequestListener)
            .get('/')
            .expect(() => equal(stream.toString().trimEnd(), expected));

    await it('should handle the case when authorization header is not available', () => {
        app.use(requestLogger({ format: ':remote-user', stream }), genericHandler);

        return checker(app, stream, '-') as Promise<void>;
    });

    await it('should handle the case when authorization header is malformed', () => {
        app.use(
            requestLogger({ format: ':remote-user', stream }),
            (req, _res, next) => {
                req.headers.authorization = 'Basic 123';
                next();
            },
            genericHandler,
        );

        return checker(app, stream, '-') as Promise<void>;
    });

    await it('should handle a valid basic authorization header', () => {
        app.use(
            requestLogger({ format: ':remote-user', stream }),
            (req, _res, next) => {
                req.headers.authorization = 'Basic dGVzdDp0ZXN0';
                next();
            },
            genericHandler,
        );

        return checker(app, stream, 'test') as Promise<void>;
    });
});
