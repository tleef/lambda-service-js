import response, { data, error, statusCodes } from "@tleef/lambda-response-js";
import type from "@tleef/type-js";

import parsers from "./parsers";
import Service from "./Service";
import ServiceError from "./ServiceError";

type BodyParserFn = (body: any) => any;

interface IValidationRes {
  value: any;
  error: Error;
}

interface IValidatable {
  validate: (body: any) => IValidationRes;
}

interface IOpts {
  bodyParser?: string | BodyParserFn;
  bodyRequired?: boolean;
  bodySchema?: IValidatable;
  resSchema?: IValidatable;
}

interface IDescriptor {
  value: any;
  enumerable?: boolean;
  configurable?: boolean;
  writable?: boolean;
}

export default (opts: IOpts = {}) => {
  return (target: any, name: string, descriptor: IDescriptor) => {
    const original = descriptor.value;
    if (type.isFunction(original)) {
      descriptor.value = async function(this: Service, ctx: any, event: any) {
        let body = event && event.body;
        const headers = event && event.headers;

        if (opts.bodyParser === "json") {
          opts.bodyParser = parsers.json;
        }

        if (type.isFunction(opts.bodyParser)) {
          try {
            body = (opts.bodyParser as BodyParserFn)(body);
          } catch (e) {
            this.log("error while parsing body", {
              endpoint: name,
              error: e.message,
              request_id: ctx.id,
            });

            return response(ctx, statusCodes.BadRequest, error("Unable to parse body"));
          }
        }

        if (opts.bodyRequired && !body) {
          return response(ctx, statusCodes.BadRequest, error("body is required"));
        }

        if (opts.bodySchema) {
          const r = opts.bodySchema.validate(body);

          if (r.error) {
            return response(ctx, statusCodes.BadRequest, error("body is invalid"));
          }

          body = r.value;
        }

        let res;

        try {
          res = await original.call(this, ctx, body, headers);
        } catch (e) {
          let statusCode = statusCodes.InternalServerError;
          let message = "Internal Server Error";

          if (e instanceof ServiceError) {
            statusCode = e.statusCode || statusCodes.InternalServerError;
            message = e.message || "Internal Server Error";
          }

          if (statusCode === statusCodes.InternalServerError) {
            message = "Internal Server Error";

            this.log("error while calling endpoint", {
              endpoint: name,
              error: e.message,
              request_id: ctx.id,
            });
          }

          return response(ctx, statusCode, error(message));
        }

        if (opts.resSchema) {
          const r = opts.resSchema.validate(res);

          if (r.error) {
            this.log("res is invalid", {
              endpoint: name,
              request_id: ctx.id,
            });

            return response(ctx, statusCodes.InternalServerError, error("Internal Server Error"));
          }

          res = r.value;
        }

        return response(ctx, statusCodes.OK, data(res));
      };
    }
    return descriptor;
  };
};
