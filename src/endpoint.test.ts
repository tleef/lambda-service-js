import Context from "@tleef/context-js";
import { statusCodes } from "@tleef/lambda-response-js";
import * as chai from "chai";
import * as joi from "joi";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import endpoint from "./endpoint";
import {ServiceError} from "./Service";

const expect = chai.expect;

chai.use(sinonChai);

describe("endpoint", () => {
  it("be callable without arguments", () => {
    expect(() => endpoint()).to.not.throw();
  });

  it("should return a decorator function", () => {
    const decorator = endpoint();

    expect(decorator).to.be.a("function");
    expect(decorator.length).to.equal(3);
  });

  it("should parse json", () => {
    const original = sinon.spy();
    const o = {one: 1};
    const opts = {
      bodyParser: "json",
    };
    const ctx = new Context();
    const event = {
      body: JSON.stringify(o),
      headers: "headers",
    };

    const decorator = endpoint(opts);
    const descriptor = decorator("target", "name", {value: original});

    descriptor.value(ctx, event);

    expect(original).to.be.have.been.calledWithExactly(ctx, o, "headers");
  });

  it("should log and return 400 if unable to parse body", async () => {
    const original = sinon.spy();
    const opts = {
      bodyParser: "json",
    };
    const ctx = new Context();
    const event = {
      body: "oopsc",
    };
    const self = {
      log: sinon.spy(),
    };

    const decorator = endpoint(opts);
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value.call(self, ctx, event);

    expect(original).to.have.callCount(0);
    expect(self.log).to.have.callCount(1);
    expect(self.log).to.have.been.calledWith("error while parsing body");
    expect(res.statusCode).to.equal(statusCodes.BadRequest);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "Unable to parse body",
      },
      request_id: ctx.id,
      status_code: statusCodes.BadRequest,
    });
  });

  it("should return 400 if body is missing when required", async () => {
    const original = sinon.spy();
    const opts = {
      bodyRequired: true,
    };
    const ctx = new Context();

    const decorator = endpoint(opts);
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value(ctx);

    expect(original).to.have.callCount(0);
    expect(res.statusCode).to.equal(statusCodes.BadRequest);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "body is required",
      },
      request_id: ctx.id,
      status_code: statusCodes.BadRequest,
    });
  });

  it("should validate body with schema", () => {
    const original = sinon.spy();
    const opts = {
      bodySchema: joi.object().keys({
        one: joi.number(),
      }),
    };
    const body = {one: 1};
    const ctx = new Context();

    const decorator = endpoint(opts);
    const descriptor = decorator("target", "name", {value: original});

    descriptor.value(ctx, {body, headers: "headers"});

    expect(original).to.have.callCount(1);
    expect(original).to.have.been.calledWithExactly(ctx, body, "headers");
  });

  it("should invalidate body with schema", async () => {
    const original = sinon.spy();
    const opts = {
      bodySchema: joi.object().keys({
        one: joi.number(),
      }),
    };
    const body = {two: 1};
    const ctx = new Context();

    const decorator = endpoint(opts);
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value(ctx, {body});

    expect(original).to.have.callCount(0);
    expect(res.statusCode).to.equal(statusCodes.BadRequest);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "body is invalid",
      },
      request_id: ctx.id,
      status_code: statusCodes.BadRequest,
    });
  });

  it("should validate res with schema", async () => {
    const data = {one: 1};
    const original = sinon.stub().returns(data);
    const opts = {
      resSchema: joi.object().keys({
        one: joi.number(),
      }),
    };
    const ctx = new Context();

    const decorator = endpoint(opts);
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value(ctx);

    expect(original).to.have.callCount(1);
    expect(res.statusCode).to.equal(statusCodes.OK);
    expect(JSON.parse(res.body)).to.deep.equal({
      data,
      request_id: ctx.id,
      status_code: statusCodes.OK,
    });
  });

  it("should log and invalidate res with schema", async () => {
    const data = {two: 1};
    const original = sinon.stub().returns(data);
    const self = {
      log: sinon.spy(),
    };
    const opts = {
      resSchema: joi.object().keys({
        one: joi.number(),
      }),
    };
    const ctx = new Context();

    const decorator = endpoint(opts);
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value.call(self, ctx);

    expect(original).to.have.callCount(1);
    expect(self.log).to.have.callCount(1);
    expect(self.log).to.have.been.calledWith("res is invalid");
    expect(res.statusCode).to.equal(statusCodes.InternalServerError);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "Internal Server Error",
      },
      request_id: ctx.id,
      status_code: statusCodes.InternalServerError,
    });
  });

  it("should handle errors from original", async () => {
    const original = sinon.stub().throws(new ServiceError("original error", statusCodes.BadRequest));
    const ctx = new Context();
    const decorator = endpoint();
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value(ctx);

    expect(res.statusCode).to.equal(statusCodes.BadRequest);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "original error",
      },
      request_id: ctx.id,
      status_code: statusCodes.BadRequest,
    });
  });

  it("should log error from original is an InternalServiceError", async () => {
    const original = sinon.stub().throws(new ServiceError("original error", statusCodes.InternalServerError));
    const self = {
      log: sinon.spy(),
    };
    const ctx = new Context();
    const decorator = endpoint();
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value.call(self, ctx);

    expect(self.log).to.have.callCount(1);
    expect(self.log).to.have.been.calledWith("error while calling endpoint");
    expect(res.statusCode).to.equal(statusCodes.InternalServerError);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "Internal Server Error",
      },
      request_id: ctx.id,
      status_code: statusCodes.InternalServerError,
    });
  });

  it("should log default ServiceError message to InternalServiceError", async () => {
    const original = sinon.stub().throws(new ServiceError());
    const self = {
      log: sinon.spy(),
    };
    const ctx = new Context();
    const decorator = endpoint();
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value.call(self, ctx);

    expect(self.log).to.have.callCount(1);
    expect(self.log).to.have.been.calledWith("error while calling endpoint");
    expect(res.statusCode).to.equal(statusCodes.InternalServerError);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "Internal Server Error",
      },
      request_id: ctx.id,
      status_code: statusCodes.InternalServerError,
    });
  });

  it("should log default ServiceError statusCode to InternalServiceError", async () => {
    const original = sinon.stub().throws(new ServiceError("original error"));
    const self = {
      log: sinon.spy(),
    };
    const ctx = new Context();
    const decorator = endpoint();
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value.call(self, ctx);

    expect(self.log).to.have.callCount(1);
    expect(self.log).to.have.been.calledWith("error while calling endpoint");
    expect(res.statusCode).to.equal(statusCodes.InternalServerError);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "Internal Server Error",
      },
      request_id: ctx.id,
      status_code: statusCodes.InternalServerError,
    });
  });

  it("should log non-ServiceError from original is an InternalServiceError", async () => {
    const original = sinon.stub().throws(new Error("original error"));
    const self = {
      log: sinon.spy(),
    };
    const ctx = new Context();
    const decorator = endpoint();
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value.call(self, ctx);

    expect(self.log).to.have.callCount(1);
    expect(self.log).to.have.been.calledWith("error while calling endpoint");
    expect(res.statusCode).to.equal(statusCodes.InternalServerError);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "Internal Server Error",
      },
      request_id: ctx.id,
      status_code: statusCodes.InternalServerError,
    });
  });

  it("should default error from original to an InternalServiceError", async () => {
    const original = sinon.stub().throws(new Error());
    const self = {
      log: sinon.spy(),
    };
    const ctx = new Context();
    const decorator = endpoint();
    const descriptor = decorator("target", "name", {value: original});

    const res = await descriptor.value.call(self, ctx);

    expect(res.statusCode).to.equal(statusCodes.InternalServerError);
    expect(JSON.parse(res.body)).to.deep.equal({
      error: {
        message: "Internal Server Error",
      },
      request_id: ctx.id,
      status_code: statusCodes.InternalServerError,
    });
  });

  describe("decorator", () => {
    it("should return a descriptor", () => {
      const decorator = endpoint();
      const descriptor = decorator("target", "name", {value: () => {}});
      expect(descriptor).to.be.an("object");
      expect(descriptor.value).to.be.a("function");
    });

    it("should return original descriptor if descriptor.value is not a function", () => {
      const decorator = endpoint();
      const originalDescriptor = {value: "test"};
      const descriptor = decorator("target", "name", originalDescriptor);
      expect(descriptor).to.equal(originalDescriptor);
    });
  });

  describe("descriptor", () => {
    describe("#value", () => {
      it("should not equal original", () => {
        const original = () => {};
        const decorator = endpoint();
        const descriptor = decorator("target", "name", {value: original});

        expect(descriptor.value).to.not.equal(original);
      });

      it("should call original", () => {
        const original = sinon.spy();
        const decorator = endpoint();
        const descriptor = decorator("target", "name", {value: original});

        descriptor.value(new Context());

        expect(original).to.be.have.callCount(1);
      });
    });
  });
});
