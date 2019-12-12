const FloatingWindowTitle = "oowq2wjZo6bcXEaHXcQrKNxHDTMUd3hBECDFKWuF";
const DefaultPosition = "topRight";

floatTab = function () {
    getFloatingTab(function (floatingTab) {
        if (!floatingTab) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                var currentTab = tabs[0];
                if (currentTab) {
                    var currentTabOriginalTitle = currentTab.title;

                    setTabTitle(currentTab.id, FloatingWindowTitle, function () {
                        let tabProps = {
                            tabId: currentTab.id,
                            parentWindowId: currentTab.windowId,
                            originalIndex: currentTab.index,
                            originalTitle: currentTabOriginalTitle,
                            position: DefaultPosition
                        };

                        chrome.windows.get(currentTab.windowId, function (window) {
                            var positionData = getPositionDataForFloatingTab(window, DefaultPosition);

                            chrome.windows.create({
                                "tabId": currentTab.id,
                                "type": "popup",
                                "top": positionData.top,
                                "left": positionData.left,
                                "width": positionData.width,
                                "height": positionData.height,
                                // focused: false
                            }, function () {
                                setFloatingTab(tabProps);
                            });
                        });
                    });
                }
            });
        }
    });
}

unfloatTab = function () {
    getFloatingTab(function (floatingTab, tabProps) {
        if (floatingTab) {
            setTabTitle(tabProps.tabId, tabProps.originalTitle, function () {
                chrome.tabs.move(tabProps.tabId, { windowId: tabProps.parentWindowId, index: tabProps.originalIndex }, function () {
                    clearFloatingTab();
                });
            });
        }
    });
}

repositionFloatingTab = function (newPosition) {
    getFloatingTab(function (floatingTab, tabProps) {
        if (floatingTab) {
            chrome.windows.get(tabProps.parentWindowId, function (parentWindow) {
                let newPositionData = getPositionDataForFloatingTab(parentWindow, newPosition);

                chrome.windows.update(floatingTab.windowId, newPositionData, function () {
                    tabProps.position = newPosition;
                    setFloatingTab(tabProps);
                });
            });
        }
    });
}

getPositionDataForFloatingTab = function (parentWindow, position) {
    const padding = 50;
    let halfWidth = parseInt(parentWindow.width / 2);
    let halfHeight = parseInt(parentWindow.height / 2);
    let newTop = parentWindow.top + padding;
    let newLeft = parentWindow.left + padding;

    if (position.startsWith("bottom")) {
        newTop += halfHeight;
    }
    if (position.endsWith("Right")) {
        newLeft += halfWidth;
    }

    return {
        top: newTop,
        left: newLeft,
        width: halfWidth - padding * 2,
        height: halfHeight - padding * 2
    };
}

setTabTitle = function (tabId, title, callback) {
    chrome.tabs.executeScript(tabId, { code: "document.title = \"" + title + "\"" }, callback);
}

getFloatingTab = function (callback) {
    chrome.storage.local.get(["floatingTabProperties"], function (data) {
        if (data.floatingTabProperties) {
            let tabProps = data.floatingTabProperties;
            chrome.tabs.get(tabProps.tabId, function (floatingTab) {
                if (!chrome.runtime.lastError) {
                    callback(floatingTab, tabProps);
                } else {
                    clearFloatingTab();
                    callback();
                }
            });
        } else {
            callback();
        }
    });
}

setFloatingTab = function (tabProps, callback) {
    chrome.storage.local.set({ floatingTabProperties: tabProps }, callback);
}

clearFloatingTab = function (callback) {
    chrome.storage.local.remove(["floatingTabProperties"], callback);
}