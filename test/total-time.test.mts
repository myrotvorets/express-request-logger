import { hrtime } from 'node:process';
import { expect } from 'chai';
import request from 'supertest';
import type { Response } from 'express';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

describe(':total-time', function () {
    before(beforeSuite);

    beforeEach(beforeTest);

    it('should log the total time', function () {
        app.use(requestLogger({ format: ':total-time', stream }), genericHandler);

        return request(app)
            .get('/')
            .expect(() => {
                const line = stream.toString().trimEnd();
                const tokens = line.split(' ');
                expect(tokens).to.have.lengthOf(1);
                expect(tokens[0]).to.match(/^\d+\.\d{3}$/u);
            });
    });

    it('request time should look plausible', function () {
        const timeout = 20;
        app.use(
            requestLogger({
                format: ':total-time',
                stream,
            }),
            (_req, _res, next) => setTimeout(next, timeout),
            genericHandler,
        );

        const now = hrtime.bigint();
        return request(app)
            .get('/')
            .expect(() => {
                const duration = +Number((hrtime.bigint() - now) / BigInt(1e6)).toFixed(3);
                const log = +stream.toString().trimEnd();
                expect(log).to.be.within(timeout - 10, duration);
            });
    });

    it('should handle the case when start time is not available', function () {
        app.use(
            requestLogger({
                format: ':total-time',
                stream,
            }),
            (_req, res, next) => {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete (res as Response).locals['_hrl_start_time'];
                next();
            },
            genericHandler,
        );

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle the case when start time is borked', function () {
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

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });
});
