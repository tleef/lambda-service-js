import type from '@tleef/type-js'

const json = (body) => {
  if (type.isString(body)) {
    return JSON.parse(body)
  }

  return body
}

export default {
  json
}

export {
  json
}
