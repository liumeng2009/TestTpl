/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('loginControllers',[])
  .controller('LoginCtrl',['$scope','$state','$stateParams','$ionicModal','$loginData','$ionicLoading','$ionicPopup','$timeout','$window','$ionicHistory','$cordovaLocalNotification','$cordovaToast',function($scope,$state,$stateParams,$ionicModal,$loginData,$ionicLoading,$ionicPopup,$timeout,$window,$ionicHistory,$cordovaLocalNotification,$cordovaToast){
    $ionicModal.fromTemplateUrl('templates/reg.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal_reg = modal;
    });
    $scope.showReg=function(){
      $scope.modal_reg.show();
    }
    $scope.hideReg=function(){
      $scope.modal_reg.hide();
    }
    $scope.user={
      username:'',
      password:''
    }
    $scope.backLeft=function(){
      $state.go(-1);
    }
    $scope.scheduleSingleNotification = function () {
      $cordovaLocalNotification.schedule({
        id: 1,
        title: 'Title here',
        text: 'Text here',
        data: {
          customProperty: 'custom value'
        }
      }).then(function (result) {
        // ...
      });
    };
    $scope.doLogin=function(){
      $ionicLoading.show({
        delay:200
      });
      $loginData.login(this.user).success(function(data){
        $ionicLoading.hide();
        if(data.success === 0){
          $scope.showErrorMesPopup(data.success+data.msg);
        }else{
          //成功，把token存入localStorage
          $window.localStorage.accesstoken=data.token;
          $scope.scheduleSingleNotification();
          //登录成功之后，跳转
          if($stateParams.redirectUrl){
            $state.go($stateParams.redirectUrl);
          }
          else{
            $state.go('tab.usercenter');
          }
        }
      }).error(function(data,status,headers,config){
        $ionicLoading.hide();
        $scope.showErrorMesPopup('error'+data);
      });
    }
    $scope.showErrorMesPopup = function(title) {
      //alert(title);

      $cordovaToast
        .show(title, 'short', 'center')
        .then(function(success) {
          // success
        }, function (error) {
          // error
        });

      /*
      var myPopup = $ionicPopup.show({
        title: title
      });
      $timeout(function() {
        myPopup.close();
      }, 1000);
      */
    };
    $scope.doRegister=function(){
      $ionicLoading.show({
        delay:200
      });
      $loginData.reg(this.user).success(function(data){
        $ionicLoading.hide();
        if(data.success === 0){
          $scope.showErrorMesPopup(data.msg);
        }else{
          //成功，把token存入localStorage
          $window.localStorage.accesstoken=data.token;
          //$ionicHistory.goBack(-1);
          $scope.modal_reg.hide();
          $state.go('tab.usercenter');
        }
      }).error(function(){
        $ionicLoading.hide();
        $scope.showErrorMesPopup('网络连接错误');
      });
    }
  }]);
