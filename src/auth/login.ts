import { AxiosRequestConfig } from "axios";
import { authAxios } from "@/utils/authAxios";
import { INFOVEAVE_BASE_URL, INFOVEAVE_TENANT } from "@/config/infoveave";

type TokenResponse = {
  access_token: string;
  expires_in?: number;
};

type LoginArgs = {
  username: string;
  password: string;
  otp?: string;
};

export const urlEncodedParams = <T,>(config: AxiosRequestConfig<T>) => {
  const newConfig = Object.assign({}, config);
  newConfig.transformRequest = [
    function (data: Record<string, string | number>) {
      const str: string[] = [];
      for (const p in data) {
        if (data[p]) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
        }
      }
      return str.join("&");
    },
  ];
  return newConfig;
};

export async function requestAccessToken({
  username,
  password,
  otp,
}: LoginArgs): Promise<TokenResponse> {
  const { data } = await authAxios.post<TokenResponse>(
    `${INFOVEAVE_BASE_URL}/connect/token`,
    {
      grant_type: "password",
      username,
      password,
      scope: "openid email profile roles",
      acr_values: otp
        ? `tenant:${INFOVEAVE_TENANT} otp:${otp}`
        : `tenant:${INFOVEAVE_TENANT}`,
      client_id: "Infoveave.Web",
    },
    urlEncodedParams({
      responseType: "json",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-web-app": "Infoveave",
      },
    }),
  );

  return data;
}
