import { afterEach, before, beforeEach, describe, it } from 'node:test';
import { equal } from 'node:assert/strict';
import type { RequestListener } from 'node:http';
import request from 'supertest';
import type { WritableBufferStream } from '@myrotvorets/buffer-stream';
import type { Express } from 'express';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { mockDate, unmockDate } from './helpers/dateproxy.mjs';
import { requestLogger } from '../src/index.mjs';

await describe(':date', async () => {
    before(beforeSuite);

    beforeEach(() => {
        beforeTest();
        mockDate();
    });

    afterEach(unmockDate);

    const checker = (app: Express, stream: WritableBufferStream, expected: string): Promise<unknown> =>
        request(app as RequestListener)
            .get('/')
            .expect(() => equal(stream.toString().trimEnd(), expected));

    await it('should handle web format', () => {
        app.use(requestLogger({ format: ':date[web]', stream }), genericHandler);

        const expected = 'Wed, 30 Dec 2020 00:00:00 GMT';
        return checker(app, stream, expected) as Promise<void>;
    });

    await it('should handle iso format', () => {
        app.use(requestLogger({ format: ':date[iso]', stream }), genericHandler);

        const expected = '2020-12-30T00:00:00.000Z';
        return checker(app, stream, expected) as Promise<void>;
    });

    await it('should handle clf format', () => {
        app.use(requestLogger({ format: ':date[clf]', stream }), genericHandler);

        const expected = '30/Dec/2020:00:00:00 +0000';
        return checker(app, stream, expected) as Promise<void>;
    });

    await it('should handle unknown format', () => {
        app.use(requestLogger({ format: ':date[unknown]', stream }), genericHandler);

        const expected = 'Wed, 30 Dec 2020 00:00:00 GMT';
        return checker(app, stream, expected) as Promise<void>;
    });

    await it('should handle no format', () => {
        app.use(requestLogger({ format: ':date', stream }), genericHandler);

        const expected = 'Wed, 30 Dec 2020 00:00:00 GMT';
        return checker(app, stream, expected) as Promise<void>;
    });
});
