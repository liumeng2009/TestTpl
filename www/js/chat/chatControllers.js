/**
 * Created by liumeng on 2016/7/18.
 */
/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('chatControllers',[])
  .controller('ChatCtrl',['$scope','$sce','$state','$stateParams','$loginData','$ionicLoading','$ionicPopup','$timeout','$window','$ionicHistory',function($scope,$sce,$state,$stateParams,$loginData,$ionicLoading,$ionicPopup,$timeout,$window,$ionicHistory){
    $scope.$on('$ionicView.afterEnter',function(){
      $scope.chaturl=$sce.trustAsResourceUrl('http://127.0.0.1:3000/chat.html?from='+$stateParams.from+'&to='+$stateParams.to);
    });
  }]);
