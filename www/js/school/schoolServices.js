/**
 * Created by Administrator on 2016/6/29.
 */
angular.module('schoolServices',[])
  .factory('$schoolData',function($http){
    return {
      list:function(requestParams){
        var url=config.basePath+'school_list?token='+requestParams.token;
        return $http({
          url:url,
          type:'GET'
        })
      },
      school:function(requestParams){
        var url=config.basePath+'school?token='+requestParams.token+'&id'+requestParams.id;
        return $http({
          url:url,
          type:'GET'
        })
      }
    }
  });
