import Embryo from '../javascripts/embryo.es6';

(function () {
  var data = [];
  $('.contribution').each(function() {
    data.push({
      text: $(this).find('p').text(),
      image: $(this).find('img').get(0)
    });
  });
  console.log(new Embryo(data, document.body, 1000, 500));

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
      this.submit = function (contribution, callback) {
        $http({
          url: '/contributes/post',
          method: 'POST',
          data: contribution
        })
          .success(function (data, status, headers, config) {
            callback(data);
          })

          .error(function (data, status, headers, config) {
            aleart(status + ' ' + data.message);
          });
      };
    }]);

  angular.module("myApp", ['myServices'])
    .controller('myCtrl', ['$scope', 'imageSearch', 'contributes', function ($scope, imageSearch, contributes) {
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
        });
      }
    }]);

})();