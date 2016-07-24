/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('loginServices',[])
  .factory('$loginData',function($http){
    return {
      login:function(requestParams){
        var url=config.basePath+'signin?username='+requestParams.username+'&password='+requestParams.password;
        return $http({
          url:url,
          type:'GET'
        })
      },
      reg:function(requestParams){
        var url=config.basePath+'signup'
        return $http({
          method:'POST',
          url:url,
          data:requestParams
        })
      }
    }
  });
