import { LogFn, Logger, main } from "@tleef/log-js";

import endpoint from "./endpoint";
import parsers from "./parsers";
import ServiceError from "./ServiceError";

export default class Service {
  private readonly _name: string;
  private readonly _logger: Logger;
  private readonly _log: LogFn;

  constructor(name: string) {
    this._name = name || "unknown";
    this._logger = main.withMeta({service: this.name});
    this._log = this._logger.log;
  }

  get name() {
    return this._name;
  }

  get log() {
    return this._log;
  }

  public error(message: string, statusCode: number) {
    throw new ServiceError(message, statusCode);
  }
}

export {
  ServiceError,
  endpoint,
  parsers,
};
