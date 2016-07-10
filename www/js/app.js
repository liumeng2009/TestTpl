// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
  $ionicConfigProvider.views.transition('ios');
  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.tabs.style('standard');
  var configProperties = {
    views: {
      maxCache: 5,
      forwardCache: true,
      transition: 'ios'
    },
    navBar: {
    },
    backButton: {
      icon: 'ion-chevron-left',
      text: '&nbsp;',
      previousTitleText: false
    },
    templates: {
      // maxPrefetch: 0
    }
  };
  $ionicConfigProvider.setPlatformConfig('ios', configProperties);
  $ionicConfigProvider.setPlatformConfig('android', configProperties);
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
  // setup an abstract state for the tabs directive
    .state('login',{
      url:'/login',
      templateUrl:'js/login/login.html',
      controller:'LoginCtrl'
    })
    .state('reg',{
      url:'/reg',
      templateUrl:'js/login/reg.html',
      controller:'RegCtrl'
    })
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'js/usercenter/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.weibo', {
    url: '/weibo',
    views: {
      'tab-weibo': {
        templateUrl: 'js/weibo/weibo.html',
        controller:'WeiboCtrl'
      }
    }
  })

  .state('tab.children', {
      url: '/children',
      views: {
        'tab-children': {
          templateUrl: 'js/children/children.html'
        }
      }
    })
    .state('tab.usercenter', {
      url: '/usercenter',
      views: {
        'tab-usercenter': {
          templateUrl: 'js/usercenter/usercenter.html',
          controller:'UserCenterCtrl'
        }
      }
    })
    .state('school',{
      url:'/school',
      abstract:true,
      templateUrl:'js/school/base.html'
    })
    .state('school.list',{
      url:'/list',
      templateUrl:'js/school/school_list.html',
      controller:'SchoolCtrl'
    })
    .state('school.add',{
      url:'/add',
      templateUrl:'js/school/school.html',
    })
    /*
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  })
  */
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/weibo');

});
