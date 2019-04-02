import { statusCodes } from "@tleef/lambda-response-js";
import * as chai from "chai";

import {ServiceError} from "./Service";

const expect = chai.expect;

describe("ServiceError", () => {
    it("should be callable without arguments", () => {
        const err = new ServiceError();

        expect(err).to.be.an.instanceof(ServiceError);
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal("Internal Server Error");
        expect(err.statusCode).to.equal(statusCodes.InternalServerError);
    });

    it("should be callable with custom message and statusCode", () => {
        const err = new ServiceError('hello', 123);

        expect(err).to.be.an.instanceof(ServiceError);
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal("hello");
        expect(err.statusCode).to.equal(123);
    });
});
