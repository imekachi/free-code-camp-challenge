export type CashType =
  | 'PENNY'
  | 'NICKEL'
  | 'DIME'
  | 'QUARTER'
  | 'ONE'
  | 'FIVE'
  | 'TEN'
  | 'TWENTY'
  | 'ONE HUNDRED'

export type CashItem = [CashType, number]

export type CashItemList = CashItem[]

export type RegisterStatus = 'CLOSED' | 'OPEN' | 'INSUFFICIENT_FUNDS'

export type RegisterResult = {
  status: RegisterStatus
  change: CashItem[]
}

export type CashTypeValueMap = Record<CashType, number>