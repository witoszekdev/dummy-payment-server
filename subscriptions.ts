export const gatewayInitialize = `subscription {
  event {
    ... on PaymentGatewayInitializeSession {
      issuedAt
      version
      issuingPrincipal {
        ... on Node {
          id
        }
        __typename
      }
      recipient {
        id
        name
      }
      sourceObject {
        __typename
      }
      data
      amount
    }
  }
}`;

export const transactionInitialize = `subscription {
  event {
    ... on TransactionInitializeSession {
      issuedAt
      version
      issuingPrincipal {
        ... on Node {
          id
        }
        __typename
      }
      recipient {
        id
        name
      }
      transaction {
        id
        name
        pspReference
      }
      data
      merchantReference
      action {
        amount
        currency
        actionType
      }
    }
  }
}`

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
`;

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
}`;

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
}`;
