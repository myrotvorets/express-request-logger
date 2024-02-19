import { expect } from 'chai';
import request from 'supertest';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

describe(':remote-user', function () {
    before(beforeSuite);

    beforeEach(beforeTest);

    it('should handle the case when authorization header is not available', function () {
        app.use(requestLogger({ format: ':remote-user', stream }), genericHandler);

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle the case when authorization header is malformed', function () {
        app.use(
            requestLogger({ format: ':remote-user', stream }),
            (req, _res, next) => {
                req.headers.authorization = 'Basic 123';
                next();
            },
            genericHandler,
        );

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle a valid basic authorization header', function () {
        app.use(
            requestLogger({ format: ':remote-user', stream }),
            (req, _res, next) => {
                req.headers.authorization = 'Basic dGVzdDp0ZXN0';
                next();
            },
            genericHandler,
        );

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('test'));
    });
});
