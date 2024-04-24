import open from "open";
import Conf from "conf";
import axios, { AxiosResponse } from "axios";

const config = new Conf<{
  refreshToken?: string;
  expireDate?: string;
  accessToken?: string;
}>({ projectName: "dd-cli", configName: "auth" });

const requestLoginAndThrow = () => {
  throw new Error(
    "You need to be logged in to perform this operation.Please run dd-cli login to login."
  );
};

export const getAccessToken = async () => {
  if (!config.get("accessToken")) {
    requestLoginAndThrow();
  }

  const expireDate = config.get("expireDate");
  if (!expireDate) {
    requestLoginAndThrow();
  }

  const now = new Date();
  const expiration = new Date(expireDate);
  if (now > expiration) {
    if (config.get("refreshToken")) {
      await refreshTokens();
    } else {
      requestLoginAndThrow();
    }
  }

  return config.get("accessToken");
};

export const login = async () => {
  const response = await axios.request<{
    verification_uri_complete: string;
    device_code: string;
    interval: number;
  }>({
    method: "POST",
    url: "https://dockerdeploy.eu.auth0.com/oauth/device/code",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: {
      client_id: "2wQiAna0UFAjmxnkxjqD0B4YZpnnoh9v",
      scope: "email offline_access",
      audience: "https://api.dockerdeploy.cloud",
    },
  });

  console.log("Your device code is " + response.data.device_code);

  await open(response.data.verification_uri_complete, { wait: false });

  let tokensResponse: AxiosResponse<{
    refresh_token: string;
    access_token: string;
    expires_in: number;
  }>;
  while (!tokensResponse) {
    // Sleep
    await new Promise((r) => setTimeout(r, 5000));

    try {
      tokensResponse = await axios.request({
        method: "POST",
        url: "https://dockerdeploy.eu.auth0.com/oauth/token",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: response.data.device_code,
          client_id: "2wQiAna0UFAjmxnkxjqD0B4YZpnnoh9v",
        }),
      });
    } catch (error) {
      tokensResponse = null;
    }
  }

  config.set("accessToken", tokensResponse.data.access_token);
  config.set("refreshToken", tokensResponse.data.refresh_token || "");

  const expiration = new Date();
  expiration.setSeconds(
    expiration.getSeconds() + tokensResponse.data.expires_in
  );

  config.set("expireDate", expiration.toISOString());

  console.log("You are now logged in");
};

const refreshTokens = async () => {
  const refreshToken = config.get("refreshToken");
  if (!refreshToken) {
    throw new Error("Please login");
  }

  const tokensResponse = await axios.request<{
    access_token: string;
    expires_in: number;
  }>({
    method: "POST",
    url: "https://dockerdeploy.eu.auth0.com/oauth/token",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: "2wQiAna0UFAjmxnkxjqD0B4YZpnnoh9v",
      refresh_token: refreshToken,
    }),
  });

  config.set("accessToken", tokensResponse.data.access_token);

  const expiration = new Date();
  expiration.setSeconds(
    expiration.getSeconds() + tokensResponse.data.expires_in
  );
  config.set("expireDate", expiration.toISOString());
};

// eslint-disable-next-line @typescript-eslint/require-await
export const logout = async () => {
  config.delete("accessToken");
  config.delete("expireDate");
  config.delete("refreshToken");

  console.log("Logged out");
};
