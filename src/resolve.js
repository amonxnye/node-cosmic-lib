'use strict'
/**
 * Contains functions that probe the blockchain or federation servers to collect
 * datas.
 *
 * @exports resolve
 */
const resolve = exports

const Signers = require('./signers')
const status = require('./status')

const helpers = require('ticot-box/misc')

/**
 * Select the network to be used by `StellarSdk` as being `cosmicLink` current
 * network.
 *
 * @param {CL}
 */
resolve.network = function (cosmicLink, network) {
  switch (network) {
    case 'test':
      StellarSdk.Network.useTestNetwork()
      return testServer
    case 'public':
      StellarSdk.Network.usePublicNetwork()
      return publicServer
    default: throw new Error('Invalid network: ' + network)
  }
}

const testServer = new StellarSdk.Server('https://horizon-testnet.stellar.org')
const publicServer = new StellarSdk.Server('https://horizon.stellar.org')

/**
 * Configure for how much time the resolved addresses are kept in cache,
 * in seconds. The default is set to 5 minutes to avoid resolving to an outdated
 * address.
 *
 * @const
 */
resolve.accountCacheExpiration = 5 * 60

/**
 * Contains promise of previously fetched accounts.
 *
 * @private
 * @type {Object}
 */
const accountCache = {}

/**
 * Cache `promise` resolving to `address`'s account for `accountCacheExpiration`
 * seconds.
 *
 * @private
 * @param {string} address
 * @param {Promise} promise
 */
async function cacheAccount (address, promise) {
  accountCache[address] = promise
  await helpers.timeout(resolve.accountCacheExpiration * 1000)
  delete accountCache[address]
}

/**
 * Return a promise that resolve to `address` account object, as defined in
 * JavaScript Stellar SDK API reference. `address` can be either a Stellar public
 * key or a federated address (account*example.org).
 * Returned results are cached and re-usable.
 *
 * In case of error, change `cosmicLink` status accordingly.
 *
 * @param {cosmicLink} cosmicLink
 * @param {string} address
 * @return {Promise} Resolve to `address` account object
 */
resolve.address = function (cosmicLink, address) {
  if (accountCache[address]) return accountCache[address]
  const promise = addressResolver(cosmicLink, address)
  cacheAccount(address, promise)
  return promise
}

/**
 * Helper for the previous resolve.address function.
 * Resolve to an account object for `address` or write error/status in
 * `cosmicLink`.
 *
 * @private
 * @param {cosmicLink} cosmicLink
 * @param {string} address
 */
async function addressResolver (cosmicLink, address) {
  if (address.length !== 56 && !address.match(/.*\*.*\..*/)) {
    status.fail(cosmicLink, 'Invalid address(es)')
    status.error(cosmicLink, 'Invalid address: ' + helpers.shorter(address), 'throw')
  }

  try {
    const account = await StellarSdk.FederationServer.resolve(address)
    const publicKey = account.account_id
    if (!publicKey) throw new Error('Empty account')
    if (!account.memo_type && account.memo !== undefined) delete account.memo
    if (address !== publicKey) account.address = address
    const alias = cosmicLink.aliases[publicKey]
    if (alias) account.alias = alias
    return account
  } catch (error) {
    console.error(error)
    status.fail(cosmicLink, 'Unresolved address(es)')
    status.error(cosmicLink, "Can't resolve: " + helpers.shorter(address), 'throw')
  }
}

/**
 * Return the AccountResponse object for `address` on `network`.
 *
 * @param {CL}
 * @param {string} address A public key or a federated address
 * @param {string} network Either 'test' or 'public'
 * @return {Object} The account response
 */
resolve.account = async function (cosmicLink, address, network) {
  const server = resolve.network(cosmicLink, network || cosmicLink.network)
  const account = await resolve.address(cosmicLink, address)
  const publicKey = account.account_id
  try {
    const accountResponse = await server.loadAccount(publicKey)
    return accountResponse
  } catch (error) {
    console.error(error)
    const short = helpers.shorter(address)
    error.message = `Empty account: ${short}`
    status.error(cosmicLink, `Empty account: ${short}`, 'throw')
  }
}

/**
 * Returns the source AccountResponse object for `cosmicLink`
 *
 * @param {CL}
 * @return {Object} The account response
 */
resolve.getSourceAccount = async function (cosmicLink) {
  const source = await cosmicLink.getSource()
  try {
    const account = await resolve.account(cosmicLink, source, cosmicLink.network)
    return account
  } catch (error) {
    status.fail(cosmicLink, 'Empty source account', 'throw')
  }
}

resolve.signers = require('./signers')

resolve.transaction = async function (cosmicLink, txHash) {
  const caller = cosmicLink.server.transactions()
  return caller.transaction(txHash).call()
}
