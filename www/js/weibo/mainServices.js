/**
 * Created by Administrator on 2016/7/22.
 */
angular.module('mainServices',[])
  .factory('$mainData',function($http){
    return {
      list:function(requestParams){
        var url=config.basePath+'chat_list?token='+requestParams.token;
        return $http({
          url:url,
          type:'GET'
        })
      }
    }
  });
