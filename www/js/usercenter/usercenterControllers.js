/**
 * Created by Administrator on 2016/6/29.
 */
angular.module('usercenterControllers',[])
  .controller('UserCenterCtrl',['$scope','$rootScope','$state','$usercenterData','$ionicLoading','$ionicPopup','$timeout','$window',function($scope,$rootScope,$state,$usercenterData,$ionicLoading,$ionicPopup,$timeout,$window){
    $scope.$on('$ionicView.afterEnter',function(){
      var token=$window.localStorage.accesstoken;
      if(token){
        $usercenterData.usercenter({token:token})
          .success(function(data){
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg);
            }else{
              $scope.user=data.user;
            }
          })
          .error(function(){
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{
      }
    });
    $scope.showErrorMesPopup = function(title) {
      var myPopup = $ionicPopup.show({
        title: '<b>'+title+'</b>'
      });
      $timeout(function() {
        myPopup.close(); // 2秒后关闭
      }, 1000);
    };
    $scope.logout=function(){
      $window.localStorage.accesstoken=undefined;
      $scope.user=undefined;
    }
  }]);
