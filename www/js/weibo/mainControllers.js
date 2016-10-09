/**
 * Created by Administrator on 2016/7/22.
 */
angular.module('mainControllers',['ngCordova'])
  .controller('MainCtrl',['$scope','$rootScope','$state','$ionicModal','$usercenterData','$mainData','$ionicLoading','$ionicPopup','$timeout','$window','$cordovaToast','$SFTools',function($scope,$rootScope,$state,$ionicModal,$usercenterData,$mainData,$ionicLoading,$ionicPopup,$timeout,$window,$cordovaToast,$SFTools){
    $scope.$on('$ionicView.afterEnter',function(){
      //app默认进入页面
      //var token=$SFTools.getToken();
      //console.log('token是'+token);

      var db = null;
      var username='';
      var _id='';
      var token='';
      var touser='';


      $scope.chats=[];

      iosocket.on('connect',function(){
        //alert('连接成功啦');
      });

      document.addEventListener('deviceready', function() {
        db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
        db.transaction(function(tx) {
          tx.executeSql('SELECT * FROM users where active=1', [], function(tx, rs) {
            console.log('Record count (expected to be 2): ' + rs.rows.item(0).token);
            token=rs.rows.item(0).token;
            touser=rs.rows.item(0).id;
            var chatXiaoYuan={
              id:0,
              name:'晓园团队',
              userid:0,
              content:'欢迎加入晓园IM,如果字很多怎么办呢很多很多很多么办呢很多很多很多么办呢很多很多很多么办呢很多很多很多么办呢很多很多很多',
              createAt:rs.rows.item(0).createAt,
              new:101
            };
            $scope.chats.push(chatXiaoYuan);
            $scope.$apply();
          }, function(tx, error) {
            //console.log('SELECT error: ' + error.message);
            //$SFTools.myToast(error.message);
            $state.go('login');
          });
        },function(tx,error){
            $SFTools.myToast(error.message);
        },
          function(){
              //至此，token和touser都有值了
              console.log('加载本地记录'+token);
              $scope.initMessageFromSql(touser);
              if(token){
                console.log('token是'+token);
                $usercenterData.usercenter({token:token})
                  .success(function(data){
                    if(data.success===0){
                      $state.go('login');
                      $scope.showErrorMesPopup(data.msg);
                    }
                    else{
                      //登录成功之后，登录实时系统
                      username=data.user.name;
                      _id=data.user._id;
                      iosocket.emit('login', {
                        name:username,
                        _id:_id,
                        type:'page'
                      });
                      //重连的情况
                      iosocket.on('connect',function(){
                        console.log('连接了，不知道是重新连还是直接连，username是'+username+',_id是'+_id);
                        if(username!=''&&_id!=''){
                          iosocket.emit('login', {
                            name:username,
                            _id:_id,
                            type:'page'
                          });
                        }
                      });
                      $scope.initMessageFromServer();
                      $scope.receiveMessage();
                    }
                  })
                  .error(function(){
                    $scope.showErrorMesPopup('网络连接错误');
                  })
              }
              else{
                $timeout(function(){
                  $state.go('login');
                },100);
              }

          });
      });


    });
    $scope.chatwidth=function(userid){
      var db=null;
      var token='';
      document.addEventListener('deviceready', function() {
        db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
        db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM users where active=1', [], function(tx, rs) {
              console.log('Record count (expected to be 2): ' + rs.rows.item(0).token);
              token=rs.rows.item(0).token;
            }, function(tx, error) {
              $state.go('login');
            });
          },function(tx,error){
            $SFTools.myToast(error.message);
          },
          function(){
            if(token){
              console.log('token是'+token);
              //跳转
              $state.go('chat',{userid:userid});
            }
            else{
              $timeout(function(){
                $state.go('login');
              },100);
            }

          });
      });
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
    $scope.receiveMessage=function(){
      iosocket.on('message',function(obj){
        var chat=obj.message;
        var from=obj.from;
        var db = null;
        console.log('触发了接收消息的事件');
        $SFTools.myToast('web端接收到的消息是'+from.name+'发送的'+chat.content+chat.meta.createAt);
        //存数据库
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
            console.log('发出消息的这个人的信息在数据库里面存在吗？'+exist+'信息是：'+from.name);

            db.transaction(function(tx) {
              tx.executeSql('CREATE TABLE IF NOT EXISTS chat (id,fromuser,touser,content,createAt,saw)');
              tx.executeSql('INSERT INTO chat VALUES (?,?,?,?,?,?)', [chat._id,chat.from,chat.to,chat.content,chat.meta.createAt,0]);
              if(exist){
                tx.executeSql('update userinfo set name=?,image=? where id=?',[from.name,from.image,from._id]);
              }
              else{
                tx.executeSql('insert into userinfo values(?,?,?)',[from._id,from.name,from.image]);
              }
            });
          });
        });
        //实时显示
        if($scope.chats.length===0){
          var newObj={
            id:chat._id,
            name:from.name,
            userid:from._id,
            content:chat.content,
            createAt:chat.meta.createAt,
            new:1
          }
          $scope.chats.unshift(newObj);
        }
        else{
          for(var i=0;i<$scope.chats.length;i++){
            console.log('ffffffffffff'+$scope.chats[i].name+from.name+from._id+$scope.chats[i].userid);
            if(from.name===$scope.chats[i].name&&from._id===$scope.chats[i].userid){
              $scope.chats[i].content=chat.content;
              if($scope.chats[i].new){
                $scope.chats[i].new=parseInt($scope.chats[i].new)+1;
              }
              else{
                $scope.chats[i].new=1;
              }
              $scope.chats[i].createAt=chat.meta.createAt;

              //将这个对象置前
              var newObj=$scope.chats[i];
              $scope.chats.splice(i,1);
              $scope.chats.unshift(newObj);

              break;
            }
            else{
              if(i===$scope.chats.length-1){
                //说明是一个新的用户
                var newObj={
                  id:chat._id,
                  name:from.name,
                  userid:from._id,
                  content:chat.content,
                  createAt:chat.meta.createAt,
                  new:1
                }
                $scope.chats.unshift(newObj);
                break;
              }
            }
          }
        }

        $scope.$apply();
      });
    }
    $scope.initMessageFromSql=function(touser){
      document.addEventListener('deviceready', function() {
        //从sql读取今天并且没有查看过的所有信息
        var db=null;
        db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
        //var sqlStr='select chat.id,chat.content,chat.createAt,chat.saw,userinfo.id,userinfo.name,userinfo.image from chat,userinfo where chat.saw=0 and chat.from=userinfo.id';
        //今天的所有消息
        var date=new Date();
        var DateToday=new Date();
        DateToday.setFullYear(date.getFullYear(),date.getMonth(),date.getDay());
        var DateTodayTime=DateToday.getTime();

        console.log('出问题的sql语句加的参数是：'+touser);

        var sqlContentStr='select userinfo.name as username,chat.createAt as createAt,chat.id as chatid,chat.content as content,userinfo.id as id,M.new as newmessage'+
        ' from chat inner join userinfo on chat.fromuser=userinfo.id'+
        ' left join '+
        ' (select count(content) as new,fromuser from chat where saw=0 and touser=\''+touser+'\'  group by fromuser) as M'+
        ' on chat.fromuser=M.fromuser,'+
        ' (select max(createAt) as createAt,fromuser from chat group by fromuser) as T'+
        ' where chat.fromuser=T.fromuser'+
        ' and chat.createAt=T.createAt'+
        ' order by createAt';

        db.transaction(function(tx){
          tx.executeSql(sqlContentStr,[],function(tx,rs){
            for(var i=0;i<rs.rows.length;i++){
              //console.log('有新的消息吗？'+rs.rows.item(i).content+rs.rows.item(i).fromname+rs.rows.item(i).saw+rs.rows.item(i).fromimage+rs.rows.item(i).createAt);
              console.log('222222222222222222222'+rs.rows.item(i).newmessage);

              for(var p in rs.rows.item(i)){
                console.log('tttttttttttttttttttt'+p);
              }

              var chat={
                id:rs.rows.item(i).chatid,
                name:rs.rows.item(i).username,
                userid:rs.rows.item(i).id,
                content:rs.rows.item(i).content,
                createAt:rs.rows.item(i).createAt,
                new:rs.rows.item(i).newmessage
              };
              $scope.chats.unshift(chat);
            }
          },function(tx,error){
            console.log('select error is'+error.message);
          });
        },function(tx,error){
          console.log('transaction error is'+error.message);
        },function(){
          $scope.$apply();
          console.log('transaction success');
        });
      });
    }
    $scope.initMessageFromServer=function(){
      console.log('来自服务器的消息');
    }
  }]);
