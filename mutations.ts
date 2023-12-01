import { gql } from "graphql_tag/mod.ts";

export const transactionEventReport = gql`
  mutation TransactionEventReport(
    $amount: PositiveDecimal!
    $availableActions: [TransactionActionEnum!]
    $id: ID!
    $message: String
    $pspReference: String!
    $type: TransactionEventTypeEnum!
  ) {
    transactionEventReport(
      amount: $amount
      availableActions: $availableActions
      id: $id
      message: $message
      pspReference: $pspReference
      type: $type
    ) {
      alreadyProcessed
      transactionEvent {
        id
      }
      errors {
        field
        message
        code
      }
    }
  }
`;
