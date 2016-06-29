/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('loginControllers',[])
  .controller('LoginCtrl',['$scope','$state','$loginData','$ionicLoading','$ionicPopup','$timeout',function($scope,$state,$loginData,$ionicLoading,$ionicPopup,$timeout){
    $scope.user={
      username:'dreams',
      password:'123456'
    }
    $scope.doLogin=function(){
      $ionicLoading.show({
        delay:200
      });
      $loginData.login(this.user).success(function(data){
        $ionicLoading.hide();
        if(data.success === 0){
          $scope.showErrorMesPopup(data.msg);
        }else{
          $state.go('tab.dash')
        }
      }).error(function(){
        $ionicLoading.hide();
        $scope.showErrorMesPopup('网络连接错误');
      });
    }
    $scope.showErrorMesPopup = function(title) {
      var myPopup = $ionicPopup.show({
        title: '<b>'+title+'</b>'
      });
      $timeout(function() {
        myPopup.close(); // 2秒后关闭
      }, 1000);
    };
  }]);
