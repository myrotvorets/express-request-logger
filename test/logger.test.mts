import { afterEach, before, beforeEach, describe, it } from 'node:test';
import { equal } from 'node:assert/strict';
import type { RequestListener } from 'node:http';
import request from 'supertest';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';
import { mockDate, unmockDate } from './helpers/dateproxy.mjs';

await describe('RequestLogger', async () => {
    before(beforeSuite);

    beforeEach(beforeTest);

    await it('should pass a basic test', async () => {
        app.set('trust proxy', true);
        app.use(
            requestLogger({
                format: 'LOGGER says: :remote-addr :status :method :url :no-handler :no-handler[too] :user-agent',
                stream,
            }),
            genericHandler,
        );

        const expectedIP = '192.168.1.1';
        const expectedURL = '/';
        const expectedUA = 'WeirdBot/1.2.4';

        await request(app as RequestListener)
            .get(expectedURL)
            .set('X-Forwarded-For', expectedIP)
            .set('User-Agent', expectedUA)
            .expect(() =>
                equal(
                    stream.toString().trimEnd(),
                    `LOGGER says: ${expectedIP} 200 GET ${expectedURL} :no-handler :no-handler[too] ${expectedUA}`,
                ),
            );
    });

    await describe('Log Format', async () => {
        beforeEach(mockDate);

        afterEach(unmockDate);

        await it('should use default web format', async () => {
            app.set('trust proxy', true);
            app.use(requestLogger({ stream }), genericHandler);

            const expectedIP = '192.168.1.1';
            const expectedURL = '/';
            const expectedUA = 'WeirdBot/1.2.4';
            await request(app as RequestListener)
                .get(expectedURL)
                .set('X-Forwarded-For', expectedIP)
                .set('User-Agent', expectedUA)
                .expect(() =>
                    equal(
                        stream.toString().trimEnd(),
                        `${expectedIP} - - [30/Dec/2020:00:00:00 +0000] "GET ${expectedURL} HTTP/1.1" 200 17 "-" "${expectedUA}"`,
                    ),
                );
        });
    });

    await describe('beforeLogHook', async () => {
        await it('should be able to modify the log line', async () => {
            app.use(
                requestLogger({
                    format: ':status',
                    stream,
                    beforeLogHook: (_err, _req, _res, line) => `LOGGER says: ${line}`,
                }),
                genericHandler,
            );

            await request(app as RequestListener)
                .get('/')
                .expect(() => equal(stream.toString().trimEnd(), 'LOGGER says: 200'));
        });

        await it('should be able to instruct to skip logging', async () => {
            app.use(
                requestLogger({
                    format: ':status',
                    stream,
                    beforeLogHook: () => '',
                }),
                genericHandler,
            );

            await request(app as RequestListener)
                .get('/')
                .expect(() => equal(stream.toString(), ''));
        });
    });
});
