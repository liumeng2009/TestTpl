angular.module('starter.services', ['loginServices','usercenterServices','schoolServices','gradeServices','childrenServices','mainServices'])
  .factory('$SFTools',['$cordovaToast','$cordovaSQLite',function($cordovaToast,$cordovaSQLite){
    return {
      myToast:function(msg){
        document.addEventListener('deviceready',function() {
          $cordovaToast
            .show(msg, 'short', 'center')
            .then(function (success) {
            }, function (error) {
            });
        });
      },
      getToken:function(){
        var db = null;
        document.addEventListener('deviceready', function() {
          db = window.sqlitePlugin.openDatabase({name: 'sfDB.db3', location: 'default'});
          var query = 'select * from ';
          db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM users', [], function(tx, rs) {
              console.log('Record count (expected to be 2): ' + rs.rows.item(0).name);
              myToast('记录是:'+rs.rows.item(0));
            }, function(tx, error) {
              console.log('SELECT error: ' + error.message);
              myToast('出错了:'+error.message);
            });
          });
        });

        //var db = $cordovaSQLite.openDB({ name: "dbSF.db3",location:'default' });
        //var db=window.openDatabase({name: 'demo.db', location: 'default'});

        // for opening a background db:
        //var db = $cordovaSQLite.openDB({ name: "my.db", bgType: 1 });


      }
    }
  }]);
