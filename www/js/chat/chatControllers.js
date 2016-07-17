/**
 * Created by liumeng on 2016/7/18.
 */
/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('chatControllers',[])
  .controller('ChatCtrl',['$scope','$state','$stateParams','$loginData','$ionicLoading','$ionicPopup','$timeout','$window','$ionicHistory',function($scope,$state,$stateParams,$loginData,$ionicLoading,$ionicPopup,$timeout,$window,$ionicHistory){
    $scope.$on('$ionicView.afterEnter',function(){
      $scope.fromto={
        from:$stateParams.from,
        to:$stateParams.to
      }
    })
  }]);
