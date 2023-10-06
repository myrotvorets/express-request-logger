import { expect } from 'chai';
import request from 'supertest';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

describe(':req', function () {
    before(beforeSuite);
    beforeEach(beforeTest);

    it('should handle the case when header is not available', function () {
        app.use(requestLogger({ format: ':req[x-ping]', stream }), genericHandler);

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle the case with no parameters', function () {
        app.use(requestLogger({ format: ':req', stream }), genericHandler);

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle the case when header is available', function () {
        app.use(requestLogger({ format: ':req[x-ping]', stream }), genericHandler);

        const expected = 'pong';
        return request(app)
            .get('/')
            .set('x-ping', expected)
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expected));
    });

    it('should handle the case when header is available, but empty', function () {
        app.use(requestLogger({ format: ':req[x-ping]', stream }), genericHandler);

        return request(app)
            .get('/')
            .set('x-ping', '')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('-'));
    });

    it('should handle the case when header is available, but array', function () {
        app.use(
            requestLogger({ format: ':req[x-ping]', stream }),
            (req, _res, next) => {
                req.headers['x-ping'] = ['pong', 'pong'];
                next();
            },
            genericHandler,
        );

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal('pong, pong'));
    });
});
