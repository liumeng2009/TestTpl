/**
 * Created by liumeng on 2016/7/18.
 */
/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('chatControllers',[])
  .controller('ChatCtrl',['$scope','$rootScope','$ionicPlatform','$sce','$state','$stateParams','$loginData','$ionicLoading','$ionicPopup','$timeout','$window','$ionicHistory','$ionicScrollDelegate','$usercenterData','$mainData','$cordovaLocalNotification','$SFTools','$cordovaKeyboard','$location',function($scope,$rootScope,$ionicPlatform,$sce,$state,$stateParams,$loginData,$ionicLoading,$ionicPopup,$timeout,$window,$ionicHistory,$ionicScrollDelegate,$usercenterData,$mainData,$cordovaLocalNotification,$SFTools,$cordovaKeyboard,$location){
    var goLogin=function(){
      $state.go('login');
    }
    $scope.messages=[];
    $scope.sendMessage='';
    $scope.popMessage={
      show:false
    }
    $scope.keyBoardStatus=false;

    $scope.$on('$ionicView.enter',function(){

    });

    $scope.$on('$ionicView.loaded',function(){
      //处理键盘事件
      var registerKeyBoard='';
      $scope.messages=[];
      //监听键盘弹出事件
      window.addEventListener('native.keyboardshow', keyboardShowHandler);

      function keyboardShowHandler(e){
        //alert('Keyboard height is: ' + e.keyboardHeight);
        $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();

        //注册后退键
        registerKeyBoard=$ionicPlatform.registerBackButtonAction(function(){
          $cordovaKeyboard.close();
        }, 550, [0]);
      }
      window.addEventListener('native.keyboardhide', keyboardHideHandler);

      function keyboardHideHandler(e){
        //alert('Keyboard height is: ' + e.keyboardHeight);
        //$scope.keyBoardStatus=false;
        $timeout(function(){
          registerKeyBoard();
        },500);
      }
      //处理键盘事件结束

      var userid=$stateParams.userid;
      var username=$stateParams.username;

      if(userid){
        $scope.touser={
          name:username,
          _id:userid
        }
        $SFTools.getToken(function(_token){
          $scope.fromuser={
            name:_token.name,
            _id:_token.userid,
            image:_token.image
          }

          $scope.getMessageFromSql(_token,userid);
          /*
          $rootScope.$on('socketReconnect',function(event,obj){
            alert('和聊天服务器重新连接了，同步服务器消息');
            $SFTools.getToken(function(token){
              $scope.initMessageFromServer(token);
            });
          });
          */
          //确认对方的身份信息
          $usercenterData.user_by_id({token:_token.token,id:userid})
            .success(function(data){
              if(data.success===0){
                $SFTools.myToast(data.msg);
                $state.go('login');
              }
              else{
                $scope.touser.image=data.user.image;

                $scope.setSaw(_token.userid,userid);

                $scope.receiveMessagePerson(userid);

                $scope.NoReadListener(_token);
              }
            })
            .error(function(){
              $SFTools.myToast(config.userPrompt.ajaxError);
            });
        });
      }
      else{
        $state.go('main');
      }
    });
    $scope.$on('$ionicView.afterEnter',function(){
      $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
    });
    $scope.getMessageFromSql=function(_token,touser){
      //alert('取得最近三天的聊天记录'+_token.userid+_token.token);
      document.addEventListener('deviceready', function() {
        //从sql读取今天并且没有查看过的所有信息
        var db = null;
        db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
        db.executeSql("create table if not exists nosend(id,fromuser,touser,content,status)");

        var sqlChatAndNoSend='select * from ( select fromuser,touser,content,createAt,id as status from chat'+
          ' where '+
          ' (fromuser=\''+_token.userid+'\' and touser=\''+touser+'\''
          +' or touser=\''+_token.userid+'\' and fromuser=\''+touser+'\')'
          +' union '
          +' select fromuser,touser,content,id as createAt,status from nosend where status=1 and '
          +' touser=\''+touser+'\' and fromuser=\''+_token.userid+'\''
          +' ) order by createAt desc limit 20';
        console.log('这个sql语句是：'+sqlChatAndNoSend);

        db.transaction(function(tx){
          tx.executeSql(sqlChatAndNoSend,[],function(tx,rs){
            for(var i=0;i<rs.rows.length;i++){
              //按照时间段进行分组
              if($scope.messages.length>0){
                //和最后一个数组成员的createAt作比较，小于一分钟就同一组，大于一分钟就重新建立一个数组成员push进去
                //alert(rs.rows.item(i).createAt+'减去'+$scope.messages[$scope.messages.length-1].createAt+'等于'+rs.rows.item(i).createAt-$scope.messages[$scope.messages.length-1].createAt);
                if(rs.rows.item(i).createAt-$scope.messages[$scope.messages.length-1].createAt>TIME_SPACING*60*1000){
                  //说明间隔时间很长，要建立新的时间段
                  var _m;
                  if(_token.userid===rs.rows.item(i).fromuser){
                    _m={
                      type:'from',
                      image:_token.image,
                      userid:_token.userid,
                      username:_token.name,
                      mess:rs.rows.item(i).content,
                      createAt:rs.rows.item(i).createAt,
                      send:rs.rows.item(i).status.toString()==='1'?'sending':rs.rows.item(i).status.toString()
                    }
                  }
                  else{
                    _m={
                      type:'to',
                      image:touser.image,
                      username:touser.name,
                      userid:touser._id,
                      mess:rs.rows.item(i).content,
                      createAt:rs.rows.item(i).createAt,
                      send:rs.rows.item(i).status.toString()==='1'?'sending':rs.rows.item(i).status.toString()
                    }
                  }
                  var chatlist=[];
                  chatlist.unshift(_m);
                  var messageper={
                    createAt:rs.rows.item(i).createAt,
                    chatlist:chatlist
                  }
                  $scope.messages.unshift(messageper);
                }
                else{
                  //一个时间段的，
                  var _m;
                  if(_token.userid===rs.rows.item(i).fromuser){
                    _m={
                      type:'from',
                      image:_token.image,
                      username:_token.name,
                      userid:_token.userid,
                      mess:rs.rows.item(i).content,
                      createAt:rs.rows.item(i).createAt,
                      send:rs.rows.item(i).status.toString()==='1'?'sending':rs.rows.item(i).status.toString()
                    }
                  }
                  else{
                    _m={
                      type:'to',
                      image:touser.image,
                      username:touser.name,
                      userid:touser._id,
                      mess:rs.rows.item(i).content,
                      createAt:rs.rows.item(i).createAt,
                      send:rs.rows.item(i).status.toString()==='1'?'sending':rs.rows.item(i).status.toString()
                    }
                  }
                  $scope.messages[$scope.messages.length-1].chatlist.unshift(_m);
                }
              }
              else{
                var _m;
                if(_token.userid===rs.rows.item(0).fromuser){
                  _m={
                    type:'from',
                    image:_token.image,
                    username:_token.name,
                    userid:_token.userid,
                    mess:rs.rows.item(i).content,
                    createAt:rs.rows.item(i).createAt,
                    send:rs.rows.item(i).status.toString()==='1'?'sending':rs.rows.item(i).status.toString()
                  }
                }
                else{
                  _m={
                    type:'to',
                    image:touser.image,
                    username:touser.name,
                    userid:touser._id,
                    mess:rs.rows.item(i).content,
                    createAt:rs.rows.item(i).createAt,
                    send:rs.rows.item(i).status.toString()==='1'?'sending':rs.rows.item(i).status.toString()
                  }
                }
                var chatlist=[_m];
                var messageper={
                  createAt:rs.rows.item(i).createAt,
                  chatlist:chatlist
                }
                $scope.messages.unshift(messageper);
              }
            }
          });
        },function(tx,error){},
        function(){
          $scope.$apply();
          $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
        });

      });
    }
    $scope.send=function(){
      //send之后，加入retryList
      //各属性描述：   发给谁的  循环次数  用户点击发送的时间  重试倒计时  在视图上的对象实例 一分钟重试一次，如果收到了服务器的回应，说明收到了，就从数组内删除
      // retry的结构是 .touser   .loop     .startTime          .retryTime  viewObject
      console.log('和我聊天的人是：'+$scope.touser._id+$scope.touser.name);
      $SFTools.getToken(function(_token){
        if(_token&&_token.userid&&_token!=''){
          var time=new Date();
          var timeid=time.getTime();
          var sendContent=$scope.send.sendMessage;
          //alert(sendContent);
          //发送消息
          console.log('发送消息');
          iosocket.emit('private message', _token.userid, $scope.touser._id, sendContent,timeid,_token.deviceid);
          //加入发送超时模块,一分钟没收到反馈，就再次发送，一直循环，持续5次。如果网络恢复，也尝试发送
          //超过五次，标识为发送不成功，再次发送需要用户确认
          var retryObj={
            touser:$scope.touser._id,
            loop:0,
            startTime:timeid,
            retryTime:0
          };
          console.log('加入重试循环');
          $rootScope.retryList.push(retryObj);

          //将信息存入未发表成功的信息表
          document.addEventListener('deviceready', function() {
            var db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
            // status=1 默认 status=0的时候，说明这条数据发送成功了 id列就是时间
            db.executeSql('create table if not exists nosend(id,fromuser,touser,content,status)');
            db.transaction(function(tx){
              //alert('我发信息给'+$scope.touser._id);
              tx.executeSql('insert into nosend values(?,?,?,?,?)',[timeid,_token.userid,$scope.touser._id,sendContent,1]);
            },function(tx,error){
              console.log(tx+error);
            },function(){
              //alert('插入nosend成功');
            });
          });

          //发送广播，用户发送信息了,main页面可以接收，改变自己的视图
          //alert('发送消息的通知'+sendContent);
          $rootScope.$broadcast('SendingMessage',{userid:$scope.touser._id,content:sendContent,timeid:timeid,username:$scope.touser.name,image:$scope.touser.image});

          /*
           document.addEventListener('deviceready', function() {
           var db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
           //main-message列表存入一条status=sending的消息
           var master = _token.userid;
           var relation_user = $scope.touser.username;
           var relation_user_id = $scope.touser._id;
           var main_content = sendContent;
           var main_saw = 0;
           var main_status = 'sending';
           db.executeSql('insert into main_message values(?,?,?,?,?,?,?,?)', [master, relation_user, relation_user_id, main_content, timeid, main_saw, main_status,'']);
           });
           */
          //实时显示
          console.log('实时显示');
          var timenow=new Date();
          var _m={
            type:'from',
            userid:_token.userid,
            image:_token.image,
            username:_token.name,
            mess:$scope.send.sendMessage,
            createAt:timenow.getTime(),
            timeid:timeid,
            send:'sending'
          }
          if($scope.messages.length>0){
            console.log('聊天信息不是0');
            var lastCreateAt=$scope.messages[$scope.messages.length-1].createAt;
            if(timenow.getTime()-lastCreateAt>TIME_SPACING*60*1000){
              console.log('很新的一条，并且是新的时间段');
              //说明不在一个时间段
              var messageper={
                createAt:timenow.getTime(),
                chatlist:[_m]
              }
              $scope.messages.push(messageper);
            }
            else{
              //说明在一个时间段
              console.log('很新的一条，不是新的时间段');
              $scope.messages[$scope.messages.length-1].chatlist.push(_m);
            }
          }
          else{
            var messageper={
              createAt:timenow.gettime(),
              chatlist:[_m]
            }
            $scope.messages.push(messageper);
          }
          //将这条发送消息的视图实例，赋值到重试列表中.
          retryObj.viewObject=_m;


          $scope.send.sendMessage = '';
          //$ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
          $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
          $scope.$apply();
        }
      });
    };
    $scope.receiveMessagePerson=function(userid){
      // $scope.chatBroadCastListener=
      $rootScope.$on('ReciveMessage',function(event,obj){
        //保存已经被main页面做了，所以实时显示即可
        if(userid===obj.from._id){
          if($scope.messages.length>0){
            _m={
              type:'to',
              image:$scope.touser.image,
              username:$scope.touser.name,
              mess:obj.message.content,
              createAt:obj.message.meta.createAt
            }
            var timeMessage=new Date(obj.message.meta.createAt);
            var timeLast=$scope.messages[$scope.messages.length-1].createAt;
            if(timeMessage-timeLast>TIME_SPACING*60*1000){
              var messageper={
                createAt:timeMessage,
                chatlist:[_m]
              }
              $scope.messages.push(messageper);
            }
            else{
              $scope.messages[$scope.messages.length-1].chatlist.push(_m);
            }
          }
          else{
            _m={
              type:'to',
              image:$scope.touser.image,
              username:$scope.touser.name,
              mess:obj.message.content,
              createAt:obj.message.meta.createAt
            }
            var timeMessage=new Date(obj.message.meta.createAt);
            var messageper={
              createAt:timeMessage,
              chatlist:[_m]
            }
            $scope.messages.push(messageper);
          }
          $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
          $scope.$apply();
        }
        else{
          //说明不是这个人发的,做一个浮动卡片，从上面
          //$scope.scheduleSingleNotification(obj.from.name,obj.message.content);
          $scope.popMessage.show=true;
          $scope.popMessage.name=obj.from.name;
          $scope.popMessage.message=obj.message.content;
          $scope.$apply();
          $timeout(function(){
            $scope.popMessage.show=false;
          },2000);
          console.log('接到了另一个人的消息'+obj.from.name+obj.message.content);
          //铃声

        }
      })
      console.log('接收'+userid);
      $rootScope.$on('ServerRecive'+userid,function(event,obj){
        //alert('接到了angularjs的广播，广播名称是'+'ServerRecive 服务器说，我收到了，你做自己的处理吧'+obj.timeid+obj.from+obj.to+obj.message.content+'事件名称是');
        //服务器收到了，把nosend表的status置0，然后将信息存入chat表
        console.log('chat页面也收到了通知'+JSON.stringify(obj));
        document.addEventListener('deviceready', function() {
          var db = null;
          db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
          db.transaction(function(tx){
            tx.executeSql('update nosend set status=? where id=? and fromuser=? and touser=?',[0,obj.timeid,obj.from,obj.to]);
            var createtime=new Date(obj.message.meta.createAt);
            tx.executeSql('insert into chat values(?,?,?,?,?,?)',[obj.message._id,obj.from,obj.to,obj.message.content,createtime.getTime(),1]);
          },function(tx,error){
            //alert('事务执行失败'+error);
          },function(){
            //alert('数据库操作成功');
            //服务器说：你发的我收到了。chat页面找到这条信息，然后把这条信息的send:sending属性去掉
            console.log('客户端收到了回执');
            for(var i=0;i<$scope.messages.length;i++){
              for(var j=0;j<$scope.messages[i].chatlist.length;j++){
                console.log($scope.messages[i].chatlist[j].userid+'     '+obj.from+'     '+$scope.messages[i].chatlist[j].timeid+'     '+obj.timeid);
                if($scope.messages[i].chatlist[j].type==='from'&&$scope.messages[i].chatlist[j].userid===obj.from&&$scope.messages[i].chatlist[j].timeid===obj.timeid){
                  //说明这条信息是发送成功的那一条
                  console.log('chat页面符合条件，修改');
                  $scope.messages[i].chatlist[j].send='';
                  break;
                }
              }
            }

            for(var k=0;k<$rootScope.retryList.length;k++){
              if(obj.timeid===$rootScope.retryList[k].startTime&&obj.to===$rootScope.retryList[k].touser){
                console.log('客户端收到了，不用再retry了');
                $rootScope.retryList.splice(k,1);
                break;
              }
            }
            $scope.$apply();
          });
        });
      });
    }
    $scope.goMain=function(){
      $state.go('tab.main');
    }
    $scope.setSaw=function(userid,touser){
      //发送通知，告诉main页面，这些东西看过了。
      document.addEventListener('deviceready', function() {
        var db = null;
        db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
        //chat全部saw置1   main的saw清0
        db.transaction(function(tx){
          tx.executeSql('update chat set saw=1 where fromuser=? and touser=? and saw=0',[userid,touser]);
          tx.executeSql('update main_message set saw=0 where master=? and relation_user_id=?',[userid,touser]);
        },function(error){
        },function(){
          $rootScope.$broadcast('SawMessage',touser);
        })
      });
    }

    $scope.NoReadListener=function(token){

      $rootScope.$on('ReceiveNoRead',function(event,obj){
        console.log('chat页面收到了服务器同步的信息，同时开始同步chat页面。');
        $scope.getMessageFromSql(token,$rootScope.touser.userid);
      });

    }

    $scope.clickRetry=function(message){
      alert(JSON.stringify(message));
    }

    $scope.CheckInputAreaHeight=function(obj){

    }



  }]);
