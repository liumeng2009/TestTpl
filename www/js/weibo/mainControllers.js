/**
 * Created by Administrator on 2016/7/22.
 */
angular.module('mainControllers',[])
  .controller('MainCtrl',['$scope','$rootScope','$state','$ionicModal','$usercenterData','$mainData','$ionicLoading','$ionicPopup','$timeout','$window',function($scope,$rootScope,$state,$ionicModal,$usercenterData,$mainData,$ionicLoading,$ionicPopup,$timeout,$window){
    var goLogin=function(){
      $state.go('login');
    }
    $scope.$on('$ionicView.afterEnter',function(){
      var token=$window.localStorage.accesstoken;
      var chats=$window.localStorage.chats?JSON.parse($window.localStorage.chats):[];
      if(token){
        $mainData.not_read_list({token:token})
          .success(function(data){
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg,goLogin);
            }else{
              var chatsDB=data.chats;
              //这是别人发给他的，但是没收到的
              for(var i=0;i<chatsDB.length;i++){
                if(chats.length==0){
                  var chat={
                    id:chatsDB[i].from._id,
                    name:chatsDB[i].from.name,
                    image:chatsDB[i].from.image,
                    content:chatsDB[i].content
                  }
                  chats.push(chat);
                }
                else{
                  for(var j=0;j<chats.length;j++){
                    if(chatsDB[i].from._id.toString()===chats[j].id.toString()){
                      chats[j].content=chatsDB.content;
                    }
                    else{
                      if(j===chats.length-1){
                        var chat={
                          id:chatsDB[i].from._id,
                          name:chatsDB[i].from.name,
                          image:chatsDB[i].from.image,
                          content:chatsDB[i].content
                        }
                        chats.push(chat);
                      }
                    }
                  }
                }

              }
              $window.localStorage.chats=JSON.stringify(chats);
            }
          })
          .error(function(){
            $scope.showErrorMesPopup('网络连接错误');
          });
        $scope.chats=chats;

      }
      else{
        $state.go('login')
      }
    });
    $scope.chatwidth=function(id,name){
      var token=$window.localStorage.accesstoken;
      if(token){
        $usercenterData.usercenter({token:token})
          .success(function(data){
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg,function(){
                $state.go('login');
              });
            }else{
              $state.go('chat',{
                from:{
                  _id:data.user._id,
                  name:data.user.name
                },
                to:{
                  _id:id,
                  name:name
                }
              });
            }
          })
          .error(function(){
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{
        $state.go('login');
      }
    }
    $scope.showErrorMesPopup = function(title,cb) {
      var myPopup = $ionicPopup.show({
        title: '<b>'+title+'</b>'
      });
      $timeout(function() {
        myPopup.close(); // 2秒后关闭
        if(cb)
          cb();
      }, 1000);
    };
  }]);
