import {
  APL,
  AuthData,
  AplReadyResult,
  AplConfiguredResult,
} from "saleor-app-sdk/APL";

const kv = await Deno.openKv();

const KV_KEY = "authData";

export class DenoAPL implements APL {
  async get(saleorApiUrl: string) {
    const authData = await kv.get<AuthData>([KV_KEY, saleorApiUrl]);
    if (authData.value) {
      return authData.value;
    }
  }

  async set(authData: AuthData) {
    await kv.set([KV_KEY, authData.saleorApiUrl], authData);
  }

  async delete(saleorApiUrl: string) {
    return await kv.delete([KV_KEY, saleorApiUrl]);
  }

  async getAll() {
    const list = kv.list<AuthData>({ prefix: [KV_KEY] });

    const authDataList: AuthData[] = [];

    for await (const res of list) {
      authDataList.push(res.value);
    }

    return authDataList;
  }

  // deno-lint-ignore require-await
  async isReady(): Promise<AplReadyResult> {
    return {
      ready: true,
    };
  }

  // deno-lint-ignore require-await
  async isConfigured(): Promise<AplConfiguredResult> {
    return {
      configured: true,
    };
  }
}
