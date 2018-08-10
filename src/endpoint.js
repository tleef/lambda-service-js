import type from '@tleef/type-js'
import response, { data, error, statusCodes } from '@tleef/lambda-response-js'

import parsers from './parsers'

export default (opts = {}) => {
  return (target, name, descriptor) => {
    const original = descriptor.value
    if (type.isFunction(original)) {
      descriptor.value = function (ctx, event) {
        let body = event && event.body

        if (opts.bodyParser === 'json') {
          opts.bodyParser = parsers.json
        }

        if (type.isFunction(opts.bodyParser)) {
          try {
            body = opts.bodyParser(body)
          } catch (e) {
            this.log('error while parsing body', {
              request_id: ctx.id,
              endpoint: name,
              error: e.message
            })

            return response(ctx, statusCodes.BadRequest, error('Unable to parse body'))
          }
        }

        if (opts.bodyRequired && !body) {
          return response(ctx, statusCodes.BadRequest, error('body is required'))
        }

        if (opts.bodySchema) {
          let r = opts.bodySchema.validate(body)

          if (r.error) {
            return response(ctx, statusCodes.BadRequest, error('body is invalid'))
          }

          body = r.value
        }

        let res

        try {
          res = original.call(this, ctx, body)
        } catch (e) {
          const statusCode = e.statusCode || statusCodes.InternalServerError
          let message = e.message || 'Internal Server Error'

          if (statusCode === statusCodes.InternalServerError) {
            message = 'Internal Server Error'

            this.log('error while calling endpoint', {
              request_id: ctx.id,
              endpoint: name,
              error: e.message
            })
          }

          return response(ctx, statusCode, error(message))
        }

        if (opts.resSchema) {
          let r = opts.resSchema.validate(res)

          if (r.error) {
            this.log('res is invalid', {
              request_id: ctx.id,
              endpoint: name
            })

            return response(ctx, statusCodes.InternalServerError, error('Internal Server Error'))
          }

          res = r.value
        }

        return response(ctx, statusCodes.OK, data(res))
      }
    }
    return descriptor
  }
}
