var reply = [
  '謝謝',
  '我知道了',
  '已經收到你的通知',
  '好啦',
  '努力中',
  '朕知道了',
  '好',
  '工程師加班中',
  '不然要幹麻',
  '好害羞',
  '記得要用喔',
  '不要刪我喔'
];

angular.module('starter.controllers', [])

.controller('AppCtrl', function(
  $rootScope
) {

  $rootScope.area = AREA;
  $rootScope.blood = BLOOD;
  
  $rootScope.areaIndex = Object.keys(AREA).sort(function(a, b){
    return b.index-a.index;
  });

  $rootScope.bloodIndex = Object.keys(BLOOD).sort(function(a, b){
    return b.index-a.index;
  });

})

.controller('DashboardCtrl', function(
  $scope,
  $cordovaProgress,
  $cordovaDialogs,
  $ionicPlatform,
  blood
) {
  $scope.bloodStorages = {};

  $scope.reload = function() {
    $cordovaProgress.showSimpleWithLabel(true, '更新血量資訊');

    blood
      .load()
      .then(function(reply) {
        $scope.bloodStorages = reply;
        $scope.$broadcast('scroll.refreshComplete');
        $cordovaProgress.hide();
      }, function(err) {
        $cordovaDialogs.alert('網路異常', '錯誤');
        $scope.$broadcast('scroll.refreshComplete');
        $cordovaProgress.hide();
      });
  };

  $ionicPlatform.ready(function() {
    $scope.reload();
  });
})

.controller('StationCtrl', function(
  $scope,
  $cordovaProgress,
  $cordovaDialogs,
  $ionicPlatform,
  $cordovaActionSheet,
  $cordovaGeolocation,
  $cordovaDeviceOrientation,
  $timeout,
  $state,
  $q,
  station
) {
  $scope.station = [];

  $scope.location = {
    latitude: 25.039149,
    longitude: 121.517263,
    heading: 0
  };

  var posOptions = {
    timeout : 10000,
    enableHighAccuracy: true
  };

  var watchGeo = function() {
    $q.all({
      position: $cordovaGeolocation.getCurrentPosition(posOptions),
      heading: $cordovaDeviceOrientation.getCurrentHeading()
    })
    .then(function(reply) {
      if (reply && reply.position) {
        $scope.location.latitude = reply.position.coords.latitude;
        $scope.location.longitude = reply.position.coords.longitude;
      }
      if (reply && reply.heading) {
        $scope.location.heading = reply.heading.trueHeading || reply.heading.magneticHeading;
      }

      if ($state.current.name === 'app.station') {
        $timeout(watchGeo, 3000);
      }
    }, function() {
      if ($state.current.name === 'app.station') {
        $timeout(watchGeo, 3000);
      }
    });
  };

  $scope.doit = function(item) {

    var options = {
      title: item.name,
      buttonLabels: ['行人導航'],
      addCancelButtonWithLabel: '取消',
      androidEnableCancelButton : true,
      winphoneEnableCancelButton : true
    };

    $cordovaActionSheet.show(options)
      .then(function(index) {
        if (index === 1) {
          launchnavigator.navigate(
            [item.location.latitude, item.location.longitude],
            null,
            function(){},
            function(error){},
            {preferGoogleMaps: true}
          );
        }
      });
  };

  $ionicPlatform.ready(function() {
    $cordovaProgress.showSimpleWithLabel(true, '更新捐血站資訊');

    station.load().then(function(results) {
      $scope.station = results;
      $scope.$broadcast('scroll.refreshComplete');
      $cordovaProgress.hide();
    });

    watchGeo();
  });
})

.controller('AboutCtrl', function(
  $scope,
  station
) {
  $scope.lastServiceStation = station.getLastTimes();
  $scope.autoServiceStation = station.getAutoUpgrade();

})

.controller('NotificationCtrl', function(
  $q,
  $scope,
  $cordovaProgress,
  $cordovaDialogs,
  $cordovaToast,
  $ionicPlatform,
  installation
) {
  $scope.input = {
    blood: 'a',
    area: 'taipei',
    delayDays: 1
  };

  $scope.saved = false;

  $ionicPlatform.ready(function() {
    $cordovaProgress.showSimpleWithLabel(true, '取得提醒資訊');

    var deferred = $q.defer();

    deferred
      .promise
      .then(function() {
        return installation
          .getDelay()
          .then(function(delay) {
            $scope.input.delayDays = delay;
            return;
          });
      })
      .then(function() {
        return installation
          .getSubscriptions()
          .then(function(listen) {
            for (var i = 0; i < listen.length; i++) {
              item = /^storage_(\w+)_(\w+)$/gi.exec(listen[i]);
              if (item) {
                $scope.saved = true;
                $scope.input.area = item[1];
                $scope.input.blood = item[2];
                return;
              }
            }
            return;
          });
      })
      .then(function() {
        $cordovaProgress.hide();
      }, function(err) {
        $cordovaProgress.hide();
        
        if (err.code == 100) {
          $cordovaDialogs.alert('網路異常', '錯誤');
        } else {
          $cordovaDialogs.alert(err.message, '錯誤');
        }
      });

    deferred.resolve();
  });

  $scope.delay = function() {
    $cordovaProgress.showSimpleWithLabel(true, '設定延後');

    installation
      .setDelay($scope.input.delayDays)
      .then(function() {
        $cordovaProgress.hide();
        $cordovaToast.showShortBottom('設定延後完成');
      }, function(err) {
        $cordovaProgress.hide();
        
        if (err.code == 100) {
          $cordovaDialogs.alert('網路異常', '錯誤');
        } else {
          $cordovaDialogs.alert(err.message, '錯誤');
        }
      });
  };

  $scope.listener = function() {
    var listen = [
      'storage_' + $scope.input.area + '_' + $scope.input.blood,
      'storage_' + $scope.input.blood,
      'storage_' + $scope.input.area
    ];
    
    installation.subscribe(listen);

    $scope.saved = true;
  };

  $scope.unListener = function() {
    installation.unsubscribe(/^storage_.+/gi);

    $scope.saved = false;
  };
})

.controller('ReportCtrl', function(
  $scope,
  $cordovaToast
) {
  $scope.need = function() {
    var n = Math.floor(Math.random() * reply.length);  
    $cordovaToast.showShortCenter(reply[n]);

    Parse.Cloud.run('need', {
      'feature': 'report'
    });
  };
})

.controller('BadgeCtrl', function(
  $scope,
  $cordovaToast
) {
  $scope.need = function() {
    var n = Math.floor(Math.random() * reply.length);  
    $cordovaToast.showShortCenter(reply[n]);

    Parse.Cloud.run('need', {
      'feature': 'badge'
    });
  };
});
