'use_strict'
/**
 * Contains Stellar transactions specification.
 *
 * @exports specs
 */
const specs = exports

/**
 * Transaction optional fields.
 */
specs.transactionOptionalFields = [
  'network', 'memo', 'source', 'sequence',
  'minTime', 'maxTime', 'fee'
]

/**
 * Operation mandatory fields.
 */
specs.operationMandatoryFields = {
  accountMerge: ['destination'],
  allowTrust: ['assetCode', 'trustor'],
  bumpSequence: ['bumpTo'],
  changeTrust: ['asset'],
  createAccount: ['destination', 'startingBalance'],
  createPassiveOffer: ['selling', 'buying', 'amount', 'price'],
  inflation: [],
  manageData: ['name'],
  manageOffer: ['selling', 'buying', 'amount', 'price'],
  pathPayment: ['sendAsset', 'sendMax', 'destination', 'destAsset', 'destAmount'],
  payment: ['asset', 'destination', 'amount'],
  setOptions: []
}

/**
 * Operation optionnal fields.
 */
specs.operationOptionalFields = {
  accountMerge: ['source'],
  allowTrust: ['authorize', 'source'],
  bumpSequence: ['source'],
  changeTrust: ['limit', 'source'],
  createAccount: ['source'],
  createPassiveOffer: ['source'],
  inflation: ['source'],
  manageData: ['value', 'source'],
  manageOffer: ['offerId', 'source'],
  pathPayment: ['path', 'source'],
  payment: ['source'],
  setOptions: ['inflationDest', 'clearFlags', 'setFlags', 'masterWeight',
    'lowThreshold', 'medThreshold', 'highThreshold', 'signer', 'homeDomain',
    'source']
}

/**
 * Field types.
 */
specs.fieldType = {
  amount: 'amount',
  asset: 'asset',
  assetCode: 'string',
  assetIssuer: 'address',
  authorize: 'boolean',
  bumpTo: 'sequence',
  buying: 'asset',
  clearFlags: 'flags',
  destAsset: 'asset',
  destAmount: 'amount',
  destination: 'address',
  fee: 'amount',
  highThreshold: 'threshold',
  homeDomain: 'string',
  inflationDest: 'address',
  limit: 'amount',
  lowThreshold: 'threshold',
  masterWeight: 'weight',
  maxTime: 'date',
  medThreshold: 'threshold',
  memo: 'memo',
  memoHash: 'hash',
  memoText: 'string',
  minTime: 'date',
  network: 'network',
  offerId: 'string',
  price: 'price',
  name: 'string',
  path: 'assetsArray',
  selling: 'asset',
  sendAsset: 'asset',
  sendMax: 'amount',
  sequence: 'sequence',
  setFlags: 'flags',
  signer: 'signer',
  signerAddress: 'address',
  signerHash: 'hash',
  signerTx: 'hash',
  signerWeight: 'weight',
  source: 'address',
  startingBalance: 'amount',
  trustor: 'address',
  value: 'string'
}

/**
 * Transaction field meaning.
 */
specs.fieldDesc = {
  source: 'Source',
  fee: 'Fees',
  minTime: 'Valid only after',
  maxTime: 'Valid only before',
  memo: 'Memo',

  network: 'Network',
  sequence: 'Sequence'
}

/**
 * An array of each valid type for fields.
 */
specs.types = []
for (let field in specs.fieldType) {
  const type = specs.fieldType[field]
  specs.types.find(entry => entry === type) || specs.types.push(type)
}

/**
 * A neutral account ID meant to be replaced before signing & sending the
 * transaction.
 * @static
 */
specs.neutralAccountId = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

/**
 * The mandatory fields for each SEP-0007 operation.
 */
specs.sep7MandatoryFields = {
  tx: [ 'xdr' ],
  pay: [ 'destination' ]
}

/**
 * The optional fields for each SEP-0007 operation.
 */
specs.sep7OptionalFields = {
  tx: [ 'callback', 'pubkey', 'network_passphrase', 'origin_domain', 'signature' ],
  pay: [ 'amount', 'asset_code', 'asset_issuer', 'memo', 'memo_type', 'callback',
    'network_passphrase', 'origin_domain', 'signature' ]
}

specs.sep7IgnoredFields = [ 'callback', 'pubkey', 'origin_domain', 'signature' ]
