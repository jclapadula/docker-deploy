import fs from "fs";
import inquirer from "inquirer";
import { exec } from "child_process";

export const deployCurrent = async () => {
  if (!fs.existsSync("Dockerfile")) {
    console.error(
      "Dockerfile doesn't exist! Please run the command where your dockerfile is located"
    );
    return;
  }

  const isArmArch = process.arch.startsWith("arm");
  if (!isArmArch) {
    const result = await inquirer.prompt({
      type: "confirm",
      name: "install_qemu",
      message:
        "Your CPU is not ARM, you need to install a QEMU emulator to build ARM images.\n Do you want to install it now?",
    });

    if (result.install_qemu) {
      installEmulator();
    } else {
      console.error("Can't continue without the emulator");
      return;
    }
  }

  // Get the user registry and credentials
  // dockerlogin

  // Build & publish the image with the right tags

  // Create deployment => show link
};

const installEmulator = () => {
  console.log("Installing emulator, it might take a bit");
  console.log("");

  exec(
    "docker run --privileged --rm tonistiigi/binfmt --install arm64",
    (err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        return;
      }

      if (stderr) {
        console.log(stderr);
      } else if (stdout) {
        console.log(stdout);
      }
    }
  );
};
