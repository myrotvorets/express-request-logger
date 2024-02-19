import { expect } from 'chai';
import request from 'supertest';
import { app, beforeSuite, beforeTest, genericHandler, stream } from './helpers/setup.mjs';
import { requestLogger } from '../src/index.mjs';

describe('Operation Mode', function () {
    before(beforeSuite);

    beforeEach(beforeTest);

    it('should work in immediate mode', function () {
        app.use(
            requestLogger({
                format: ':status :method :url :res[content-type]',
                mode: 'immediate',
                stream,
            }),
            genericHandler,
        );

        const expectedURL = '/';
        return request(app)
            .get(expectedURL)
            .expect(() => expect(stream.toString().trimEnd()).to.equal(`- GET ${expectedURL} -`));
    });

    it('should work in audit mode', function () {
        app.use(
            requestLogger({
                format: ':status :method :url :res[content-type]',
                mode: 'audit',
                stream,
            }),
            genericHandler,
        );

        const expectedURL = '/';
        return request(app)
            .get(expectedURL)
            .expect(() =>
                expect(stream.toString().trimEnd()).to.equal(
                    `- GET ${expectedURL} -\n200 GET ${expectedURL} application/json; charset=utf-8`,
                ),
            );
    });
});
