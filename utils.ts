import { getJwksUrlFromSaleorApiUrl } from "npm:@saleor/app-sdk@0.43.0/urls";

export const fetchRemoteJwks = async (saleorApiUrl: string) => {
  const jwksResponse = await fetch(getJwksUrlFromSaleorApiUrl(saleorApiUrl));
  return jwksResponse.text();
};

type GetIdResponseType = {
  data?: {
    app?: {
      id: string;
    };
  };
};

export interface GetAppIdProperties {
  saleorApiUrl: string;
  token: string;
}

export const getAppId = async ({
  saleorApiUrl,
  token,
}: GetAppIdProperties): Promise<string | undefined> => {
  try {
    const response = await fetch(saleorApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
        {
          app{
            id
          }
        }
        `,
      }),
    });
    if (response.status !== 200) {
      console.error(
        `Could not get the app ID: Saleor API has response code ${response.status}`
      );
      return undefined;
    }
    const body = (await response.json()) as GetIdResponseType;
    const appId = body.data?.app?.id;
    return appId;
  } catch (e) {
    console.error("Could not get the app ID: %O", e);
    return undefined;
  }
};

export const isDenoDeploy: boolean =
  Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
