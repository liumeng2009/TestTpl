/**
 * Created by liumeng on 2016/10/13.
 */
angular.module('tabControllers',[])
  .controller('TabCtrl',['$scope','$rootScope','$location','$state','$SFTools','$ionicModal','$ionicScrollDelegate','$timeout','$ionicPlatform',function($scope,$rootScope,$location,$state,$SFTools,$ionicModal,$ionicScrollDelegate,$timeout,$ionicPlatform){
    $scope.$on('$ionicView.loaded',function(){
      $SFTools.getStartPage(function(value){
        //alert('从shared取出来的startPage值是'+value);
      });
    });
    $ionicModal.fromTemplateUrl('templates/modal_add.html', {
      scope: $scope,
      animation: 'slide-in-left'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.$on('modal.hidden',function(){
      if($scope.chatBroadCastListener){
        $scope.chatBroadCastListener();
      }
    });
    $scope.openChatModal=function(userid,username){

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
      if(userid){
        $scope.modal.show();
        $rootScope.touser={
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

          $scope.setSaw(_token.userid,userid);

          $scope.receiveMessagePerson(userid);

          //确认对方的身份信息
          $usercenterData.user_by_id({token:_token.token,id:userid})
            .success(function(data){
              if(data.success===0){
                $scope.showErrorMesPopup('网络连接错误'+data,goLogin);
              }
              else{
                $rootScope.touser.image=data.user.image;
              }
            })
            .error(function(){
              $scope.showErrorMesPopup('网络连接错误');
            });
        });
      }
      else{
        $scope.modal.hide();
      }

    }

    //聊天modal的方法
    $scope.messages=[];
    $scope.keyBoardStatus=false;
    $scope.getMessageFromSql=function(_token,touser){
      //alert('取得最近三天的聊天记录'+_token.userid+_token.token);
      document.addEventListener('deviceready', function() {
        //从sql读取今天并且没有查看过的所有信息
        var db = null;
        db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
        db.executeSql("create table if not exists nosend(id,fromuser,touser,content,status)");
        var now=new Date();
        var DateSwap=new Date();
        DateSwap.setHours(0);
        DateSwap.setMinutes(0);
        DateSwap.setSeconds(0);
        var resultThreeDaysAgo=new Date(DateSwap.getTime()-2*24*3600*1000);
        var sqlStr='select fromuser,touser,content,createAt,id as status from chat'+
          ' where createAt>='+resultThreeDaysAgo.getTime()+' and'+
          ' (fromuser=\''+_token.userid+'\' and touser=\''+touser+'\''
          +' or touser=\''+_token.userid+'\' and fromuser=\''+touser+'\')'
          +' union'
          +' select fromuser,touser,content,id as createAt,status from nosend where status=1 and '
          +' touser=\''+touser+'\' and fromuser=\''+_token.userid+'\''
          +' order by createAt asc';
        db.transaction(function(tx){
            tx.executeSql(sqlStr,[],function(tx,rs){
              for(var i=0;i<rs.rows.length;i++){
                //alert('第'+i+'条信息'+rs.rows.item(i).content);
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
                    chatlist.push(_m);
                    var messageper={
                      createAt:rs.rows.item(i).createAt,
                      chatlist:chatlist
                    }
                    $scope.messages.push(messageper);
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
                    $scope.messages[$scope.messages.length-1].chatlist.push(_m);
                  }
                }
                else{
                  //alert('走这里了');
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
                  $scope.messages.push(messageper);
                }
              }
            });
          },function(error){
            //alert(error);
          },
          function(){
            $scope.$apply();
            $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
          });

      });
    }
    $scope.send=function(){
      console.log('和我聊天的人是：'+$rootScope.touser._id+$rootScope.touser.name);
      $SFTools.getToken(function(_token){
        if(_token&&_token.userid&&_token!=''){
          var time=new Date();
          var timeid=time.getTime();
          var sendContent=$scope.send.sendMessage;
          iosocket.emit('private message', _token.userid, $rootScope.touser._id, sendContent,timeid,_token.deviceid);
          //加入发送超时模块,一分钟没收到反馈，就再次发送，一直循环，持续5次。如果网络恢复，也尝试发送
          //超过五次，标识为发送不成功，再次发送需要用户确认
          //将信息存入未发表成功的信息表
          document.addEventListener('deviceready', function() {
            var db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
            // status=1 默认 status=0的时候，说明这条数据发送成功了 id列就是时间
            db.executeSql('create table if not exists nosend(id,fromuser,touser,content,status)');
            db.transaction(function(tx){
              tx.executeSql('insert into nosend values(?,?,?,?,?)',[timeid,_token.userid,$rootScope.touser._id,sendContent,1]);
            },function(tx,error){

            },function(){

            });
          });

          //发送广播，用户发送信息了
          $rootScope.$broadcast('SendingMessage',{userid:$rootScope.touser._id,content:sendContent});
          document.addEventListener('deviceready', function() {
            var db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
            //main-message列表存入一条status=sending的消息
            var master = _token.userid;
            var relation_user = $rootScope.touser.username;
            var relation_user_id = $rootScope.touser._id;
            var main_content = sendContent;
            var main_saw = 0;
            var main_status = 'sending';
            db.executeSql('insert into main_message values(?,?,?,?,?,?,?,?)', [master, relation_user, relation_user_id, main_content, timeid, main_saw, main_status,'']);
          });

          //实时显示
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
            var lastCreateAt=$scope.messages[$scope.messages.length-1].createAt;
            if(timenow.getTime()-lastCreateAt>TIME_SPACING*60*1000){
              //说明不在一个时间段
              var messageper={
                createAt:timenow.getTime(),
                chatlist:[_m]
              }
              $scope.messages.push(messageper);
            }
            else{
              //说明在一个时间段
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
          $scope.send.sendMessage = '';
          //$ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
          $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom();
          $scope.$apply();
        }
      });
    };
    $scope.receiveMessagePerson=function(userid){
      $scope.chatBroadCastListener=$rootScope.$on('ReciveMessage',function(event,obj){
        //保存已经被main页面做了，所以实时显示即可
        if(userid===obj.from._id){
          if($scope.messages.length>0){
            _m={
              type:'to',
              image:$rootScope.touser.image,
              username:$rootScope.touser.name,
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
              image:$rootScope.touser.image,
              username:$rootScope.touser.name,
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
          //说明不是这个人发的,发出通知
          $scope.scheduleSingleNotification(obj.from.name,obj.message.content);
        }

      })
      $rootScope.$on('ServerRecive'+userid,function(event,obj){
        // alert('接到了angularjs的广播，广播名称是'+'ServerRecive'+$stateParams.userid+'服务器说，我收到了，你做自己的处理吧'+obj.timeid+obj.from+obj.to+obj.message.content+'事件名称是');
        //服务器收到了，把nosend表的status置0，然后将信息存入chat表
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
            for(var i=0;i<$scope.messages.length;i++){
              for(var j=0;j<$scope.messages[i].chatlist.length;j++){
                //alert($scope.messages[i].chatlist[j].mess+'     '+$scope.messages[i].chatlist[j].timeid+'     '+obj.timeid+'       '+obj.message.content);
                if($scope.messages[i].chatlist[j].type==='from'&&$scope.messages[i].chatlist[j].userid===obj.from&&$scope.messages[i].chatlist[j].timeid===obj.timeid){
                  //说明这条信息是发送成功的那一条
                  //alert('chat页面符合条件，修改');
                  $scope.messages[i].chatlist[j].send='';
                  break;
                }
              }
            }
            $scope.$apply();
          });
        });
      });
    }
    $scope.closeModal=function(){
      $scope.modal.hide();
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

    //从服务器同步离线消息，并发出全局通知
    $scope.initMessageFromServer=function(token){
      $scope.LoadingServer=true;
      document.addEventListener('deviceready', function() {
        var db = null;
        db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
        db.executeSql('select * from main_message',[],function(rs){
          var mainArray=[];
          var userInfoArray=[];
          for(var o=0;o<rs.rows.length;o++){
            var mainObj={
              master:rs.rows.item(o).master,
              relation_user:rs.rows.item(o).relation_user,
              relation_user_id:rs.rows.item(o).relation_user_id,
              content:rs.rows.item(o).content,
              createAt:rs.rows.item(o).createAt,
              saw:rs.rows.item(o).saw,
              status:rs.rows.item(o).status,
              relation_chat_id:rs.rows.item(o).relation_chat_id
            }
            mainArray.push(mainArray);
          }
          db.executeSql('select * from userinfo',[],function(rsUserInfo){
            for(var oo=0;oo<rsUserInfo.rows.length;oo++){
              var userInfoObj={
                id:rsUserInfo.rows.item(oo).id,
                name:rsUserInfo.rows.item(oo).name,
                image:rsUserInfo.rows.item(oo).image,
                showInMain:rsUserInfo.rows.item(oo).showInMain
              }
              userInfoArray.push(userInfoObj);
            }
            $mainData.not_read_list({token:token.token}).success(function(data){
              $SFTools.myToast('从服务器同步信息的条数是：'+JSON.stringify(data.chats));
              //获取信息之后，将同步的信息，存入sqlite
              var insertSqls=[];
              var insertUser=[];
              var mainServer=[];
              for(var i=0;i<data.chats.length;i++){
                //首先看和user发生关系的这个人的信息，是否在userinfo表中存在，存在不修改，不存在新增
                var fromuser=data.chats[i].from;
                var touser=data.chats[i].to;
                //同步userinfo表
                var relation_user={};
                if(token.userid===fromuser._id.toString()) {
                  relation_user={
                    name:touser.name,
                    userid:touser._id,
                    image:touser.image,
                    action:'to'
                  }
                }
                else{
                  relation_user={
                    name:fromuser.name,
                    userid:fromuser._id,
                    image:fromuser.image,
                    action:'from'
                  }
                }
                console.log('这条有关联系人的信息是：'+relation_user.name+'他的行为是'+relation_user.action);
                var existUser=false;

                if(userInfoArray.length>0){
                  for(var ui=0;ui<userInfoArray.length;ui++){
                    console.log('循环'+relation_user.userid+'和'+userInfoArray[ui].id);
                    if(relation_user.userid===userInfoArray[ui].id){
                      //说明存在，不管
                      break;
                    }
                    else{
                      if(ui===userInfoArray.length-1){
                        //说明不存在，插入
                        console.log(relation_user.name+'不存在插入1');
                        var userInfoArrayObj={
                          id:relation_user.userid,
                          name:relation_user.name,
                          image:relation_user.image,
                          showInMain:1
                        }
                        userInfoArray.push(userInfoArrayObj);
                        insertUser.push('insert into userinfo values(\''+userInfoArrayObj.id+'\',\''+userInfoArrayObj.name+'\',\''+userInfoArrayObj.image+'\',1)');
                        break;
                      }
                    }
                  }
                }
                else{
                  console.log(relation_user.name+'不存在插入2');
                  var userInfoArrayObj={
                    id:relation_user.userid,
                    name:relation_user.name,
                    image:relation_user.image,
                    showInMain:1
                  }
                  userInfoArray.push(userInfoArrayObj);
                  insertUser.push('insert into userinfo values(\''+userInfoArrayObj.id+'\',\''+userInfoArrayObj.name+'\',\''+userInfoArrayObj.image+'\',1)');
                }


                //同步chat
                var createDate=new Date(data.chats[i].meta.createAt);
                var chatObj={
                  id:data.chats[i]._id,
                  fromuser:fromuser._id.toString(),
                  touser:touser._id.toString(),
                  content:data.chats[i].content,
                  createAt:createDate.getTime(),
                  saw:0
                }

                console.log('服务器同步过来的消息，客户端没有，进行插入操作');
                insertSqls.push('insert into chat values(\''+chatObj.id+'\',\''+chatObj.fromuser+'\',\''+chatObj.touser+'\',\''+chatObj.content+'\','+chatObj.createAt+',0)')


                //同步main_message
                //得到的服务器消息，需要和sqlite中的main_message作比较 mainArray是当前数据库中的数据
                //把服务器传输过来的数据，做main_message筛选,放在mainServer里面
                console.log('mainServer第一次插入的时候数据是：'+JSON.stringify(mainServer));
                if(mainServer.length===0){
                  var mainServerObj={
                    master:token.userid,
                    relation_user:relation_user.name,
                    relation_user_id:relation_user.userid,
                    content:data.chats[i].content,
                    createAt:createDate.getTime(),
                    saw:relation_user.action==='to'?0:((data.chats[i].saw==="0"||data.chats[i].saw==="1"||data.chats[i].saw==="")?1:0),
                    status:1,
                    relation_chat_id:relation_user.action==="to"?"":data.chats[i]._id.toString()
                  }
                  mainServer.push(mainServerObj);
                }
                else{
                  for(var k=0;k<mainServer.length;k++){
                    if(mainServer[k].relation_user_id===relation_user.userid){
                      console.log('Mainserver中的第'+k+'个人和这条chat的人是相同的'+mainServer[k].relation_user_id+mainServer[k].relation_user);
                      //比较他们的createAt
                      if(mainServer[k].createAt> createDate.getTime()){
                        //说明这条信息和之前那个相比，不新，就不需要更新了
                      }
                      else{
                        //更加新的一条信息，需要更新mainServer
                        mainServer[k].content=data.chats[i].content;
                        mainServer[k].createAt=createDate.getTime();
                        if(relation_user.action==='to'){
                          mainServer[k].saw=0;
                        }
                        else{
                          mainServer[k].saw=(data.chats[i].saw==="0"||data.chats[i].saw==="1"||data.chats[i].saw==="")?mainServer[k].saw+1:mainServer[k].saw;
                        }
                        mainServer[k].relation_chat_id=relation_user.action==="to"?"":data.chats[i]._id.toString();
                      }
                      break;
                    }
                    else{
                      //说明是和另一个人的联系
                      if(k===mainServer.length-1){
                        //说明是新的，insert进mainServer
                        var mainServerObj={
                          master:token.userid,
                          relation_user:relation_user.name,
                          relation_user_id:relation_user.userid,
                          content:data.chats[i].content,
                          createAt:createDate.getTime(),
                          saw:relation_user.action==='to'?0:((data.chats[i].saw==="0"||data.chats[i].saw==="1"||data.chats[i].saw==="")?1:0),
                          status:1,
                          relation_chat_id:relation_user.action==="to"?"":data.chats[i]._id.toString()
                        }
                        mainServer.push(mainServerObj);
                      }
                      else{
                        //继续循环
                      }
                    }
                  }
                }
              }

              //循环完毕，把mainServer[]和mainArray[]整合，确定这一系列的sql
              if(mainArray.length===0){
                //相当于main_message对象是空的，把服务器的main直接放进去就可以了
                for(var ss=0;ss<mainServer.length;ss++){
                  insertSqls.push('insert into main_message values(\''+mainServer[ss].master+'\',\''+mainServer[ss].relation_user+'\',\''+mainServer[ss].relation_user_id+'\',\''+mainServer[ss].content+'\','+mainServer[ss].createAt+','+mainServer[ss].saw+','+mainServer[ss].status+',\''+mainServer[ss].relation_chat_id+'\')');
                }
              }
              else{
                for(var cc=0;cc<mainServer.length;cc++){
                  for(var tt=0;tt<mainArray.length;tt++){
                    if(mainArray[tt].relation_user_id===mainServer[cc].relation_user_id){
                      if(mainArray[tt].createAt>mainServer[cc].createAt){
                        //说明这条信息不新，不用修改了
                      }
                      else{
                        //说明服务器过来的这个消息是新的，修改之
                        var contentUpdate=mainServer[cc].content;
                        var createAtUpdate=mainServer[cc].createAt;
                        var sawUpdate=0;
                        if(mainServer[cc].relation_chat_id===""){

                        }
                        else{
                          sawUpdate=mainArray[tt].saw+1;
                        }
                        var relationChatIdUpdate=mainServer[cc].relation_chat_id;
                        var masterUpdate=mainServer[cc].master;
                        var relationUserId=mainServer[cc].relation_user_id;
                        insertSqls.push('update main_message set content=\''+contentUpdate+'\',createAt='+createAtUpdate+',saw='+sawUpdate+',relation_chat_id=\''+relationChatIdUpdate+'\' where master=\''+masterUpdate+'\' and relation_user_id=\''+relationChatIdUpdate+'\' and status=1 ');
                      }
                      break;
                    }
                    else{
                      //循环到最后一个
                      if(tt===mainArray.length-1){
                        //说明就是最后的一个了,需要insert
                        insertSqls.push('insert into main_message values(\''+mainServer[cc].master+'\',\''+mainServer[cc].relation_user+'\',\''+mainServer[cc].relation_user_id+'\',\''+mainServer[cc].content+'\','+mainServer[cc].createAt+','+mainServer[cc].saw+','+mainServer[cc].status+',\''+mainServer[cc].relation_chat_id+'\')');
                      }
                      else{

                      }
                    }
                  }
                }
              }
              console.log('信息规整完成，插入了'+insertUser.length+'条用户数据，插入了'+insertSqls.length+'条chat和userinfo数据');
              console.log('同步的聊天信息sql是：'+JSON.stringify(insertSqls));
              console.log('同步的用户信息sql是：'+JSON.stringify(insertUser));
              db.transaction(function(tx){
                for(var u=0;u<insertUser.length;u++){
                  tx.executeSql(insertUser[u]);
                }
                for(var z=0;z<insertSqls.length;z++){
                  tx.executeSql(insertSqls[z]);
                }
              },function(err){
                console.log('写入数据库出错了'+error);
              },function(){
                $scope.chats=[];
                $scope.initChat(token);
                $scope.initMessageFromSql(token.userid);
                $scope.LoadingServer=false;
                console.log('写入数据库成功,服务器可以修改标志位了,把这个用户相关的消息的标志位都改成这台设备的');
                $mainData.setNewDeviceId({userid:token.userid,deviceid:token.deviceid,token:token.token});
              });
            }).error(function(error){
              $SFTools.myToast('从服务器同步信息失败'+error);
            });



          })


        })
      });
    }


  }]);
