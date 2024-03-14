import axios from "axios";
import { getAccessToken } from "./auth.js";

export const getDeployments = async () => {
  const jwt = await getAccessToken();

  try {
    const response = await axios.request({
      headers: {
        Authorization: "Bearer " + jwt,
      },
      url: "https://api.dockerdeploy.cloud/api/deployments/all",
      method: "GET",
    });

    console.log(response.data);
  } catch (error) {
    console.log("Something went wrong");
  }
};

export type RegistryCredentails = {
  username: string;
  password: string;
};

export const getRegistryCredentials = async () => {
  const jwt = await getAccessToken();

  try {
    const response = await axios.request<RegistryCredentails>({
      headers: {
        Authorization: "Bearer " + jwt,
      },
      url: "https://api.dockerdeploy.cloud/api/users/getRegistryCredentials",
      method: "GET",
    });

    return response.data;
  } catch (error) {
    console.log("Something went wrong");
  }
};
