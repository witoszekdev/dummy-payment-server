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
} from "saleor-app-sdk/const";
import { DenoAPL } from "./deno-apl.ts";
import { astToString, fetchRemoteJwks, getAppId } from "./utils.ts";
import { AuthData } from "saleor-app-sdk/APL";
import "./logger.ts";
import * as log from "log/mod.ts";

const apl = new DenoAPL();

interface TransactionRequestResponse {
  pspReference: string;
  result: string;
  amount: string;
}

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

async function getTransactionResponse(
  req: Request,
  logger: log.Logger
): Promise<Response> {
  const json = await req.json();
  const amount = json.action.amount;
  const action = json.action.actionType ?? "CHARGE";
  const saleorApiUrl = req.headers.get(SALEOR_API_URL_HEADER);
  const data = json?.data;

  logger.info("Request", {
    amount,
    action,
    saleorApiUrl,
    data,
  });

  logger.debug("Request details", {
    headers: req.headers,
    body: req.body,
  });

  if (!amount || !action || !saleorApiUrl) {
    logger.error("Missing parameter");
    return Response.BadRequest({
      message: "Missing params",
    });
  }

  return Response.OK({
    pspReference: "initialize-test",
    result: `${action}_SUCCESS`,
    amount,
    ...data,
  } satisfies TransactionRequestResponse);
}

async function getActionResponse(
  req: Request,
  logger: log.Logger
): Promise<Response> {
  const json = await req.json();
  const amount = json.action.amount;
  const action = json.action.actionType;
  const saleorApiUrl = req.headers.get(SALEOR_API_URL_HEADER);
  const data = json.data;

  logger.info("Transaction action request", {
    amount,
    action,
    saleorApiUrl,
    data,
  });

  logger.debug("Request details", {
    headers: req.headers,
    body: req.body,
  });

  if (!action) {
    logger.error("Missing action in request");
    return Response.BadRequest({
      event: {
        message: "Missing action",
      },
    });
  }

  if (!amount || !saleorApiUrl) {
    logger.error("Missing amount or saleorApiUrl");
    return Response.BadRequest({
      pspReference: `${action}-1234`,
      event: {
        type: `${action}_FAILURE`,
        message: "Missing params",
      },
    });
  }

  return Response.OK({
    pspReference: `${action}-1234`,
    ...data,
    event: {
      type: `${action}_SUCCESS`,
      amount,
      message: "Example created by dummy server",
      ...data?.event,
    },
  } satisfies ActionRequestResponse);
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
    const logger = log.getLogger("gateway-initialize");
    const json = await req.json();

    logger.info("Request", json);
    logger.debug("Request details", { body: req.body, headers: req.headers });

    if (json?.data) {
      return json.data;
    }

    return Response.OK({
      data: {
        some: "data",
      },
    });
  }),
  POST("/transaction-initialize", async (req: Request) => {
    const logger = log.getLogger("transaction-initialize");

    return await getTransactionResponse(req, logger);
  }),
  POST("/transaction-process", async (req: Request) => {
    const logger = log.getLogger("transaction-process");

    return await getTransactionResponse(req, logger);
  }),
  POST("/transaction-charge-requested", async (req: Request) => {
    const logger = log.getLogger("transaction-charge-requested");

    return await getActionResponse(req, logger);
  }),
  POST("/transaction-refund-requested", async (req) => {
    const logger = log.getLogger("transaction-refund-requested");

    return await getActionResponse(req, logger);
  }),
  POST("/transaction-cancelation-requested", async (req) => {
    const logger = log.getLogger("transaction-cancelation-requested");

    return await getActionResponse(req, logger);
  }),
  POST("/transaction-action-request", async (req) => {
    const logger = log.getLogger("transaction-action-request");

    const json = await req.json();
    logger.info("Request", json);
    logger.debug("Request details", { body: req.body, headers: req.headers });

    return Response.OK("Accepted");
  }),
];

serve(routes);
