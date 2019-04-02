import * as chai from "chai";

import Service, { ServiceError } from "./Service";

const expect = chai.expect;

describe("Service", () => {
  describe("constructor()", () => {
    it("should be callable without args", () => {
      // @ts-ignore
      const service = new Service();

      expect(service).to.be.an.instanceof(Service);
      expect(service.name).to.equal("unknown");
    });

    it("should set name", () => {
      const service = new Service("test");

      expect(service.name).to.equal("test");
    });
  });

  describe("log()", () => {
    it("should be callable", () => {
      // @ts-ignore
      const service = new Service();

      expect(() => {
        service.log('hello');
      }).to.not.throw();
    });
  });

  describe("error()", () => {
    it("should throw a ServiceError", () => {
      // @ts-ignore
      const service = new Service();

      expect(() => {
        service.error();
      }).to.throw(ServiceError);
    });
  });
});
