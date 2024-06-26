import fs from "node:fs";
import { Architectures } from "./api.types.js";

export type DeploymentConfig = {
  imageName: string;

  /** Base without version */
  tagBase: string;
  arch?: Architectures;
};

const configLocation = "./dockerdeploy.json";

export const getDeploymentConfig = (): Partial<DeploymentConfig> => {
  if (!fs.existsSync(configLocation)) {
    return {};
  }

  const data = fs.readFileSync(configLocation, "utf-8");
  return JSON.parse(data) as Partial<DeploymentConfig>;
};

export const updateDeploymentConfig = (updates: Partial<DeploymentConfig>) => {
  const currentData = getDeploymentConfig();
  const newData = { ...currentData, ...updates };

  fs.writeFileSync(configLocation, JSON.stringify(newData));
};
