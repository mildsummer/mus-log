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

  angular.module("embryo", ['myServices'])
    .controller('myCtrl', ['$scope', 'imageSearch', 'contributes', function ($scope, imageSearch, contributes) {
      //contibutionsを取得
      contributes.getAll(function(data) {
        $scope.contributions = data;
        var container = $('.embryo-three');
        var contributionImage = $('.embryo-contribution-image');
        embryo = new Embryo(data, container.get(0), container.width(), container.height());
        window.embryo = embryo;
        embryo.onselect = function(contribution) {
          if ($scope.hasSelected) {
            $scope.hasSelected = false;
            container.css({
              '-webkit-filter': 'blur(0px)'
            });
            contributionImage.css({
              'opacity': 0
            });
          } else {
            $scope.hasSelected = true;
            $scope.selectedContribution = contribution;
            $scope.$apply();
            contributionImage.css({
              'backgroundImage': 'url(' + contribution.base64 + ')',
              'backgroundSize': 'cover',
              'opacity': 1
            });
            container.css({
              '-webkit-filter': 'blur(10px)'
            })
          }
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
      $scope.closeLightbox = function () {
        $scope.hasSelected = false;
      };
    }]);

})();