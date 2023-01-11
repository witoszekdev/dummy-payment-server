export const chargeSub = `subscription {
  event {
    ... on TransactionChargeRequested {
      issuedAt
      version
      issuingPrincipal {
        ... on User {
          lastName
          firstName
          email
        }
      }
      transaction {
        id
      }
      action {
        actionType
        amount
      }
    }
  }
}
`

export const refundSub = `subscription {
  event {
    ... on TransactionRefundRequested {
      issuedAt
      version
      issuingPrincipal {
        ... on User {
          lastName
          firstName
          email
        }
      }
      transaction {
        id
      }
      action {
        actionType
        amount
      }
    }
  }
}`

export const cancelSub = `subscription {
  event {
    ... on TransactionCancelationRequested {
      issuedAt
      version
      issuingPrincipal {
        ... on User {
          lastName
          firstName
          email
        }
      }
      transaction {
        id
      }
      action {
        actionType
        amount
      }
    }
  }
}`
