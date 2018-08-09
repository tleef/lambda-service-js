import {main} from '@tleef/log-js'

export default class Service {
  constructor (name) {
    this.name = name
    this.logger = main.withMeta({service: this.name})
    this.log = this.logger.log
  }
}
