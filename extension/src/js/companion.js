/*
 * Copyright 2020 Balazs Gyurak
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CompanionName } from "./constants.js";
import { CompanionLatestVersions } from "./constants.js";
import { loadOptionsAsync } from "./main.js";

export async function getCompanionInfoAsync(logger) {
    try {
        const debug = await isDebuggingEnabledAsync();
        const companionInfo = await browser.runtime.sendNativeMessage(CompanionName, {
            action: "ping",
            debug: debug.toString()
        });

        logger.info(`Companion responded to ping request. Status: '${companionInfo.status}', Version: ${companionInfo.version} (${companionInfo.os})`);

        if (companionInfo.status === "ok") {
            const isOutdated = isOutdatedVersion(companionInfo);

            return {
                status: "connected",
                version: companionInfo.version,
                os: companionInfo.os,
                latestVersion: getLatestCompanionVersion(companionInfo),
                isOutdated: isOutdated,
                latestVersionHasBreakingChanges: isOutdated ? latestVersionHasBreakingChanges(companionInfo) : false,
                logFilePath: companionInfo.logfile
            };
        } else {
            // TODO handle error somehow. show it in tooltip? extra status?
            return {
                status: "error"
            };
        }
    }
    catch (error) {
        logger.warn(`Unable to contact companion for ping request: '${JSON.stringify(error)}'`);

        return {
            status: "unavailable",
            errorMessage: error.message
        };
    }
}

export async function sendMakeDialogRequestAsync(windowTitle, parentWindowTitle, logger) {
    logger.info(`MakeDialog request received. Window title: '${windowTitle}', parent window title: '${parentWindowTitle}'`);

    try {
        const debug = await isDebuggingEnabledAsync();
        await browser.runtime.sendNativeMessage(CompanionName, {
            action: "setAsModelessDialog",
            windowTitle: windowTitle,
            parentWindowTitle: parentWindowTitle,
            debug: debug.toString()
        });
    } catch (error) {
        logger.error(`Unable to contact companion for MakeDialog request. Error: '${JSON.stringify(error)}'`);
    }
}

function isOutdatedVersion(companionInfo) {
    return companionInfo.version !== getLatestCompanionVersion(companionInfo);
}

function latestVersionHasBreakingChanges(companionInfo) {
    return getMajorVersion(companionInfo.version) < getMajorVersion(getLatestCompanionVersion(companionInfo));
}

function getLatestCompanionVersion(companionInfo) {
    switch (companionInfo.os) {
        case "Linux": return CompanionLatestVersions.Linux;
        case "Windows": return CompanionLatestVersions.Windows;
        default: return "unknown";
    }
}

function getMajorVersion(version) {
    return parseInt(version.substring(0, version.indexOf(".")));
}

async function isDebuggingEnabledAsync() {
    const options = await loadOptionsAsync();
    return options.debug;
}
