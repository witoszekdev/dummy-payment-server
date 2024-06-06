import * as log from "log/mod.ts";
import * as Response from "wren/response.ts";

const KV_KEY = "paymentMethods";

type PaymentMethodObj = {
  [key: string]: unknown;
};

export const listStoredPaymentMethodsHandler = async (
  req: Request,
  log: log.Logger,
) => {
  const json = await req.json();
  console.log(json);
  // const userId = json.userId;

  // const paymentMethods = getStoredPaymentMethods({})

  return Response.OK({ paymentMethods: [] });
};

export const deleteStoredPaymentMethodHandler = async (
  req: Request,
  log: log.Logger,
) => {
  return Response.OK({
    result: "SUCCESSFULLY_DELETED",
  });
};

export const initializeTokenizationHandler = async (
  req: Request,
  log: log.Logger,
) => {
  const json = await req.json();
  // const result = json.data.result

  return Response.OK({
    result: "SUCCESSFULLY_TOKENIZED",
    id: "1",
    data: { ok: true },
  });
};

export const processTokenizationHandler = async (
  req: Request,
  log: log.Logger,
) => {
  const json = await req.json();

  return Response.OK({
    result: "SUCCESSFULLY_TOKENIZED",
    id: "1",
    data: { ok: true },
  });
};

export const initializeTokenizationSessionHandler = async (
  req: Request,
  log: log.Logger,
) => {
  return Response.OK({
    result: "SUCCESSFULLY_INITIALIZED",
    data: {
      ok: true,
    },
  });
};

const getStoredPaymentMethods = async ({
  userId,
  channelId,
}: {
  userId: string;
  channelId: string;
}) => {
  const kv = await Deno.openKv();
  if (!userId || !channelId) {
    throw new Error("Missing userId or chanelId");
  }
  return kv.get<Array<PaymentMethodObj>>([KV_KEY, userId, channelId]);
};

const addStoredPaymentMethod = async ({
  userId,
  channelId,
  data,
  paymentMethodId = crypto.randomUUID(),
}: {
  userId: string;
  channelId: string;
  data: unknown;
  paymentMethodId?: string;
}) => {
  const kv = await Deno.openKv();
  if (!userId || !channelId || !data) {
    throw new Error("Missing userId, channelId or data");
  }

  const userMethodsKv = await getStoredPaymentMethods({ userId, channelId });

  const kvResult = await kv
    .atomic()
    .check(userMethodsKv)
    .set([KV_KEY, userId, channelId, paymentMethodId], data)
    .commit();

  return { paymentMethodId, kvResult };
};

const deleteStoredPaymentMethod = async ({
  userId,
  channelId,
  paymentMethodId,
}: {
  userId: string;
  channelId: string;
  paymentMethodId: string;
}) => {
  const kv = await Deno.openKv();

  const userMethodsKv = await getStoredPaymentMethods({ userId, channelId });

  if ((userMethodsKv.value || []).length === 0) {
    return kv
      .atomic()
      .check(userMethodsKv)
      .delete([KV_KEY, userId, channelId])
      .commit();
  }

  return kv
    .atomic()
    .check(userMethodsKv)
    .delete([KV_KEY, userId, channelId, paymentMethodId])
    .commit();
};
