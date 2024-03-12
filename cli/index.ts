#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { login, logout } from "./src/auth.js";
import { getDeployments } from "./src/httpClient.js";

const argv = yargs(hideBin(process.argv));

argv
  .usage("Usage: $0 <command> [options]")
  .command(
    "login",
    "Log in into Docker Deploy so you can perform operations in your account",
    login
  )
  .command("logout", "Log out from Docker Deploy", logout)
  .command("deployments get", "See all your deployments", getDeployments)
  .command({
    command: "*",
    handler() {
      argv.showHelp();
    },
  }).argv;
