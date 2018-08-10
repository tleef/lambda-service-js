import { main } from '@tleef/log-js'
import { statusCodes } from '@tleef/lambda-response-js'

export default class Service {
  constructor (name) {
    this.name = name || 'unknown'
    this.logger = main.withMeta({service: this.name})
    this.log = this.logger.log
  }

  error (message, statusCode) {
    throw new ServiceError(message, statusCode)
  }
}

class ServiceError extends Error {
  constructor (message, statusCode) {
    super()

    this.name = 'ServiceError'
    this.message = message || 'Internal Server Error'
    this.statusCode = statusCode || statusCodes.InternalServerError
  }
}

export {
  ServiceError
}
