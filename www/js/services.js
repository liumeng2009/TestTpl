angular.module('starter.services', ['loginServices','usercenterServices','schoolServices','gradeServices','childrenServices','mainServices'])
  .factory('$SFTools',['$cordovaToast','$cordovaSQLite','$cordovaDialogs',function($cordovaToast,$cordovaSQLite,$cordovaDialogs){
    return {
      myToast:function(msg){
        document.addEventListener('deviceready',function() {
          $cordovaToast
            .show(msg, 'short', 'center')
            .then(function (success) {
            }, function (error) {
            });
        });
      },
      myDialog:function(msg,title,buttonName,callback){
        document.addEventListener('deviceready',function() {
          $cordovaDialogs
            .alert(msg, title,buttonName)
            .then(function (success) {
              callback();
            });
        });
      },
      getToken:function(callback){

      }
    }
  }]);
