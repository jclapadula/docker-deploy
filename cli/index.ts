#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { login, logout } from "./src/auth.js";
import { deployCurrent } from "./src/deployments.js";

const argv = yargs(hideBin(process.argv));

argv
  .usage("Usage: $0 <command> [options]")
  .command(
    "login",
    "Log in into Docker Deploy so you can perform operations in your account",
    login
  )
  .command("logout", "Log out from Docker Deploy", logout)
  .command(
    "deploy",
    "Deploys the current project into Docker Deploy",
    deployCurrent
  )
  .command({
    command: "*",
    handler() {
      argv.showHelp();
    },
  }).argv;
