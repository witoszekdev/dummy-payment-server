import { serve } from "wren/mod.ts";
import { GET, POST } from "wren/route.ts";
import * as Response from "wren/response.ts";
import { AppManifest } from "./types.ts";
import {
  cancelSub,
  chargeSub,
  gatewayInitialize,
  refundSub,
  transactionInitialize,
  transactionProcess,
} from "./subscriptions.ts";

interface ActionRequestResponse {
  pspReference: string;
  event?: {
    type: string;
    amount?: string;
    time?: Date;
    message?: string;
    externalUrl?: string;
  };
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
      message: "Example created by dummy server",
    },
  };
}

function getUrl(req: Request) {
  const domain = req.headers.get("host");
  if (domain) {
    return `https://${domain}`;
  }
  return "http://localhost:5544";
}

const routes = [
  GET("/", () => Response.OK("Hello, Root")),
  GET("/manifest", (req) => {
    const URL = getUrl(req);
    return Response.OK({
      id: "witoszekdev.dummy-payment-app",
      name: "Dummy Payment App",
      appUrl: URL,
      version: "1.0.0",
      permissions: [
        "HANDLE_PAYMENTS",
        "HANDLE_CHECKOUTS",
        "MANAGE_ORDERS",
        "MANAGE_USERS",
      ],
      tokenTargetUrl: `${URL}/install`,
      webhooks: [
        {
          name: "Gateway Initialize",
          targetUrl: `${URL}/gateway-initialize`,
          query: gatewayInitialize,
          syncEvents: ["PAYMENT_GATEWAY_INITIALIZE_SESSION"],
        },
        {
          name: "Transaction Initialize",
          targetUrl: `${URL}/transaction-initialize`,
          query: transactionInitialize,
          syncEvents: ["TRANSACTION_INITIALIZE_SESSION"],
        },
        {
          name: "Transaction Process",
          targetUrl: `${URL}/transaction-process`,
          query: transactionProcess,
          syncEvents: ["TRANSACTION_PROCESS_SESSION"],
        },
        {
          name: "Charge Request",
          targetUrl: `${URL}/transaction-charge-requested`,
          query: chargeSub,
          syncEvents: ["TRANSACTION_CHARGE_REQUESTED"],
        },
        {
          name: "Refund Request",
          targetUrl: `${URL}/transaction-refund-requested`,
          query: refundSub,
          syncEvents: ["TRANSACTION_REFUND_REQUESTED"],
        },
        {
          name: "Cancel Request",
          targetUrl: `${URL}/transaction-cancelation-requested`,
          query: cancelSub,
          syncEvents: ["TRANSACTION_CANCELATION_REQUESTED"],
        },
      ],
    } satisfies AppManifest);
  }),
  POST("/install", async (req) => {
    console.log("install");
    const json = await req.json();
    console.log("install", json);
    return Response.OK({
      success: true,
    });
  }),
  POST("/gateway-initialize", async (req: Request) => {
    const json = await req.json();
    console.log("gateway initialize", json);
    console.log("headers", req.headers);
    return Response.OK({
      data: {
        some: "data",
      },
    });
  }),
  POST("/transaction-initialize", async (req: Request) => {
    const json = await req.json();
    console.log("transaction initialize", json);
    console.log("headers", req.headers);
    const amount = json.action.amount;
    const action = json.action.actionType ?? "CHARGE";
    return Response.OK({
      pspReference: "initialize-test",
      result: json?.data?.final ? `${action}_SUCCESS` : `${action}_REQUEST`,
      amount,
    });
  }),
  POST("/transaction-process", async (req: Request) => {
    const json = await req.json();
    console.log("transaction process", json);
    console.log("headers", req.headers);
    const amount = json.action.amount;
    const action = json.action.actionType ?? "CHARGE";
    return Response.OK({
      pspReference: "initialize-test",
      result: json?.data?.final ? `${action}_SUCCESS` : `${action}_REQUEST`,
      amount,
    });
  }),
  POST("/transaction-charge-requested", async (req: Request) => {
    const json = await req.json();
    console.log("charge request", json);
    console.log("headers", req.headers);
    const amount = json.action.amount;
    return Response.OK(getResponse("CHARGE_SUCCESS", amount));
  }),
  POST("/transaction-refund-requested", async (req) => {
    const json = await req.json();
    console.log("refund request", json);
    const amount = json.action.amount;
    return Response.OK(getResponse("REFUND_SUCCESS", amount));
  }),
  POST("/transaction-cancelation-requested", async (req) => {
    const json = await req.json();
    console.log("cancel request", json);
    const amount = json.action.amount;
    return Response.OK(getResponse("CANCEL_SUCCESS", amount));
  }),
  POST("/transaction-action-request", async (req) => {
    const json = await req.json();
    console.log("received old async event", json);
    return Response.OK("Accepted");
  }),
];

serve(routes);
