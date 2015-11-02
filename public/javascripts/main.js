(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author qiao / https://github.com/qiao
 * @fileoverview This is a convex hull generator using the incremental method. 
 * The complexity is O(n^2) where n is the number of vertices.
 * O(nlogn) algorithms do exist, but they are much more complicated.
 *
 * Benchmark: 
 *
 *  Platform: CPU: P7350 @2.00GHz Engine: V8
 *
 *  Num Vertices	Time(ms)
 *
 *     10           1
 *     20           3
 *     30           19
 *     40           48
 *     50           107
 */

"use strict";

THREE.ConvexGeometry = function (vertices) {

	THREE.Geometry.call(this);

	var faces = [[0, 1, 2], [0, 2, 1]];

	for (var i = 3; i < vertices.length; i++) {

		addPoint(i);
	}

	function addPoint(vertexId) {

		var vertex = vertices[vertexId].clone();

		var mag = vertex.length();
		vertex.x += mag * randomOffset();
		vertex.y += mag * randomOffset();
		vertex.z += mag * randomOffset();

		var hole = [];

		for (var f = 0; f < faces.length;) {

			var face = faces[f];

			// for each face, if the vertex can see it,
			// then we try to add the face's edges into the hole.
			if (visible(face, vertex)) {

				for (var e = 0; e < 3; e++) {

					var edge = [face[e], face[(e + 1) % 3]];
					var boundary = true;

					// remove duplicated edges.
					for (var h = 0; h < hole.length; h++) {

						if (equalEdge(hole[h], edge)) {

							hole[h] = hole[hole.length - 1];
							hole.pop();
							boundary = false;
							break;
						}
					}

					if (boundary) {

						hole.push(edge);
					}
				}

				// remove faces[ f ]
				faces[f] = faces[faces.length - 1];
				faces.pop();
			} else {

				// not visible

				f++;
			}
		}

		// construct the new faces formed by the edges of the hole and the vertex
		for (var h = 0; h < hole.length; h++) {

			faces.push([hole[h][0], hole[h][1], vertexId]);
		}
	}

	/**
  * Whether the face is visible from the vertex
  */
	function visible(face, vertex) {

		var va = vertices[face[0]];
		var vb = vertices[face[1]];
		var vc = vertices[face[2]];

		var n = normal(va, vb, vc);

		// distance from face to origin
		var dist = n.dot(va);

		return n.dot(vertex) >= dist;
	}

	/**
  * Face normal
  */
	function normal(va, vb, vc) {

		var cb = new THREE.Vector3();
		var ab = new THREE.Vector3();

		cb.subVectors(vc, vb);
		ab.subVectors(va, vb);
		cb.cross(ab);

		cb.normalize();

		return cb;
	}

	/**
  * Detect whether two edges are equal.
  * Note that when constructing the convex hull, two same edges can only
  * be of the negative direction.
  */
	function equalEdge(ea, eb) {

		return ea[0] === eb[1] && ea[1] === eb[0];
	}

	/**
  * Create a random offset between -1e-6 and 1e-6.
  */
	function randomOffset() {

		return (Math.random() - 0.5) * 2 * 1e-6;
	}

	/**
  * XXX: Not sure if this is the correct approach. Need someone to review.
  */
	function vertexUv(vertex) {

		var mag = vertex.length();
		return new THREE.Vector2(vertex.x / mag, vertex.y / mag);
	}

	// Push vertices into `this.vertices`, skipping those inside the hull
	var id = 0;
	var newId = new Array(vertices.length); // map from old vertex id to new id

	for (var i = 0; i < faces.length; i++) {

		var face = faces[i];

		for (var j = 0; j < 3; j++) {

			if (newId[face[j]] === undefined) {

				newId[face[j]] = id++;
				this.vertices.push(vertices[face[j]]);
			}

			face[j] = newId[face[j]];
		}
	}

	// Convert faces into instances of THREE.Face3
	for (var i = 0; i < faces.length; i++) {

		this.faces.push(new THREE.Face3(faces[i][0], faces[i][1], faces[i][2]));
	}

	// Compute UVs
	for (var i = 0; i < this.faces.length; i++) {

		var face = this.faces[i];

		this.faceVertexUvs[0].push([vertexUv(this.vertices[face.a]), vertexUv(this.vertices[face.b]), vertexUv(this.vertices[face.c])]);
	}

	this.computeFaceNormals();
	this.computeVertexNormals();
};

THREE.ConvexGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.ConvexGeometry.prototype.constructor = THREE.ConvexGeometry;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('./three-mouse-event.es6');

require('./ConvexGeometry');

THREE.Vector3.prototype.mix = function (y, a) {
  return this.multiplyScalar(1 - a).add(y.clone().multiplyScalar(a));
};

var Embryo = (function () {
  function Embryo(data, container, width, height, callback) {
    var _this = this;

    _classCallCheck(this, Embryo);

    //* data : array of contributions
    //* contribution
    //* {
    //*   image: DOMImage
    //*   text: String
    //* }
    this.data = data;
    this.createCallback = callback;

    //テクスチャの作成
    var loadedNum = 0;
    data.forEach(function (contribution, index) {
      var image = new Image();
      image.onload = function () {
        var texture = Embryo.createTexture(image);
        _this.data[index].texture = texture;
        loadedNum++;
        if (loadedNum === data.length) {
          _this.initialize(container, width, height);
        }
      };
      image.src = contribution.base64;
    });

    return this;
  }

  _createClass(Embryo, [{
    key: 'initialize',
    value: function initialize(container, width, height) {
      this.width = width;
      this.height = height;
      this.isHidden = false;

      //init scene
      var scene = new THREE.Scene();

      //init camera
      var fov = 60;
      var aspect = width / height;
      var camera = new THREE.PerspectiveCamera(fov, aspect);
      camera.position.set(0, 0, height / 2 / Math.tan(fov * Math.PI / 180 / 2));
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      scene.add(camera);

      //init renderer
      var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setClearColor(0xcccccc, 0);
      container.appendChild(renderer.domElement);

      //init controls
      var controls = new THREE.TrackballControls(camera, renderer.domElement);

      //watch mouse events
      scene.watchMouseEvent(renderer.domElement, camera);

      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.controls = controls;

      //生成
      this.create(this.createCallback);

      this.count = 0;

      //console.log(this.frames);

      var update = (function () {
        controls.update();
        renderer.render(scene, camera);
        //scene.handleMouseEvent();
        this.count++;
        this.moveVertices().rotate();
        requestAnimationFrame(update);
      }).bind(this);
      update();

      return this;
    }
  }, {
    key: 'create',
    value: function create(callback) {
      var _this2 = this;

      this.geometry = Embryo.createGeometry(100, this.data.length);
      this.frames = Embryo.createFrames(this.geometry, this.data);
      this.frames.children && this.frames.children.forEach(function (frame) {
        //マウスイベントの設定
        frame.onclick = function (intersect) {
          if (typeof _this2.onselect === 'function') {
            frame.data && _this2.onselect(frame.data);
          }
        };
        //frame.onmouseover = (intersect) => {
        //  intersect.face.mouseon = true;
        //};
      });
      this.scene.add(this.frames);
      if (typeof callback === 'function') {
        callback();
      }

      return this;
    }

    //三角の面で構成される多面体の作成
  }, {
    key: 'moveVertices',
    value: function moveVertices() {
      var _this3 = this;

      //console.log(this.frames.children[0].geometry.vertices[0]);
      this.frames.children.forEach(function (frame) {
        var face = frame.geometry.faces[0];
        frame.geometry.vertices.forEach(function (vertex, index) {
          vertex.mix(face.normal, 0.1).setLength(vertex.originalLength + 5 * Math.cos(_this3.count / 20 + index * 10));
        });
        frame.geometry.verticesNeedUpdate = true;
        frame.geometry.computeFaceNormals();
      });

      return this;
    }
  }, {
    key: 'rotate',
    value: function rotate() {
      this.frames.rotation.set(0, this.count / 500, 0);
    }

    /*
      three.jsオブジェクトの削除
     */
  }, {
    key: 'clear',
    value: function clear() {
      this.geometry && this.geometry.dispose();
      this.frames.children.forEach(function (frame) {
        frame.geometry.dispose();
        frame.material.dispose();
      });
      this.scene.remove(this.frames);

      return this;
    }

    /*
      contributionの追加
      @param contribution {Object} 投稿
     */
  }, {
    key: 'addContribution',
    value: function addContribution(contribution, callback) {
      var _this4 = this;

      var image = new Image();
      image.onload = function () {
        contribution.texture = Embryo.createTexture(image);
        _this4.data.push(contribution);
        _this4.clear().create(callback); //リセット
      };
      image.src = contribution.base64;

      return this;
    }
  }, {
    key: 'setSize',
    value: function setSize(width, height) {
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      return this;
    }
  }, {
    key: 'toggle',
    value: function toggle() {
      var _this5 = this;

      var TOTAL_COUNT = 36;
      var START_POINT = this.frames.position.clone();
      var END_POINT = this.isHidden ? new THREE.Vector3() : new THREE.Vector3(0, -200, -200);
      var count = 0;
      console.log(START_POINT);
      var animate = function animate() {
        var n = count / TOTAL_COUNT - 1;
        var newPoint = START_POINT.clone().mix(END_POINT, Math.pow(n, 5) + 1);
        _this5.frames.position.set(newPoint.x, newPoint.y, newPoint.z);
        if (count < TOTAL_COUNT) {
          count++;
          window.requestAnimationFrame(animate);
        }
      };
      window.requestAnimationFrame(animate);
      this.isHidden = !this.isHidden;
    }
  }], [{
    key: 'createGeometry',
    value: function createGeometry(radius, surfaceNumber) {
      var vertices = [];
      surfaceNumber = surfaceNumber < 4 ? 4 : surfaceNumber; //４以下は不可
      surfaceNumber = surfaceNumber & 1 ? surfaceNumber + 1 : surfaceNumber; //奇数は不可(より大きい偶数に直す)
      for (var i = 0, l = 2 + surfaceNumber / 2; i < l; i++) {
        vertices[i] = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5); //球状にランダムに点を打つ
        vertices[i].setLength(radius);
        vertices[i].originalLength = radius;
      }
      return new THREE.ConvexGeometry(vertices);
    }
  }, {
    key: 'createFrames',
    value: function createFrames(geometry, data) {
      var vertextShader = '' + 'varying vec4 vPosition;' + 'void main() {' + '  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);' + '  vPosition = gl_Position;' + '}';

      var fragmentShader = '' + 'uniform sampler2D texture;' + 'uniform float opacity;' + 'varying vec4 vPosition;' + 'void main(void){' + '  vec4 textureColor = texture2D(texture, vec2((1.0 + vPosition.x / 100.0) / 2.0, (1.0 + vPosition.y / 100.0) / 2.0));' + '  textureColor.w = opacity;' + '  gl_FragColor = textureColor;' +
      //'      gl_FragColor = vec4((vPosition.x / 800.0 + 1.0) / 2.0, (vPosition.y / 800.0 + 1.0) / 2.0, 0, 0);' +
      '}';

      var frames = new THREE.Object3D();
      geometry.faces.forEach(function (face, index) {
        var a = geometry.vertices[face.a],
            b = geometry.vertices[face.b],
            c = geometry.vertices[face.c];

        //create geometry
        var frameGeometry = new THREE.Geometry();
        frameGeometry.vertices = [a, b, c];
        frameGeometry.faces = [new THREE.Face3(0, 1, 2)];
        frameGeometry.computeFaceNormals();
        frameGeometry.computeVertexNormals();

        //create material
        var frameMaterial = new THREE.ShaderMaterial({
          vertexShader: vertextShader,
          fragmentShader: fragmentShader,
          uniforms: {
            texture: { type: "t", value: data[index] ? data[index].texture : null },
            opacity: { type: "f", value: 1.0 }
          }
        });

        var mesh = new THREE.Mesh(frameGeometry, frameMaterial);
        mesh.data = data[index];

        frames.add(mesh);
      });
      return frames;
    }
  }, {
    key: 'createTexture',
    value: function createTexture(image) {
      var texture = new THREE.Texture(this.getSuitableImage(image));
      //texture.magFilter = texture.minFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
      return texture;
    }

    //画像サイズを調整
  }, {
    key: 'getSuitableImage',
    value: function getSuitableImage(image) {
      var w = image.naturalWidth,
          h = image.naturalHeight;
      //var size = Math.pow(2, Math.log(Math.min(w, h)) / Math.LN2 | 0); // largest 2^n integer that does not exceed
      var size = 128;
      if (w !== h || w !== size) {
        var canvas = document.createElement('canvas');
        var offsetX = h / w > 1 ? 0 : (w - h) / 2;
        var offsetY = h / w > 1 ? (h - w) / 2 : 0;
        var clipSize = h / w > 1 ? w : h;
        canvas.height = canvas.width = size;
        canvas.getContext('2d').drawImage(image, offsetX, offsetY, clipSize, clipSize, 0, 0, size, size);
        image = canvas;
      }
      return image;
    }
  }]);

  return Embryo;
})();

