import { gql } from "graphql_tag/mod.ts";

export const gatewayInitialize = gql`
  subscription {
    event {
      ... on PaymentGatewayInitializeSession {
        issuedAt
        version
        issuingPrincipal {
          ... on App {
            id
            __typename
          }
          ... on User {
            id
            __typename
          }
          ... on Node {
            id
            __typename
          }
        }
        recipient {
          id
          name
        }
        sourceObject {
          ... on Checkout {
            user {
              id
            }
          }
          ... on Order {
            user {
              id
            }
          }
        }
        data
        amount
      }
    }
  }
`;

export const transactionInitialize = gql`
  subscription {
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
        sourceObject {
          ... on Checkout {
            user {
              id
            }
          }
          ... on Order {
            user {
              id
            }
          }
          __typename
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
  }
`;

export const transactionProcess = gql`
  fragment Money on Money {
    currency
    amount
  }

  subscription {
    event {
      ... on TransactionProcessSession {
        issuedAt
        version
        issuingPrincipal {
          ... on User {
            id
            lastName
            firstName
          }
          ... on App {
            id
            name
          }
          __typename
        }
        recipient {
          id
          name
        }
        sourceObject {
          ... on Checkout {
            id
            totalPrice {
              currency
              gross {
                ...Money
              }
            }
          }
          ... on Order {
            id
            total {
              currency
              gross {
                ...Money
              }
            }
          }
          __typename
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
  }
`;

export const chargeSub = gql`
  subscription {
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

export const refundSub = gql`
  subscription {
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
  }
`;

export const cancelSub = gql`
  subscription {
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
  }
`;

export const listStoredPaymentMethodSubscription = gql`
  subscription {
    event {
      ... on ListStoredPaymentMethods {
        user {
          id
        }
        channel {
          id
        }
      }
    }
  }
`;

export const deleteStoredPaymentMethodSubscription = gql`
  subscription {
    event {
      ... on StoredPaymentMethodDeleteRequested {
        user {
          id
        }
        paymentMethodId
        channel {
          id
        }
      }
    }
  }
`;

export const initializeGatewayTokenizationSubscription = gql`
  subscription {
    event {
      ... on PaymentGatewayInitializeTokenizationSession {
        user {
          id
        }
        channel {
          id
        }
        data
      }
    }
  }
`;

export const initializeTokenizationSubscription = gql`
  subscription {
    event {
      ... on PaymentMethodInitializeTokenizationSession {
        paymentFlowToSupport
        user {
          id
        }
        channel {
          id
        }
        data
      }
    }
  }
`;

export const processTokenizationSubscription = gql`
  subscription {
    event {
      ... on PaymentMethodProcessTokenizationSession {
        id
        user {
          id
        }
        channel {
          id
        }
        data
      }
    }
  }
`;
