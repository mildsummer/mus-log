import Embryo from './embryo.es6';

(function () {

  var embryo;

  //angular test
  angular.module('myServices', [])
    .service('imageSearch', ['$http', function ($http) {
      this.getImages = function (query, callback) {
        var items = [];
        var url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyD3inAUtfaiIqFbBMOI0Y34X1x_qvsxA8g&cx=001556568943546838350:0bdigrd1x8i&searchType=image&q=';
        query = encodeURIComponent(query.replace(/\s+/g, ' '));
        $http({
          url: url + query,
          method: 'GET'
        })
          .success(function (data, status, headers, config) {
            items = items.concat(data.items);
            console.log(items);
            if(items.length === 20) {
              callback(items);
            }
          })

          .error(function (data, status, headers, config) {
            alert(status + ' ' + data.message);
          });
        url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyD3inAUtfaiIqFbBMOI0Y34X1x_qvsxA8g&cx=001556568943546838350:0bdigrd1x8i&searchType=image&start=11&q=';
        query = encodeURIComponent(query.replace(/\s+/g, ' '));

        $http({
          url: url + query,
          method: 'GET'
        })
          .success(function (data, status, headers, config) {
            items = items.concat(data.items);
            console.log(items);
            if(items.length === 20) {
              callback(items);
            }
          })

          .error(function (data, status, headers, config) {
            alert(status + ' ' + data.message);
          });
      };
    }])
    .service('contributes', ['$http', function ($http) {
      this.getAll = function (callback) {
        $http({
          url: '/contributes/all',
          //url: './javascripts/all.json',
          method: 'GET'
        })
          .success(function (data, status, headers, config) {
            if (typeof data === 'string') {
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
            if (typeof data === 'string') {
              alert(data);
            } else {
              callback(data)
            }
          })

          .error(function (data, status, headers, config) {
            alert(status + ' ' + data.message);
          });
      };
      this.editText = function (text, contribution_id, callback) {
        $http({
          url: '/contributes/edit',
          method: 'POST',
          data: {
            text: text,
            contribution_id: contribution_id
          }
        })
          .success(function (data, status, headers, config) {
            if (typeof data === 'string') {
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
      contributes.getAll(function (data) {
        $scope.contributions = data;
        $scope.visibility.tutorial = data.length > 0;
        var container = $('.embryo-three');
        var contributionImage = $('.embryo-contribution-image');
        embryo = new Embryo(data, container.get(0), container.width(), container.height(), function() {
          $scope.visibility.loading = false;
          $scope.$apply();
        });
        window.embryo = embryo;
        embryo.onselect = function (contribution) {
          if ($scope.hasSelected) {
            $scope.hasSelected = false;
            $scope.visibility.contributionDetails = 'hidden';
            $scope.visibility.plusButton = true;
            $scope.visibility.three = true;
            $scope.$apply();
            contributionImage.css({
              'opacity': 0
            });
            //embryo.toggle();
          } else {
            $scope.hasSelected = true;
            $scope.visibility.contributionDetails = 'shown';
            $scope.visibility.plusButton = false;
            $scope.selectedContribution = contribution;
            $scope.selectedContributionText = contribution.text;
            $scope.visibility.three = false;
            $scope.$apply();
            contributionImage.css({
              'backgroundImage': 'url(' + contribution.base64 + ')',
              'backgroundSize': 'cover',
              'opacity': 1
            });
            //embryo.toggle();
          }
        };
      });

      $scope.visibility = {
        post: false,
        plusButton: true,
        contributionDetails: 'hidden',
        postSearch: true,
        postContribute: false,
        postLoading: false,
        three: true,
        loading: true,
        tutorial: false
      };

      $scope.query = '';
      $scope.contributionDetailsMessage = 'Update';

      $scope.search = function () {
        $scope.items = [];
        imageSearch.getImages($scope.query, function (items) {
          console.log(items);
          $scope.items = items;
        });
      };
      $scope.select = function (item) {
        $scope.selectedItem = item;
        $scope.url = item.link;
        $scope.visibility.postSearch = false;
        $scope.visibility.postContribute = true;
        $scope.text = $scope.query;
      };
      $scope.submit = function () {
        contributes.submit({text: $scope.text, url: $scope.url}, function (data) {
          console.log(data);
          //投稿の追加
          $scope.contributions.push(data);
          embryo.addContribution(data, function () {
            $scope.visibility.post = false;
            $scope.visibility.postSearch = true;
            $scope.visibility.postContribute = false;
            $scope.visibility.tutorial = false;
          });
        });
        $scope.visibility.postLoading = true;
      };
      $scope.editText = function () {
        console.log($scope.selectedContributionText);
        contributes.editText($scope.selectedContributionText, $scope.selectedContribution._id, function() {
          $scope.contributionDetailsMessage = 'Completed';
          $scope.$apply();
          window.setTimeout(function() {
            $scope.contributionDetailsMessage = 'Update';
            $scope.$apply();
          }, 2000);
        });
      };
      $scope.closeLightbox = function () {
        $scope.hasSelected = false;
      };
      $scope.togglePostPane = function () {
        $scope.visibility.post = !$scope.visibility.post;
      };
      $scope.toggleContributionDetails = function () {
        $scope.visibility.contributionDetails = $scope.visibility.contributionDetails == 'opened' ? 'shown' : 'opened';
      };
      $scope.backToSearch = function () {
        $scope.visibility.postSearch = true;
        $scope.visibility.postContribute = false;
      }
    }]);

})();