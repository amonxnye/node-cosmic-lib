'use strict'
/**
 * Decode fields values from URI to cosmic link JSON format. This format differs
 * from Stellar transaction format: it is simpler, allow for federated address
 * and can be stringified/parsed without loss of information.
 *
 * For each of those functions, any error is recorded in the `conf` object
 * and HTML nodes are updated accordingly.
 *
 * @private
 * @exports decode
 */
const decode = exports

const check = require('./check')
const normalize = require('./normalize')
const specs = require('./specs')
const status = require('./status')

decode.query = function (conf, query = '?') {
  if (query.substr(0, 1) !== '?') status.fail(conf, 'Invalid query', 'throw')

  const operations = []
  const tdesc = {}

  let command = query.substr(1).replace(/&.*/, '')
  const params = query.substr(command.length + 2).split('&')
  if (command && command !== 'transaction') operations.push({ type: command })

  for (let index in params) {
    const param = params[index].split('=', 2)
    const field = param[0]
    if (!field) continue

    if (field === 'operation') {
      operations.push({ type: param[1] })
      command = 'operation'
      continue
    }

    const value = decode.field(conf, field, param[1])

    /// Multi-operation link.
    if (command === 'transaction') {
      tdesc[field] = value
    } else if (command === 'operation') {
      operations[operations.length - 1][field] = value
    /// One-operation link.
    } else {
      if (specs.isTransactionField(field)) {
        tdesc[field] = value
      } else {
        operations[0][field] = value
      }
    }
  }

  tdesc.operations = operations
  normalize.tdesc(conf, tdesc)
  tdesc.operations.forEach(odesc => normalize.odesc(conf, odesc))
  check.tdesc(conf, tdesc)
  return tdesc
}

/******************************************************************************/

/**
 * Decode `value` accordingly to `field` type.
 *
 * @param {string} field
 * @param {string} value
 */
decode.field = function (conf, field, value) {
  const type = specs.fieldType[field]
  return type ? decode.type(conf, type, value) : value
}

/**
 * Decode `value` using the decoding function for `type`.
 *
 * @param {string} type
 * @param {string} value
 */
decode.type = function (conf, type, value) {
  if (value) {
    value = decodeURIComponent(value)
    return process[type] ? process[type](conf, value) : value
  } else {
    return ''
  }
}

/******************************************************************************/

const process = {}

process.asset = function (conf, asset) {
  const assetLower = asset.toLowerCase()
  if (assetLower === 'xlm' || assetLower === 'native') {
    return { code: 'XLM' }
  } else {
    const temp = asset.split(':')
    const object = { code: temp[0], issuer: temp[1] }
    return object
  }
}

process.assetsArray = function (conf, assetsList) {
  const strArray = assetsList.split(',')
  return strArray.map(entry => decode.asset(conf, entry))
}

process.boolean = function (conf, string) {
  switch (string) {
    case 'true': return true
    case 'false': return false
  }
}

process.date = function (conf, string) {
  /// Use UTC timezone by default.
  if (string.match(/T[^+]*[0-9]$/)) string += 'Z'
  return new Date(string).toISOString()
}

process.memo = function (conf, memo) {
  const type = memo.replace(/:.*/, '')
  const value = memo.replace(/^[^:]*:/, '')
  if (type === value) {
    return { type: 'text', value: value }
  } else {
    return { type: type, value: value }
  }
}

process.price = function (conf, price) {
  const numerator = price.replace(/:.*/, '')
  const denominator = price.replace(/^[^:]*:/, '')
  if (numerator === denominator) return price
  else return { n: +numerator, d: +denominator }
}

process.signer = function (conf, signer) {
  const temp = signer.split(':')
  const object = { weight: temp[0], type: temp[1], value: temp[2] }
  return object
}

/******************************************************************************/

/**
 * Provide dummy aliases for every other type for convenience & backward
 * compatibility.
 */
specs.types.forEach(type => {
  exports[type] = (conf, value) => decode.type(conf, type, value)
})
