#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { login, logout } from "./src/auth.js";
import { buildAndPublish, deploy } from "./src/deployments.js";
import { Architectures } from "./src/api.types.js";

const argv = yargs(hideBin(process.argv));

void argv
  .usage("Usage: dd-cli <command> [options]")
  .command(
    "login",
    "Log in into Docker Deploy so you can perform operations in your account",
    login
  )
  .command("logout", "Log out from Docker Deploy", logout)
  .command<{ f: string; v: string[]; arch: Architectures | undefined }>(
    "build",
    "Builds and publish the docker image defined by the selected Dockerfile.",
    (args) =>
      args
        .option("f", {
          type: "string",
          default: "./Dockerfile",
          description: "Dockerfile to deploy",
        })
        .option("v", {
          type: "array",
          default: ["latest"],
          description:
            "Set the version for this image tag. By default 'latest' is set",
        })
        .option("arch", {
          type: "string",
          choices: [undefined, Architectures.arm, Architectures.AMD64],
        })
        .version(false),
    (args) =>
      buildAndPublish({ dockerfile: args.f, versions: args.v, arch: args.arch })
  )
  .command<{ f: string }>(
    "deploy",
    "Deploys the current app into Docker Deploy. It requires the publish command to be executed first.",
    (args) => args.version(false),
    () => deploy()
  )
  .scriptName("dd-cli")
  .version("0.2.11")
  .showHelpOnFail(false)
  .command({
    command: "*",
    handler() {
      argv.showHelp();
    },
  }).argv;
