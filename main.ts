/// <reference lib="deno.unstable" />

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
import {
  SALEOR_DOMAIN_HEADER,
  SALEOR_API_URL_HEADER,
} from "npm:@saleor/app-sdk@0.43.0/const";
import { DenoAPL } from "./deno-apl.ts";
import { astToString, fetchRemoteJwks, getAppId } from "./utils.ts";
import { AuthData } from "npm:@saleor/app-sdk@0.43.0/APL";
import "./logger.ts";
import * as log from "log/mod.ts";

const apl = new DenoAPL();

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
    log.debug("Requesting manifest", req.headers.get("HOST"));
    const URL = getUrl(req);
    log.debug("Determined app URL", URL);

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
          query: astToString(gatewayInitialize),
          syncEvents: ["PAYMENT_GATEWAY_INITIALIZE_SESSION"],
        },
        {
          name: "Transaction Initialize",
          targetUrl: `${URL}/transaction-initialize`,
          query: astToString(transactionInitialize),
          syncEvents: ["TRANSACTION_INITIALIZE_SESSION"],
        },
        {
          name: "Transaction Process",
          targetUrl: `${URL}/transaction-process`,
          query: astToString(transactionProcess),
          syncEvents: ["TRANSACTION_PROCESS_SESSION"],
        },
        {
          name: "Charge Request",
          targetUrl: `${URL}/transaction-charge-requested`,
          query: astToString(chargeSub),
          syncEvents: ["TRANSACTION_CHARGE_REQUESTED"],
        },
        {
          name: "Refund Request",
          targetUrl: `${URL}/transaction-refund-requested`,
          query: astToString(refundSub),
          syncEvents: ["TRANSACTION_REFUND_REQUESTED"],
        },
        {
          name: "Cancel Request",
          targetUrl: `${URL}/transaction-cancelation-requested`,
          query: astToString(cancelSub),
          syncEvents: ["TRANSACTION_CANCELATION_REQUESTED"],
        },
      ],
    } satisfies AppManifest);
  }),
  POST("/install", async (req) => {
    const json = await req.json();
    const authToken = json.auth_token;
    const saleorDomain = req.headers.get(SALEOR_DOMAIN_HEADER);
    const saleorApiUrl = req.headers.get(SALEOR_API_URL_HEADER);
    log.info("Running installation", { saleorDomain, saleorApiUrl });
    log.debug("Installation token", { authToken });

    if (!authToken || !saleorDomain || !saleorApiUrl) {
      log.warning("Missing headers");
      return Response.BadRequest({
        code: "MISSING_HEADER",
        message: "One of requried headers is missing",
      });
    }

    const appId = await getAppId({ saleorApiUrl, token: authToken });
    log.debug("Got appId", appId);

    if (!appId) {
      log.error("Missing app id", { saleorDomain, saleorApiUrl });
      return Response.BadRequest({
        code: "UNKNOWN_APP_ID",
        message: `The auth data given during registration request could not be used to fetch app ID. 
          This usually means that App could not connect to Saleor during installation. Saleor URL that App tried to connect: ${saleorApiUrl}`,
      });
    }

    const jwks = await fetchRemoteJwks(saleorApiUrl);
    log.debug("Got jwks", jwks);
    if (!jwks) {
      log.error("Missing jwks", { saleorDomain, saleorApiUrl });
      return Response.BadRequest({
        code: "JWKS_NOT_AVAILABLE",
        message: "Can't fetch the remote JWKS.",
      });
    }

    const authData: AuthData = {
      domain: saleorDomain,
      token: authToken,
      saleorApiUrl,
      appId,
      jwks,
    };

    try {
      apl.set(authData);
      log.debug("Auth data saved");
    } catch (error) {
      log.critical("Cannot save auth data", error);
      return Response.InternalServerError({
        code: "APL_SAVE_ERROR",
        message: "Cannot save APL",
      });
    }

    return Response.OK({
      success: true,
    });
  }),
  POST("/gateway-initialize", async (req: Request) => {
    const json = await req.json();
    console.log("/gateway-initialize - json", json);
    console.log("/gateway-initialize - headers", req.headers);
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
      result: json?.data?.final
        ? `${action}_SUCCESS`
        : `${action}_ACTION_REQUIRED`,
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
