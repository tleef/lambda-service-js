/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import Context from '@tleef/context-js'
import { statusCodes } from '@tleef/lambda-response-js'
import joi from 'joi'

import endpoint from './endpoint'

const expect = chai.expect

chai.use(sinonChai)

describe('endpoint', () => {
  it('be callable without arguments', () => {
    expect(() => endpoint()).not.to.throw()
  })

  it('should return a decorator function', () => {
    const decorator = endpoint()

    expect(decorator).to.be.a('function')
    expect(decorator.length).to.equal(3)
  })

  it('should parse json', () => {
    const original = sinon.spy()
    const o = {one: 1}
    const opts = {
      bodyParser: 'json'
    }
    const ctx = new Context()
    const event = {
      body: JSON.stringify(o)
    }

    const decorator = endpoint(opts)
    const descriptor = decorator('target', 'name', {value: original})

    descriptor.value(ctx, event)

    expect(original).to.be.have.been.calledWithExactly(ctx, o)
  })

  it('should log and return 400 if unable to parse body', () => {
    const original = sinon.spy()
    const opts = {
      bodyParser: 'json'
    }
    const ctx = new Context()
    const event = {
      body: 'oopsc'
    }
    const self = {
      log: sinon.spy()
    }

    const decorator = endpoint(opts)
    const descriptor = decorator('target', 'name', {value: original})

    const res = descriptor.value.call(self, ctx, event)

    expect(original).to.have.callCount(0)
    expect(self.log).to.have.callCount(1)
    expect(self.log).to.have.been.calledWith('error while parsing body')
    expect(res.statusCode).to.equal(statusCodes.BadRequest)
    expect(JSON.parse(res.body)).to.deep.equal({
      status: statusCodes.BadRequest,
      request_id: ctx.id,
      error: {
        message: 'Unable to parse body'
      }
    })
  })

  it('should return 400 if body is missing when required', () => {
    const original = sinon.spy()
    const opts = {
      bodyRequired: true
    }
    const ctx = new Context()

    const decorator = endpoint(opts)
    const descriptor = decorator('target', 'name', {value: original})

    const res = descriptor.value(ctx)

    expect(original).to.have.callCount(0)
    expect(res.statusCode).to.equal(statusCodes.BadRequest)
    expect(JSON.parse(res.body)).to.deep.equal({
      status: statusCodes.BadRequest,
      request_id: ctx.id,
      error: {
        message: 'body is required'
      }
    })
  })

  it('should validate body with schema', () => {
    const original = sinon.spy()
    const opts = {
      bodySchema: joi.object().keys({
        one: joi.number()
      })
    }
    const body = {one: 1}
    const ctx = new Context()

    const decorator = endpoint(opts)
    const descriptor = decorator('target', 'name', {value: original})

    descriptor.value(ctx, {body})

    expect(original).to.have.callCount(1)
    expect(original).to.have.been.calledWithExactly(ctx, body)
  })

  it('should invalidate body with schema', () => {
    const original = sinon.spy()
    const opts = {
      bodySchema: joi.object().keys({
        one: joi.number()
      })
    }
    const body = {two: 1}
    const ctx = new Context()

    const decorator = endpoint(opts)
    const descriptor = decorator('target', 'name', {value: original})

    const res = descriptor.value(ctx, {body})

    expect(original).to.have.callCount(0)
    expect(res.statusCode).to.equal(statusCodes.BadRequest)
    expect(JSON.parse(res.body)).to.deep.equal({
      status: statusCodes.BadRequest,
      request_id: ctx.id,
      error: {
        message: 'body is invalid'
      }
    })
  })

  it('should validate res with schema', () => {
    const data = {one: 1}
    const original = sinon.stub().returns(data)
    const opts = {
      resSchema: joi.object().keys({
        one: joi.number()
      })
    }
    const ctx = new Context()

    const decorator = endpoint(opts)
    const descriptor = decorator('target', 'name', {value: original})

    const res = descriptor.value(ctx)

    expect(original).to.have.callCount(1)
    expect(res.statusCode).to.equal(statusCodes.OK)
    expect(JSON.parse(res.body)).to.deep.equal({
      status: statusCodes.OK,
      request_id: ctx.id,
      data
    })
  })

  it('should log and invalidate res with schema', () => {
    const data = {two: 1}
    const original = sinon.stub().returns(data)
    const self = {
      log: sinon.spy()
    }
    const opts = {
      resSchema: joi.object().keys({
        one: joi.number()
      })
    }
    const ctx = new Context()

    const decorator = endpoint(opts)
    const descriptor = decorator('target', 'name', {value: original})

    const res = descriptor.value.call(self, ctx)

    expect(original).to.have.callCount(1)
    expect(self.log).to.have.callCount(1)
    expect(self.log).to.have.been.calledWith('res is invalid')
    expect(res.statusCode).to.equal(statusCodes.InternalServerError)
    expect(JSON.parse(res.body)).to.deep.equal({
      status: statusCodes.InternalServerError,
      request_id: ctx.id,
      error: {
        message: 'Internal Server Error'
      }
    })
  })

  describe('decorator', () => {
    it('should return a descriptor', () => {
      const decorator = endpoint()
      const descriptor = decorator('target', 'name', {value: () => {}})
      expect(descriptor).to.be.an('object')
      expect(descriptor.value).to.be.a('function')
    })
  })

  describe('descriptor', () => {
    describe('#value', () => {
      it('should not equal original', () => {
        const original = () => {}

        const decorator = endpoint()
        const descriptor = decorator('target', 'name', {value: original})

        expect(descriptor.value).to.not.equal(original)
      })

      it('should call original', () => {
        const original = sinon.spy()

        const decorator = endpoint()
        const descriptor = decorator('target', 'name', {value: original})

        descriptor.value(new Context())

        expect(original).to.be.have.callCount(1)
      })
    })
  })
})
