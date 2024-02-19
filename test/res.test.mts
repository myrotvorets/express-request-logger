import { expect } from 'chai';
import request from 'supertest';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

describe(':res', function () {
    before(beforeSuite);

    beforeEach(beforeTest);

    it('should handle the case when header is not available', function () {
        app.use(requestLogger({ format: ':res[x-ping]', stream }), genericHandler);

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle the case with no parameters', function () {
        app.use(requestLogger({ format: ':res', stream }), genericHandler);

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle the case when header is available', function () {
        const expected = 'pong';
        app.use(
            requestLogger({ format: ':res[x-ping]', stream }),
            (_req, res, next) => {
                res.set('x-ping', expected);
                next();
            },
            genericHandler,
        );

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expected));
    });

    it('should handle the case when header is available, but empty', function () {
        app.use(
            requestLogger({ format: ':res[x-ping]', stream }),
            (_req, res, next) => {
                res.set('x-ping', '');
                next();
            },
            genericHandler,
        );

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle the case when header is available, but array', function () {
        app.use(
            requestLogger({ format: ':res[x-ping]', stream }),
            (_req, res, next) => {
                res.set('x-ping', ['pong', 'pong']);
                next();
            },
            genericHandler,
        );

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('pong, pong'));
    });
});
