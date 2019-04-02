import { statusCodes } from "@tleef/lambda-response-js";

export default class ServiceError extends Error {
    private readonly _statusCode: number;

    constructor(message?: string, statusCode?: number) {
        super(message || "Internal Server Error");

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ServiceError.prototype);

        this.name = "ServiceError";
        this._statusCode = statusCode || statusCodes.InternalServerError;
    }

    get statusCode() {
        return this._statusCode;
    }
}
