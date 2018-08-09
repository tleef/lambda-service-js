import response, {data, error} from '@tleef/lambda-response-js'

export default (opts = {}) => {
  return (target, name, descriptor) => {
    const original = descriptor.value
    if (typeof original === 'function') {
      descriptor.value = function (ctx, event) {
        let body

        if (opts.body === 'json') {
          try {
            if (type.isString(event.body)) {
              body = JSON.parse(event.body)
            } else {
              body = event.body
            }
          } catch (e) {
            this.log('error while parsing body', {
              request_id: ctx.id,
              endpoint: name,
              error: e.message
            })

            return response(ctx, 400, error('Unable to parse body'))
          }
        }

        if (opts.body && !body) {
          return response(ctx, 400, error('body is required'))
        }

        let res

        try {
          res = original.call(this, body)
        } catch (e) {
          const status = e.status || 500
          let message = e.message || 'Internal Server Error'

          if (status === 500) {
            message = 'Internal Server Error'

            this.log('error while calling endpoint', {
              request_id: ctx.id,
              endpoint: name,
              error: e.message
            })
          }

          return response(ctx, status, error(message))
        }

        return response(ctx, 200, data(res))
      }
    }
    return descriptor
  }
}