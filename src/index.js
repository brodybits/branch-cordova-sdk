var exec = require("cordova/exec");
var deviceVendor = (typeof window.clientInformation != 'undefined' && typeof window.clientInformation.vendor != 'undefined') ? window.clientInformation.vendor : "unknownVendor";

// SDK Class
var API_CLASS = "BranchSDK";

// Branch prototype
var Branch = function Branch() {
  this.debugMode = false;
  this.trackingDisabled = false;
};

// JavsSript to SDK wrappers
function execute(method, params) {
  var output = !params ? [] : params;

  return new Promise(function promise(resolve, reject) {
    exec(
      function success(res) {
        resolve(res);
      },
      function failure(err) {
        reject(err);
      },
      API_CLASS,
      method,
      output
    );
  });
}

function executeCallback(method, callback, params) {
  var output = !params ? [] : params;

  exec(
    callback,
    function failure(err) {
      console.error(err);
    },
    API_CLASS,
    method,
    output
  );
}

function executeReject(message) {
  return new Promise(function promise(resolve, reject) {
    reject(message);
  });
}

// Branch interface
Branch.prototype.disableTracking = function disableTracking(isEnabled) {
  var value = typeof isEnabled === "boolean" ? isEnabled : false;
  this.trackingDisabled = value;
  return execute("disableTracking", [value]);
};

Branch.prototype.initSession = function initSession() {
  return execute("initSession");
};

Branch.prototype.setRequestMetadata = function setRequestMetadata(key, val) {
  if (!key || typeof key !== "string") {
    return executeReject("Please set key");
  }
  if (!val || typeof val !== "string") {
    return executeReject("Please set value");
  }
  return execute("setRequestMetadata", [key, val]);
};

Branch.prototype.setDebug = function setDebug(isEnabled) {
  var value = typeof isEnabled !== "boolean" ? false : isEnabled;
  this.debugMode = value;

  return execute("setDebug", [value]);
};

Branch.prototype.setCookieBasedMatching = function setCookieBasedMatching(
  linkDomain
) {
  return linkDomain && deviceVendor.indexOf("Apple") < 0
    ? execute("setCookieBasedMatching", [linkDomain])
    : null;
};

Branch.prototype.getFirstReferringParams = function getFirstReferringParams() {
  return execute("getFirstReferringParams");
};

Branch.prototype.getLatestReferringParams = function getLatestReferringParams() {
  return execute("getLatestReferringParams");
};

Branch.prototype.setIdentity = function setIdentity(identity) {
  if (identity) {
    return execute("setIdentity", [String(identity)]);
  }
  return executeReject("Please set an identity");
};

Branch.prototype.logout = function logout() {
  return execute("logout");
};

Branch.prototype.userCompletedAction = function userCompletedAction(
  action,
  metaData
) {
  var args = [action];
  if (!action) {
    return executeReject("Please set an event name");
  }

  if (metaData) {
    args.push(metaData);
  }

  return execute("userCompletedAction", args);
};

Branch.prototype.sendCommerceEvent = function sendCommerceEvent(
  action,
  metaData
) {
  var args = [action];
  if (!action) {
    return executeReject("Please set a commerce event");
  }

  if (metaData) {
    args.push(metaData);
  }

  return execute("sendCommerceEvent", args);
};

Branch.prototype.createBranchUniversalObject = function createBranchUniversalObject(
  options
) {
  return new Promise(function promise(resolve, reject) {
    execute("createBranchUniversalObject", [options]).then(
      function success(res) {
        var obj = {
          message: res.message,
          instanceId: res.branchUniversalObjectId
        };

        obj.registerView = function registerView() {
          return execute("registerView", [obj.instanceId]);
        };

        obj.generateShortUrl = function generateShortUrl(
          analytics,
          properties
        ) {
          return execute("generateShortUrl", [
            obj.instanceId,
            analytics,
            properties
          ]);
        };

        obj.showShareSheet = function showShareSheet(
          analytics,
          properties,
          shareText
        ) {
          var message = !shareText ? "This stuff is awesome: " : shareText;

          return execute("showShareSheet", [
            obj.instanceId,
            analytics,
            properties,
            message
          ]);
        };

        obj.onShareSheetLaunched = function onShareSheetLaunched(callback) {
          if (deviceVendor.indexOf("Apple") < 0) {
            executeCallback("onShareLinkDialogLaunched", callback, [
              obj.instanceId
            ]);
          }
        };

        obj.onShareSheetDismissed = function onShareSheetDismissed(callback) {
          executeCallback("onShareLinkDialogDismissed", callback, [
            obj.instanceId
          ]);
        };

        obj.onLinkShareResponse = function onLinkShareResponse(callback) {
          executeCallback("onLinkShareResponse", callback, [obj.instanceId]);
        };

        obj.onChannelSelected = function onChannelSelected(callback) {
          if (deviceVendor.indexOf("Apple") < 0) {
            executeCallback("onChannelSelected", callback, [obj.instanceId]);
          }
        };

        obj.listOnSpotlight = function listOnSpotlight() {
          if (!(deviceVendor.indexOf("Apple") < 0)) {
            return execute("listOnSpotlight", [obj.instanceId]);
          }
          return executeReject("iOS Spotlight only");
        };

        resolve(obj);
      },
      function failure(err) {
        reject(err);
      }
    );
  });
};

Branch.prototype.loadRewards = function loadRewards(bucket) {
  var output = !bucket ? "" : bucket;
  return execute("loadRewards", [output]);
};

Branch.prototype.redeemRewards = function redeemRewards(value, bucket) {
  var params = [value];
  if (bucket) {
    params.push(bucket);
  }

  return execute("redeemRewards", params);
};

Branch.prototype.creditHistory = function creditHistory() {
  return execute("getCreditHistory");
};

// export Branch object
module.exports = new Branch();
