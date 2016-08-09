/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('loginControllers',[])
  .controller('LoginCtrl',['$scope','$state','$stateParams','$ionicModal','$loginData','$ionicLoading','$ionicPopup','$timeout','$window','$ionicHistory','$cordovaLocalNotification','$cordovaToast','$cordovaKeyboard','$cordovaSQLite',function($scope,$state,$stateParams,$ionicModal,$loginData,$ionicLoading,$ionicPopup,$timeout,$window,$ionicHistory,$cordovaLocalNotification,$cordovaToast,$cordovaKeyboard,$cordovaSQLite){
    $ionicModal.fromTemplateUrl('templates/reg.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal_reg = modal;
    });
    $scope.showReg=function(){
      $scope.modal_reg.show();
      //开启键盘
      //$cordovaKeyboard.show();
      //$scope.regStart=true;
    }
    $scope.showFind=function(){
      $scope.showErrorMesPopup('未完成');
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
      alert(12333333);
      $ionicLoading.show({
        delay:200
      });
      alert(22222222222222);
      $loginData.login(this.user).success(function(data){
        $ionicLoading.hide();
        alert(44444444444444);
        if(data.success === 0){
          alert(5555555555555);
          $scope.showErrorMesPopup(data.success+data.msg);
        }else{
          alert(66666666666666666);
          //成功，把token存入localStorage
          $window.localStorage.accesstoken=data.user.token;
          //测试本地通知
          //$scope.scheduleSingleNotification();
          //sql存储登录信息
          /*
          var db=$cordovaSQLite.openDB({ name: "sf.db" });

          db.sqlBatch([
            'CREATE TABLE IF NOT EXISTS tb_login (name,token,image)',
            [ 'INSERT INTO DemoTable VALUES (?,?)', ['Alice', 101] ]
          ], function() {
            //console.log('Populated database OK');
          }, function(error) {
            //console.log('SQL batch ERROR: ' + error.message);
          });
          */

          //登录成功之后，跳转
          if($stateParams.redirectUrl){
            $state.go($stateParams.redirectUrl);
          }
          else{
            $state.go('tab.usercenter');
          }
        }
      }).error(function(data,status,headers,config){
        alert(88888888);
        $ionicLoading.hide();
        $scope.showErrorMesPopup('error'+data);
      });
    }
    $scope.showErrorMesPopup = function(title) {
      alert(99999999999);
      $cordovaToast
        .show(title, 'short', 'center')
        .then(function(success) {
          // success
        }, function (error) {
          // error
        });
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
