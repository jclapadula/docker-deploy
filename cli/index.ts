#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { login, logout } from "./src/auth.js";
import { buildAndPublish, deploy } from "./src/deployments.js";

const argv = yargs(hideBin(process.argv));

argv
  .usage("Usage: dd-cli <command> [options]")
  .command(
    "login",
    "Log in into Docker Deploy so you can perform operations in your account",
    login
  )
  .command("logout", "Log out from Docker Deploy", logout)
  .command<{ f: string }>(
    "build",
    "Builds and publish the docker image defined by the selected Dockerfile.",
    (args) =>
      args.option("f", {
        type: "string",
        default: "./Dockerfile",
        description: "Dockerfile to deploy",
      }),
    (args) => buildAndPublish({ dockerfile: args.f })
  )
  .command<{ f: string }>(
    "deploy",
    "Deploys the current app into Docker Deploy. It requires the publish command to be executed first.",
    () => deploy()
  )
  .scriptName("dd-cli")
  .command({
    command: "*",
    handler() {
      argv.showHelp();
    },
  }).argv;
