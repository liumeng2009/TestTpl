/**
 * Created by Administrator on 2016/7/22.
 */
angular.module('mainServices',[])
  .factory('$mainData',function($http){
    return {
      not_read_list:function(requestParams){
        var url=config.basePath+'chat_not_read_list?token='+requestParams.token;
        return $http({
          url:url,
          method:'GET'
        })
      }
    }
  });
