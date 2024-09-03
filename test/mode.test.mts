import { before, beforeEach, describe, it } from 'node:test';
import { equal } from 'node:assert/strict';
import request from 'supertest';
import type { WritableBufferStream } from '@myrotvorets/buffer-stream';
import type { Express } from 'express';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

await describe('Operation Mode', async () => {
    before(beforeSuite);

    beforeEach(beforeTest);

    const checker = (
        app: Express,
        stream: WritableBufferStream,
        expectedURL: string,
        expected: string,
    ): Promise<unknown> =>
        request(app)
            .get(expectedURL)
            .expect(() => equal(stream.toString().trimEnd(), expected));

    await it('should work in immediate mode', () => {
        app.use(
            requestLogger({
                format: ':status :method :url :res[content-type]',
                mode: 'immediate',
                stream,
            }),
            genericHandler,
        );

        const expectedURL = '/';
        const expected = `- GET ${expectedURL} -`;
        return checker(app, stream, expectedURL, expected) as Promise<void>;
    });

    await it('should work in audit mode', () => {
        app.use(
            requestLogger({
                format: ':status :method :url :res[content-type]',
                mode: 'audit',
                stream,
            }),
            genericHandler,
        );

        const expectedURL = '/';
        const expected = `- GET ${expectedURL} -\n200 GET ${expectedURL} application/json; charset=utf-8`;
        return checker(app, stream, expectedURL, expected) as Promise<void>;
    });
});
