/* eslint-env mocha */

import chai from 'chai'

import parsers, { json } from './parsers'

const expect = chai.expect

describe('parsers', () => {
  describe('json()', () => {
    it('should return an object when given a json string', () => {
      const o = {one: 1}

      expect(json(JSON.stringify(o))).to.deep.equal(o)
    })

    it('should pass through if body is not string', () => {
      expect(json(123)).to.equal(123)
    })
  })

  describe('#json()', () => {
    it('should equal json()', () => {
      expect(parsers.json).to.equal(json)
    })
  })
})
