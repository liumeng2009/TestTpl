/**
 * Created by Administrator on 2016/7/22.
 */
angular.module('mainControllers',['ngCordova'])
  .controller('MainCtrl',['$scope','$rootScope','$state','$ionicModal','$usercenterData','$mainData','$ionicLoading','$ionicPopup','$timeout','$window','$cordovaToast','$SFTools','$location','$ionicHistory','$cordovaStatusbar','$ionicScrollDelegate','$cordovaKeyboard','$ionicPlatform','$interval','$cordovaDevice',function($scope,$rootScope,$state,$ionicModal,$usercenterData,$mainData,$ionicLoading,$ionicPopup,$timeout,$window,$cordovaToast,$SFTools,$location,$ionicHistory,$cordovaStatusbar,$ionicScrollDelegate,$cordovaKeyboard,$ionicPlatform,$interval,$cordovaDevice){
    $scope.$on('$ionicView.loaded',function(){
      //app默认进入页面
      var db = null;
      var username='';
      var _id='';
      $scope.chats=[];
      $rootScope.NewMessageCount=0;
      $scope.LoadingServer=false;
      $SFTools.getToken(function(_token){
        if(_token&&_token.userid&&_token!=''){
          //初始化main页面的欢迎信息
          $scope.initChat(_token);
          //从sql找到列表数据，让用户离线的时候也可以浏览消息
          $scope.initMessageFromSql(_token.userid);
          //确认用户是否成功登陆
          $usercenterData.usercenter({token:_token.token})
            .success(function(data){
              if(data.success===0){
                $state.go('login');
                $scope.showErrorMesPopup(data.msg);
              }
              else{
                //初始化socket，登录到聊天服务器
                $scope.initSocket(_token);
                //获取socket信息，发送angularjs通知
                iosocket.on('message',function(obj){
                  console.log('page接收到了socket的消息');
                  $rootScope.$broadcast('ReciveMessage',obj);
                });
                //服务器说，你发的消息我收到了
                iosocket.on('reciveMessage',function(obj){
                  alert('发送广播：服务器收到了。广播的名称为serverRecive'+obj.to);
                  $rootScope.$broadcast('ServerRecive'+obj.to,obj);
                  $rootScope.$broadcast('ServerRecive',obj);
                  //更新main列表
                  for(var i=0;i<$scope.chats.length;i++){
                    if($scope.chats[i].userid===obj.to){
                      $scope.chats[i].content=obj.message.content;
                      var timee=new Date(obj.message.meta.createAt);
                      $scope.chats[i].createAt=timee.getTime();
                      $scope.chats[i].new=0;
                      $scope.$apply();
                      break;
                    }
                  }
                });
                //收到了消息之后的处理
                $scope.receiveMessage(_token);
                //接收“用户看过了”这条消息
                $scope.MessageSawListener();
                //接收“用户向这个人发信息了”这条消息
                $scope.SendingMessageListener();
                //接收服务器收到了之后，发的通知
                $scope.ServerReciverListener();
                //接收用户发送失败的通知，改变view
                $scope.MessageSendFailedListener();
                //同步服务器消息成功，改变view
                $scope.NoReadListener();
              }
            })
            .error(function(){
              $SFTools.myToast(config.userPrompt.ajaxError);
            });
        }
        else{
          $state.go('login');
        }
      });
    });

    $scope.$on('$ionicView.afterEnter',function(){
      $ionicHistory.clearHistory();
      $ionicHistory.clearCache();
    });

    //弹出modal

    $scope.initSocket=function(_token){
      alert('初始化socket');
      iosocket = io.connect('http://liumeng.iego.cn/', {'reconnect': true});
      iosocket.on('connect', function () {
        console.log('连接了，不知道是重新连还是直接连，username是' + _token.name + ',_id是' + _token.userid);
        if (_token.name != '' && _token.userid != '') {
          iosocket.emit('login', {
            name: _token.name,
            _id: _token.userid,
            type: 'page'
          });
        }
      });
      iosocket.on('reconnect',function(){
        alert('重新连接了');
      })
    }

    $scope.showErrorMesPopup = function(title,cb) {
      $SFTools.myToast(title);
    };

    $scope.receiveMessage=function(token){
      $rootScope.$on('ReciveMessage',function(event,obj){
        var chat=obj.message;
        var from=obj.from;
        var db = null;
        //根据当前path决定new值，变了，根据modal是否存在而决定
        var newMessage=true;
        if($scope.modal&&$scope.modal.isShown()&&$rootScope.touser._id&&$rootScope.touser._id===from._id){
          newMessage=false;
        }

        //向服务器发送消息，我收到了，你的标志位可以修改了
        iosocket.emit('ReciveMessage',{chatid:obj.message._id,deviceid:token.deviceid});

        //$SFTools.myToast('web端接收到的消息是'+from.name+'发送的'+chat.content+chat.meta.createAt);
        //存数据库
        document.addEventListener('deviceready', function() {
          var exist=true;
          db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
          db.executeSql('create table if not exists userinfo(id,name,image,showInMain)');
          db.executeSql('CREATE TABLE IF NOT EXISTS chat (id,fromuser,touser,content,createAt,saw)');
          db.executeSql('select count(*) AS mycount from userinfo where id=?',[from._id],function(rs){
            var count=rs.rows.item(0).mycount;
            if(count>0){
              exist=true;
            }
            else{
              exist=false;
            }
            console.log('发出消息的这个人的信息在数据库里面存在吗？'+exist+'信息是：'+from.name);
            db.executeSql('select count(*) as mycount from chat where id=?',[chat._id],function(rs) {
              var createtime=new Date(chat.meta.createAt);
              var existChat;
              var countChat = rs.rows.item(0).mycount;
              if (countChat > 0) {
                existChat = true;
              }
              else {
                existChat = false;
              }
              //alert('是否存在这条信息'+existChat+chat.content);
              if (existChat) {
                //alert('不操作');
              }
              else {
                //alert('插入');
                db.executeSql('INSERT INTO chat VALUES (?,?,?,?,?,?)', [chat._id, chat.from, chat.to, chat.content, createtime.getTime(), 0]);
              }
            });

            if(exist){
              db.executeSql('update userinfo set name=?,image=? where id=?',[from.name,from.image,from._id]);
            }
            else{
              db.executeSql('insert into userinfo values(?,?,?,?)',[from._id,from.name,from.image,1]);
            }

            //最后更新首页表。数据不好查，只好建立新的表来保存，还可以提高首页性能
            // status说明：1：正常 | failed：发送失败 | bak：草稿 relation
            db.executeSql('create table if not exists main_message(master,relation_user,relation_user_id,content,createAt,saw,status,relation_chat_id)');
            var master=chat.to;
            var relation_user=from.name;
            var relation_user_id=from._id;
            db.executeSql('select count(master) as mycount,saw from main_message where master=\''+master+'\' and relation_user_id=\''+relation_user_id+'\'',[],function(rs){
              var countMain = rs.rows.item(0).mycount;
              var saw=rs.rows.item(0).saw;
              var createAtTime=new Date(chat.meta.createAt);
              if(countMain>0){
                //存在
                db.executeSql('update main_message set content=?,createAt=?,saw=?,relation_chat_id=? where master=? and relation_user_id=?',[chat.content,createAtTime.getTime(),newMessage?(parseInt(saw)+1):0,chat._id,master,relation_user_id]);
              }
              else{
                db.executeSql('insert into main_message values(?,?,?,?,?,?,?,?)',[master,relation_user,relation_user_id,chat.content,createAtTime.getTime(),newMessage?1:0,1,chat._id]);
              }
              console.log('page修改了main_message的值');
            });
          },function(tx,error){
            alert(error.message);
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
            new:newMessage?1:0
          }
          $scope.chats.unshift(newObj);
        }
        else{
          for(var i=0;i<$scope.chats.length;i++){
            //console.log('ffffffffffff'+$scope.chats[i].name+from.name+from._id+$scope.chats[i].userid);
            if(from.name===$scope.chats[i].name&&from._id===$scope.chats[i].userid){
              $scope.chats[i].content=chat.content;
              if($scope.chats[i].new){
                if(newMessage) {
                  $scope.chats[i].new = parseInt($scope.chats[i].new) + 1;
                  $rootScope.NewMessageCount=parseInt($rootScope.NewMessageCount)+1;
                }
                else{
                  $scope.chats[i].new=0;
                }
              }
              else{
                if(newMessage){
                  $scope.chats[i].new=1;
                  $rootScope.NewMessageCount=parseInt($rootScope.NewMessageCount)+1;
                }
                else{
                  $scope.chats[i].new=0;
                }

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
                  new:newMessage?1:0
                }
                $rootScope.NewMessageCount=parseInt($rootScope.NewMessageCount)+1;
                $scope.chats.unshift(newObj);
                break;
              }
            }
          }
        }
        $scope.$apply();
      })
    }
    $scope.initChat=function(_token){
      var chatXiaoYuan={
        id:0,
        name:'晓园团队',
        userid:0,
        content:'欢迎加入晓园IM',
        createAt:0,
        new:0
      };
      $scope.chats.push(chatXiaoYuan);
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

        var SqlMainMessage='select * from main_message where master=\''+touser+'\' group by relation_user_id order by createAt';

        db.transaction(function(tx){
          tx.executeSql(SqlMainMessage,[],function(tx,rs){
            for(var i=0;i<rs.rows.length;i++){

              var chat={
                id:'',
                name:rs.rows.item(i).relation_user,
                userid:rs.rows.item(i).relation_user_id,
                content:rs.rows.item(i).content,
                createAt:rs.rows.item(i).createAt,
                new:rs.rows.item(i).saw,
                type:rs.rows.item(i).status
              };
              $scope.chats.unshift(chat);
              $rootScope.NewMessageCount=parseInt($rootScope.NewMessageCount)+parseInt(rs.rows.item(i).saw);
            }
          },function(tx,error){
            console.log('select error is'+error.message);
          });
        },function(tx,error){
          console.log('transaction error is'+error.message);
        },function(){
          //alert('发送失败的消息');
          var noSendList=[];
          //然后把发送失败的这部分加上，如果nosend里面有比现在这条信息更新的，发送失败的消息，就把这条消息放在$scope.chat里 状态是 发送失败
          db.executeSql('select * from nosend where fromuser=\''+touser+'\' and status=1 group by touser',[],function(rs){
            for(var i=0;i<rs.rows.length;i++){
              var nosendObj={
                id:rs.rows.item(i).id,
                fromuser:rs.rows.item(i).fromuser,
                touser:rs.rows.item(i).touser,
                content:rs.rows.item(i).content
              };
              noSendList.push(nosendObj);
            }
            //将这个数组附加到$scope.chats上
            for(var i=0;i<noSendList.length;i++){
              //alert('第'+i+'条未发消息');
              for(var j=0;j<$scope.chats.length;j++){
                if(noSendList[i].touser===$scope.chats[j].userid){
                  //alert(noSendList[i].touser+'和'+$scope.chats[j].userid);
                  if(parseInt(noSendList[i].id)> parseInt($scope.chats[j].createAt)){
                    //alert(parseInt(noSendList[i].id)+'和'+ parseInt($scope.chats[j].createAt));
                    //alert(noSendList[i].content+ parseInt(noSendList[i].id));
                    $scope.chats[j].content=noSendList[i].content;
                    $scope.chats[j].type='failed';
                    $scope.chats[j].createAt=parseInt(noSendList[i].id);
                  }
                  break;
                }
                else{
                  if(j===$scope.chats.length-1){
                    //如果都没有这条信息，就说明，这个人是新的，需要新增，新增就需要这个人的username和image
                    //从db中找到这个人的信息
                    db.executeSql('select * from userinfo where id=\''+noSendList[i].touser+'\'',[],function(rs){
                      if(rs.rows.item(0)&&rs.rows.item(0).name&&rs.rows.item(0).image&&rs.rows.item(0).name!=''){
                        var chat={
                          id:'',
                          name:rs.rows.item(0).name,
                          userid:noSendList[i].touser,
                          content:noSendList[i].content,
                          createAt:parseInt(noSendList[i].id),
                          new:0,
                          type:'failed'
                        };
                        $scope.chats.push(chat);
                      };
                    });
                  }
                }
              }

            }
          },function(error){

          });
          $scope.$apply();
          console.log('transaction success');
        });
      });
    }
    //这个人的信息被看了，main列表的saw置0
    $scope.MessageSawListener=function(){
      $rootScope.$on('SawMessage',function(event,obj){
        for(var i=0;i<$scope.chats.length;i++){
          if($scope.chats[i].userid===obj){
            var oldnew=$scope.chats[i].new;
            $rootScope.NewMessageCount=parseInt($rootScope.NewMessageCount)-parseInt(oldnew);
            $scope.chats[i].new=0;
            break;
          }
        }
      })
    }
    //向这个人发送信息了，这条信息体现在main列表中
    $scope.SendingMessageListener=function(){
      $rootScope.$on('SendingMessage',function(event,obj){
        var userid=obj.userid;
        var content=obj.content;
        for(var i=0;i<$scope.chats.length;i++){
          if($scope.chats[i].userid===userid){
            $scope.chats[i].type='sending';
            $scope.chats[i].content=content;
            $scope.chats[i].createAt=obj.timeid;
            break;
          }
          else{
            if(i===$scope.chats.length-1){
              //说明和这个人还没有联系呢
              var chatObj={
                id:'',
                name:obj.username,
                userid:obj.userid,
                content:obj.content,
                createAt:obj.timeid,
                new:0,
                type:'sending'
              }
              //alert(JSON.stringify(chatObj)+JSON.stringify(chatObj2));
              $scope.chats.push(chatObj);
              //$scope.chats.push(chatObj2);
              //$scope.$apply();
            }
          }
        }
      });
    }
    //服务器说，你发的消息我收到了，这时候main列表的处理
    $scope.ServerReciverListener=function(){
      $rootScope.$on('ServerRecive',function(event,obj){
        //alert('debug:服务器收到了，修改main列表');
        //main页面要做的事情是：main列表对应信息的‘发送中’，去掉。数据库中，sending的这条信息删除，将content createAt替换到status=1那条信息上
        for(var i=0;i<$scope.chats.length;i++){
          if($scope.chats[i].userid===obj.to){
            //alert('符合条件，进行修改');
            $scope.chats[i].type='';
            break;
          }
        }
        $scope.$apply();
        document.addEventListener('deviceready', function() {
          var db=null;
          db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
          db.transaction(function(tx){
            var createAt=new Date(obj.message.meta.createAt);
            tx.executeSql('update main_message set content=?,createAt=?,saw=0 where master=? and relation_user_id=? and status=1',[obj.message.content,createAt.getTime(),obj.from,obj.to]);
          },function(error){
            //alert('main事务执行失败'+error);
          },function(){
            //alert('发送过程的消息确认完成');
          });
        });


      });
    }
    //消息发送失败的消息
    $scope.MessageSendFailedListener=function(){
      $rootScope.$on('MessageFailed',function(event,obj){
        alert('接收到了信息失败的消息'+obj.userid);
        for(var i=0;i<$scope.chats.length;i++){
          //alert($scope.chats[i].userid+'   '+obj.userid+'         '+$scope.chats.createAt+'     '+obj.timeid);
          if($scope.chats[i].userid===obj.userid&&$scope.chats[i].createAt===obj.timeid){
            $scope.chats[i].type='failed';
            break;
          }
        }
      })
    }



    $scope.NoReadListener=function(){
      $rootScope.$on('ReceiveNoRead',function(event,obj){
        console.log('main页面收到了服务器同步的信息，同时开始同步main页面。');
        var mainArray=obj.mainArray;

        //mainArray排序，createAt小的在前面
        for(var i=0;i<mainArray.length;i++){
          for(var j=0;j<mainArray.length-i-1;j++){
            if(mainArray[j].createAt>mainArray[j+1].createAt){
              var temp=mainArray[j];
              mainArray[j]=mainArray[j+1];
              mainArray[j+1]=temp;
            }
          }
        }

        console.log(JSON.stringify(mainArray));

        //将有关的main加入到chats[]对象中
        //mainArray中的内容 逐条 和现在chats[]中的信息做比较，做更新和新增

        if($scope.chats.length===1){
          console.log('第一种情况');
          //说明只有一个欢迎消息,那就把所有的mainArray信息,按照时间排序放到chats内
          for(var i=0;i<mainArray.length;i++){
            var chatObj={
              id:'',
              name:mainArray[i].relation_user,
              userid:mainArray[i].relation_user_id,
              content:mainArray[i].content,
              createAt:mainArray[i].createAt,
              new:mainArray[i].saw,
              type:mainArray[i].status
            };
            $scope.chats.unshift(chatObj);
          }
        }
        else{

          //有死循环

          for(var i=0;i<mainArray.length;i++){
            console.log('i是：'+i);
            for(var j=0;j<$scope.chats.length;j++){
              console.log('j是：'+j);
              console.log('数据是'+$scope.chats[j].relation_user_id+'和'+mainArray[i].relation_user_id+'和'+mainArray[i].createAt+'和'+$scope.chats[j].createAt);
              if($scope.chats[j].userid===mainArray[i].relation_user_id&&mainArray[i].createAt>$scope.chats[j].createAt){
                console.log('同一个人的信息');
                $scope.chats[j].content=mainArray[i].content;
                $scope.chats[j].createAt=mainArray[i].createAt;
                if($scope.chats[j].saw===0){
                  $scope.chats[j].saw=mainArray[i].saw;
                }
                else{
                  $scope.chats[j].saw=  parseInt($scope.chats[j].saw)+parseInt(mainArray[i].saw);
                }
                break;
              }
              else{
                console.log('不同一个人的信息');
                if(j===$scope.chats.length-1){
                  console.log('新的一个人的信息');
                  var chatObj={
                    id:'',
                    name:mainArray[i].relation_user,
                    userid:mainArray[i].relation_user_id,
                    content:mainArray[i].content,
                    createAt:mainArray[i].createAt,
                    new:mainArray[i].saw,
                    type:mainArray[i].status
                  };
                  $scope.chats.unshift(chatObj);
                  break;
                }
              }
            }
          }
        }
        console.log(JSON.stringify($scope.chats))
        $scope.$apply();

      });
    }

  }]);
