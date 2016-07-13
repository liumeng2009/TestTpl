/**
 * Created by Administrator on 2016/7/11.
 */
angular.module('schoolControllers',[])
  .controller('SchoolEditCtrl',['$scope','$rootScope','$state','$stateParams','$schoolData','$ionicLoading','$ionicPopup','$timeout','$window',function($scope,$rootScope,$state,$stateParams,$schoolData,$ionicLoading,$ionicPopup,$timeout,$window){
    $scope.$on('$ionicView.afterEnter',function(){
      //$("#city1").citySelect({nodata: "none", required: false});
      var token=$window.localStorage.accesstoken;
      if(token){
        $schoolData.school({token:token,id:$stateParams.id})
          .success(function(data){
            $ionicLoading.hide();
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg);
            }else{
              $scope.school=data.school;
            }
          })
          .error(function(){
            $ionicLoading.hide();
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{
        $ionicLoading.hide();
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
  }])
  .controller('SchoolListCtrl',['$scope','$rootScope','$state','$schoolData','$ionicLoading','$ionicPopup','$timeout','$window',function($scope,$rootScope,$state,$schoolData,$ionicLoading,$ionicPopup,$timeout,$window){
    $scope.$on('$ionicView.afterEnter',function(){
      $ionicLoading.show({
        delay:200
      });
      var token=$window.localStorage.accesstoken;
      if(token){
        $schoolData.list({token:token})
          .success(function(data){
            $ionicLoading.hide();
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg);
            }else{
              $scope.schools=data.schools;
            }
          })
          .error(function(){
            $ionicLoading.hide();
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{
        $ionicLoading.hide();
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
    $scope.goAdd=function(){
      $state.go('school.add');
    }
  }]);
;
