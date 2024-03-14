export interface DeploymentModel {
  id: string;
  name: string;
  dockerFile: string;
  domain: string | null;
  size: DeploymentSize;
}

export enum DeploymentSize {
  XS = 0,
  S = 1,
  M = 2,
  L = 4,
}
