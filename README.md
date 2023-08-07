# Dummy Payment Server

Made for testing Saleor's Transaction API

## Installation

### Deno

This project requires deno to be installed. [Follow official installation instructions](https://deno.land/manual@v1.36.0/getting_started/installation) if deno is not installed on your system

### Running app

Start app:

```
deno task start
```

### Tunnel

Create a tunnel, to make your app accessible from Internet. You can use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/tunnel-guide/local/):

```
cloudflared tunnel --url localhost:5544
```

or by using ngrook:

```
ngrok http 5544
```

> _Note_
> Saleor CLI's tunnel doesn't work with Deno

### Install app

After running a tunnel install the app in Saleor.

- In Dashboard: go to Apps > Install external app
- In CLI: `saleor app install`

** The manifest URL is: your tunnel URL + `/manifest`**.

For example, if your tunnel URL is `https://happy-tunnel.com` then the manifest URL will be `https://happy-tunnel.com/manifest`

After installation `auth_token` will be visible in the console. It is also stored inside `.token` file.

## Deployment

Fork this project

Use [Deno Deploy](https://dash.deno.com/projects) to deploy your forked repository.

## Example usage

The app id is `witoszekdev.dummy-payment-app`.

The app has excessive permissions for debug purposes. They can be modified inside `main.ts` file

### `paymentGatewayInitialize`

```graphql
mutation GatewayInitialize($id: ID!) {
  paymentGatewayInitialize(
    id: $id
    paymentGateways: [{ id: "witoszekdev.dummy-payment-app" }]
  ) {
    gatewayConfigs {
      id
      data
      errors {
        field
        message
        code
      }
    }
    errors {
      field
      message
      code
    }
  }
}
```

Variables:

```json
{
  "id": "<checkout_id>"
}
```

### `transactionInitialize`

```graphql
mutation TransactionInitalize(
  $amount: PositiveDecimal
  $checkoutId: ID!
  $data: JSON
) {
  transactionInitialize(
    amount: $amount
    id: $checkoutId
    paymentGateway: { id: "witoszekdev.dummy-payment-app", data: $data }
  ) {
    transaction {
      id
      actions
      message
      pspReference
    }
    data
    errors {
      field
      message
      code
    }
  }
}
```

Variables:

```json
{
  "checkoutId": "<checkout_id>",
  "amount": 100 // your checkout amount
  "data": {
    "final": true
  }
}
```

When you provide `data.final = true`, then the app will return `CHARGE_SUCCESS` response, otherwise it will return `CHARGE_REQUESTED`.

### `transactionProcess`

```graphql
mutation TransactionProcess($transactionId: ID!) {
  transactionProcess(data: {}, id: $transactionId) {
    transaction {
      id
    }
    transactionEvent {
      id
      createdAt
      pspReference
      message
      externalUrl
      amount {
        currency
        amount
      }
      type
    }
    data
    errors {
      field
      message
      code
    }
  }
}
```

Variables:

```json
{
  "transactionId": "<transaction id from transactionInitialzie>"
}
```
