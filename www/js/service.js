angular.module('starter.services', ['ionic', 'ngCordova'])

.service(
  'installation',
  function($q) {
    return {
      setDelay: function(day) {
        return ParseInstallation.getCurrentInstallation().then(function(installation) {
          var delay = new Date(new Date().getTime() + day * 24 * 60 * 60 * 1000);
          delay.setHours(23, 59, 59);

          return installation.set('delay', delay).save();
        });
      },
      getDelay: function() {
        return ParseInstallation
          .getCurrentInstallation()
          .then(function(installation) {
            var delay = installation.get('delay') || new Date();
            delay = (delay.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000);
            if (delay < 1) {
              return 1;
            } else {
              return Math.floor(delay);
            }
          });
      },
      getSubscriptions: function() {
        return ParseInstallation.getSubscriptions();
      },
      subscribe: function(listen) {
        return ParseInstallation.subscribe(listen);
      },
      unsubscribe: function(listen) {
        return ParseInstallation.unsubscribe(listen);
      }
    };
  }
)

.service(
  'blood',
  function($q, $ionicPlatform, $http, $cordovaFile) {
    var blood = null;
    var fileName = 'blood.json';

    return {
      load: function(status) {
        switch(status) {
          case 'cache':
            return Parse.Promise.as(blood);
          case 'file':
            return Parse.Promise.as(fileName)
              .then(function(fileName) {
                return $cordovaFile.readAsText(cordova.file.dataDirectory, fileName);
              })
              .then(function (success) {
                blood = JSON.parse(success);
                return;
              }, function() {
                localStorage.lastServiceStation = 0;
                return;
              })
              .always(function() {
                return this.load('wget');
              }.bind(this));
          case 'wget':
            return Parse.Promise.as((new Date().getTime() - (localStorage.lastServiceStation || 0)))
              .then(function(timeOut) {
                return timeOut > 3 * 60 * 60 * 1000 ? true : new Error();
              }).then(function() {
                return $http.get('http://g0v.github.io/blood/blood.json');
              }).then(function(res) {
                var reply = {
                  taipei: {},
                  hsinchu: {},
                  taichung: {},
                  tainan: {},
                  kaohsiung: {},
                  hualien: {},
                };

                [
                  {key: 'taipei', name: '台北捐血中心'},
                  {key: 'hsinchu', name: '新竹捐血中心'},
                  {key: 'taichung', name: '台中捐血中心'},
                  {key: 'tainan', name: '台南捐血中心'},
                  {key: 'kaohsiung', name: '高雄捐血中心'},
                  {key: 'hualien', name: '花蓮捐血中心'}
                ].forEach(function(item) {
                  var data = res.data[item.name];
                  reply[item.key].a = data.StorageA;
                  reply[item.key].b = data.StorageB;
                  reply[item.key].ab = data.StorageAB;
                  reply[item.key].o = data.StorageO;
                });

                blood = reply;

                return JSON.stringify(reply);
              }).then(function(reply) {
                localStorage.lastBloodStorage = new Date().getTime();

                $cordovaFile.writeFile(
                  cordova.file.dataDirectory,
                  fileName,
                  reply,
                  true
                );

                return blood;
              })
              .always(function() {
                return this.load('cache');
              }.bind(this));
          default:
            return !status ? this.load('file') : this.load('wget');
        }
      },
      getLastTimes: function() {
        return new Date(localStorage.lastBloodStorage || 0);
      },
      getAutoLoad: function() {
        return localStorage.autoBloodStorage || false;
      },
      setAutoLoad: function(toggle) {
        localStorage.autoBloodStorage = toggle ? true : false;
      }
    };
  }
)

.service(
  'station',
  function($q, $http, $cordovaFile) {
    var station = null;
    var fileName = 'station.json';

    var parser = function(result) {
      return {
        id: result.id,
        city: result.get('city'),
        name: result.get('name'),
        mode: result.get('mode'),
        location: result.get('location').toJSON(),
        detail: result.get('detail'),
        service: result.get('service')
      };
    };

    return {
      load: function(status) {
        switch(status) {
          case 'cache':
            return Parse.Promise.as(station);
          case 'file':
            return Parse.Promise.as(fileName)
              .then(function(fileName) {
                return $cordovaFile.readAsText(cordova.file.dataDirectory, fileName);
              })
              .then(function (success) {
                station = JSON.parse(success);
                return;
              }, function() {
                localStorage.lastServiceStation = 0;
                return;
              })
              .always(function() {
                return this.load('wget');
              }.bind(this));
          case 'wget':
            var timeOut = (new Date().getTime() - (localStorage.lastServiceStation || 0)) > 3 * 24 * 60 * 60 * 1000;
            return timeOut ? this.load('parse') : this.load('cache');
          case 'parse':
            var ServiceStation = Parse.Object.extend('ServiceStation');
            var query = new Parse.Query(ServiceStation);

            return query.limit(1000).find()
              .then(function(results) {
                station = [];

                results.forEach(function(result) {
                  station.push(parser(result));
                });

                return JSON.stringify(station);
              })
              .then(function(reply) {
                localStorage.lastServiceStation = new Date().getTime();

                return $cordovaFile.writeFile(
                  cordova.file.dataDirectory,
                  fileName,
                  reply,
                  true
                );
              })
              .always(function() {
                return this.load('cache');
              }.bind(this));
          default:
            return !status ? this.load('file') : this.load('wget');
        }
      },
      getLastTimes: function() {
        return new Date(localStorage.lastServiceStation || 0);
      },
      getAutoLoad: function() {
        return localStorage.autoServiceStation || false;
      },
      setAutoLoad: function(toggle) {
        localStorage.autoServiceStation = toggle ? true : false;
      }
    };
  }
)

.service(
  'greatCircle',
  function() {
    return {
      validateRadius: function(unit) {
          var r = {'KM': 6371.009, 'MI': 3958.761, 'NM': 3440.070, 'YD': 6967420, 'FT': 20902260};
          if ( unit in r ) return r[unit];
          else return unit;
      },
      distance: function(lat1, lon1, lat2, lon2, unit) {
          if ( unit === undefined ) unit = 'KM';
          var r = this.validateRadius(unit); 
          lat1 *= Math.PI / 180;
          lon1 *= Math.PI / 180;
          lat2 *= Math.PI / 180;
          lon2 *= Math.PI / 180;
          var lonDelta = lon2 - lon1;
          var a = Math.pow(Math.cos(lat2) * Math.sin(lonDelta) , 2) + Math.pow(Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lonDelta) , 2);
          var b = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lonDelta);
          var angle = Math.atan2(Math.sqrt(a) , b);
          
          return angle * r;
      },
      bearing: function(lat1, lon1, lat2, lon2) {
          lat1 *= Math.PI / 180;
          lon1 *= Math.PI / 180;
          lat2 *= Math.PI / 180;
          lon2 *= Math.PI / 180;
          var lonDelta = lon2 - lon1;
          var y = Math.sin(lonDelta) * Math.cos(lat2);
          var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lonDelta);
          var brng = Math.atan2(y, x);
          brng = brng * (180 / Math.PI);
          
          if ( brng < 0 ) { brng += 360; }
          
          return brng;
      },
    };
  }
);