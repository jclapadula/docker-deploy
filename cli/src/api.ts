import axios from "axios";
import { getAccessToken } from "./auth.js";
import { Architectures, DeploymentModel, DeploymentSize } from "./api.types.js";

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
  arch: Architectures;
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

export const getDeployment = async (
  deploymentId: string
): Promise<DeploymentModel> => {
  const jwt = await getAccessToken();

  try {
    const response = await axios.get<DeploymentModel>(
      "https://api.dockerdeploy.cloud/api/deployments/" + deploymentId,
      {
        headers: {
          Authorization: "Bearer " + jwt,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log("Something went wrong");
  }
};

export const deployDeployment = async (deploymentId: string) => {
  const jwt = await getAccessToken();

  try {
    const response = await axios.put<{ consoleResult: string }>(
      `https://api.dockerdeploy.cloud/api/deployments/${deploymentId}/deploy`,
      undefined,
      {
        headers: {
          Authorization: "Bearer " + jwt,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log("Something went wrong");
  }
};
