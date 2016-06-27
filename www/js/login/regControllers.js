/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('regControllers',[])
  .controller('regCtrl',function($scope,$rootScope){
    $scope.hideHeader=true;
    $scope.submitForm=function(isValid){
      if(!isValid){
        alert('验证失败');
      }
    }
  })
