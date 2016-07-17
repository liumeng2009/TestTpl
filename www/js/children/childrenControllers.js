/**
 * Created by liumeng on 2016/7/11.
 */
var selectPop;
angular.module('childrenControllers',[])
  .controller('ChildrenCtrl',['$scope','$rootScope','$ionicModal','$state','$usercenterData','$schoolData','$gradeData','$childrenData','$ionicLoading','$ionicPopup','$timeout','$window',function($scope,$rootScope,$ionicModal,$state,$usercenterData,$schoolData,$gradeData,$childrenData,$ionicLoading,$ionicPopup,$timeout,$window){
    $scope.$on('$ionicView.afterEnter',function(){
      $ionicLoading.show({
        delay:200
      });
      var token=$window.localStorage.accesstoken;
      if(token){
        $childrenData.list({token:token})
          .success(function(data){
            $ionicLoading.hide();
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg);
            }else{
              $scope.students=data.students;
            }
          })
          .error(function(){
            $ionicLoading.hide();
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{
        $ionicLoading.hide();
      }
    });
    $scope.orgnow={
      sname:'',
      _sid:'',
      gname:'',
      _gid:''
    };
    $scope.student={

    };
    $scope.selectschool=function(u){
      $ionicLoading.show({
        delay:300
      });
      var token=$window.localStorage.accesstoken;
      if(token){
        $schoolData.list_all({token:token})
          .success(function(data){
            $ionicLoading.hide();
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg);
            }else{
              $scope.schools=data.schools;
              selectPop=$ionicPopup.show({
                //template: '<div class="list"><label class="item item-radio" ng-repeat="school in schools"><input type="radio" name="group"><div class="item-content">{{school.name}}</div><i class="radio-icon ion-checkmark"></i></label></div>',
                template:'<ion-list ng-repeat="school in schools"><ion-radio ng-value="school._id" ng-click="setSchoolNow()" >{{school.name}}</ion-radio></ion-list>',
                title: '请选择学校',
                scope: $scope,
                buttons:[
                  {
                    text:'取消'
                  }
                ]
              });


            }
          })
          .error(function(){
            $ionicLoading.hide();
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{
        $ionicLoading.hide();
      }
    };
    $scope.selectgrade=function(u){
        $ionicLoading.show({
          delay:300
        });
        var token=$window.localStorage.accesstoken;
        if(token){
          $gradeData.list_by_school({token:token,id:$scope.orgnow._sid})
            .success(function(data){
              $ionicLoading.hide();
              if(data.success === 0){
                $scope.showErrorMesPopup(data.msg);
              }else{
                $scope.grades=data.grades;
                selectPop=$ionicPopup.show({
                  //template: '<div class="list"><label class="item item-radio" ng-repeat="school in schools"><input type="radio" name="group"><div class="item-content">{{school.name}}</div><i class="radio-icon ion-checkmark"></i></label></div>',
                  template:'<ion-list ng-repeat="grade in grades"><ion-radio ng-value="grade._id" ng-click="setGradeNow()" >{{grade.name}}</ion-radio></ion-list>',
                  title: '请选择班级',
                  scope: $scope,
                  buttons:[
                    {text:'取消'}
                  ]
                });


              }
            })
            .error(function(){
              $ionicLoading.hide();
              $scope.showErrorMesPopup('网络连接错误');
            });
        }
        else{
          $ionicLoading.hide();
        }
      };
    $ionicModal.fromTemplateUrl('templates/modal_children_add.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $ionicModal.fromTemplateUrl('templates/modal_chat_list.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal_chat = modal;
    });
    $scope.openModal=function(schoolid){
      $scope.modal.show();
    }
    $scope.showChatModal=function(studentid){
      $scope.modal_chat.show();
      var token=$window.localStorage.accesstoken;
      $ionicLoading.show({
        delay:300
      });
      if(token){
        $childrenData.chat_list({token:token,studentid:studentid})
          .success(function(data){
            $ionicLoading.hide();
            $scope.users=data.users;
          })
          .error(function(){
            $ionicLoading.hide();
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{

      }
    }
    $scope.setSchoolNow=function(){
      $scope.orgnow.sname=this.school.name;
      $scope.orgnow._sid=this.school._id;
      selectPop.close();
    };
    $scope.setGradeNow=function(){
      $scope.orgnow.gname=this.grade.name;
      $scope.orgnow._gid=this.grade._id;
      selectPop.close();
    };
    $rootScope.$on('$stateChangeStart',function(){
      $scope.modal.hide();
      $scope.modal_chat.hide();
    });
    //显示错误信息
    $scope.showErrorMesPopup = function(title) {
      var myPopup = $ionicPopup.show({
        title: '<b>'+title+'</b>'
      });
      $timeout(function() {
        myPopup.close(); // 2秒后关闭
      }, 1000);
    };
    $scope.save=function(){
      var child=this.student;
      child.school=$scope.orgnow._sid;
      child.grade=$scope.orgnow._gid;
      var token=$window.localStorage.accesstoken;
      $ionicLoading.show({
        delay:300
      });
      if(token){
        $childrenData.add({token:token,child:child})
          .success(function(data){
            $ionicLoading.hide();
            alert(data);
          })
          .error(function(){
            $ionicLoading.hide();
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{
        $ionicLoading.hide();
      }
    }
    $scope.chatWithUser=function(to){
      var token=$window.localStorage.accesstoken;
      if(token){
        $usercenterData.usercenter({token:token})
          .success(function(data){
            if(data.success === 0){
              $scope.showErrorMesPopup(data.msg);
            }else{
              $state.go('chat',{from:data.user.name,to:to});
            }
          })
          .error(function(){
            $scope.showErrorMesPopup('网络连接错误');
          });
      }
      else{

      }
    }
  }]);

