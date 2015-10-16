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
          url: url + query + '&sort=stars&order=desc',
          method: 'GET'
        })

          .success(function (data, status, headers, config) {
            callback(data);
          })

          .error(function (data, status, headers, config) {
            alert(status + ' ' + data.message);
          });
      };
    }]);

  angular.module("myApp", ['myServices'])
    .controller('myCtrl', ['$scope', 'imageSearch', function ($scope, imageSearch) {
      $scope.query = 'sky';
      $scope.submit = function () {
        $scope.images = [];
        imageSearch.getImages($scope.query, function (res) {
          console.log(res);
          $scope.images = res.items;
        });
      };
    }]);

})();