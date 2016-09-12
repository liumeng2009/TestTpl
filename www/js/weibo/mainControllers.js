/**
 * Created by Administrator on 2016/7/22.
 */
angular.module('mainControllers',['ngCordova'])
  .controller('MainCtrl',['$scope','$rootScope','$state','$ionicModal','$usercenterData','$mainData','$ionicLoading','$ionicPopup','$timeout','$window','$cordovaToast','$SFTools',function($scope,$rootScope,$state,$ionicModal,$usercenterData,$mainData,$ionicLoading,$ionicPopup,$timeout,$window,$cordovaToast,$SFTools){
    $scope.$on('$ionicView.afterEnter',function(){
      //app默认进入页面
      var token=$SFTools.getToken();
      if(token){
        $usercenterData.usercenter({token:token})
          .success(function(data){
            if(data.success===0){
              $state.go('login');
              $scope.showErrorMesPopup(data.msg);
            }
            else{
              var chats=$window.localStorage[data.user._id]?JSON.parse($window.localStorage[data.user._id]):[];
              $scope.chats=chats;
              //登录成功之后，登录实时系统
              iosocket.emit('login', {
                name:data.user.name,
                _id:data.user._id,
                type:'page'
              });

              iosocket.on('message',function(obj){
                var chat=obj.message;
                var from=obj.from;
                var db = null;
                document.addEventListener('deviceready', function() {
                  var exist=true;
                  db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
                  db.executeSql('create table if not exists userinfo(id,name,image)');
                  db.executeSql('select count(*) AS mycount from userinfo where id=?',[from._id],function(rs){
                    var count=rs.rows.item(0).mycount;
                    if(count>0){
                      exist=true;
                    }
                    else{
                      exist=false;
                    }
                  });

                  console.log('发出消息的这个人的信息在数据库里面存在吗？'+exist);

                  db.transaction(function(tx) {
                    tx.executeSql('CREATE TABLE IF NOT EXISTS chat (id,from,to,content,createAt,saw)');
                    tx.executeSql('INSERT INTO chat VALUES (?,?,?,?,?,?)', [chat._id,chat.from,chat.to,chat.content,chat.createAt,0]);
                    if(exist){
                      tx.executeSql('update userinfo set name=?,image=?',[from.name,from.image]);
                    }
                    else{
                      tx.executeSql('insert into userinfo values(?,?,?)',[from._id,from.name,from.image]);
                    }
                  });
                });
              });
            }
          })
          .error(function(){
            $scope.showErrorMesPopup('网络连接错误');
          })
      }
      else{
        $timeout(function(){
          $state.go('login');
        },1000);

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
        $ionicNativeTransitions.stateGo('login', {}, {}, {
          "type": "slide",
          "direction": "up", // 'left|right|up|down', default 'left' (which is like 'next')
          "duration": 400, // in milliseconds (ms), default 400
        });
      }
    }
    $scope.showErrorMesPopup = function(title,cb) {
      $SFTools.myToast(title);
    };
    $scope.check_online=function(){
      var token=$window.localStorage.accesstoken;
      //所有的chats查询在线情况
      if($scope.chats.length>0) {
        var ul = [];
        for (var i = 0; i < $scope.chats.length; i++) {
          var _u = {
            _id: $scope.chats[i].id.toString(),
          }
          ul.push(_u);
          iosocket.on('ansuserlist'+$scope.chats[i].id,function(obj){
            for(var i=0;i<$scope.chats.length;i++){
              if(obj._id.toString()===$scope.chats[i].id.toString()){
                $scope.chats[i].online=obj.online;
                $scope.$apply();
              }
            }
          });
        }
        $usercenterData.check_online({token: token, array: ul})
          .success(function (data) {
            var onlineResult = data.users;
            for (var i = 0; i < $scope.chats.length; i++) {
              for (var j = 0; j < onlineResult.length; j++) {
                if ($scope.chats[i].id.toString() === onlineResult[j]._id) {
                  $scope.chats[i].online = onlineResult[j].online;
                }
              }
            }
          })
          .error(function (err) {

          })
      }
    }
  }]);