exports['default'] = Embryo;
module.exports = exports['default'];

},{"./ConvexGeometry":1,"./three-mouse-event.es6":4}],3:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _embryoEs6 = require('./embryo.es6');

var _embryoEs62 = _interopRequireDefault(_embryoEs6);

(function () {

  var embryo;

  //angular test
  angular.module('myServices', []).service('imageSearch', ['$http', function ($http) {
    this.getImages = function (query, callback) {
      var items = [];
      var url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyD3inAUtfaiIqFbBMOI0Y34X1x_qvsxA8g&cx=001556568943546838350:0bdigrd1x8i&searchType=image&q=';
      query = encodeURIComponent(query.replace(/\s+/g, ' '));
      $http({
        url: url + query,
        method: 'GET'
      }).success(function (data, status, headers, config) {
        items = items.concat(data.items);
        console.log(items);
        if (items.length === 20) {
          callback(items);
        }
      }).error(function (data, status, headers, config) {
        alert(status + ' ' + data.message);
      });
      url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyD3inAUtfaiIqFbBMOI0Y34X1x_qvsxA8g&cx=001556568943546838350:0bdigrd1x8i&searchType=image&start=11&q=';
      query = encodeURIComponent(query.replace(/\s+/g, ' '));

      $http({
        url: url + query,
        method: 'GET'
      }).success(function (data, status, headers, config) {
        items = items.concat(data.items);
        console.log(items);
        if (items.length === 20) {
          callback(items);
        }
      }).error(function (data, status, headers, config) {
        alert(status + ' ' + data.message);
      });
    };
  }]).service('contributes', ['$http', function ($http) {
    this.getAll = function (callback) {
      $http({
        url: '/contributes/all',
        //url: './javascripts/all.json',
        method: 'GET'
      }).success(function (data, status, headers, config) {
        if (typeof data === 'string') {
          alert(data);
        } else {
          callback(data);
        }
      }).error(function (data, status, headers, config) {
        alert(status + ' ' + data.message);
      });
    };
    this.submit = function (contribution, callback) {
      $http({
        url: '/contributes/post',
        method: 'POST',
        data: contribution
      }).success(function (data, status, headers, config) {
        if (typeof data === 'string') {
          alert(data);
        } else {
          callback(data);
        }
      }).error(function (data, status, headers, config) {
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
      }).success(function (data, status, headers, config) {
        if (typeof data === 'string') {
          alert(data);
        } else {
          callback(data);
        }
      }).error(function (data, status, headers, config) {
        alert(status + ' ' + data.message);
      });
    };
  }]);

  angular.module("embryo", ['myServices']).controller('myCtrl', ['$scope', 'imageSearch', 'contributes', function ($scope, imageSearch, contributes) {
    //contibutionsを取得
    contributes.getAll(function (data) {
      $scope.contributions = data;
      var container = $('.embryo-three');
      var contributionImage = $('.embryo-contribution-image');
      embryo = new _embryoEs62['default'](data, container.get(0), container.width(), container.height(), function () {
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
      loading: true
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
      contributes.submit({ text: $scope.text, url: $scope.url }, function (data) {
        console.log(data);
        //投稿の追加
        $scope.contributions.push(data);
        embryo.addContribution(data, function () {
          $scope.visibility.post = false;
          $scope.visibility.postSearch = true;
          $scope.visibility.postContribute = false;
        });
      });
      $scope.visibility.postLoading = true;
    };
    $scope.editText = function () {
      console.log($scope.selectedContributionText);
      contributes.editText($scope.selectedContributionText, $scope.selectedContribution._id, function () {
        $scope.contributionDetailsMessage = 'Completed';
        $scope.$apply();
        window.setTimeout(function () {
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
    };
  }]);
})();

},{"./embryo.es6":2}],4:[function(require,module,exports){
'use strict';

THREE.Scene.prototype.watchMouseEvent = function (domElement, camera) {
  var preIntersects = [];
  var mouseDownIntersects = [];
  var preEvent;
  var mouseDownPoint = new THREE.Vector2();
  var _this = this;

  function handleMouseDown(event) {
    event.preventDefault();

    var mouse = new THREE.Vector2();
    var rect = domElement.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / domElement.width * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / domElement.height) * 2 + 1;

    //onmousedown
    preIntersects.forEach(function (preIntersect) {
      var object = preIntersect.object;
      if (typeof object.onmousedown === 'function') {
        object.onmousedown(preIntersect);
      }
    });
    mouseDownIntersects = preIntersects;

    preEvent = event;
    mouseDownPoint = new THREE.Vector2(mouse.x, mouse.y);
  }

  function handleMouseUp(event) {
    event.preventDefault();

    var mouse = new THREE.Vector2();
    var rect = domElement.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / domElement.width * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / domElement.height) * 2 + 1;

    //onmouseup
    preIntersects.forEach(function (intersect) {
      var object = intersect.object;
      if (typeof object.onmouseup === 'function') {
        object.onmouseup(intersect);
      }
    });

    if (mouseDownPoint.distanceTo(new THREE.Vector2(mouse.x, mouse.y)) < 5) {
      //onclick
      mouseDownIntersects.forEach(function (intersect) {
        var object = intersect.object;
        if (typeof object.onclick === 'function') {
          if (exist(preIntersects, intersect)) {
            object.onclick(intersect);
          }
        }
      });
    }

    preEvent = event;
  }

  function handleMouseMove(event) {
    event.preventDefault();

    var mouse = new THREE.Vector2();
    var rect = domElement.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / domElement.width * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / domElement.height) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(_this.children, true);
    intersects.length = 1; //手前のオブジェクトのみ

    //console.log(intersects);
    intersects.forEach(function (intersect) {
      var object = intersect.object;
      //onmousemove
      if (typeof object.onmousemove === 'function') {
        object.onmousemove(intersect);
      }

      //onmouseover
      if (typeof object.onmouseover === 'function') {
        if (!exist(preIntersects, intersect)) {
          object.onmouseover(intersect);
        }
      }
    });

    //onmouseout
    preIntersects.forEach(function (preIntersect) {
      var object = preIntersect.object;
      if (typeof object.onmouseout === 'function') {
        if (!exist(intersects, preIntersect)) {
          preIntersect.object.onmouseout(preIntersect);
        }
      }
    });

    preIntersects = intersects;
    preEvent = event;
  }

  function exist(intersects, targetIntersect) {
    //intersects.forEach(function(intersect) {
    //  if(intersect.object == targetIntersect.object) return true;
    //});
    //return false;
    return typeof intersects[0] === 'object' && intersects[0].object === targetIntersect.object;
  }

  domElement.addEventListener('mousedown', handleMouseDown);
  domElement.addEventListener('mouseup', handleMouseUp);
  domElement.addEventListener('mousemove', handleMouseMove);

  THREE.Scene.prototype.handleMouseEvent = function () {
    preEvent && handleMouseMove(preEvent);
  };
};

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvQ29udmV4R2VvbWV0cnkuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvZW1icnlvLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy9tYWluLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNtQkEsS0FBSyxDQUFDLGNBQWMsR0FBRyxVQUFVLFFBQVEsRUFBRzs7QUFFM0MsTUFBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7O0FBRTVCLEtBQUksS0FBSyxHQUFHLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV6QyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRzs7QUFFNUMsVUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO0VBRWQ7O0FBR0QsVUFBUyxRQUFRLENBQUUsUUFBUSxFQUFHOztBQUU3QixNQUFJLE1BQU0sR0FBRyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRTFDLE1BQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxN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TUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTdCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWYsSUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVmLFNBQU8sRUFBRSxDQUFDO0VBRVY7Ozs7Ozs7QUFPRCxVQUFTLFNBQVMsQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFHOztBQUU1QixTQUFPLEVBQUUsQ0FBRSxDQUFDLENBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFFLElBQUksRUFBRSxDQUFFLENBQUMsQ0FBRSxLQUFLLEVBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVsRDs7Ozs7QUFLRCxVQUFTLFlBQVksR0FBRzs7QUFFdkIsU0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUEsR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0VBRTFDOzs7OztBQU1ELFVBQVMsUUFBUSxDQUFFLE1BQU0sRUFBRzs7QUFFM0IsTUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzFCLFNBQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUM7RUFFM0Q7OztBQUdELEtBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLEtBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUss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SUFBTSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLGVBQWUsQ0FBQyxNQUFNLEFBQUMsQ0FBQztHQUNqRzs7QUFFRCxZQUFVLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQzFELFlBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDdEQsWUFBVSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQzs7QUFFMUQsT0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsWUFBVztBQUNsRCxZQUFRLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0dBQ3ZDLENBQUM7Q0FFSCxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGF1dGhvciBxaWFvIC8gaHR0cHM6Ly9naXRodWIuY29tL3FpYW9cbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBpcyBhIGNvbnZleCBodWxsIGdlbmVyYXRvciB1c2luZyB0aGUgaW5jcmVtZW50YWwgbWV0aG9kLiBcbiAqIFRoZSBjb21wbGV4aXR5IGlzIE8obl4yKSB3aGVyZSBuIGlzIHRoZSBudW1iZXIgb2YgdmVydGljZXMuXG4gKiBPKG5sb2duKSBhbGdvcml0aG1zIGRvIGV4aXN0LCBidXQgdGhleSBhcmUgbXVjaCBtb3JlIGNvbXBsaWNhdGVkLlxuICpcbiAqIEJlbmNobWFyazogXG4gKlxuICogIFBsYXRmb3JtOiBDUFU6IFA3MzUwIEAyLjAwR0h6IEVuZ2luZTogVjhcbiAqXG4gKiAgTnVtIFZlcnRpY2VzXHRUaW1lKG1zKVxuICpcbiAqICAgICAxMCAgICAgICAgICAgMVxuICogICAgIDIwICAgICAgICAgICAzXG4gKiAgICAgMzAgICAgICAgICAgIDE5XG4gKiAgICAgNDAgICAgICAgICAgIDQ4XG4gKiAgICAgNTAgICAgICAgICAgIDEwN1xuICovXG5cblRIUkVFLkNvbnZleEdlb21ldHJ5ID0gZnVuY3Rpb24oIHZlcnRpY2VzICkge1xuXG5cdFRIUkVFLkdlb21ldHJ5LmNhbGwoIHRoaXMgKTtcblxuXHR2YXIgZmFjZXMgPSBbIFsgMCwgMSwgMiBdLCBbIDAsIDIsIDEgXSBdOyBcblxuXHRmb3IgKCB2YXIgaSA9IDM7IGkgPCB2ZXJ0aWNlcy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHRhZGRQb2ludCggaSApO1xuXG5cdH1cblxuXG5cdGZ1bmN0aW9uIGFkZFBvaW50KCB2ZXJ0ZXhJZCApIHtcblxuXHRcdHZhciB2ZXJ0ZXggPSB2ZXJ0aWNlc1sgdmVydGV4SWQgXS5jbG9uZSgpO1xuXG5cdFx0dmFyIG1hZyA9IHZlcnRleC5sZW5ndGgoKTtcblx0XHR2ZXJ0ZXgueCArPSBtYWcgKiByYW5kb21PZmZzZXQoKTtcblx0XHR2ZXJ0ZXgueSArPSBtYWcgKiByYW5kb21PZmZzZXQoKTtcblx0XHR2ZXJ0ZXgueiArPSBtYWcgKiByYW5kb21PZmZzZXQoKTtcblxuXHRcdHZhciBob2xlID0gW107XG5cblx0XHRmb3IgKCB2YXIgZiA9IDA7IGYgPCBmYWNlcy5sZW5ndGg7ICkge1xuXG5cdFx0XHR2YXIgZmFjZSA9IGZhY2VzWyBmIF07XG5cblx0XHRcdC8vIGZvciBlYWNoIGZhY2UsIGlmIHRoZSB2ZXJ0ZXggY2FuIHNlZSBpdCxcblx0XHRcdC8vIHRoZW4gd2UgdHJ5IHRvIGFkZCB0aGUgZmFjZSdzIGVkZ2VzIGludG8gdGhlIGhvbGUuXG5cdFx0XHRpZiAoIHZpc2libGUoIGZhY2UsIHZlcnRleCApICkge1xuXG5cdFx0XHRcdGZvciAoIHZhciBlID0gMDsgZSA8IDM7IGUgKysgKSB7XG5cblx0XHRcdFx0XHR2YXIgZWRnZSA9IFsgZmFjZVsgZSBdLCBmYWNlWyAoIGUgKyAxICkgJSAzIF0gXTtcblx0XHRcdFx0XHR2YXIgYm91bmRhcnkgPSB0cnVlO1xuXG5cdFx0XHRcdFx0Ly8gcmVtb3ZlIGR1cGxpY2F0ZWQgZWRnZXMuXG5cdFx0XHRcdFx0Zm9yICggdmFyIGggPSAwOyBoIDwgaG9sZS5sZW5ndGg7IGggKysgKSB7XG5cblx0XHRcdFx0XHRcdGlmICggZXF1YWxFZGdlKCBob2xlWyBoIF0sIGVkZ2UgKSApIHtcblxuXHRcdFx0XHRcdFx0XHRob2xlWyBoIF0gPSBob2xlWyBob2xlLmxlbmd0aCAtIDEgXTtcblx0XHRcdFx0XHRcdFx0aG9sZS5wb3AoKTtcblx0XHRcdFx0XHRcdFx0Ym91bmRhcnkgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICggYm91bmRhcnkgKSB7XG5cblx0XHRcdFx0XHRcdGhvbGUucHVzaCggZWRnZSApO1xuXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyByZW1vdmUgZmFjZXNbIGYgXVxuXHRcdFx0XHRmYWNlc1sgZiBdID0gZmFjZXNbIGZhY2VzLmxlbmd0aCAtIDEgXTtcblx0XHRcdFx0ZmFjZXMucG9wKCk7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Ly8gbm90IHZpc2libGVcblxuXHRcdFx0XHRmICsrO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHQvLyBjb25zdHJ1Y3QgdGhlIG5ldyBmYWNlcyBmb3JtZWQgYnkgdGhlIGVkZ2VzIG9mIHRoZSBob2xlIGFuZCB0aGUgdmVydGV4XG5cdFx0Zm9yICggdmFyIGggPSAwOyBoIDwgaG9sZS5sZW5ndGg7IGggKysgKSB7XG5cblx0XHRcdGZhY2VzLnB1c2goIFsgXG5cdFx0XHRcdGhvbGVbIGggXVsgMCBdLFxuXHRcdFx0XHRob2xlWyBoIF1bIDEgXSxcblx0XHRcdFx0dmVydGV4SWRcblx0XHRcdF0gKTtcblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFdoZXRoZXIgdGhlIGZhY2UgaXMgdmlzaWJsZSBmcm9tIHRoZSB2ZXJ0ZXhcblx0ICovXG5cdGZ1bmN0aW9uIHZpc2libGUoIGZhY2UsIHZlcnRleCApIHtcblxuXHRcdHZhciB2YSA9IHZlcnRpY2VzWyBmYWNlWyAwIF0gXTtcblx0XHR2YXIgdmIgPSB2ZXJ0aWNlc1sgZmFjZVsgMSBdIF07XG5cdFx0dmFyIHZjID0gdmVydGljZXNbIGZhY2VbIDIgXSBdO1xuXG5cdFx0dmFyIG4gPSBub3JtYWwoIHZhLCB2YiwgdmMgKTtcblxuXHRcdC8vIGRpc3RhbmNlIGZyb20gZmFjZSB0byBvcmlnaW5cblx0XHR2YXIgZGlzdCA9IG4uZG90KCB2YSApO1xuXG5cdFx0cmV0dXJuIG4uZG90KCB2ZXJ0ZXggKSA+PSBkaXN0OyBcblxuXHR9XG5cblx0LyoqXG5cdCAqIEZhY2Ugbm9ybWFsXG5cdCAqL1xuXHRmdW5jdGlvbiBub3JtYWwoIHZhLCB2YiwgdmMgKSB7XG5cblx0XHR2YXIgY2IgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXHRcdHZhciBhYiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cblx0XHRjYi5zdWJWZWN0b3JzKCB2YywgdmIgKTtcblx0XHRhYi5zdWJWZWN0b3JzKCB2YSwgdmIgKTtcblx0XHRjYi5jcm9zcyggYWIgKTtcblxuXHRcdGNiLm5vcm1hbGl6ZSgpO1xuXG5cdFx0cmV0dXJuIGNiO1xuXG5cdH1cblxuXHQvKipcblx0ICogRGV0ZWN0IHdoZXRoZXIgdHdvIGVkZ2VzIGFyZSBlcXVhbC5cblx0ICogTm90ZSB0aGF0IHdoZW4gY29uc3RydWN0aW5nIHRoZSBjb252ZXggaHVsbCwgdHdvIHNhbWUgZWRnZXMgY2FuIG9ubHlcblx0ICogYmUgb2YgdGhlIG5lZ2F0aXZlIGRpcmVjdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGVxdWFsRWRnZSggZWEsIGViICkge1xuXG5cdFx0cmV0dXJuIGVhWyAwIF0gPT09IGViWyAxIF0gJiYgZWFbIDEgXSA9PT0gZWJbIDAgXTsgXG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSByYW5kb20gb2Zmc2V0IGJldHdlZW4gLTFlLTYgYW5kIDFlLTYuXG5cdCAqL1xuXHRmdW5jdGlvbiByYW5kb21PZmZzZXQoKSB7XG5cblx0XHRyZXR1cm4gKCBNYXRoLnJhbmRvbSgpIC0gMC41ICkgKiAyICogMWUtNjtcblxuXHR9XG5cblxuXHQvKipcblx0ICogWFhYOiBOb3Qgc3VyZSBpZiB0aGlzIGlzIHRoZSBjb3JyZWN0IGFwcHJvYWNoLiBOZWVkIHNvbWVvbmUgdG8gcmV2aWV3LlxuXHQgKi9cblx0ZnVuY3Rpb24gdmVydGV4VXYoIHZlcnRleCApIHtcblxuXHRcdHZhciBtYWcgPSB2ZXJ0ZXgubGVuZ3RoKCk7XG5cdFx0cmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IyKCB2ZXJ0ZXgueCAvIG1hZywgdmVydGV4LnkgLyBtYWcgKTtcblxuXHR9XG5cblx0Ly8gUHVzaCB2ZXJ0aWNlcyBpbnRvIGB0aGlzLnZlcnRpY2VzYCwgc2tpcHBpbmcgdGhvc2UgaW5zaWRlIHRoZSBodWxsXG5cdHZhciBpZCA9IDA7XG5cdHZhciBuZXdJZCA9IG5ldyBBcnJheSggdmVydGljZXMubGVuZ3RoICk7IC8vIG1hcCBmcm9tIG9sZCB2ZXJ0ZXggaWQgdG8gbmV3IGlkXG5cblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgZmFjZXMubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0IHZhciBmYWNlID0gZmFjZXNbIGkgXTtcblxuXHRcdCBmb3IgKCB2YXIgaiA9IDA7IGogPCAzOyBqICsrICkge1xuXG5cdFx0XHRpZiAoIG5ld0lkWyBmYWNlWyBqIF0gXSA9PT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRcdG5ld0lkWyBmYWNlWyBqIF0gXSA9IGlkICsrO1xuXHRcdFx0XHR0aGlzLnZlcnRpY2VzLnB1c2goIHZlcnRpY2VzWyBmYWNlWyBqIF0gXSApO1xuXG5cdFx0XHR9XG5cblx0XHRcdGZhY2VbIGogXSA9IG5ld0lkWyBmYWNlWyBqIF0gXTtcblxuXHRcdCB9XG5cblx0fVxuXG5cdC8vIENvbnZlcnQgZmFjZXMgaW50byBpbnN0YW5jZXMgb2YgVEhSRUUuRmFjZTNcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgZmFjZXMubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0dGhpcy5mYWNlcy5wdXNoKCBuZXcgVEhSRUUuRmFjZTMoIFxuXHRcdFx0XHRmYWNlc1sgaSBdWyAwIF0sXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDEgXSxcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMiBdXG5cdFx0KSApO1xuXG5cdH1cblxuXHQvLyBDb21wdXRlIFVWc1xuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmZhY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdHZhciBmYWNlID0gdGhpcy5mYWNlc1sgaSBdO1xuXG5cdFx0dGhpcy5mYWNlVmVydGV4VXZzWyAwIF0ucHVzaCggW1xuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYSBdICksXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5iIF0gKSxcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmMgXSApXG5cdFx0XSApO1xuXG5cdH1cblxuXHR0aGlzLmNvbXB1dGVGYWNlTm9ybWFscygpO1xuXHR0aGlzLmNvbXB1dGVWZXJ0ZXhOb3JtYWxzKCk7XG5cbn07XG5cblRIUkVFLkNvbnZleEdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFRIUkVFLkdlb21ldHJ5LnByb3RvdHlwZSApO1xuVEhSRUUuQ29udmV4R2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVEhSRUUuQ29udmV4R2VvbWV0cnk7XG4iLCJpbXBvcnQgJy4vdGhyZWUtbW91c2UtZXZlbnQuZXM2JztcbmltcG9ydCAnLi9Db252ZXhHZW9tZXRyeSc7XG5cblRIUkVFLlZlY3RvcjMucHJvdG90eXBlLm1peCA9IGZ1bmN0aW9uKHksIGEpIHtcbiAgcmV0dXJuIHRoaXMubXVsdGlwbHlTY2FsYXIoMSAtIGEpLmFkZCh5LmNsb25lKCkubXVsdGlwbHlTY2FsYXIoYSkpXG59O1xuXG5jbGFzcyBFbWJyeW8ge1xuXG4gIGNvbnN0cnVjdG9yKGRhdGEsIGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCwgY2FsbGJhY2spIHtcblxuICAgIC8vKiBkYXRhIDogYXJyYXkgb2YgY29udHJpYnV0aW9uc1xuICAgIC8vKiBjb250cmlidXRpb25cbiAgICAvLyoge1xuICAgIC8vKiAgIGltYWdlOiBET01JbWFnZVxuICAgIC8vKiAgIHRleHQ6IFN0cmluZ1xuICAgIC8vKiB9XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLmNyZWF0ZUNhbGxiYWNrID0gY2FsbGJhY2s7XG5cbiAgICAvL+ODhuOCr+OCueODgeODo+OBruS9nOaIkFxuICAgIHZhciBsb2FkZWROdW0gPSAwO1xuICAgIGRhdGEuZm9yRWFjaCgoY29udHJpYnV0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHZhciB0ZXh0dXJlID0gRW1icnlvLmNyZWF0ZVRleHR1cmUoaW1hZ2UpO1xuICAgICAgICB0aGlzLmRhdGFbaW5kZXhdLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgICAgICBsb2FkZWROdW0rKztcbiAgICAgICAgaWYobG9hZGVkTnVtID09PSBkYXRhLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZShjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaW1hZ2Uuc3JjID0gY29udHJpYnV0aW9uLmJhc2U2NDtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuXG4gIH1cblxuICBpbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLmlzSGlkZGVuID0gZmFsc2U7XG5cbiAgICAvL2luaXQgc2NlbmVcbiAgICB2YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcblxuICAgIC8vaW5pdCBjYW1lcmFcbiAgICB2YXIgZm92ID0gNjA7XG4gICAgdmFyIGFzcGVjdCA9IHdpZHRoIC8gaGVpZ2h0O1xuICAgIHZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoZm92LCBhc3BlY3QpO1xuICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgKGhlaWdodCAvIDIpIC8gTWF0aC50YW4oKGZvdiAqIE1hdGguUEkgLyAxODApIC8gMikpO1xuICAgIGNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCkpO1xuICAgIHNjZW5lLmFkZChjYW1lcmEpO1xuXG4gICAgLy9pbml0IHJlbmRlcmVyXG4gICAgdmFyIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe2FscGhhOiB0cnVlLCBhbnRpYWxpYXM6IHRydWV9KTtcbiAgICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHhjY2NjY2MsIDApO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgIC8vaW5pdCBjb250cm9sc1xuICAgIHZhciBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyhjYW1lcmEsIHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgLy93YXRjaCBtb3VzZSBldmVudHNcbiAgICBzY2VuZS53YXRjaE1vdXNlRXZlbnQocmVuZGVyZXIuZG9tRWxlbWVudCwgY2FtZXJhKTtcblxuICAgIHRoaXMuc2NlbmUgPSBzY2VuZTtcbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgdGhpcy5jb250cm9scyA9IGNvbnRyb2xzO1xuXG4gICAgLy/nlJ/miJBcbiAgICB0aGlzLmNyZWF0ZSh0aGlzLmNyZWF0ZUNhbGxiYWNrKTtcblxuICAgIHRoaXMuY291bnQgPSAwO1xuXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLmZyYW1lcyk7XG5cbiAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24oKXtcbiAgICAgIGNvbnRyb2xzLnVwZGF0ZSgpO1xuICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgLy9zY2VuZS5oYW5kbGVNb3VzZUV2ZW50KCk7XG4gICAgICB0aGlzLmNvdW50Kys7XG4gICAgICB0aGlzLm1vdmVWZXJ0aWNlcygpLnJvdGF0ZSgpO1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHVwZGF0ZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfVxuXG4gIGNyZWF0ZShjYWxsYmFjaykge1xuICAgIHRoaXMuZ2VvbWV0cnkgPSBFbWJyeW8uY3JlYXRlR2VvbWV0cnkoMTAwLCB0aGlzLmRhdGEubGVuZ3RoKTtcbiAgICB0aGlzLmZyYW1lcyA9IEVtYnJ5by5jcmVhdGVGcmFtZXModGhpcy5nZW9tZXRyeSwgdGhpcy5kYXRhKTtcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbiAmJiB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4gey8v44Oe44Km44K544Kk44OZ44Oz44OI44Gu6Kit5a6aXG4gICAgICBmcmFtZS5vbmNsaWNrID0gKGludGVyc2VjdCkgPT4ge1xuICAgICAgICBpZih0eXBlb2YgdGhpcy5vbnNlbGVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGZyYW1lLmRhdGEgJiYgdGhpcy5vbnNlbGVjdChmcmFtZS5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8vZnJhbWUub25tb3VzZW92ZXIgPSAoaW50ZXJzZWN0KSA9PiB7XG4gICAgICAvLyAgaW50ZXJzZWN0LmZhY2UubW91c2VvbiA9IHRydWU7XG4gICAgICAvL307XG4gICAgfSk7XG4gICAgdGhpcy5zY2VuZS5hZGQodGhpcy5mcmFtZXMpO1xuICAgIGlmKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8v5LiJ6KeS44Gu6Z2i44Gn5qeL5oiQ44GV44KM44KL5aSa6Z2i5L2T44Gu5L2c5oiQXG4gIHN0YXRpYyBjcmVhdGVHZW9tZXRyeShyYWRpdXMsIHN1cmZhY2VOdW1iZXIpIHtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgPCA0KSA/IDQgOiBzdXJmYWNlTnVtYmVyOy8v77yU5Lul5LiL44Gv5LiN5Y+vXG4gICAgc3VyZmFjZU51bWJlciA9IChzdXJmYWNlTnVtYmVyICYgMSkgPyAoc3VyZmFjZU51bWJlciArIDEpIDogc3VyZmFjZU51bWJlcjsvL+Wlh+aVsOOBr+S4jeWPryjjgojjgorlpKfjgY3jgYTlgbbmlbDjgavnm7TjgZkpXG4gICAgZm9yKHZhciBpID0gMCwgbCA9ICgyICsgc3VyZmFjZU51bWJlciAvIDIpOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2ZXJ0aWNlc1tpXSA9IG5ldyBUSFJFRS5WZWN0b3IzKE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUpOy8v55CD54q244Gr44Op44Oz44OA44Og44Gr54K544KS5omT44GkXG4gICAgICB2ZXJ0aWNlc1tpXS5zZXRMZW5ndGgocmFkaXVzKTtcbiAgICAgIHZlcnRpY2VzW2ldLm9yaWdpbmFsTGVuZ3RoID0gcmFkaXVzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFRIUkVFLkNvbnZleEdlb21ldHJ5KHZlcnRpY2VzKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVGcmFtZXMoZ2VvbWV0cnksIGRhdGEpIHtcbiAgICB2YXIgdmVydGV4dFNoYWRlciA9ICcnICtcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xuICAgICAgJ3ZvaWQgbWFpbigpIHsnICtcbiAgICAgICcgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdHJpeCAqIHZpZXdNYXRyaXggKiBtb2RlbE1hdHJpeCAqIHZlYzQocG9zaXRpb24sIDEuMCk7JyArXG4gICAgICAnICB2UG9zaXRpb24gPSBnbF9Qb3NpdGlvbjsnICtcbiAgICAgICd9JztcblxuICAgIHZhciBmcmFnbWVudFNoYWRlciA9ICcnICtcbiAgICAgICd1bmlmb3JtIHNhbXBsZXIyRCB0ZXh0dXJlOycgK1xuICAgICAgJ3VuaWZvcm0gZmxvYXQgb3BhY2l0eTsnICtcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xuICAgICAgJ3ZvaWQgbWFpbih2b2lkKXsnICtcbiAgICAgICcgIHZlYzQgdGV4dHVyZUNvbG9yID0gdGV4dHVyZTJEKHRleHR1cmUsIHZlYzIoKDEuMCArIHZQb3NpdGlvbi54IC8gMTAwLjApIC8gMi4wLCAoMS4wICsgdlBvc2l0aW9uLnkgLyAxMDAuMCkgLyAyLjApKTsnICtcbiAgICAgICcgIHRleHR1cmVDb2xvci53ID0gb3BhY2l0eTsnICtcbiAgICAgICcgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmVDb2xvcjsnICtcbiAgICAgIC8vJyAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoKHZQb3NpdGlvbi54IC8gODAwLjAgKyAxLjApIC8gMi4wLCAodlBvc2l0aW9uLnkgLyA4MDAuMCArIDEuMCkgLyAyLjAsIDAsIDApOycgK1xuICAgICAgJ30nO1xuXG4gICAgdmFyIGZyYW1lcyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIGdlb21ldHJ5LmZhY2VzLmZvckVhY2goZnVuY3Rpb24oZmFjZSwgaW5kZXgpIHtcbiAgICAgIHZhciBhID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5hXSwgYiA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl0sIGMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAvL2NyZWF0ZSBnZW9tZXRyeVxuICAgICAgdmFyIGZyYW1lR2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcbiAgICAgIGZyYW1lR2VvbWV0cnkudmVydGljZXMgPSBbYSwgYiwgY107XG4gICAgICBmcmFtZUdlb21ldHJ5LmZhY2VzID0gW25ldyBUSFJFRS5GYWNlMygwLCAxLCAyKV07XG4gICAgICBmcmFtZUdlb21ldHJ5LmNvbXB1dGVGYWNlTm9ybWFscygpO1xuICAgICAgZnJhbWVHZW9tZXRyeS5jb21wdXRlVmVydGV4Tm9ybWFscygpO1xuXG4gICAgICAvL2NyZWF0ZSBtYXRlcmlhbFxuICAgICAgdmFyIGZyYW1lTWF0ZXJpYWwgPSBuZXcgVEhSRUUuU2hhZGVyTWF0ZXJpYWwoe1xuICAgICAgICB2ZXJ0ZXhTaGFkZXI6IHZlcnRleHRTaGFkZXIsXG4gICAgICAgIGZyYWdtZW50U2hhZGVyOiBmcmFnbWVudFNoYWRlcixcbiAgICAgICAgdW5pZm9ybXM6IHtcbiAgICAgICAgICB0ZXh0dXJlOiB7IHR5cGU6IFwidFwiLCB2YWx1ZTogZGF0YVtpbmRleF0gPyBkYXRhW2luZGV4XS50ZXh0dXJlIDogbnVsbCB9LFxuICAgICAgICAgIG9wYWNpdHk6IHsgdHlwZTogXCJmXCIsIHZhbHVlOiAxLjAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChmcmFtZUdlb21ldHJ5LCBmcmFtZU1hdGVyaWFsKTtcbiAgICAgIG1lc2guZGF0YSA9IGRhdGFbaW5kZXhdO1xuXG4gICAgICBmcmFtZXMuYWRkKG1lc2gpO1xuICAgIH0pO1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlVGV4dHVyZShpbWFnZSkge1xuICAgIHZhciB0ZXh0dXJlID0gbmV3IFRIUkVFLlRleHR1cmUodGhpcy5nZXRTdWl0YWJsZUltYWdlKGltYWdlKSk7XG4gICAgLy90ZXh0dXJlLm1hZ0ZpbHRlciA9IHRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcbiAgICB0ZXh0dXJlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gdGV4dHVyZTtcbiAgfVxuXG4gIC8v55S75YOP44K144Kk44K644KS6Kq/5pW0XG4gIHN0YXRpYyBnZXRTdWl0YWJsZUltYWdlKGltYWdlKSB7XG4gICAgdmFyIHcgPSBpbWFnZS5uYXR1cmFsV2lkdGgsIGggPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xuICAgIC8vdmFyIHNpemUgPSBNYXRoLnBvdygyLCBNYXRoLmxvZyhNYXRoLm1pbih3LCBoKSkgLyBNYXRoLkxOMiB8IDApOyAvLyBsYXJnZXN0IDJebiBpbnRlZ2VyIHRoYXQgZG9lcyBub3QgZXhjZWVkXG4gICAgdmFyIHNpemUgPSAxMjg7XG4gICAgaWYgKHcgIT09IGggfHwgdyAhPT0gc2l6ZSkge1xuICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgdmFyIG9mZnNldFggPSBoIC8gdyA+IDEgPyAwIDogKHcgLSBoKSAvIDI7XG4gICAgICB2YXIgb2Zmc2V0WSA9IGggLyB3ID4gMSA/IChoIC0gdykgLyAyIDogMDtcbiAgICAgIHZhciBjbGlwU2l6ZSA9IGggLyB3ID4gMSA/IHcgOiBoO1xuICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy53aWR0aCA9IHNpemU7XG4gICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoaW1hZ2UsIG9mZnNldFgsIG9mZnNldFksIGNsaXBTaXplLCBjbGlwU2l6ZSwgMCwgMCwgc2l6ZSwgc2l6ZSk7XG4gICAgICBpbWFnZSA9IGNhbnZhcztcbiAgICB9XG4gICAgcmV0dXJuIGltYWdlO1xuICB9XG5cbiAgbW92ZVZlcnRpY2VzKCkge1xuICAgIC8vY29uc29sZS5sb2codGhpcy5mcmFtZXMuY2hpbGRyZW5bMF0uZ2VvbWV0cnkudmVydGljZXNbMF0pO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goKGZyYW1lKSA9PiB7XG4gICAgICB2YXIgZmFjZSA9IGZyYW1lLmdlb21ldHJ5LmZhY2VzWzBdO1xuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXMuZm9yRWFjaCgodmVydGV4LCBpbmRleCkgPT4ge1xuICAgICAgICB2ZXJ0ZXgubWl4KGZhY2Uubm9ybWFsLCAwLjEpLnNldExlbmd0aCh2ZXJ0ZXgub3JpZ2luYWxMZW5ndGggKyA1ICogTWF0aC5jb3ModGhpcy5jb3VudC8yMCArIGluZGV4ICogMTApKTtcbiAgICB9KTtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LnZlcnRpY2VzTmVlZFVwZGF0ZSA9IHRydWU7XG4gICAgICBmcmFtZS5nZW9tZXRyeS5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcm90YXRlKCkge1xuICAgIHRoaXMuZnJhbWVzLnJvdGF0aW9uLnNldCgwLCB0aGlzLmNvdW50LzUwMCwgMCk7XG4gIH1cblxuICAvKlxuICAgIHRocmVlLmpz44Kq44OW44K444Kn44Kv44OI44Gu5YmK6ZmkXG4gICAqL1xuICBjbGVhcigpIHtcbiAgICB0aGlzLmdlb21ldHJ5ICYmIHRoaXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICAgIGZyYW1lLm1hdGVyaWFsLmRpc3Bvc2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLnNjZW5lLnJlbW92ZSh0aGlzLmZyYW1lcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAgY29udHJpYnV0aW9u44Gu6L+95YqgXG4gICAgQHBhcmFtIGNvbnRyaWJ1dGlvbiB7T2JqZWN0fSDmipXnqL9cbiAgICovXG4gIGFkZENvbnRyaWJ1dGlvbihjb250cmlidXRpb24sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgY29udHJpYnV0aW9uLnRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XG4gICAgICB0aGlzLmRhdGEucHVzaChjb250cmlidXRpb24pO1xuICAgICAgdGhpcy5jbGVhcigpLmNyZWF0ZShjYWxsYmFjayk7Ly/jg6rjgrvjg4Pjg4hcbiAgICB9O1xuICAgIGltYWdlLnNyYyA9IGNvbnRyaWJ1dGlvbi5iYXNlNjQ7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFNpemUod2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICB0aGlzLmNhbWVyYS5hc3BlY3QgPSB3aWR0aCAvIGhlaWdodDtcbiAgICB0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgICBcbiAgdG9nZ2xlKCkge1xuICAgIHZhciBUT1RBTF9DT1VOVCA9IDM2O1xuICAgIHZhciBTVEFSVF9QT0lOVCA9IHRoaXMuZnJhbWVzLnBvc2l0aW9uLmNsb25lKCk7XG4gICAgdmFyIEVORF9QT0lOVCA9IHRoaXMuaXNIaWRkZW4gPyBuZXcgVEhSRUUuVmVjdG9yMygpIDogbmV3IFRIUkVFLlZlY3RvcjMoMCwgLTIwMCwgLTIwMCk7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICBjb25zb2xlLmxvZyhTVEFSVF9QT0lOVCk7XG4gICAgdmFyIGFuaW1hdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbiA9IGNvdW50IC8gVE9UQUxfQ09VTlQgLSAxO1xuICAgICAgdmFyIG5ld1BvaW50ID0gU1RBUlRfUE9JTlQuY2xvbmUoKS5taXgoRU5EX1BPSU5ULCBNYXRoLnBvdyhuLCA1KSArIDEpO1xuICAgICAgdGhpcy5mcmFtZXMucG9zaXRpb24uc2V0KG5ld1BvaW50LngsIG5ld1BvaW50LnksIG5ld1BvaW50LnopO1xuICAgICAgaWYoY291bnQgPCBUT1RBTF9DT1VOVCkge1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgfVxuICAgIH1cbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgIHRoaXMuaXNIaWRkZW4gPSAhdGhpcy5pc0hpZGRlbjtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEVtYnJ5bzsiLCJpbXBvcnQgRW1icnlvIGZyb20gJy4vZW1icnlvLmVzNic7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGVtYnJ5bztcblxuICAvL2FuZ3VsYXIgdGVzdFxuICBhbmd1bGFyLm1vZHVsZSgnbXlTZXJ2aWNlcycsIFtdKVxuICAgIC5zZXJ2aWNlKCdpbWFnZVNlYXJjaCcsIFsnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcbiAgICAgIHRoaXMuZ2V0SW1hZ2VzID0gZnVuY3Rpb24gKHF1ZXJ5LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdmFyIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUQzaW5BVXRmYWlJcUZiQk1PSTBZMzRYMXhfcXZzeEE4ZyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZxPSc7XG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6IHVybCArIHF1ZXJ5LFxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xuICAgICAgICAgICAgaWYoaXRlbXMubGVuZ3RoID09PSAyMCkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUQzaW5BVXRmYWlJcUZiQk1PSTBZMzRYMXhfcXZzeEE4ZyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZzdGFydD0xMSZxPSc7XG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG5cbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIHVybDogdXJsICsgcXVlcnksXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJ1xuICAgICAgICB9KVxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgaXRlbXMgPSBpdGVtcy5jb25jYXQoZGF0YS5pdGVtcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XG4gICAgICAgICAgICBpZihpdGVtcy5sZW5ndGggPT09IDIwKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGl0ZW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfV0pXG4gICAgLnNlcnZpY2UoJ2NvbnRyaWJ1dGVzJywgWyckaHR0cCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIHVybDogJy9jb250cmlidXRlcy9hbGwnLFxuICAgICAgICAgIC8vdXJsOiAnLi9qYXZhc2NyaXB0cy9hbGwuanNvbicsXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJ1xuICAgICAgICB9KVxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBhbGVydChkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgdGhpcy5zdWJtaXQgPSBmdW5jdGlvbiAoY29udHJpYnV0aW9uLCBjYWxsYmFjaykge1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgdXJsOiAnL2NvbnRyaWJ1dGVzL3Bvc3QnLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IGNvbnRyaWJ1dGlvblxuICAgICAgICB9KVxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBhbGVydChkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgdGhpcy5lZGl0VGV4dCA9IGZ1bmN0aW9uICh0ZXh0LCBjb250cmlidXRpb25faWQsIGNhbGxiYWNrKSB7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6ICcvY29udHJpYnV0ZXMvZWRpdCcsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbl9pZDogY29udHJpYnV0aW9uX2lkXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBhbGVydChkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1dKTtcblxuICBhbmd1bGFyLm1vZHVsZShcImVtYnJ5b1wiLCBbJ215U2VydmljZXMnXSlcbiAgICAuY29udHJvbGxlcignbXlDdHJsJywgWyckc2NvcGUnLCAnaW1hZ2VTZWFyY2gnLCAnY29udHJpYnV0ZXMnLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZVNlYXJjaCwgY29udHJpYnV0ZXMpIHtcbiAgICAgIC8vY29udGlidXRpb25z44KS5Y+W5b6XXG4gICAgICBjb250cmlidXRlcy5nZXRBbGwoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbnMgPSBkYXRhO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnLmVtYnJ5by10aHJlZScpO1xuICAgICAgICB2YXIgY29udHJpYnV0aW9uSW1hZ2UgPSAkKCcuZW1icnlvLWNvbnRyaWJ1dGlvbi1pbWFnZScpO1xuICAgICAgICBlbWJyeW8gPSBuZXcgRW1icnlvKGRhdGEsIGNvbnRhaW5lci5nZXQoMCksIGNvbnRhaW5lci53aWR0aCgpLCBjb250YWluZXIuaGVpZ2h0KCksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuICAgICAgICB3aW5kb3cuZW1icnlvID0gZW1icnlvO1xuICAgICAgICBlbWJyeW8ub25zZWxlY3QgPSBmdW5jdGlvbiAoY29udHJpYnV0aW9uKSB7XG4gICAgICAgICAgaWYgKCRzY29wZS5oYXNTZWxlY3RlZCkge1xuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID0gJ2hpZGRlbic7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wbHVzQnV0dG9uID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnRocmVlID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XG4gICAgICAgICAgICAgICdvcGFjaXR5JzogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvL2VtYnJ5by50b2dnbGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAnc2hvd24nO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucGx1c0J1dHRvbiA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uID0gY29udHJpYnV0aW9uO1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uVGV4dCA9IGNvbnRyaWJ1dGlvbi50ZXh0O1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkudGhyZWUgPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XG4gICAgICAgICAgICAgICdiYWNrZ3JvdW5kSW1hZ2UnOiAndXJsKCcgKyBjb250cmlidXRpb24uYmFzZTY0ICsgJyknLFxuICAgICAgICAgICAgICAnYmFja2dyb3VuZFNpemUnOiAnY292ZXInLFxuICAgICAgICAgICAgICAnb3BhY2l0eSc6IDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy9lbWJyeW8udG9nZ2xlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS52aXNpYmlsaXR5ID0ge1xuICAgICAgICBwb3N0OiBmYWxzZSxcbiAgICAgICAgcGx1c0J1dHRvbjogdHJ1ZSxcbiAgICAgICAgY29udHJpYnV0aW9uRGV0YWlsczogJ2hpZGRlbicsXG4gICAgICAgIHBvc3RTZWFyY2g6IHRydWUsXG4gICAgICAgIHBvc3RDb250cmlidXRlOiBmYWxzZSxcbiAgICAgICAgcG9zdExvYWRpbmc6IGZhbHNlLFxuICAgICAgICB0aHJlZTogdHJ1ZSxcbiAgICAgICAgbG9hZGluZzogdHJ1ZVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnF1ZXJ5ID0gJyc7XG4gICAgICAkc2NvcGUuY29udHJpYnV0aW9uRGV0YWlsc01lc3NhZ2UgPSAnVXBkYXRlJztcblxuICAgICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLml0ZW1zID0gW107XG4gICAgICAgIGltYWdlU2VhcmNoLmdldEltYWdlcygkc2NvcGUucXVlcnksIGZ1bmN0aW9uIChpdGVtcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcbiAgICAgICAgICAkc2NvcGUuaXRlbXMgPSBpdGVtcztcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICRzY29wZS5zZWxlY3RlZEl0ZW0gPSBpdGVtO1xuICAgICAgICAkc2NvcGUudXJsID0gaXRlbS5saW5rO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gZmFsc2U7XG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnRleHQgPSAkc2NvcGUucXVlcnk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHt0ZXh0OiAkc2NvcGUudGV4dCwgdXJsOiAkc2NvcGUudXJsfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAvL+aKleeov+OBrui/veWKoFxuICAgICAgICAgICRzY29wZS5jb250cmlidXRpb25zLnB1c2goZGF0YSk7XG4gICAgICAgICAgZW1icnlvLmFkZENvbnRyaWJ1dGlvbihkYXRhLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0ID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0TG9hZGluZyA9IHRydWU7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmVkaXRUZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2VsZWN0ZWRDb250cmlidXRpb25UZXh0KTtcbiAgICAgICAgY29udHJpYnV0ZXMuZWRpdFRleHQoJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uVGV4dCwgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uLl9pZCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ0NvbXBsZXRlZCc7XG4gICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ1VwZGF0ZSc7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgICRzY29wZS5jbG9zZUxpZ2h0Ym94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH07XG4gICAgICAkc2NvcGUudG9nZ2xlUG9zdFBhbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3QgPSAhJHNjb3BlLnZpc2liaWxpdHkucG9zdDtcbiAgICAgIH07XG4gICAgICAkc2NvcGUudG9nZ2xlQ29udHJpYnV0aW9uRGV0YWlscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPT0gJ29wZW5lZCcgPyAnc2hvd24nIDogJ29wZW5lZCc7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmJhY2tUb1NlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdFNlYXJjaCA9IHRydWU7XG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfV0pO1xuXG59KSgpOyIsIlRIUkVFLlNjZW5lLnByb3RvdHlwZS53YXRjaE1vdXNlRXZlbnQgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYW1lcmEpIHtcbiAgdmFyIHByZUludGVyc2VjdHMgPSBbXTtcbiAgdmFyIG1vdXNlRG93bkludGVyc2VjdHMgPSBbXTtcbiAgdmFyIHByZUV2ZW50O1xuICB2YXIgbW91c2VEb3duUG9pbnQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlRG93bihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIHZhciByZWN0ID0gZG9tRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBtb3VzZS54ID0gKChldmVudC5jbGllbnRYIC0gcmVjdC5sZWZ0KSAvIGRvbUVsZW1lbnQud2lkdGgpICogMiAtIDE7XG4gICAgbW91c2UueSA9IC0oKGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCkgLyBkb21FbGVtZW50LmhlaWdodCkgKiAyICsgMTtcblxuICAgIC8vb25tb3VzZWRvd25cbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24ocHJlSW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gcHJlSW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vkb3duID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdC5vbm1vdXNlZG93bihwcmVJbnRlcnNlY3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1vdXNlRG93bkludGVyc2VjdHMgPSBwcmVJbnRlcnNlY3RzO1xuXG4gICAgcHJlRXZlbnQgPSBldmVudDtcbiAgICBtb3VzZURvd25Qb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IyKG1vdXNlLngsIG1vdXNlLnkpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VVcChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIHZhciByZWN0ID0gZG9tRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBtb3VzZS54ID0gKChldmVudC5jbGllbnRYIC0gcmVjdC5sZWZ0KSAvIGRvbUVsZW1lbnQud2lkdGgpICogMiAtIDE7XG4gICAgbW91c2UueSA9IC0oKGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCkgLyBkb21FbGVtZW50LmhlaWdodCkgKiAyICsgMTtcblxuICAgIC8vb25tb3VzZXVwXG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKGludGVyc2VjdCkge1xuICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNldXAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb2JqZWN0Lm9ubW91c2V1cChpbnRlcnNlY3QpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYobW91c2VEb3duUG9pbnQuZGlzdGFuY2VUbyhuZXcgVEhSRUUuVmVjdG9yMihtb3VzZS54LCBtb3VzZS55KSkgPCA1KSB7XG4gICAgICAvL29uY2xpY2tcbiAgICAgIG1vdXNlRG93bkludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbiAoaW50ZXJzZWN0KSB7XG4gICAgICAgIHZhciBvYmplY3QgPSBpbnRlcnNlY3Qub2JqZWN0O1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdC5vbmNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgaWYgKGV4aXN0KHByZUludGVyc2VjdHMsIGludGVyc2VjdCkpIHtcbiAgICAgICAgICAgIG9iamVjdC5vbmNsaWNrKGludGVyc2VjdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcmVFdmVudCA9IGV2ZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIG1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQpIC8gZG9tRWxlbWVudC53aWR0aCkgKiAyIC0gMTtcbiAgICBtb3VzZS55ID0gLSgoZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKSAvIGRvbUVsZW1lbnQuaGVpZ2h0KSAqIDIgKyAxO1xuXG4gICAgdmFyIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcbiAgICByYXljYXN0ZXIuc2V0RnJvbUNhbWVyYShtb3VzZSwgY2FtZXJhKTtcblxuICAgIHZhciBpbnRlcnNlY3RzID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMoX3RoaXMuY2hpbGRyZW4sIHRydWUpO1xuICAgIGludGVyc2VjdHMubGVuZ3RoID0gMTsvL+aJi+WJjeOBruOCquODluOCuOOCp+OCr+ODiOOBruOBv1xuXG4gICAgLy9jb25zb2xlLmxvZyhpbnRlcnNlY3RzKTtcbiAgICBpbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24gKGludGVyc2VjdCkge1xuICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XG4gICAgICAvL29ubW91c2Vtb3ZlXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlbW92ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3Qub25tb3VzZW1vdmUoaW50ZXJzZWN0KTtcbiAgICAgIH1cblxuICAgICAgLy9vbm1vdXNlb3ZlclxuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZW92ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKCFleGlzdChwcmVJbnRlcnNlY3RzLCBpbnRlcnNlY3QpKSB7XG4gICAgICAgICAgb2JqZWN0Lm9ubW91c2VvdmVyKGludGVyc2VjdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vb25tb3VzZW91dFxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihwcmVJbnRlcnNlY3QpIHtcbiAgICAgIHZhciBvYmplY3QgPSBwcmVJbnRlcnNlY3Qub2JqZWN0O1xuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoIWV4aXN0KGludGVyc2VjdHMsIHByZUludGVyc2VjdCkpIHtcbiAgICAgICAgICBwcmVJbnRlcnNlY3Qub2JqZWN0Lm9ubW91c2VvdXQocHJlSW50ZXJzZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcHJlSW50ZXJzZWN0cyA9IGludGVyc2VjdHM7XG4gICAgcHJlRXZlbnQgPSBldmVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4aXN0KGludGVyc2VjdHMsIHRhcmdldEludGVyc2VjdCkge1xuICAgIC8vaW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKGludGVyc2VjdCkge1xuICAgIC8vICBpZihpbnRlcnNlY3Qub2JqZWN0ID09IHRhcmdldEludGVyc2VjdC5vYmplY3QpIHJldHVybiB0cnVlO1xuICAgIC8vfSk7XG4gICAgLy9yZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuICh0eXBlb2YgaW50ZXJzZWN0c1swXSA9PT0gJ29iamVjdCcpICYmIChpbnRlcnNlY3RzWzBdLm9iamVjdCA9PT0gdGFyZ2V0SW50ZXJzZWN0Lm9iamVjdCk7XG4gIH1cblxuICBkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlRG93bik7XG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZU1vdXNlVXApO1xuICBkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlTW92ZSk7XG5cbiAgVEhSRUUuU2NlbmUucHJvdG90eXBlLmhhbmRsZU1vdXNlRXZlbnQgPSBmdW5jdGlvbigpIHtcbiAgICBwcmVFdmVudCAmJiBoYW5kbGVNb3VzZU1vdmUocHJlRXZlbnQpO1xuICB9O1xuXG59OyJdfQ==
