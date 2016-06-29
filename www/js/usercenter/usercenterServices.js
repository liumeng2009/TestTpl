/**
 * Created by Administrator on 2016/6/29.
 */
angular.module('usercenterServices',[])
  .factory('$usercenterData',function($http){
    return {
      login:function(requestParams){
        var url=config.basePath+'signin?username='+requestParams.username+'&password='+requestParams.password;
        return $http({
          url:url,
          type:'GET'
        })
      }
    }
  });
