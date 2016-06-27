/**
 * Created by Administrator on 2016/6/27.
 */
angular.module('loginServices',[])
  .factory('$loginData',function($http){
    return {
      find:function(requestParams){
        var url=config.basePath+'signin?username='+requestParams.username+'&password='+requestParams.password;
        return $http({
          url:url,
          type:'GET'
        })
      }
    }
  });
