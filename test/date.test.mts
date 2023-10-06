import { expect } from 'chai';
import request from 'supertest';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { mockDate, unmockDate } from './helpers/dateproxy.mjs';
import { requestLogger } from '../src/index.mjs';

describe(':date', function () {
    before(beforeSuite);
    beforeEach(function () {
        beforeTest();
        mockDate();
    });

    afterEach(unmockDate);

    it('should handle web format', function () {
        app.use(requestLogger({ format: ':date[web]', stream }), genericHandler);

        const expected = 'Wed, 30 Dec 2020 00:00:00 GMT';
        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expected));
    });

    it('should handle iso format', function () {
        app.use(requestLogger({ format: ':date[iso]', stream }), genericHandler);

        const expected = '2020-12-30T00:00:00.000Z';
        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expected));
    });

    it('should handle clf format', function () {
        app.use(requestLogger({ format: ':date[clf]', stream }), genericHandler);

        const expected = '30/Dec/2020:00:00:00 +0000';
        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expected));
    });

    it('should handle unknown format', function () {
        app.use(requestLogger({ format: ':date[unknown]', stream }), genericHandler);

        const expected = 'Wed, 30 Dec 2020 00:00:00 GMT';
        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expected));
    });

    it('should handle no format', function () {
        app.use(requestLogger({ format: ':date', stream }), genericHandler);

        const expected = 'Wed, 30 Dec 2020 00:00:00 GMT';
        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expected));
    });
});
