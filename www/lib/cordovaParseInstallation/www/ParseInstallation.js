var exec = require('cordova/exec');

module.exports = (function() {
  var deferred;
  var toReturn;
  if (window.jQuery) {
    deferred = jQuery.Deferred;
    toReturn = function(def) {
      return def;
    };
  } else if (window.angular) {
    injector = angular.injector(["ng"]);
    $q = injector.get("$q");
    deferred = $q.defer;
    toReturn = function(def) {
      return def.promise;
    };
  } else {
    return console.error('AppVersion either needs a success callback, or jQuery/AngularJS defined for using promises');
  }

  var subscriptions = window.localStorage.getItem('subscriptions') || '[]';
  subscriptions = JSON.parse(subscriptions);

  function getAppName() {
    var q = deferred();
    exec(q.resolve, q.reject, 'ParseInstallation', 'getAppName', []);
    return toReturn(q);
  }
  
  function getPackageName() {
    var q = deferred();
    exec(q.resolve, q.reject, 'ParseInstallation', 'getPackageName', []);
    return toReturn(q);
  }

  function getVersionNumber() {
    var q = deferred();
    exec(q.resolve, q.reject, 'ParseInstallation', 'getVersionNumber', []);
    return toReturn(q);
  }

  function getTimeZone() {
    var q = deferred();
    exec(q.resolve, q.reject, 'ParseInstallation', 'getTimeZone', []);
    return toReturn(q);
  }

  function saveInstallation(token, config) {
    var Installation = Parse.Object.extend("_Installation");

    return Parse._getInstallationId()
      .then(function(iid) {
        var installation = new Installation();

        var platform = device.platform.toLowerCase();
        installation.set('deviceType', platform);

        installation.set('installationId', iid);

        return installation;
      })
      .then(function(installation) {
        if (device.platform.toLowerCase() === 'android') {
          installation.set('pushType', 'gcm');
          if (config.senderID !== 1076345567071) {
            installation.set('GCMSenderId', config.senderID);
          }
        }
        installation.set('deviceToken', token);
        installation.set('parseVersion', Parse.VERSION);
        installation.set('channels', subscriptions);
        return installation;
      })
      .then(function(installation) {
        return getVersionNumber()
          .then(function(versionNumber) {
            return installation.set('appVersion', versionNumber);
          });
      })
      .then(function(installation) {
        return getAppName()
          .then(function(appName) {
            return installation.set('appName', appName);
          });
      })
      .then(function(installation) {
        return getPackageName()
          .then(function(packageName) {
            return installation.set('appIdentifier', packageName);
          });
      })
      .then(function(installation) {
        return getTimeZone()
          .then(function(timeZone) {
            return installation.set('timeZone', timeZone);
          });
      })
      .then(function(installation) {
        console.log('save installation: ' + installation.id + ', ' + installation.get('installationId'));
        
        return installation.save();
      });
  }

  var pushToken;
  var onNotification;
  var installation;
  return {
    listenNotification: function (notification) {
      setTimeout(function() {
        if (notification.event && notification.event == 'registered') {
          if (notification.regid.length > 0 ) {
            pushToken = notification.regid;
          }
        } else {
          if (onNotification) {
            onNotification(notification);
          } else if (window.onNotification) {
            window.onNotification(notification);
          }
        }
      });
    },
    getCurrentInstallation: function() {
      return getCurrentInstallation();
    },
    initialize: function (appId, appKey, config) {

      Parse.initialize(appId, appKey);

      if (config.onNotification) {
        onNotification = config.onNotification;
      }

      var platform = device.platform.toLowerCase();
      if (platform === 'android') {
        config = config.android;
        if (!config.senderID) {
          config.senderID = 1076345567071;
        }
      } else if (platform === 'ios') {
        config = config.ios;
      } else {
        return q.reject('Not suppert platform');
      }

      if (config !== undefined && config.ecb === undefined) {
        config.ecb = 'ParseInstallation.listenNotification';
      }

      var q = deferred();
      exec(function (token) {
        if (token != 'OK') {
          pushToken = token;
        }

        var nextLoop = function() {
          setTimeout(function () {
            if (pushToken) {
              saveInstallation(pushToken, config)
                .then(function(reply) {
                  installation = reply;
                  q.resolve(reply);
                }, q.reject);
            } else {
              nextLoop();
            }
          });
        };
        nextLoop();
      }, function(error) {
        alert(JSON.stringify(error));
      }, "PushPlugin", "register", [config]);

      return toReturn(q);
    },
    getSubscriptions: function() {
      var q = deferred();

      setTimeout(function() {
        q.resolve(subscriptions);
      });

      return toReturn(q);
    },
    subscribe: function(channels) {
      var q = deferred();

      if (typeof channels === 'string') {
        channels = [channels];
      }
      
      var nextLoop = function() {
        setTimeout(function () {
          if (installation) {
            channels.forEach(function(item) {
              for(var i in subscriptions) {
                if (subscriptions[i] === item) {
                  return;
                }
              }
              
              subscriptions.push(item);
              installation.addUnique("channels", item);
            });

            window.localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
            installation.save().then(q.resolve, q.reject);
          } else {
            nextLoop();
          }
        });
      };
      nextLoop();

      return toReturn(q);
    },
    unsubscribe: function(channels) {
      var q = deferred();

      if (typeof channels === 'string') {
        channels = [channels];
      }

      var nextLoop = function() {
        setTimeout(function () {
          if (installation) {
            if (channels instanceof RegExp) {
              subscriptions = subscriptions.filter(function(subscription) {
                return !channels.test(subscription);
              });
            } else {
              channels.forEach(function(item) {
                subscriptions = subscriptions.filter(function(subscription) {
                  return subscription !== item;
                });
              });
            }

            installation.set("channels", subscriptions);

            window.localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
            installation.save().then(q.resolve, q.reject);
          } else {
            nextLoop();
          }
        });
      };
      nextLoop();

      return toReturn(q);
    }
  };
}).call(this);