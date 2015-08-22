(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Allow for MSIE11 msCrypto
  var _crypto = _global.crypto || _global.msCrypto;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _crypto && _crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      _crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // uuid v4
  function uuid() {
    var rnds = _rng();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    bth = _byteToHex;
    return  bth[rnds[i++]] + bth[rnds[i++]] +
            bth[rnds[i++]] + bth[rnds[i++]] + '-' +
            bth[rnds[i++]] + bth[rnds[i++]] + '-' +
            bth[rnds[i++]] + bth[rnds[i++]] + '-' +
            bth[rnds[i++]] + bth[rnds[i++]] + '-' +
            bth[rnds[i++]] + bth[rnds[i++]] +
            bth[rnds[i++]] + bth[rnds[i++]] +
            bth[rnds[i++]] + bth[rnds[i++]];
  }

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

  var pushToken;
  var onNotification;

  _global.ParseInstallation = {
    listenNotification: function (notification) {
    },
    initialize: function (appId, appKey, config) {
      var q = deferred();

      Parse.initialize(appId, appKey);

      setTimeout(function() {
        q.resolve();
      });

      return toReturn(q);
    },
    getAppName: function() {
      return null;
    },
    getPackageName: function() {
      return null;
    },
    getVersionNumber: function() {
      return null;
    },
    getVersionCode: function() {
      return null;
    }
  };
}).call(this);