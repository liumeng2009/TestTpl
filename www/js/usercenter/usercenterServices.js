/**
 * Created by Administrator on 2016/6/29.
 */
angular.module('usercenterServices',[])
  .factory('$usercenterData',function($http){
    return {
      usercenter:function(requestParams){
        var url=config.basePath+'usercenter?token='+requestParams.token;
        return $http({
          url:url,
          type:'GET'
        })
      },
      user_by_id:function(requestParams){
        var url=config.basePath+'user_by_id?token='+requestParams.token+'&id='+requestParams.id;
        return $http({
          url:url,
          type:'GET'
        })
      }
    }
  });
