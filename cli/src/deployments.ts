import fs from "fs";
import inquirer from "inquirer";
import child_process, { ExecException } from "child_process";
import util from "util";
const exec = util.promisify(child_process.exec);
import {
  CreateDeploymentModel,
  RegistryCredentails,
  createDeployment,
  deployDeployment,
  getDeployment,
  getRegistryCredentials,
} from "./api.js";
import { getDeploymentConfig, updateDeploymentConfig } from "./config.js";
import { Architectures, DeploymentSize } from "./api.types.js";

type BuildArgs = {
  dockerfile: string;
  versions: string[];
  arch?: Architectures;
};

export const buildAndPublish = async ({
  dockerfile,
  versions,
  arch,
}: BuildArgs) => {
  if (!fs.existsSync(dockerfile)) {
    console.error(
      "Dockerfile doesn't exist! Please run the command where your dockerfile is located"
    );

    return;
  }

  await checkIfDockerIsRunning();

  await installEmulatorIfNecessary(arch);

  await setAppNameIfNecessary();

  const registryCredentials = await getRegistryCredentials();

  await loginIntoDockerRegistry(registryCredentials);

  await buildAndPublishImage(dockerfile, registryCredentials, versions, arch);
};

export const deploy = async () => {
  const config = getDeploymentConfig();
  const { tagBase, imageName } = config;
  let { arch } = config;
  arch = arch || isArmPc() ? Architectures.arm : Architectures.AMD64;

  if (!tagBase) {
    console.error(
      `Not image tag found for ${
        imageName || "the app"
      }. Please run dd-cli publish to re-publish the image`
    );
    return;
  }

  const createDeploymentModel: CreateDeploymentModel = {
    name: "My Deployment",
    domain: "",
    size: DeploymentSize.XS,
    dockerfile: getComposeForSingleService({ imageTag: tagBase }),
    arch,
  };
  let deployment = await createDeployment(createDeploymentModel);

  console.log("");
  console.log("Deployment created successfully ✔");

  await deployDeployment(deployment.id);
  console.log("");
  console.log("Deployment started");
  console.log(
    "Edit your deployment here: " +
      `https://dockerdeploy.cloud/dashboard/deployments/${deployment.id}`
  );

  deployment = await getDeployment(deployment.id);
  console.log(`See your deployment running: ${deployment.domain}`);
};

const getComposeForSingleService = ({ imageTag }: { imageTag: string }) => {
  return `services:
  app:
    image: ${imageTag}
    ports:
      # If your image is exposing a different port, change it in the right side. E.g.: "80:3000"
      - "80:80"
    pull_policy: always`;
};

const imageTagRegex = /^([a-z0-9]+(?:[._-]{1,2}[a-z0-9]+)*)$/;
const setAppNameIfNecessary = async () => {
  const { imageName } = getDeploymentConfig();
  if (imageName) {
    return;
  }

  const result = await inquirer.prompt({
    type: "input",
    message: "Please pick a name for your docker image",
    name: "imageName",
    validate: (userInput: string) => {
      if (userInput && imageTagRegex.test(userInput)) return true;

      return "The image name should be all lowercase and can contain only letters, numbers, - and _";
    },
  });

  updateDeploymentConfig({ imageName: result.imageName as string });
};

const getRegistry = (username: string) =>
  `registry.dockerdeploy.cloud/${username}`;

const getImagetag = (username: string, appName: string) =>
  `registry.dockerdeploy.cloud/${username}/${appName}`;

const buildAndPublishImage = async (
  dockerfile: string,
  registryCredentials: RegistryCredentails,
  versions: string[],
  arch?: Architectures
) => {
  if (versions.length === 0) {
    throw new Error(
      "No version set for the image. Default is 'latest' if the -v is not used"
    );
  }

  // Build & publish the image with the right tags
  const appName = getDeploymentConfig().imageName || "my-first-app";
  const imageTagBase = getImagetag(registryCredentials.username, appName);

  const tagsWithVersions = versions.map((v) => `${imageTagBase}:${v}`);
  const firstFullTag = tagsWithVersions[0];

  const tagsArg = tagsWithVersions.map((fullTag) => `-t ${fullTag} `).join("");

  const archOption =
    arch == Architectures.arm
      ? "--platform linux/arm64"
      : arch == Architectures.AMD64
      ? "--platform linux/amd64"
      : "";

  const buildCommand = `docker build -f ${dockerfile} ${archOption} . ${tagsArg}`;

  console.log("Building your docker image...");
  try {
    const { stderr, stdout } = await exec(buildCommand);
    if (stderr) {
      stdout && console.log(stdout);
      console.log(stderr);
    } else {
      console.log("You image tag is " + firstFullTag);
    }
  } catch (error) {
    console.error((error as ExecException).stderr);
    throw new Error("An error ocurred when building your image");
  }

  console.log("Image built ✔");
  console.log("");
  console.log("Pushing the image to the registry");

  try {
    const { stderr, stdout } = await exec(`docker push ${firstFullTag}`);

    if (stderr) {
      stdout && console.log(stdout);
      console.log(stderr);
    } else {
      console.log("Image pushed ✔");
      console.log("You image tag is " + firstFullTag);
    }
  } catch (error) {
    throw new Error(`An error ocurred when pushing your image\n${error}`);
  }

  updateDeploymentConfig({ tagBase: imageTagBase, arch });
};

const checkIfDockerIsRunning = async () => {
  try {
    await exec(`docker version`);
  } catch (error) {
    throw new Error(
      "Docker must be running to continue. Please start docker and try again"
    );
  }
};

const loginIntoDockerRegistry = async (credentials: RegistryCredentails) => {
  try {
    const registry = getRegistry(credentials.username);
    const isWindows = process.platform === "win32";
    const { stderr } = await exec(
      `echo ${credentials.password} | docker login ${registry} -u ${credentials.username} --password-stdin`,
      isWindows ? { shell: "powershell.exe" } : undefined
    );
    if (stderr) {
      console.log(stderr);
    }
  } catch (error) {
    throw new Error(`An error ocurred when login into docker`);
  }
};

const isArmPc = () => process.arch.startsWith("arm");

const installEmulatorIfNecessary = async (architecture: Architectures) => {
  if (!architecture) {
    return;
  }

  if (architecture == Architectures.arm && isArmPc()) {
    return;
  }

  if (architecture == Architectures.AMD64 && !isArmPc()) {
    return;
  }

  console.log(
    `Your CPU is not ${architecture}. The emulator will be configured.`
  );

  const emulatorArchName = Architectures.arm ? "arm64" : "amd64";

  console.log("Configuring emulator...");
  console.log("");

  try {
    const { stderr, stdout } = await exec(
      `docker run --privileged --rm tonistiigi/binfmt --install ${emulatorArchName}`
    );

    if (stderr) {
      console.log(stderr);
    } else if (stdout) {
      console.log(stdout);
    }
  } catch (error) {
    console.error("Erorr ocurred when configuring the emulator");
  }
};
