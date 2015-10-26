import Embryo from './embryo.es6';

(function () {

  var embryo;

  //angular test
  angular.module('myServices', [])
    .service('imageSearch', ['$http', function ($http) {
      this.getImages = function (query, callback) {
        var url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyCLRfeuR06RNPKbwFgoOnY0ze0IKESF7Kw&cx=001556568943546838350:0bdigrd1x8i&searchType=image&q=';
        query = encodeURIComponent(query.replace(/\s+/g, ' '));
        $http({
          url: url + query,
          method: 'GET'
        })
          .success(function (data, status, headers, config) {
            callback(data);
          })

          .error(function (data, status, headers, config) {
            alert(status + ' ' + data.message);
          });
      };
    }])
    .service('contributes', ['$http', function ($http) {
      this.getAll = function (callback) {
        $http({
          //url: '/contributes/all',
          url: './javascripts/all.json',
          method: 'GET'
        })
          .success(function (data, status, headers, config) {
            if(typeof data === 'string') {
              alert(data);
            } else {
              callback(data)
            }
          })

          .error(function (data, status, headers, config) {
            alert(status + ' ' + data.message);
          });
      };
      this.submit = function (contribution, callback) {
        $http({
          url: '/contributes/post',
          method: 'POST',
          data: contribution
        })
          .success(function (data, status, headers, config) {
            if(typeof data === 'string') {
              alert(data);
            } else {
              callback(data)
            }
          })

          .error(function (data, status, headers, config) {
            alert(status + ' ' + data.message);
          });
      };
    }]);

  angular.module("myApp", ['myServices'])
    .controller('myCtrl', ['$scope', 'imageSearch', 'contributes', function ($scope, imageSearch, contributes) {
      //contibutionsを取得
      contributes.getAll(function(data) {
        $scope.contributions = data;
        embryo = new Embryo(data, document.body, 1000, 500);
        embryo.onselect = function(contribution) {
          console.log(contribution);
          $scope.hasSelected = true;
          $scope.selectedContribution = contribution;
        };
      });

      $scope.query = 'sky';

      $scope.search = function () {
        $scope.items = [];
        imageSearch.getImages($scope.query, function (res) {
          console.log(res);
          $scope.items = res.items;
        });
      };
      $scope.select = function (item) {
        $scope.selectedItem = item;
        $scope.url = item.link;
      };
      $scope.submit = function () {
        contributes.submit({ text: $scope.text, url: $scope.url }, function(data) {
          console.log(data);
          //投稿の追加
          $scope.contributions.push(data);
          embryo.addContribution(data);
        });
      };
      $scope.closeLightBox = function () {
        $scope.hasSelected = false;
      }
    }]);

})();