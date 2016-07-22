/**
 * Created by Administrator on 2016/7/22.
 */
angular.module('mainControllers',[])
  .controller('MainCtrl',['$scope','$rootScope','$state','$ionicModal','$mainData','$ionicLoading','$ionicPopup','$timeout','$window',function($scope,$rootScope,$state,$ionicModal,$mainData,$ionicLoading,$ionicPopup,$timeout,$window){
    $scope.$on('$ionicView.afterEnter',function(){
      var token=$window.localStorage.accesstoken;
      if(token){
        $mainData.list({token:token})
          .success(function(data){
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg);
            }else{
              $scope.chats=data.chats;
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
  }]);
