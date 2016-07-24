/**
 * Created by liumeng on 2016/7/18.
 */
/**
 * Created by Administrator on 2016/6/27.
 */
var iosocket;
angular.module('chatControllers',[])
  .controller('ChatCtrl',['$scope','$rootScope','$sce','$state','$stateParams','$loginData','$ionicLoading','$ionicPopup','$timeout','$window','$ionicHistory','$ionicScrollDelegate','$usercenterData',function($scope,$rootScope,$sce,$state,$stateParams,$loginData,$ionicLoading,$ionicPopup,$timeout,$window,$ionicHistory,$ionicScrollDelegate,$usercenterData){
    $scope.messages=[];
    $scope.fromuser={};
    $scope.touser={};
    $scope.sendMessage='';
    $scope.$on('$ionicView.afterEnter',function(){
      //$scope.to=$stateParams.to.name;
      //及时聊天相关
      //连接服务
      var token=$window.localStorage.accesstoken;
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
            image:$scope.touser.image,
            username:$scope.touser.name,
            mess:obj.message
          }
          $scope.messages.push(_m);
          $scope.$apply();
          $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
          //接到信息后，存入本地存储，用于main页面
          $scope.saveChat(token,$stateParams.to._id,obj.message);


        })
      });
    });
    $scope.showErrorMesPopup = function(title,cb) {
      var myPopup = $ionicPopup.show({
        title: '<b>'+title+'</b>'
      });
      $timeout(function() {
        myPopup.close(); // 2秒后关闭
        cb();
      }, 1000);
    };
    $scope.send=function(){
      var token=$window.localStorage.accesstoken;
      if(token) {
        iosocket.emit('private message', $stateParams.from._id, $stateParams.to._id, $scope.sendMessage);
        var _m = {
          type: 'from',
          image: $scope.fromuser.image,
          username: $scope.fromuser.name,
          mess: $scope.sendMessage
        }
        $scope.messages.push(_m);
        var messs=$scope.sendMessage;
        $scope.sendMessage = '';
        $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
        $scope.saveChat(token,$stateParams.to._id,messs);

      }
      else{
        $state.go('login');
      }



    };
    $scope.saveChat=function(token,userid,content){
      //发送完毕后，将对象存入本地存储，体现在main页面
      var chats = $window.localStorage.chats? JSON.parse($window.localStorage.chats):[];
      if(!$window.localStorage.chats){
        $window.localStorage.chats=[];
        //说明没有和这个人说过，需要存入新的对象
        $usercenterData.user_by_id({token: token,id:userid})
          .success(function(data){
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg,function(){
                $state.go('login');
              });
            }else{
              var user=data.user;
              var chat={
                id:user._id,
                name:user.name,
                image:user.image,
                content:content,
              }
              chats.push(chat);
              $window.localStorage.chats=JSON.stringify(chats);
            }
          })
          .error(function(){
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === userid) {
          chats[i].content = content;
          $window.localStorage.chats= JSON.stringify(chats);
        }
        else if(i===chats.length-1){
          //说明没有和这个人说过，需要存入新的对象
          $usercenterData.user_by_id({token: token,id:userid})
            .success(function(data){
              if(data.success === 0){
                $scope.showErrorMesPopup(data.msg,function(){
                  $state.go('login');
                });
              }else{
                var user=data.user;
                var chat={
                  id:user._id,
                  name:user.name,
                  image:user.image,
                  content:content
                }
                chats.push(chat);
                $window.localStorage.chats= JSON.stringify(chats);
              }
            })
            .error(function(){
              $scope.showErrorMesPopup('网络连接错误');
            });
        }
      }
    }
    $rootScope.$on('$stateChangeStart',function(){
      iosocket.emit('logout',$stateParams.from._id);
    });
  }]);
