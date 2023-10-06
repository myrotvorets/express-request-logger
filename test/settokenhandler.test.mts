import { expect } from 'chai';
import request from 'supertest';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger, setTokenHandler } from '../src/index.mjs';

describe('setTokenHandler', function () {
    before(beforeSuite);
    beforeEach(beforeTest);

    afterEach(function () {
        setTokenHandler('test', undefined);
    });

    it('should be able to add new handlers', function () {
        const expectedResult = 'test';

        setTokenHandler('test', () => expectedResult);
        app.use(requestLogger({ format: ':test', stream }), genericHandler);

        return request(app)
            .get('/')
            .expect(() => expect(stream.toString().trimEnd()).to.equal(expectedResult));
    });

    it('should be able to delete existing handlers', async function () {
        const origHandler = setTokenHandler('status', undefined);
        try {
            app.use(requestLogger({ format: ':status', stream }), genericHandler);

            await request(app)
                .get('/')
                .expect(() => expect(stream.toString().trimEnd()).to.equal(':status'));
        } finally {
            setTokenHandler('status', origHandler);
        }
    });

    it('should be able to modify existing handlers', async function () {
        const expected = 'STATUS';
        const origHandler = setTokenHandler('status', () => expected);
        try {
            app.use(requestLogger({ format: ':status', stream }), genericHandler);

            await request(app)
                .get('/')
                .expect(() => expect(stream.toString().trimEnd()).to.equal(expected));
        } finally {
            setTokenHandler('status', origHandler);
        }
    });
});
