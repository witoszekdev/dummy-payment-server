import { serve } from 'wren/mod.ts';
import { GET, POST } from 'wren/route.ts';
import * as Response from 'wren/response.ts';
import { AppManifest } from './types.ts';
import { cancelSub, chargeSub, refundSub } from './subscriptions.ts';

interface ActionRequestResponse {
  pspReference: string;
  event?: {
    type: string;
    amount?: string;
    time?: Date;
    message?: string;
    externalUrl?: string;
  }
}

function getResponse(type: string, amount: string): ActionRequestResponse {
  // Uncomment for reporting without status update
  // return {
  //   pspReference: `${type}-1234`,
  // }
  return {
      pspReference: `${type}-1234`,
      event: {
        type,
        amount,
        message: "Example created by dummy server"
      }
  }
}

function getUrl(req: Request) {
  const domain = req.headers.get("host");
  if (domain) {
    return `https://${domain}`;
  }
  return "http://localhost:5544"
}

const routes = [
	GET('/', () => Response.OK('Hello, Root')),
  GET("/manifest", (req) => {
    const URL = getUrl(req);
    return Response.OK({
      id: "witoszekdev.dummy-payment-app",
      name: "Dummy Payment App",
      appUrl: URL,
      version: "1.0.0",
      permissions: ["HANDLE_PAYMENTS", "HANDLE_CHECKOUTS", "MANAGE_ORDERS"],
      tokenTargetUrl: `${URL}/install`,
      webhooks: [
        {
          name: "Charge Request",
          targetUrl: `${URL}/transaction-charge-requested`,
          isActive: true,
          query: chargeSub,
          syncEvents: ["TRANSACTION_CHARGE_REQUESTED"]
        },
        {
          name: "Refund Request",
          targetUrl: `${URL}/transaction-refund-requested`,
          isActive: true,
          query: refundSub,
          syncEvents: ["TRANSACTION_REFUND_REQUESTED"]
        },
        {
          name: "Cancel Request",
          targetUrl: `${URL}/transaction-cancelation-requested`,
          isActive: true,
          query: cancelSub,
          syncEvents: ["TRANSACTION_CANCELATION_REQUESTED"]
        },
        // {
        //   name: "Action request async",
        //   targetUrl: `${URL}/transaction-action-request`,
        //   isActive: true,
        //   asyncEvents: ["TRANSACTION_ACTION_REQUEST"]
        // }
      ],
    } satisfies AppManifest)
  }),
  POST("/install", async (req) => {
    console.log("install");
    const json = await req.json();
    console.log("install", json);
    return Response.OK({
      success: true
    })
  }),
  POST("/transaction-charge-requested", async (req) => {
    const json = await req.json()
    console.log("charge request", json);
    const amount = json.action.amount;
    return Response.OK(getResponse("CHARGE_SUCCESS", amount)) ;
  }),
  POST("/transaction-refund-requested", async (req) => {
    const json = await req.json()
    console.log("refund request", json);
    const amount = json.action.amount;
    return Response.OK(getResponse("REFUND_SUCCESS", amount)) ;
  }),
  POST("/transaction-cancelation-requested", async (req) => {
    const json = await req.json()
    console.log("cancel request", json);
    const amount = json.action.amount
    return Response.OK(getResponse("CANCEL_SUCCESS", amount)) ;
  }),
  POST("/transaction-action-request", async (req) => {
    const json = await req.json();
    console.log("received old async event", json)
    return Response.OK("Accepted");
  })
];

serve(routes);
