/* eslint-env mocha */

import chai from 'chai'
import { statusCodes } from '@tleef/lambda-response-js'

import Service, { ServiceError } from './service'

const expect = chai.expect

describe('service', () => {
  describe('Service', () => {
    describe('constructor()', () => {
      it('should be callable without args', () => {
        const service = new Service()

        expect(service).to.be.an.instanceof(Service)
        expect(service.name).to.equal('unknown')
      })

      it('should set name', () => {
        const service = new Service('test')

        expect(service.name).to.equal('test')
      })
    })

    describe('error()', () => {
      it('should throw a ServiceError', () => {
        const service = new Service()

        expect(() => {
          service.error()
        }).to.throw(ServiceError)
      })
    })
  })

  describe('ServiceError', () => {
    it('should be callable without arguments', () => {
      const err = new ServiceError()

      expect(err).to.be.an.instanceof(ServiceError)
      expect(err).to.be.an.instanceof(Error)
      expect(err.message).to.equal('Internal Server Error')
      expect(err.statusCode).to.equal(statusCodes.InternalServerError)
    })
  })
})
