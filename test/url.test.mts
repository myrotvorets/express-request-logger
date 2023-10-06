import { expect } from 'chai';
import request from 'supertest';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

describe(':url', function () {
    before(beforeSuite);
    beforeEach(beforeTest);

    it('should log the url', function () {
        app.use(requestLogger({ format: ':url', stream }), genericHandler);

        const expectedURL = '/';
        return request(app)
            .get(expectedURL)
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expectedURL));
    });

    it('should should prefer originalUrl', function () {
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
        return request(app)
            .get(expectedURL)
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expectedURL));
    });

    it('should should fall back to url', function () {
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
        return request(app)
            .get(expectedURL)
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expectedURL));
    });
});
