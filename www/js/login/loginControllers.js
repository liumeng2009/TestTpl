/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('loginControllers',[])
  .controller('LoginCtrl',['$scope','$loginData',function($scope,$loginData){
    $scope.doLogin=function(){
      alert(123);
    }
  }]);
