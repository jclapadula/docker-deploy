# Docker Deploy CLI

This CLI will help you deploy and manage your apps to dockerdeploy.cloud

You can install it with `npm i dockerdeploy-cli -g`

Then run `dd-cli` to see the help menu

## Usage and commands

```
Usage: dd-cli <command> [options]

Commands:
  dd-cli login    Log in into Docker Deploy so you can perform operations in
                  your account
  dd-cli logout   Log out from Docker Deploy
  dd-cli publish  Builds and publish the docker image defined by the selected
                  Dockerfile
  dd-cli deploy   Deploys the current app into Docker Deploy. It requires the
                  publish command to be executed first.
```
