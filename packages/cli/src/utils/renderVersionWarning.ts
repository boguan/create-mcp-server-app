import { execSync } from "child_process";
import https from "https";
import { type PackageJson } from "type-fest";

import { getVersion } from "./version.js";
import { logger } from "./logger.js";

interface RenderVersionWarningOptions {
  npmVersion: string;
  packageJson: PackageJson;
  packageName: string;
}

export const renderVersionWarning = ({ npmVersion, packageJson, packageName }: RenderVersionWarningOptions) => {
  const currentVersion = getVersion(packageJson);

  //   console.log("current", currentVersion);
  //   console.log("npm", npmVersion);

  if (currentVersion.includes("beta")) {
    logger.warn(`You are using a beta version of ${packageName}.`);
    logger.warn(`Please report any bugs you encounter.`);
  } else if (currentVersion.includes("next")) {
    logger.warn(
      `You are running ${packageName} with the @next tag which is no longer maintained.`
    );
    logger.warn("Please run the CLI with @latest instead.");
  } else if (currentVersion !== npmVersion) {
    logger.warn(`You are using an outdated version of ${packageName}.`);
    logger.warn(
      " Your version:",
      currentVersion + ".",
      "Latest version in the npm registry:",
      npmVersion
    );
    logger.warn("  Please run the CLI with @latest to get the latest updates.");
  }
  console.log("");
};

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 * https://github.com/facebook/create-react-app/blob/main/packages/create-react-app/LICENSE
 */
interface DistTagsBody {
  latest: string;
}

function checkForLatestVersion(packageName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(
        `https://registry.npmjs.org/-/package/${packageName}/dist-tags`,
        (res) => {
          if (res.statusCode === 200) {
            let body = "";
            res.on("data", (data) => (body += data));
            res.on("end", () => {
              resolve((JSON.parse(body) as DistTagsBody).latest);
            });
          } else {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject();
          }
        }
      )
      .on("error", () => {
        // logger.error("Unable to check for latest version.");
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject();
      });
  });
}

export const getNpmVersion = (packageName: string) =>
  // `fetch` to the registry is faster than `npm view` so we try that first
  checkForLatestVersion(packageName).catch(() => {
    try {
      // TODO
      return execSync(`npm view ${packageName} version`).toString().trim();
    } catch {
      return null;
    }
  });
