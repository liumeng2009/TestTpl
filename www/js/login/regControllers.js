/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('regControllers',[])
  .controller('RegCtrl',['$scope','$regData',function($scope,$regdata){
    $scope.doRegister=function(){
      alert(456);
    }
  }])
