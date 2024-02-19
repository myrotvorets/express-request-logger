import { expect } from 'chai';
import request from 'supertest';
import { beforeEach } from 'mocha';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';
import { mockDate, unmockDate } from './helpers/dateproxy.mjs';

describe('RequestLogger', function () {
    before(beforeSuite);

    beforeEach(beforeTest);

    it('should pass a basic test', function () {
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

        return request(app)
            .get(expectedURL)
            .set('X-Forwarded-For', expectedIP)
            .set('User-Agent', expectedUA)
            .expect(() =>
                expect(stream.toString().trimEnd()).to.equal(
                    `LOGGER says: ${expectedIP} 200 GET ${expectedURL} :no-handler :no-handler[too] ${expectedUA}`,
                ),
            );
    });

    describe('Log Format', function () {
        beforeEach(mockDate);

        afterEach(unmockDate);

        it('should use default web format', function () {
            app.set('trust proxy', true);
            app.use(requestLogger({ stream }), genericHandler);

            const expectedIP = '192.168.1.1';
            const expectedURL = '/';
            const expectedUA = 'WeirdBot/1.2.4';
            return request(app)
                .get(expectedURL)
                .set('X-Forwarded-For', expectedIP)
                .set('User-Agent', expectedUA)
                .expect(() =>
                    expect(stream.toString().trimEnd()).to.equal(
                        `${expectedIP} - - [30/Dec/2020:00:00:00 +0000] "GET ${expectedURL} HTTP/1.1" 200 17 "-" "${expectedUA}"`,
                    ),
                );
        });
    });

    describe('beforeLogHook', function () {
        it('should be able to modify the log line', function () {
            app.use(
                requestLogger({
                    format: ':status',
                    stream,
                    beforeLogHook: (_err, _req, _res, line) => `LOGGER says: ${line}`,
                }),
                genericHandler,
            );

            return request(app)
                .get('/')
                .expect(() => expect(stream.toString().trimEnd()).to.equal('LOGGER says: 200'));
        });

        it('should be able to instruct to skip logging', function () {
            app.use(
                requestLogger({
                    format: ':status',
                    stream,
                    beforeLogHook: () => '',
                }),
                genericHandler,
            );

            return request(app)
                .get('/')
                .expect(() => expect(stream.toString()).to.equal(''));
        });
    });
});
