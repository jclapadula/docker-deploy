#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { login, logout } from "./src/auth.js";
import { deployCurrent } from "./src/deployments.js";

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
    "deploy",
    "Deploys the current project into Docker Deploy",
    (args) =>
      args.option("f", {
        type: "string",
        default: "./Dockerfile",
        description: "Dockerfile to deploy",
      }),
    (args) => deployCurrent({ dockerfile: args.f })
  )
  .command({
    command: "*",
    handler() {
      argv.showHelp();
    },
  }).argv;
