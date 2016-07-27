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
      if(token){
        $usercenterData.usercenter({token:token})
          .success(function(data){
            if(data.success===0){
              $scope.showErrorMesPopup('网络连接错误',goLogin);
            }
            else{
              var chats=$window.localStorage[data.user._id]?JSON.parse($window.localStorage[data.user._id]):[];
              $scope.chats=chats;
              //登录成功之后，登录实时系统
              iosocket.emit('login', {
                name:data.user.name,
                _id:data.user._id
              });
              iosocket.send('hi');
              //iosocket.on('connect',function(){
                iosocket.on('to'+data.user._id,function(obj){
                  if(chats.length===0){
                    var chat={
                      id:obj.from._id,
                      name:obj.from.name,
                      image:obj.from.image,
                      content:[obj.message],
                      createAt:obj.createAt,
                      new:true
                    };
                    chats.unshift(chat);
                    $window.localStorage[data.user._id]=JSON.stringify(chats);
                  }
                  else{
                    for(var i=0;i<chats.length;i++){
                      if(chats[i].id.toString()===obj.from._id.toString()){
                        if(chats[i].new){
                          chats[i].content.unshift(obj.message);
                          chats[i].new=true;
                          break;
                        }
                        else{
                          chats[i].content=[obj.message];
                          chats[i].new=true;
                          break;
                        }

                      }
                      else{
                        if(i===chats.length-1){
                          //说明没有
                          var chat={
                            id:obj.from._id,
                            name:obj.from.name,
                            image:obj.from.image,
                            content:[obj.message],
                            createAt:obj.createAt,
                            new:true
                          };
                          chats.unshift(chat);
                          //i++;
                          break;
                        }
                      }
                    }
                  }

                  $window.localStorage[data.user._id]=JSON.stringify(chats);
                  $scope.chats=chats;
                  $scope.$apply();
                })
              //})



              $mainData.not_read_list({token:token})
                .success(function(da){
                  if(da.success === 0){
                    $scope.showErrorMesPopup(da.msg,goLogin);
                  }else{
                    var chatsDB=da.chats;
                    //这是别人发给他的，但是没查看的
                    if(chats.length==0){
                      for(var i=0;i<chatsDB.length;i++){
                        var chat={
                          id:chatsDB[i].from._id,
                          name:chatsDB[i].from.name,
                          image:chatsDB[i].from.image,
                          content:chatsDB[i].content,
                          createAt:chatsDB[i].meta.createAt,
                          new:true
                        };
                        chats.push(chat);
                      }
                    }
                    else{
                      for(var i=0;i<chats.length;i++){
                        //遍历chatdb，如果没有这个id，就将chats里面id符合的条目new=false，
                        if(chatsDB.length===0){
                          chats[i].new=false;
                        }
                        for(var k=0;k<chatsDB.length;k++){
                          if(chatsDB[k].from._id.toString()===chats[i].id){
                            chats[i].content=chatsDB[k].content;
                            chats[i].new=true;
                            chatsDB.splice(k,1);
                            break;
                          }
                          else{
                            if(k===chatsDB.length-1){
                              //
                              chats[i].new=false;
                              /*
                              //最后一个，还不等于，说明chat[i]这个里面的东西已经被看过了，
                              chats[i].new=false;
                              //chatdb里面是新的
                              var chat={
                                id:chatsDB[k].from._id,
                                name:chatsDB[k].from.name,
                                image:chatsDB[k].from.image,
                                content:chatsDB[k].content,
                                createAt:chatsDB[k].meta.createAt,
                                new:true
                              };
                              chats.push(chat);
                              //i++;
                              */

                            }
                          }
                        }
                      }
                      //循环完毕后，还剩下多少chatdb
                      for(var i=0;i<chatsDB.length;i++) {
                        var chat = {
                          id: chatsDB[i].from._id,
                          name: chatsDB[i].from.name,
                          image: chatsDB[i].from.image,
                          content: chatsDB[i].content,
                          createAt: chatsDB[i].meta.createAt,
                          new: true
                        };
                        chats.push(chat);
                      }
                    }

                    $scope.chats=chats;
                    $window.localStorage[data.user._id]=JSON.stringify(chats);
                    //$scope.$apply();
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
