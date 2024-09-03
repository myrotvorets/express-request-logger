import { afterEach, before, beforeEach, describe, it } from 'node:test';
import { equal } from 'node:assert/strict';
import request from 'supertest';
import type { WritableBufferStream } from '@myrotvorets/buffer-stream';
import type { Express } from 'express';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger, setTokenHandler } from '../src/index.mjs';

await describe('setTokenHandler', async () => {
    before(beforeSuite);

    beforeEach(beforeTest);

    afterEach(() => setTokenHandler('test', undefined));

    const checker = (app: Express, stream: WritableBufferStream, expected: string): Promise<unknown> =>
        request(app)
            .get('/')
            .expect(() => equal(stream.toString().trimEnd(), expected));

    await it('should be able to add new handlers', () => {
        const expectedResult = 'test';

        setTokenHandler('test', () => expectedResult);
        app.use(requestLogger({ format: ':test', stream }), genericHandler);

        return checker(app, stream, expectedResult) as Promise<void>;
    });

    await it('should be able to delete existing handlers', async () => {
        const expected = ':status';
        const origHandler = setTokenHandler('status', undefined);
        try {
            app.use(requestLogger({ format: ':status', stream }), genericHandler);

            await checker(app, stream, expected);
        } finally {
            setTokenHandler('status', origHandler);
        }
    });

    await it('should be able to modify existing handlers', async () => {
        const expected = 'STATUS';
        const origHandler = setTokenHandler('status', () => expected);
        try {
            app.use(requestLogger({ format: ':status', stream }), genericHandler);

            await checker(app, stream, expected);
        } finally {
            setTokenHandler('status', origHandler);
        }
    });
});
