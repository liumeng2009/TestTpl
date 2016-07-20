/**
 * Created by liumeng on 2016/7/18.
 */
/**
 * Created by Administrator on 2016/6/27.
 */
var iosocket;
angular.module('chatControllers',[])
  .controller('ChatCtrl',['$scope','$rootScope','$sce','$state','$stateParams','$loginData','$ionicLoading','$ionicPopup','$timeout','$window','$ionicHistory','$ionicScrollDelegate',function($scope,$rootScope,$sce,$state,$stateParams,$loginData,$ionicLoading,$ionicPopup,$timeout,$window,$ionicHistory,$ionicScrollDelegate){
    $scope.messages=[];
    $scope.fromuser={};
    $scope.touser={};
    $scope.sendMessage='';
    $scope.$on('$ionicView.afterEnter',function(){
      //$scope.to=$stateParams.to.name;
      //及时聊天相关
      //连接服务
      iosocket = io.connect('http://localhost:3000');
      //发出登录请求
      iosocket.emit('login', {
        username: $stateParams.from.name,
        userid:$stateParams.from._id,
        tousername:$stateParams.to.name,
        touserid:$stateParams.to._id
      });
      iosocket.on('connect',function(){
        iosocket.on('loginsuccess',function(obj){
          $scope.fromuser=obj.user;
          $scope.touser=obj.userto;
          $scope.$apply();
        });
        iosocket.on('from'+$stateParams.to._id+'to'+$stateParams.from._id,function(obj){
          var _m={
            type:'to',
            image:obj.user.image,
            username:obj.user.name,
            mess:obj.message
          }
          $scope.messages.push(_m);
          $scope.$apply();
          $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
        })
      });
    });
    $scope.send=function(){
      iosocket.emit('private message',$stateParams.from._id,$stateParams.to._id,$scope.sendMessage);
      var _m={
        type:'from',
        image:$scope.fromuser.image,
        username:$scope.fromuser.name,
        mess:$scope.sendMessage
      }
      $scope.messages.push(_m);
      $scope.sendMessage='';
      $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
    };
    $rootScope.$on('$stateChangeStart',function(){
      iosocket.emit('logout',$stateParams.from._id);
    });
  }]);
