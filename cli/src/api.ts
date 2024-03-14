import axios from "axios";
import { getAccessToken } from "./auth.js";
import { DeploymentModel, DeploymentSize } from "./api.types.js";

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

export type CreateDeploymentModel = {
  name: string;
  dockerfile: string;
  /** Empty so it's generated */
  domain: "";
  size: DeploymentSize;
};

export const createDeployment = async (
  deployment: CreateDeploymentModel
): Promise<DeploymentModel> => {
  const jwt = await getAccessToken();

  try {
    const response = await axios.post<DeploymentModel>(
      "https://api.dockerdeploy.cloud/api/deployments",
      deployment,
      {
        headers: {
          Authorization: "Bearer " + jwt,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log("Something went wrong");
  }
};
