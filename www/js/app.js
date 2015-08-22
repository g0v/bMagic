var AREA = {
  taipei: {
    display: '臺北捐血中心',
    info: '臺北（臺北、新北、基隆）',
    index: 1
  },
  hsinchu: {
    display: '新竹捐血中心',
    info: '新竹（桃園、新竹、苗栗）',
    index: 2
  },
  taichung: {
    display: '臺中捐血中心',
    info: '臺中（臺中、彰化、南投）',
    index: 3
  },
  tainan: {
    display: '臺南捐血中心',
    info: '臺南（雲林、嘉義、臺南）',
    index: 4
  },
  kaohsiung: {
    display: '高雄捐血中心',
    info: '高雄（高雄、屏東、澎湖）',
    index: 5
  },
  hualien: {
    display: '花蓮捐血中心',
    info: '花蓮（宜蘭、花蓮、臺東）',
    index: 6
  }
};

var BLOOD = {
  a: {
    display: 'A型',
    index: 1
  },
  b: {
    display: 'B型',
    index: 2
  },
  ab: {
    display: 'AB型',
    index: 3
  },
  o: {
    display: 'O型',
    index: 4
  }
};

angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova'])

.filter('bloodStorage', function() {
  return function(data) {
    var storage = {
      full: '正常',
      medium: '偏低',
      empty: '急缺'
    };

    return storage[data] || '異常';
  };
})

.filter('delayDate', function() {
  return function(data) {
    return new Date(new Date().getTime() + data * 24 * 60 * 60 * 1000);
  };
})

.filter('distance', function(greatCircle) {
  return function(input, location) {
    input.forEach(function(item) {
      var distance = greatCircle.distance(
        location.latitude,
        location.longitude,
        item.location.latitude,
        item.location.longitude
      );

      item.distance = distance;

      if (distance < 1) {
        item.distanceDisplay = Math.round(distance * 1000) + 'm';
      } else if (distance < 10) {
        item.distanceDisplay = (Math.round(distance * 100) / 100) + 'km';
      } else {
        item.distanceDisplay = Math.round(distance) + 'km';
      }
      
      item.bearing = greatCircle.bearing(
        location.latitude,
        location.longitude,
        item.location.latitude,
        item.location.longitude
      ) - location.heading;

      if (item.bearing < 0) {
        item.bearing += 360;
      }

      if (item.bearing < 22.5) {
        item.bearing = 0;
      } else if (item.bearing < 45 + 22.5) {
        item.bearing = 45;
      } else if (item.bearing < 90 + 22.5) {
        item.bearing = 90;
      } else if (item.bearing < 135 + 22.5) {
        item.bearing = 135;
      } else if (item.bearing < 180 + 22.5) {
        item.bearing = 180;
      } else if (item.bearing < 225 + 22.5) {
        item.bearing = 225;
      } else if (item.bearing < 270 + 22.5) {
        item.bearing = 270;
      } else if (item.bearing < 315 + 22.5) {
        item.bearing = 315;
      } else {
        item.bearing = 0;
      }
    });
    return input;
  };
})

.filter('inService', function(greatCircle) {
  return function(input) {
    var today = new Date();
    today.setTime(today.getTime() + ((today.getTimezoneOffset() + 480) * 60 * 1000));

    var day = today.getDay() + 'n';
    var date = today.getDate() + 'd';
    var month = (today.getMonth()+1) + 'm';
    var week = Math.ceil(((today.getMonth()+1) + 6 - today.getDay()) / 7) + 'w';
    var clock = today.getHours() * 60 + today.getMinutes();
    var d = [date, month+date];
    var n = [day, week+day, month+week+day];

    input.forEach(function(item) {
      var keys = Object.keys(item.service.rule);
      var service;
      if (keys.length === 1 && keys[0] === 'e') {
        service = item.service.rule.e;
      } else {
        for (var i = keys.length - 1; i >= 0; i--) {
          var key = keys[i];
          var matcher = /\dd/gi.test(key) ? d : n;

          var index = matcher.indexOf(key);
          if (index > -1) {
            service = item.service.rule[matcher[index]];
            break;
          }
        }
      }

      item.inService = false;
      if (service) {
        if (clock < service.start) {
          if (service.start - clock < 60) {
            item.serviceDisplay = '服務準備中，將於 ' + (service.start - clock) + '分鐘 後開始';
          } else {
            item.serviceDisplay = '本日服務尚未開始';
          }
        } else if (clock < service.end) {
          item.inService = true;

          if (service.end - clock < 60) {
            item.serviceDisplay = '服務中，將於 ' + (service.end - clock) + '分鐘 後結束';
          } else {
            item.serviceDisplay = '服務中';
          }
        } else {
          item.serviceDisplay = '本日服務已結束';
        }
      } else {
        item.serviceDisplay = '本日不提供服務';
      }
    });
    return input;
  };
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.dashboard', {
    url: '/dashboard',
    views: {
      'menuContent': {
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardCtrl'
      }
    }
  })

  .state('app.notification', {
    url: '/notification',
    views: {
      'menuContent': {
        templateUrl: 'templates/notification.html',
        controller: 'NotificationCtrl'
      }
    }
  })

  .state('app.station', {
    url: '/station',
    views: {
      'menuContent': {
        templateUrl: 'templates/station.html',
        controller: 'StationCtrl'
      }
    }
  })

  .state('app.report', {
    url: '/report',
    views: {
      'menuContent': {
        templateUrl: 'templates/report.html',
        controller: 'ReportCtrl'
      }
    }
  })

  .state('app.badge', {
    url: '/badge',
    views: {
      'menuContent': {
        templateUrl: 'templates/badge.html',
        controller: 'BadgeCtrl'
      }
    }
  })

  .state('app.about', {
    url: '/about',
    views: {
      'menuContent': {
        templateUrl: 'templates/about.html',
        controller: 'AboutCtrl'
      }
    }
  });

  $urlRouterProvider.otherwise('/app/dashboard');
})

.run(function(
  $ionicPlatform
) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

  $ionicPlatform.ready(function() {
    ParseInstallation
      .initialize(
        configs.parseId,
        configs.parseKey,
        {
          android: {'senderID': configs.gcmSenderID},
          ios: {},
          onNotification: function(notification) {
            $rootScope.$broadcast('notificationReceived', notification);
          }
        }
      )
      .then(function(installation) {
        // alert('New object created with objectId: ' + installation.id);
      });
  });
});