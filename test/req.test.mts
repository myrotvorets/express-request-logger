import { before, beforeEach, describe, it } from 'node:test';
import { equal } from 'node:assert/strict';
import request from 'supertest';
import type { WritableBufferStream } from '@myrotvorets/buffer-stream';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

await describe(':req', async () => {
    before(beforeSuite);

    beforeEach(beforeTest);

    const checker = (stream: WritableBufferStream, expected: string): unknown =>
        equal(stream.toString().trimEnd(), expected);

    await it('should handle the case when header is not available', async () => {
        app.use(requestLogger({ format: ':req[x-ping]', stream }), genericHandler);

        await request(app)
            .get('/')
            .expect(() => checker(stream, '-'));
    });

    await it('should handle the case with no parameters', async () => {
        app.use(requestLogger({ format: ':req', stream }), genericHandler);

        await request(app)
            .get('/')
            .expect(() => checker(stream, '-'));
    });

    await it('should handle the case when header is available', async () => {
        app.use(requestLogger({ format: ':req[x-ping]', stream }), genericHandler);

        const expected = 'pong';
        await request(app)
            .get('/')
            .set('x-ping', expected)
            .expect(() => checker(stream, expected));
    });

    await it('should handle the case when header is available, but empty', async () => {
        app.use(requestLogger({ format: ':req[x-ping]', stream }), genericHandler);

        await request(app)
            .get('/')
            .set('x-ping', '')
            .expect(() => checker(stream, '-'));
    });

    await it('should handle the case when header is available, but array', async () => {
        app.use(
            requestLogger({ format: ':req[x-ping]', stream }),
            (req, _res, next) => {
                req.headers['x-ping'] = ['pong', 'pong'];
                next();
            },
            genericHandler,
        );

        await request(app)
            .get('/')
            .expect(() => checker(stream, 'pong, pong'));
    });
});
