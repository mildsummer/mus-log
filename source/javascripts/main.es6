import Embryo from '../javascripts/embryo.es6';

$(function () {
  var data = [];
  $('.contribution').each(function() {
    data.push({
      text: $(this).find('p').text(),
      image: $(this).find('img').get(0)
    });
  });
  console.log(new Embryo(data, document.body, 1000, 500));

});


//angular test
angular.module('myServices', [])
  .service('github', ['$http', function ($http) {
    this.get_repos = function (queries, callback) {
      var url = 'https://api.github.com/search/repositories?q=';
      queries = encodeURIComponent(queries.replace(/\s+/g, ' '));

      $http({
        url: url + queries + '&sort=stars&order=desc',
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
  .controller('myCtrl', ['$scope', 'github', function ($scope, github) {
    $scope.queries = 'angular boilerplate';
    $scope.submit = function () {
      $scope.repos = [];

      github.get_repos($scope.queries, function (res) {
        $scope.repos = res.items;
      });
    };
  }]);