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
  getRegistryCredentials,
} from "./api.js";
import { getDeploymentConfig, updateDeploymentConfig } from "./config.js";
import { DeploymentSize } from "./api.types.js";

type DeployArgs = {
  dockerfile: string;
};

export const buildAndPublish = async ({ dockerfile }: DeployArgs) => {
  if (!fs.existsSync(dockerfile)) {
    console.error(
      "Dockerfile doesn't exist! Please run the command where your dockerfile is located"
    );

    return;
  }

  await checkIfDockerIsRunning();

  await installEmulatorIfNecessary();

  await setAppNameIfNecessary();

  const registryCredentials = await getRegistryCredentials();

  await loginIntoDockerRegistry(registryCredentials);

  await buildAndPublishImage(dockerfile, registryCredentials);
};

export const deploy = async () => {
  const { imageTag, imageName } = getDeploymentConfig();
  if (!imageTag) {
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
    dockerfile: getComposeForSingleService({ imageTag }),
  };
  const deployment = await createDeployment(createDeploymentModel);

  console.log("");
  console.log("Deployment created successfully ✔");

  await deployDeployment(deployment.id);
  console.log("");
  console.log("Deployment started");
  console.log(
    "Edit your deployment here: " +
      `https://dockerdeploy.cloud/dashboard/deployments/${deployment.id}`
  );
  console.log(`See your deployment running: ${deployment.domain}`);
};

const getComposeForSingleService = ({ imageTag }: { imageTag: string }) => {
  return `services:
  app:
    image: ${imageTag}
    ports:
      # If your image is exposing a different port, change it in the right side. E.g.: "80:3000"
      - "80:80"
    pull_policy: always
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 1g`;
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
    validate: (userInput) => {
      if (userInput && imageTagRegex.test(userInput)) return true;

      return "The image name should be all lowercase and can contain only letters, numbers, - and _";
    },
  });

  updateDeploymentConfig({ imageName: result.imageName });
};

const getRegistry = (username: string) =>
  `registry.dockerdeploy.cloud/${username}`;

const getImagetag = (username: string, appName: string) =>
  `registry.dockerdeploy.cloud/${username}/${appName}`;

const buildAndPublishImage = async (
  dockerfile: string,
  registryCredentials: RegistryCredentails
) => {
  // Build & publish the image with the right tags
  const appName = getDeploymentConfig().imageName || "my-first-app";
  const imageTag = getImagetag(registryCredentials.username, appName);
  const buildCommand = `docker build -f ${dockerfile} ${
    !isArmPc() ? "--platform linux/arm64" : ""
  } . --tag ${imageTag}`;

  console.log("Building your docker image...");
  try {
    const { stderr, stdout } = await exec(buildCommand);
    if (stderr) {
      stdout && console.log(stdout);
      console.log(stderr);
    } else {
      console.log("You image tag is " + imageTag);
    }
  } catch (error) {
    console.error((error as ExecException).stderr);
    throw new Error("An error ocurred when building your image");
  }

  console.log("Image built ✔");
  console.log("");
  console.log("Pushing the image to the registry");

  try {
    const { stderr, stdout } = await exec(`docker push ${imageTag}`);

    if (stderr) {
      stdout && console.log(stdout);
      console.log(stderr);
    } else {
      console.log("Image pushed ✔");
      console.log("You image tag is " + imageTag);
    }
  } catch (error) {
    throw new Error("An error ocurred when pushing your image");
  }

  updateDeploymentConfig({ imageTag });
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
  fs.writeFileSync("./c", credentials.password);

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
    console.log({ error });
    throw new Error(`An error ocurred when login into docker`);
  } finally {
    fs.rmSync("./c");
  }
};

const isArmPc = () => process.arch.startsWith("arm");

const installEmulatorIfNecessary = async () => {
  if (isArmPc()) {
    return;
  }

  const result = await inquirer.prompt({
    type: "confirm",
    name: "install_qemu",
    message:
      "Your CPU is not ARM, you need to install a QEMU emulator to build ARM images.\n Do you want to install it now?",
  });

  if (result.install_qemu) {
    console.log("Installing emulator, it might take a bit");
    console.log("");

    try {
      const { stderr, stdout } = await exec(
        "docker run --privileged --rm tonistiigi/binfmt --install arm64"
      );

      if (stderr) {
        console.log(stderr);
      } else if (stdout) {
        console.log(stdout);
      }
    } catch (error) {
      console.error("Erorr ocurred when installing emulator");
    }
  }
};
