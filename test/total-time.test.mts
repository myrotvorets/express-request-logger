import { before, beforeEach, describe, it } from 'node:test';
import { equal, match } from 'node:assert/strict';
import type { RequestListener } from 'node:http';
import { hrtime } from 'node:process';
import request from 'supertest';
import type { Response } from 'express';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

function within<T>(value: T, min: T, max: T): boolean {
    return value >= min && value <= max;
}

await describe(':total-time', async () => {
    before(beforeSuite);

    beforeEach(beforeTest);

    await it('should log the total time', async () => {
        app.use(requestLogger({ format: ':total-time', stream }), genericHandler);

        await request(app as RequestListener)
            .get('/')
            .expect(() => {
                const line = stream.toString().trimEnd();
                const tokens = line.split(' ');
                equal(tokens.length, 1);
                match(tokens[0]!, /^\d+\.\d{3}$/u);
            });
    });

    await it('request time should look plausible', async () => {
        const timeout = 30;
        app.use(
            requestLogger({
                format: ':total-time',
                stream,
            }),
            (_req, _res, next) => {
                setTimeout(next, timeout);
            },
            genericHandler,
        );

        const now = hrtime.bigint();
        await request(app as RequestListener)
            .get('/')
            .expect(() => {
                const duration = +Number((hrtime.bigint() - now) / BigInt(1e6)).toFixed(3);
                const log = +stream.toString().trimEnd();
                equal(within(log, timeout, duration), true);
            });
    });

    await it('should handle the case when start time is not available', async () => {
        app.use(
            requestLogger({
                format: ':total-time',
                stream,
            }),
            (_req, res, next) => {
                delete (res as Response).locals['_hrl_start_time'];
                next();
            },
            genericHandler,
        );

        await request(app as RequestListener)
            .get('/')
            .expect(() => equal(stream.toString().trimEnd(), '-'));
    });

    await it('should handle the case when start time is borked', async () => {
        app.use(
            requestLogger({
                format: ':total-time',
                stream,
            }),
            (_req, res, next) => {
                (res as Response).locals['_hrl_start_time'] = 'borked';
                next();
            },
            genericHandler,
        );

        await request(app as RequestListener)
            .get('/')
            .expect(() => equal(stream.toString().trimEnd(), '-'));
    });
});
