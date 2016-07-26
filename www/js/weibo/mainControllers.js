/**
 * Created by Administrator on 2016/7/22.
 */
angular.module('mainControllers',[])
  .controller('MainCtrl',['$scope','$rootScope','$state','$ionicModal','$usercenterData','$mainData','$ionicLoading','$ionicPopup','$timeout','$window',function($scope,$rootScope,$state,$ionicModal,$usercenterData,$mainData,$ionicLoading,$ionicPopup,$timeout,$window){
    var goLogin=function(){
      $state.go('login');
    }
    $scope.$on('$ionicView.afterEnter',function(){
      //app默认进入页面
      var token=$window.localStorage.accesstoken;
      var chats=$window.localStorage.chats?JSON.parse($window.localStorage.chats):[];
      $scope.chats=chats;
      if(token){
        $usercenterData.usercenter({token:token})
          .success(function(data){
            if(data.success===0){
              $scope.showErrorMesPopup('网络连接错误',goLogin);
            }
            else{
              //登录成功之后，登录实时系统
              iosocket.emit('login', {
                name:data.user.name,
                _id:data.user._id
              });
              $mainData.not_read_list({token:token})
                .success(function(data){
                  if(data.success === 0){
                    $scope.showErrorMesPopup(data.msg,goLogin);
                  }else{
                    var chatsDB=data.chats;
                    //这是别人发给他的，但是没查看的
                    for(var i=0;i<chats.length;i++){
                      for(var j=0;j<chatsDB.length;j++){
                        if(chatsDB[j].from._id.toString()===chats[i].id){
                          chats[i].content=chatsDB[j].content;
                          chats[i].new=true;
                        }
                        else{
                          if(j===chatsDB.length-1){
                            //说明是新的

                          }
                        }
                      }
                    }


                    for(var i=0;i<chatsDB.length;i++){
                      if(chats.length==0){
                        var chat={
                          id:chatsDB[i].from._id,
                          name:chatsDB[i].from.name,
                          image:chatsDB[i].from.image,
                          content:chatsDB[i].content,
                          createAt:chatsDB[i].meta.createAt
                        }
                        chats.push(chat);
                      }
                      else{
                        for(var j=0;j<chats.length;j++){
                          if(chatsDB[i].from._id.toString()===chats[j].id.toString()){
                            chats[j].content=chatsDB[i].content;
                            chats[j].createAt=chatsDB[i].meta.createAt;
                          }
                          else{
                            if(j===chats.length-1){
                              var chat={
                                id:chatsDB[i].from._id,
                                name:chatsDB[i].from.name,
                                image:chatsDB[i].from.image,
                                content:chatsDB[i].content,
                                createAt:chatsDB[i].meta.createAt
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
            }
          })
          .error(function(){
            $scope.showErrorMesPopup('网络连接错误');
          })
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
