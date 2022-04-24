// @ts-check

/**
 * @typedef {import('./checkCashRegister').CashItemList} CashItemList
 * @typedef {import('./checkCashRegister').CashType} CashType
 * @typedef {import('./checkCashRegister').CashTypeValueMap} CashTypeValueMap
 * @typedef {import('./checkCashRegister').RegisterResult} RegisterResult
 */

/**
 * @type {CashTypeValueMap}
 */
const CASH_TYPE_VALUE_MAP = {
  PENNY: toCents(0.01),
  NICKEL: toCents(0.05),
  DIME: toCents(0.1),
  QUARTER: toCents(0.25),
  ONE: toCents(1),
  FIVE: toCents(5),
  TEN: toCents(10),
  TWENTY: toCents(20),
  'ONE HUNDRED': toCents(100),
}

/**
 *
 * @param {number} priceDollars
 * @param {number} cashDollars
 * @param {CashItemList} drawerDollars
 * @returns {RegisterResult}
 */
function checkCashRegister(priceDollars, cashDollars, drawerDollars) {
  // Convert all amounts to cents to avoid floating point errors
  const price = toCents(priceDollars)
  const cash = toCents(cashDollars)
  const drawer = toCashListCents(drawerDollars)

  const changeValue = cash - price
  const drawerValue = sumDrawerValue(drawer)

  if (changeValue === drawerValue) {
    return { status: 'CLOSED', change: drawerDollars }
  }
  if (drawerValue < changeValue) {
    return { status: 'INSUFFICIENT_FUNDS', change: [] }
  }

  /**
   * @type {CashItemList}
   */
  let pickedCashCents

  try {
    const pickResult = pickCashFromDrawer(changeValue, drawer)
    pickedCashCents = pickResult.pickedCash
  } catch {
    return { status: 'INSUFFICIENT_FUNDS', change: [] }
  }

  return { status: 'OPEN', change: toCashListDollars(pickedCashCents) }
}

/**
 *
 * @param {number} amount
 * @param {CashItemList} drawer
 * @returns {{
 *   pickedCash: CashItemList,
 *   updatedDrawer: CashItemList,
 * }}
 * @throws {Error}
 */
function pickCashFromDrawer(amount, drawer) {
  const sortedDrawer = sortCashInDrawerByType(drawer)
  /**
   * @type {CashItemList}
   */
  const pickedCash = []
  let amountLeft = amount

  // Use for .. in to get the index in order to update the sortedDrawer
  for (let index in sortedDrawer) {
    const [cashType, cashValue] = sortedDrawer[index]

    const { pickedCashValue, cashValueLeft, targetValueLeft } = pickCash({
      cashType,
      cashValue,
      targetValue: amountLeft,
    })

    // If we didn't pick anything, skip it
    if (pickedCashValue <= 0) continue

    pickedCash.push([cashType, pickedCashValue])
    // Otherwise, Update the amount left
    amountLeft = targetValueLeft
    // Update the drawer without mutating the original cashItem array
    sortedDrawer[index] = [cashType, cashValueLeft]

    if (amountLeft <= 0) break
  }

  if (amountLeft > 0) {
    throw new Error('Insufficient Funds')
  }

  return { pickedCash, updatedDrawer: sortedDrawer }
}

/**
 *
 * @param {{
 *   cashType: CashType,
 *   cashValue: number,
 *   targetValue: number,
 * }} params
 * @returns {{
 *   pickedCashValue: number,
 *   cashValueLeft: number,
 *   targetValueLeft: number,
 * }}
 */
function pickCash({ cashType, cashValue, targetValue }) {
  const result = {
    pickedCashValue: 0,
    cashValueLeft: cashValue,
    targetValueLeft: targetValue,
  }

  // If the cash type is not enough to cover the target value, return the result
  if (cashValue <= 0) return result

  const cashTypeValue = CASH_TYPE_VALUE_MAP[cashType]
  // If the cash type value is too big, return the result
  if (cashTypeValue > targetValue) return result

  // If the entire cashValue is enough, just take all of it
  if (cashValue <= targetValue) {
    result.pickedCashValue = cashValue
    result.cashValueLeft = 0
    result.targetValueLeft = targetValue - cashValue

    return result
  }

  // Pick the cash
  const { dividedValue } = intDivided(targetValue, cashTypeValue)

  // Update the result values
  result.pickedCashValue = dividedValue
  result.cashValueLeft = cashValue - dividedValue
  result.targetValueLeft = targetValue - dividedValue

  return result
}

/**
 * @param {CashItemList} drawer
 * @returns {CashItemList}
 */
function sortCashInDrawerByType(drawer) {
  // Prevent mutation to the original drawer
  const clonedDrawer = drawer.slice(0)
  clonedDrawer.sort(([cashTypeA], [cashTypeB]) => {
    const valueA = CASH_TYPE_VALUE_MAP[cashTypeA]
    const valueB = CASH_TYPE_VALUE_MAP[cashTypeB]
    return valueB - valueA
  })

  return clonedDrawer
}

/**
 *
 * @param {number} a
 * @param {number} b
 * @returns {{
 *   resultInt: number,
 *   fraction: number,
 *   dividedValue: number,
 * }}
 */
function intDivided(a, b) {
  const divisionResult = a / b
  const divisionResultStr = String(divisionResult)
  const [resultStr, fractionStr = '0'] = divisionResultStr.split('.')
  const resultInt = Number(resultStr)

  return {
    resultInt,
    fraction: Number(fractionStr),
    dividedValue: resultInt * b,
  }
}

/**
 *
 * @param {CashItemList} drawer
 * @returns {number}
 */
function sumDrawerValue(drawer) {
  return drawer.reduce((acc, [, cashValue]) => acc + cashValue, 0)
}

/**
 *
 * @param {CashItemList} drawerDollars
 * @returns {CashItemList}
 */
function toCashListCents(drawerDollars) {
  return drawerDollars.map(([cashType, valueDollars]) => [
    cashType,
    toCents(valueDollars),
  ])
}

/**
 *
 * @param {CashItemList} drawerCents
 * @returns {CashItemList}
 */
function toCashListDollars(drawerCents) {
  return drawerCents.map(([cashType, valueDollars]) => [
    cashType,
    toDollars(valueDollars),
  ])
}

/**
 *
 * @param {number} dollars
 * @returns {number}
 */
function toCents(dollars) {
  return dollars * 100
}

/**
 *
 * @param {number} cents
 * @returns {number}
 */
function toDollars(cents) {
  return cents / 100
}

module.exports = {
  checkCashRegister,
}
