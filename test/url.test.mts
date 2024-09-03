import { before, beforeEach, describe, it } from 'node:test';
import { equal } from 'node:assert/strict';
import request from 'supertest';
import type { WritableBufferStream } from '@myrotvorets/buffer-stream';
import type { Express } from 'express';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

await describe(':url', async () => {
    before(beforeSuite);

    beforeEach(beforeTest);

    const checker = (app: Express, stream: WritableBufferStream, expectedURL: string): Promise<unknown> =>
        request(app)
            .get(expectedURL)
            .expect(() => equal(stream.toString().trimEnd(), expectedURL));

    await it('should log the url', () => {
        app.use(requestLogger({ format: ':url', stream }), genericHandler);

        const expectedURL = '/';
        return checker(app, stream, expectedURL) as Promise<void>;
    });

    await it('should should prefer originalUrl', () => {
        app.use(
            requestLogger({
                format: ':url',
                stream,
            }),
            (req, _res, next) => {
                req.url = '/foo';
                next();
            },
            genericHandler,
        );

        const expectedURL = '/bar?baz=quux';
        return checker(app, stream, expectedURL) as Promise<void>;
    });

    await it('should should fall back to url', () => {
        app.use(
            requestLogger({
                format: ':url',
                stream,
            }),
            (req, _res, next) => {
                req.originalUrl = '';
                next();
            },
            genericHandler,
        );

        const expectedURL = '/bar?baz=foo';
        return checker(app, stream, expectedURL) as Promise<void>;
    });
});
