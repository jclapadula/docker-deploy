import fs from "node:fs";

export type DeploymentConfig = {
  imageName: string;
  imageTag: string;
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
