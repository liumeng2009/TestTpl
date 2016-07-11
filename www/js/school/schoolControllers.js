/**
 * Created by Administrator on 2016/7/11.
 */
angular.module('schoolControllers',[])
  .controller('SchoolCtrl',['$scope','$rootScope','$state','$schoolData','$ionicLoading','$ionicPopup','$timeout','$window',function($scope,$rootScope,$state,$schoolData,$ionicLoading,$ionicPopup,$timeout,$window){
    $scope.$on('$ionicView.afterEnter',function(){
      $("#city1").citySelect({nodata: "none", required: false});
      var token=$window.localStorage.accesstoken;
      if(token){

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
