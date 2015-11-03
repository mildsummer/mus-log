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
      image.src = './contributes/image/' + contribution._id;
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
      image.src = './contributes/image/' + contribution._id;

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
    value: function toggle(duration) {
      var _this5 = this;

      console.log(duration);
      var TOTAL_COUNT = duration / (1000 / 60);
      var OFFSET = 200;
      var SCALE = 0.6;
      var count = 0;
      var startY = this.frames.position.y;
      var endY = this.isHidden ? 0 : -OFFSET;
      var startScale = this.frames.scale.x;
      var endScale = this.isHidden ? 1 : SCALE;
      var animate = function animate() {
        console.log("animate");
        var n = count / TOTAL_COUNT - 1;
        n = Math.pow(n, 5) + 1;
        _this5.frames.position.set(0, startY * (1 - n) + endY * n, 0);
        var s = startScale * (1 - n) + endScale * n;
        _this5.frames.scale.set(s, s, s);
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

      var fragmentShader = '' + 'uniform sampler2D texture;' + 'uniform float opacity;' + 'varying vec4 vPosition;' + 'void main(void){' + '  vec4 textureColor = texture2D(texture, vec2((1.0 + vPosition.x / 210.0) / 2.0, (1.0 + vPosition.y / 210.0) / 2.0));' + '  textureColor.w = opacity;' + '  gl_FragColor = textureColor;' +
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
            opacity: { type: "f", value: 1.0 },
            offsetY: { type: "f", value: 0 }
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

},{"./ConvexGeometry":1,"./three-mouse-event.es6":3}],3:[function(require,module,exports){
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
    mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

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
    mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

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
    mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(_this.children, true);
    intersects.length = 1; //手前のオブジェクトのみ

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

},{}],4:[function(require,module,exports){
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
      $scope.visibility.tutorial = data.length < 1;
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
          //            embryo.toggle(600);
        } else {
            $scope.hasSelected = true;
            $scope.visibility.contributionDetails = 'shown';
            $scope.visibility.plusButton = false;
            $scope.selectedContribution = contribution;
            $scope.selectedContributionText = contribution.text;
            $scope.visibility.three = false;
            $scope.$apply();
            contributionImage.css({
              'backgroundImage': 'url(./contributes/image/' + contribution._id + ')',
              'backgroundSize': 'cover',
              'opacity': 1
            });
            //            embryo.toggle(600);
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
      contributes.submit({ text: $scope.text, url: $scope.url }, function (data) {
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

},{"./embryo.es6":2}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL0RvY3VtZW50cy9tdXMubG9nL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9Ob2Rva2EvRG9jdW1lbnRzL211cy5sb2cvc291cmNlL2phdmFzY3JpcHRzL0NvbnZleEdlb21ldHJ5LmpzIiwiQzovVXNlcnMvTm9kb2thL0RvY3VtZW50cy9tdXMubG9nL3NvdXJjZS9qYXZhc2NyaXB0cy9lbWJyeW8uZXM2IiwiQzovVXNlcnMvTm9kb2thL0RvY3VtZW50cy9tdXMubG9nL3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiLCJDOi9Vc2Vycy9Ob2Rva2EvRG9jdW1lbnRzL211cy5sb2cvc291cmNlL2phdmFzY3JpcHRzL21haW4uZXM2Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbUJBLEtBQUssQ0FBQyxjQUFjLEdBQUcsVUFBVSxRQUFRLEVBQUc7O0FBRTNDLE1BQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDOztBQUU1QixLQUFJLEtBQUssR0FBRyxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRTVDLFVBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVkOztBQUdELFVBQVMsUUFBUSxDQUFFLFFBQVEsRUFBRzs7QUFFN0IsTUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDLEtBQUssRUFBRSxDQUFDOztBQUUxQyxNQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDMUIsUUFBTSxDQUFDLENB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WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiBAYXV0aG9yIHFpYW8gLyBodHRwczovL2dpdGh1Yi5jb20vcWlhb1xyXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgYSBjb252ZXggaHVsbCBnZW5lcmF0b3IgdXNpbmcgdGhlIGluY3JlbWVudGFsIG1ldGhvZC4gXHJcbiAqIFRoZSBjb21wbGV4aXR5IGlzIE8obl4yKSB3aGVyZSBuIGlzIHRoZSBudW1iZXIgb2YgdmVydGljZXMuXHJcbiAqIE8obmxvZ24pIGFsZ29yaXRobXMgZG8gZXhpc3QsIGJ1dCB0aGV5IGFyZSBtdWNoIG1vcmUgY29tcGxpY2F0ZWQuXHJcbiAqXHJcbiAqIEJlbmNobWFyazogXHJcbiAqXHJcbiAqICBQbGF0Zm9ybTogQ1BVOiBQNzM1MCBAMi4wMEdIeiBFbmdpbmU6IFY4XHJcbiAqXHJcbiAqICBOdW0gVmVydGljZXNcdFRpbWUobXMpXHJcbiAqXHJcbiAqICAgICAxMCAgICAgICAgICAgMVxyXG4gKiAgICAgMjAgICAgICAgICAgIDNcclxuICogICAgIDMwICAgICAgICAgICAxOVxyXG4gKiAgICAgNDAgICAgICAgICAgIDQ4XHJcbiAqICAgICA1MCAgICAgICAgICAgMTA3XHJcbiAqL1xyXG5cclxuVEhSRUUuQ29udmV4R2VvbWV0cnkgPSBmdW5jdGlvbiggdmVydGljZXMgKSB7XHJcblxyXG5cdFRIUkVFLkdlb21ldHJ5LmNhbGwoIHRoaXMgKTtcclxuXHJcblx0dmFyIGZhY2VzID0gWyBbIDAsIDEsIDIgXSwgWyAwLCAyLCAxIF0gXTsgXHJcblxyXG5cdGZvciAoIHZhciBpID0gMzsgaSA8IHZlcnRpY2VzLmxlbmd0aDsgaSArKyApIHtcclxuXHJcblx0XHRhZGRQb2ludCggaSApO1xyXG5cclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBhZGRQb2ludCggdmVydGV4SWQgKSB7XHJcblxyXG5cdFx0dmFyIHZlcnRleCA9IHZlcnRpY2VzWyB2ZXJ0ZXhJZCBdLmNsb25lKCk7XHJcblxyXG5cdFx0dmFyIG1hZyA9IHZlcnRleC5sZW5ndGgoKTtcclxuXHRcdHZlcnRleC54ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xyXG5cdFx0dmVydGV4LnkgKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XHJcblx0XHR2ZXJ0ZXgueiArPSBtYWcgKiByYW5kb21PZmZzZXQoKTtcclxuXHJcblx0XHR2YXIgaG9sZSA9IFtdO1xyXG5cclxuXHRcdGZvciAoIHZhciBmID0gMDsgZiA8IGZhY2VzLmxlbmd0aDsgKSB7XHJcblxyXG5cdFx0XHR2YXIgZmFjZSA9IGZhY2VzWyBmIF07XHJcblxyXG5cdFx0XHQvLyBmb3IgZWFjaCBmYWNlLCBpZiB0aGUgdmVydGV4IGNhbiBzZWUgaXQsXHJcblx0XHRcdC8vIHRoZW4gd2UgdHJ5IHRvIGFkZCB0aGUgZmFjZSdzIGVkZ2VzIGludG8gdGhlIGhvbGUuXHJcblx0XHRcdGlmICggdmlzaWJsZSggZmFjZSwgdmVydGV4ICkgKSB7XHJcblxyXG5cdFx0XHRcdGZvciAoIHZhciBlID0gMDsgZSA8IDM7IGUgKysgKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIGVkZ2UgPSBbIGZhY2VbIGUgXSwgZmFjZVsgKCBlICsgMSApICUgMyBdIF07XHJcblx0XHRcdFx0XHR2YXIgYm91bmRhcnkgPSB0cnVlO1xyXG5cclxuXHRcdFx0XHRcdC8vIHJlbW92ZSBkdXBsaWNhdGVkIGVkZ2VzLlxyXG5cdFx0XHRcdFx0Zm9yICggdmFyIGggPSAwOyBoIDwgaG9sZS5sZW5ndGg7IGggKysgKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoIGVxdWFsRWRnZSggaG9sZVsgaCBdLCBlZGdlICkgKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGhvbGVbIGggXSA9IGhvbGVbIGhvbGUubGVuZ3RoIC0gMSBdO1xyXG5cdFx0XHRcdFx0XHRcdGhvbGUucG9wKCk7XHJcblx0XHRcdFx0XHRcdFx0Ym91bmRhcnkgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRicmVhaztcclxuXHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKCBib3VuZGFyeSApIHtcclxuXHJcblx0XHRcdFx0XHRcdGhvbGUucHVzaCggZWRnZSApO1xyXG5cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyByZW1vdmUgZmFjZXNbIGYgXVxyXG5cdFx0XHRcdGZhY2VzWyBmIF0gPSBmYWNlc1sgZmFjZXMubGVuZ3RoIC0gMSBdO1xyXG5cdFx0XHRcdGZhY2VzLnBvcCgpO1xyXG5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0Ly8gbm90IHZpc2libGVcclxuXHJcblx0XHRcdFx0ZiArKztcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gY29uc3RydWN0IHRoZSBuZXcgZmFjZXMgZm9ybWVkIGJ5IHRoZSBlZGdlcyBvZiB0aGUgaG9sZSBhbmQgdGhlIHZlcnRleFxyXG5cdFx0Zm9yICggdmFyIGggPSAwOyBoIDwgaG9sZS5sZW5ndGg7IGggKysgKSB7XHJcblxyXG5cdFx0XHRmYWNlcy5wdXNoKCBbIFxyXG5cdFx0XHRcdGhvbGVbIGggXVsgMCBdLFxyXG5cdFx0XHRcdGhvbGVbIGggXVsgMSBdLFxyXG5cdFx0XHRcdHZlcnRleElkXHJcblx0XHRcdF0gKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogV2hldGhlciB0aGUgZmFjZSBpcyB2aXNpYmxlIGZyb20gdGhlIHZlcnRleFxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHZpc2libGUoIGZhY2UsIHZlcnRleCApIHtcclxuXHJcblx0XHR2YXIgdmEgPSB2ZXJ0aWNlc1sgZmFjZVsgMCBdIF07XHJcblx0XHR2YXIgdmIgPSB2ZXJ0aWNlc1sgZmFjZVsgMSBdIF07XHJcblx0XHR2YXIgdmMgPSB2ZXJ0aWNlc1sgZmFjZVsgMiBdIF07XHJcblxyXG5cdFx0dmFyIG4gPSBub3JtYWwoIHZhLCB2YiwgdmMgKTtcclxuXHJcblx0XHQvLyBkaXN0YW5jZSBmcm9tIGZhY2UgdG8gb3JpZ2luXHJcblx0XHR2YXIgZGlzdCA9IG4uZG90KCB2YSApO1xyXG5cclxuXHRcdHJldHVybiBuLmRvdCggdmVydGV4ICkgPj0gZGlzdDsgXHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogRmFjZSBub3JtYWxcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBub3JtYWwoIHZhLCB2YiwgdmMgKSB7XHJcblxyXG5cdFx0dmFyIGNiID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcclxuXHRcdHZhciBhYiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XHJcblxyXG5cdFx0Y2Iuc3ViVmVjdG9ycyggdmMsIHZiICk7XHJcblx0XHRhYi5zdWJWZWN0b3JzKCB2YSwgdmIgKTtcclxuXHRcdGNiLmNyb3NzKCBhYiApO1xyXG5cclxuXHRcdGNiLm5vcm1hbGl6ZSgpO1xyXG5cclxuXHRcdHJldHVybiBjYjtcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBEZXRlY3Qgd2hldGhlciB0d28gZWRnZXMgYXJlIGVxdWFsLlxyXG5cdCAqIE5vdGUgdGhhdCB3aGVuIGNvbnN0cnVjdGluZyB0aGUgY29udmV4IGh1bGwsIHR3byBzYW1lIGVkZ2VzIGNhbiBvbmx5XHJcblx0ICogYmUgb2YgdGhlIG5lZ2F0aXZlIGRpcmVjdGlvbi5cclxuXHQgKi9cclxuXHRmdW5jdGlvbiBlcXVhbEVkZ2UoIGVhLCBlYiApIHtcclxuXHJcblx0XHRyZXR1cm4gZWFbIDAgXSA9PT0gZWJbIDEgXSAmJiBlYVsgMSBdID09PSBlYlsgMCBdOyBcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBDcmVhdGUgYSByYW5kb20gb2Zmc2V0IGJldHdlZW4gLTFlLTYgYW5kIDFlLTYuXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gcmFuZG9tT2Zmc2V0KCkge1xyXG5cclxuXHRcdHJldHVybiAoIE1hdGgucmFuZG9tKCkgLSAwLjUgKSAqIDIgKiAxZS02O1xyXG5cclxuXHR9XHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBYWFg6IE5vdCBzdXJlIGlmIHRoaXMgaXMgdGhlIGNvcnJlY3QgYXBwcm9hY2guIE5lZWQgc29tZW9uZSB0byByZXZpZXcuXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gdmVydGV4VXYoIHZlcnRleCApIHtcclxuXHJcblx0XHR2YXIgbWFnID0gdmVydGV4Lmxlbmd0aCgpO1xyXG5cdFx0cmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IyKCB2ZXJ0ZXgueCAvIG1hZywgdmVydGV4LnkgLyBtYWcgKTtcclxuXHJcblx0fVxyXG5cclxuXHQvLyBQdXNoIHZlcnRpY2VzIGludG8gYHRoaXMudmVydGljZXNgLCBza2lwcGluZyB0aG9zZSBpbnNpZGUgdGhlIGh1bGxcclxuXHR2YXIgaWQgPSAwO1xyXG5cdHZhciBuZXdJZCA9IG5ldyBBcnJheSggdmVydGljZXMubGVuZ3RoICk7IC8vIG1hcCBmcm9tIG9sZCB2ZXJ0ZXggaWQgdG8gbmV3IGlkXHJcblxyXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArKyApIHtcclxuXHJcblx0XHQgdmFyIGZhY2UgPSBmYWNlc1sgaSBdO1xyXG5cclxuXHRcdCBmb3IgKCB2YXIgaiA9IDA7IGogPCAzOyBqICsrICkge1xyXG5cclxuXHRcdFx0aWYgKCBuZXdJZFsgZmFjZVsgaiBdIF0gPT09IHVuZGVmaW5lZCApIHtcclxuXHJcblx0XHRcdFx0bmV3SWRbIGZhY2VbIGogXSBdID0gaWQgKys7XHJcblx0XHRcdFx0dGhpcy52ZXJ0aWNlcy5wdXNoKCB2ZXJ0aWNlc1sgZmFjZVsgaiBdIF0gKTtcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZhY2VbIGogXSA9IG5ld0lkWyBmYWNlWyBqIF0gXTtcclxuXHJcblx0XHQgfVxyXG5cclxuXHR9XHJcblxyXG5cdC8vIENvbnZlcnQgZmFjZXMgaW50byBpbnN0YW5jZXMgb2YgVEhSRUUuRmFjZTNcclxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkgKysgKSB7XHJcblxyXG5cdFx0dGhpcy5mYWNlcy5wdXNoKCBuZXcgVEhSRUUuRmFjZTMoIFxyXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDAgXSxcclxuXHRcdFx0XHRmYWNlc1sgaSBdWyAxIF0sXHJcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMiBdXHJcblx0XHQpICk7XHJcblxyXG5cdH1cclxuXHJcblx0Ly8gQ29tcHV0ZSBVVnNcclxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmZhY2VzLmxlbmd0aDsgaSArKyApIHtcclxuXHJcblx0XHR2YXIgZmFjZSA9IHRoaXMuZmFjZXNbIGkgXTtcclxuXHJcblx0XHR0aGlzLmZhY2VWZXJ0ZXhVdnNbIDAgXS5wdXNoKCBbXHJcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmEgXSApLFxyXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5iIF0gKSxcclxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYyBdIClcclxuXHRcdF0gKTtcclxuXHJcblx0fVxyXG5cclxuXHR0aGlzLmNvbXB1dGVGYWNlTm9ybWFscygpO1xyXG5cdHRoaXMuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcclxuXHJcbn07XHJcblxyXG5USFJFRS5Db252ZXhHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5HZW9tZXRyeS5wcm90b3R5cGUgKTtcclxuVEhSRUUuQ29udmV4R2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVEhSRUUuQ29udmV4R2VvbWV0cnk7XHJcbiIsImltcG9ydCAnLi90aHJlZS1tb3VzZS1ldmVudC5lczYnO1xyXG5pbXBvcnQgJy4vQ29udmV4R2VvbWV0cnknO1xyXG5cclxuVEhSRUUuVmVjdG9yMy5wcm90b3R5cGUubWl4ID0gZnVuY3Rpb24oeSwgYSkge1xyXG4gIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKDEgLSBhKS5hZGQoeS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKGEpKVxyXG59O1xyXG5cclxuY2xhc3MgRW1icnlvIHtcclxuXHJcbiAgY29uc3RydWN0b3IoZGF0YSwgY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0LCBjYWxsYmFjaykge1xyXG5cclxuICAgIC8vKiBkYXRhIDogYXJyYXkgb2YgY29udHJpYnV0aW9uc1xyXG4gICAgLy8qIGNvbnRyaWJ1dGlvblxyXG4gICAgLy8qIHtcclxuICAgIC8vKiAgIGltYWdlOiBET01JbWFnZVxyXG4gICAgLy8qICAgdGV4dDogU3RyaW5nXHJcbiAgICAvLyogfVxyXG4gICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgIHRoaXMuY3JlYXRlQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuXHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBruS9nOaIkFxyXG4gICAgdmFyIGxvYWRlZE51bSA9IDA7XHJcbiAgICBkYXRhLmZvckVhY2goKGNvbnRyaWJ1dGlvbiwgaW5kZXgpID0+IHtcclxuICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICB2YXIgdGV4dHVyZSA9IEVtYnJ5by5jcmVhdGVUZXh0dXJlKGltYWdlKTtcclxuICAgICAgICB0aGlzLmRhdGFbaW5kZXhdLnRleHR1cmUgPSB0ZXh0dXJlO1xyXG4gICAgICAgIGxvYWRlZE51bSsrO1xyXG4gICAgICAgIGlmKGxvYWRlZE51bSA9PT0gZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZShjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgaW1hZ2Uuc3JjID0gJy4vY29udHJpYnV0ZXMvaW1hZ2UvJyArIGNvbnRyaWJ1dGlvbi5faWQ7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgfVxyXG5cclxuICBpbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCkge1xyXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB0aGlzLmlzSGlkZGVuID0gZmFsc2U7XHJcblxyXG4gICAgLy9pbml0IHNjZW5lXHJcbiAgICB2YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcclxuXHJcbiAgICAvL2luaXQgY2FtZXJhXHJcbiAgICB2YXIgZm92ID0gNjA7XHJcbiAgICB2YXIgYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XHJcbiAgICB2YXIgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0KTtcclxuICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgKGhlaWdodCAvIDIpIC8gTWF0aC50YW4oKGZvdiAqIE1hdGguUEkgLyAxODApIC8gMikpO1xyXG4gICAgY2FtZXJhLmxvb2tBdChuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKSk7XHJcbiAgICBzY2VuZS5hZGQoY2FtZXJhKTtcclxuXHJcbiAgICAvL2luaXQgcmVuZGVyZXJcclxuICAgIHZhciByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHthbHBoYTogdHJ1ZSwgYW50aWFsaWFzOiB0cnVlfSk7XHJcbiAgICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGNjY2NjYywgMCk7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgLy9pbml0IGNvbnRyb2xzXHJcbiAgICB2YXIgY29udHJvbHMgPSBuZXcgVEhSRUUuVHJhY2tiYWxsQ29udHJvbHMoY2FtZXJhLCByZW5kZXJlci5kb21FbGVtZW50KTtcclxuXHJcbiAgICAvL3dhdGNoIG1vdXNlIGV2ZW50c1xyXG4gICAgc2NlbmUud2F0Y2hNb3VzZUV2ZW50KHJlbmRlcmVyLmRvbUVsZW1lbnQsIGNhbWVyYSk7XHJcblxyXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xyXG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XHJcbiAgICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XHJcbiAgICB0aGlzLmNvbnRyb2xzID0gY29udHJvbHM7XHJcblxyXG4gICAgLy/nlJ/miJBcclxuICAgIHRoaXMuY3JlYXRlKHRoaXMuY3JlYXRlQ2FsbGJhY2spO1xyXG5cclxuICAgIHRoaXMuY291bnQgPSAwO1xyXG5cclxuICAgIC8vY29uc29sZS5sb2codGhpcy5mcmFtZXMpO1xyXG5cclxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbigpe1xyXG4gICAgICBjb250cm9scy51cGRhdGUoKTtcclxuICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xyXG4gICAgICAvL3NjZW5lLmhhbmRsZU1vdXNlRXZlbnQoKTtcclxuICAgICAgdGhpcy5jb3VudCsrO1xyXG4gICAgICB0aGlzLm1vdmVWZXJ0aWNlcygpLnJvdGF0ZSgpO1xyXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIHVwZGF0ZSgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG5cclxuICB9XHJcblxyXG4gIGNyZWF0ZShjYWxsYmFjaykge1xyXG4gICAgdGhpcy5nZW9tZXRyeSA9IEVtYnJ5by5jcmVhdGVHZW9tZXRyeSgxMDAsIHRoaXMuZGF0YS5sZW5ndGgpO1xyXG4gICAgdGhpcy5mcmFtZXMgPSBFbWJyeW8uY3JlYXRlRnJhbWVzKHRoaXMuZ2VvbWV0cnksIHRoaXMuZGF0YSk7XHJcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbiAmJiB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4gey8v44Oe44Km44K544Kk44OZ44Oz44OI44Gu6Kit5a6aXHJcbiAgICAgIGZyYW1lLm9uY2xpY2sgPSAoaW50ZXJzZWN0KSA9PiB7XHJcbiAgICAgICAgaWYodHlwZW9mIHRoaXMub25zZWxlY3QgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIGZyYW1lLmRhdGEgJiYgdGhpcy5vbnNlbGVjdChmcmFtZS5kYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIC8vZnJhbWUub25tb3VzZW92ZXIgPSAoaW50ZXJzZWN0KSA9PiB7XHJcbiAgICAgIC8vICBpbnRlcnNlY3QuZmFjZS5tb3VzZW9uID0gdHJ1ZTtcclxuICAgICAgLy99O1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLmZyYW1lcyk7XHJcbiAgICBpZih0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgY2FsbGJhY2soKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8v5LiJ6KeS44Gu6Z2i44Gn5qeL5oiQ44GV44KM44KL5aSa6Z2i5L2T44Gu5L2c5oiQXHJcbiAgc3RhdGljIGNyZWF0ZUdlb21ldHJ5KHJhZGl1cywgc3VyZmFjZU51bWJlcikge1xyXG4gICAgdmFyIHZlcnRpY2VzID0gW107XHJcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgPCA0KSA/IDQgOiBzdXJmYWNlTnVtYmVyOy8v77yU5Lul5LiL44Gv5LiN5Y+vXHJcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgJiAxKSA/IChzdXJmYWNlTnVtYmVyICsgMSkgOiBzdXJmYWNlTnVtYmVyOy8v5aWH5pWw44Gv5LiN5Y+vKOOCiOOCiuWkp+OBjeOBhOWBtuaVsOOBq+ebtOOBmSlcclxuICAgIGZvcih2YXIgaSA9IDAsIGwgPSAoMiArIHN1cmZhY2VOdW1iZXIgLyAyKTsgaSA8IGw7IGkrKykge1xyXG4gICAgICB2ZXJ0aWNlc1tpXSA9IG5ldyBUSFJFRS5WZWN0b3IzKE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUpOy8v55CD54q244Gr44Op44Oz44OA44Og44Gr54K544KS5omT44GkXHJcbiAgICAgIHZlcnRpY2VzW2ldLnNldExlbmd0aChyYWRpdXMpO1xyXG4gICAgICB2ZXJ0aWNlc1tpXS5vcmlnaW5hbExlbmd0aCA9IHJhZGl1cztcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgVEhSRUUuQ29udmV4R2VvbWV0cnkodmVydGljZXMpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGNyZWF0ZUZyYW1lcyhnZW9tZXRyeSwgZGF0YSkge1xyXG4gICAgdmFyIHZlcnRleHRTaGFkZXIgPSAnJyArXHJcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xyXG4gICAgICAndm9pZCBtYWluKCkgeycgK1xyXG4gICAgICAnICBnbF9Qb3NpdGlvbiA9IHByb2plY3Rpb25NYXRyaXggKiB2aWV3TWF0cml4ICogbW9kZWxNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLCAxLjApOycgK1xyXG4gICAgICAnICB2UG9zaXRpb24gPSBnbF9Qb3NpdGlvbjsnICtcclxuICAgICAgJ30nO1xyXG5cclxuICAgIHZhciBmcmFnbWVudFNoYWRlciA9ICcnICtcclxuICAgICAgJ3VuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7JyArXHJcbiAgICAgICd1bmlmb3JtIGZsb2F0IG9wYWNpdHk7JyArXHJcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xyXG4gICAgICAndm9pZCBtYWluKHZvaWQpeycgK1xyXG4gICAgICAnICB2ZWM0IHRleHR1cmVDb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB2ZWMyKCgxLjAgKyB2UG9zaXRpb24ueCAvIDIxMC4wKSAvIDIuMCwgKDEuMCArIHZQb3NpdGlvbi55IC8gMjEwLjApIC8gMi4wKSk7JyArXHJcbiAgICAgICcgIHRleHR1cmVDb2xvci53ID0gb3BhY2l0eTsnICtcclxuICAgICAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZUNvbG9yOycgK1xyXG4gICAgICAvLycgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCh2UG9zaXRpb24ueCAvIDgwMC4wICsgMS4wKSAvIDIuMCwgKHZQb3NpdGlvbi55IC8gODAwLjAgKyAxLjApIC8gMi4wLCAwLCAwKTsnICtcclxuICAgICAgJ30nO1xyXG5cclxuICAgIHZhciBmcmFtZXMgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcclxuICAgIGdlb21ldHJ5LmZhY2VzLmZvckVhY2goZnVuY3Rpb24oZmFjZSwgaW5kZXgpIHtcclxuICAgICAgdmFyIGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdLCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXSwgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XHJcblxyXG4gICAgICAvL2NyZWF0ZSBnZW9tZXRyeVxyXG4gICAgICB2YXIgZnJhbWVHZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xyXG4gICAgICBmcmFtZUdlb21ldHJ5LnZlcnRpY2VzID0gW2EsIGIsIGNdO1xyXG4gICAgICBmcmFtZUdlb21ldHJ5LmZhY2VzID0gW25ldyBUSFJFRS5GYWNlMygwLCAxLCAyKV07XHJcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XHJcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcclxuXHJcbiAgICAgIC8vY3JlYXRlIG1hdGVyaWFsXHJcbiAgICAgIHZhciBmcmFtZU1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcclxuICAgICAgICB2ZXJ0ZXhTaGFkZXI6IHZlcnRleHRTaGFkZXIsXHJcbiAgICAgICAgZnJhZ21lbnRTaGFkZXI6IGZyYWdtZW50U2hhZGVyLFxyXG4gICAgICAgIHVuaWZvcm1zOiB7XHJcbiAgICAgICAgICB0ZXh0dXJlOiB7IHR5cGU6IFwidFwiLCB2YWx1ZTogZGF0YVtpbmRleF0gPyBkYXRhW2luZGV4XS50ZXh0dXJlIDogbnVsbCB9LFxyXG4gICAgICAgICAgb3BhY2l0eTogeyB0eXBlOiBcImZcIiwgdmFsdWU6IDEuMCB9LFxyXG4gICAgICAgICAgb2Zmc2V0WTogeyB0eXBlOiBcImZcIiwgdmFsdWU6IDAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGZyYW1lR2VvbWV0cnksIGZyYW1lTWF0ZXJpYWwpO1xyXG4gICAgICBtZXNoLmRhdGEgPSBkYXRhW2luZGV4XTtcclxuXHJcbiAgICAgIGZyYW1lcy5hZGQobWVzaCk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBmcmFtZXM7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgY3JlYXRlVGV4dHVyZShpbWFnZSkge1xyXG4gICAgdmFyIHRleHR1cmUgPSBuZXcgVEhSRUUuVGV4dHVyZSh0aGlzLmdldFN1aXRhYmxlSW1hZ2UoaW1hZ2UpKTtcclxuICAgIC8vdGV4dHVyZS5tYWdGaWx0ZXIgPSB0ZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XHJcbiAgICB0ZXh0dXJlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcclxuICAgIHJldHVybiB0ZXh0dXJlO1xyXG4gIH1cclxuXHJcbiAgLy/nlLvlg4/jgrXjgqTjgrrjgpLoqr/mlbRcclxuICBzdGF0aWMgZ2V0U3VpdGFibGVJbWFnZShpbWFnZSkge1xyXG4gICAgdmFyIHcgPSBpbWFnZS5uYXR1cmFsV2lkdGgsIGggPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xyXG4gICAgLy92YXIgc2l6ZSA9IE1hdGgucG93KDIsIE1hdGgubG9nKE1hdGgubWluKHcsIGgpKSAvIE1hdGguTE4yIHwgMCk7IC8vIGxhcmdlc3QgMl5uIGludGVnZXIgdGhhdCBkb2VzIG5vdCBleGNlZWRcclxuICAgIHZhciBzaXplID0gMTI4O1xyXG4gICAgaWYgKHcgIT09IGggfHwgdyAhPT0gc2l6ZSkge1xyXG4gICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgIHZhciBvZmZzZXRYID0gaCAvIHcgPiAxID8gMCA6ICh3IC0gaCkgLyAyO1xyXG4gICAgICB2YXIgb2Zmc2V0WSA9IGggLyB3ID4gMSA/IChoIC0gdykgLyAyIDogMDtcclxuICAgICAgdmFyIGNsaXBTaXplID0gaCAvIHcgPiAxID8gdyA6IGg7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMud2lkdGggPSBzaXplO1xyXG4gICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoaW1hZ2UsIG9mZnNldFgsIG9mZnNldFksIGNsaXBTaXplLCBjbGlwU2l6ZSwgMCwgMCwgc2l6ZSwgc2l6ZSk7XHJcbiAgICAgIGltYWdlID0gY2FudmFzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGltYWdlO1xyXG4gIH1cclxuXHJcbiAgbW92ZVZlcnRpY2VzKCkge1xyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLmZyYW1lcy5jaGlsZHJlblswXS5nZW9tZXRyeS52ZXJ0aWNlc1swXSk7XHJcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4ge1xyXG4gICAgICB2YXIgZmFjZSA9IGZyYW1lLmdlb21ldHJ5LmZhY2VzWzBdO1xyXG4gICAgICBmcmFtZS5nZW9tZXRyeS52ZXJ0aWNlcy5mb3JFYWNoKCh2ZXJ0ZXgsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgdmVydGV4Lm1peChmYWNlLm5vcm1hbCwgMC4xKS5zZXRMZW5ndGgodmVydGV4Lm9yaWdpbmFsTGVuZ3RoICsgNSAqIE1hdGguY29zKHRoaXMuY291bnQvMjAgKyBpbmRleCAqIDEwKSk7XHJcbiAgICB9KTtcclxuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXNOZWVkVXBkYXRlID0gdHJ1ZTtcclxuICAgICAgZnJhbWUuZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHJvdGF0ZSgpIHtcclxuICAgIHRoaXMuZnJhbWVzLnJvdGF0aW9uLnNldCgwLCB0aGlzLmNvdW50LzUwMCwgMCk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgdGhyZWUuanPjgqrjg5bjgrjjgqfjgq/jg4jjga7liYrpmaRcclxuICAgKi9cclxuICBjbGVhcigpIHtcclxuICAgIHRoaXMuZ2VvbWV0cnkgJiYgdGhpcy5nZW9tZXRyeS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGZyYW1lKSB7XHJcbiAgICAgIGZyYW1lLmdlb21ldHJ5LmRpc3Bvc2UoKTtcclxuICAgICAgZnJhbWUubWF0ZXJpYWwuZGlzcG9zZSgpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnNjZW5lLnJlbW92ZSh0aGlzLmZyYW1lcyk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgY29udHJpYnV0aW9u44Gu6L+95YqgXHJcbiAgICBAcGFyYW0gY29udHJpYnV0aW9uIHtPYmplY3R9IOaKleeov1xyXG4gICAqL1xyXG4gIGFkZENvbnRyaWJ1dGlvbihjb250cmlidXRpb24sIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgY29udHJpYnV0aW9uLnRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XHJcbiAgICAgIHRoaXMuZGF0YS5wdXNoKGNvbnRyaWJ1dGlvbik7XHJcbiAgICAgIHRoaXMuY2xlYXIoKS5jcmVhdGUoY2FsbGJhY2spOy8v44Oq44K744OD44OIXHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gJy4vY29udHJpYnV0ZXMvaW1hZ2UvJyArIGNvbnRyaWJ1dGlvbi5faWQ7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBzZXRTaXplKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcclxuICAgIHRoaXMuY2FtZXJhLmFzcGVjdCA9IHdpZHRoIC8gaGVpZ2h0O1xyXG4gICAgdGhpcy5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gICAgXHJcbiAgdG9nZ2xlKGR1cmF0aW9uKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGR1cmF0aW9uKTtcclxuICAgIHZhciBUT1RBTF9DT1VOVCA9IGR1cmF0aW9uIC8gKDEwMDAgLyA2MCk7XHJcbiAgICB2YXIgT0ZGU0VUID0gMjAwO1xyXG4gICAgdmFyIFNDQUxFID0gMC42O1xyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHZhciBzdGFydFkgPSB0aGlzLmZyYW1lcy5wb3NpdGlvbi55O1xyXG4gICAgdmFyIGVuZFkgPSB0aGlzLmlzSGlkZGVuID8gMCA6IC1PRkZTRVQ7XHJcbiAgICB2YXIgc3RhcnRTY2FsZSA9IHRoaXMuZnJhbWVzLnNjYWxlLng7XHJcbiAgICB2YXIgZW5kU2NhbGUgPSB0aGlzLmlzSGlkZGVuID8gMSA6IFNDQUxFO1xyXG4gICAgdmFyIGFuaW1hdGUgPSAoKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJhbmltYXRlXCIpO1xyXG4gICAgICB2YXIgbiA9IGNvdW50IC8gVE9UQUxfQ09VTlQgLSAxO1xyXG4gICAgICBuID0gTWF0aC5wb3cobiAsIDUpICsgMTtcclxuICAgICAgdGhpcy5mcmFtZXMucG9zaXRpb24uc2V0KDAsIHN0YXJ0WSAqICgxIC0gbikgKyBlbmRZICogbiwgMCk7XHJcbiAgICAgIHZhciBzID0gc3RhcnRTY2FsZSAqICgxIC0gbikgKyBlbmRTY2FsZSAqIG47XHJcbiAgICAgIHRoaXMuZnJhbWVzLnNjYWxlLnNldChzLCBzLCBzKTtcclxuICAgICAgaWYoY291bnQgPCBUT1RBTF9DT1VOVCkge1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcclxuICAgIHRoaXMuaXNIaWRkZW4gPSAhdGhpcy5pc0hpZGRlbjtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBFbWJyeW87IiwiVEhSRUUuU2NlbmUucHJvdG90eXBlLndhdGNoTW91c2VFdmVudCA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIGNhbWVyYSkge1xyXG4gIHZhciBwcmVJbnRlcnNlY3RzID0gW107XHJcbiAgdmFyIG1vdXNlRG93bkludGVyc2VjdHMgPSBbXTtcclxuICB2YXIgcHJlRXZlbnQ7XHJcbiAgdmFyIG1vdXNlRG93blBvaW50ID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcclxuICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZURvd24oZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcclxuICAgIHZhciByZWN0ID0gZG9tRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgIG1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQpIC8gcmVjdC53aWR0aCkgKiAyIC0gMTtcclxuICAgIG1vdXNlLnkgPSAtKChldmVudC5jbGllbnRZIC0gcmVjdC50b3ApIC8gcmVjdC5oZWlnaHQpICogMiArIDE7XHJcblxyXG4gICAgLy9vbm1vdXNlZG93blxyXG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHByZUludGVyc2VjdCkge1xyXG4gICAgICB2YXIgb2JqZWN0ID0gcHJlSW50ZXJzZWN0Lm9iamVjdDtcclxuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZWRvd24gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBvYmplY3Qub25tb3VzZWRvd24ocHJlSW50ZXJzZWN0KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBtb3VzZURvd25JbnRlcnNlY3RzID0gcHJlSW50ZXJzZWN0cztcclxuXHJcbiAgICBwcmVFdmVudCA9IGV2ZW50O1xyXG4gICAgbW91c2VEb3duUG9pbnQgPSBuZXcgVEhSRUUuVmVjdG9yMihtb3VzZS54LCBtb3VzZS55KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlVXAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcclxuICAgIHZhciByZWN0ID0gZG9tRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgIG1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQpIC8gcmVjdC53aWR0aCkgKiAyIC0gMTtcclxuICAgIG1vdXNlLnkgPSAtKChldmVudC5jbGllbnRZIC0gcmVjdC50b3ApIC8gcmVjdC5oZWlnaHQpICogMiArIDE7XHJcblxyXG4gICAgLy9vbm1vdXNldXBcclxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihpbnRlcnNlY3QpIHtcclxuICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2V1cCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIG9iamVjdC5vbm1vdXNldXAoaW50ZXJzZWN0KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYobW91c2VEb3duUG9pbnQuZGlzdGFuY2VUbyhuZXcgVEhSRUUuVmVjdG9yMihtb3VzZS54LCBtb3VzZS55KSkgPCA1KSB7XHJcbiAgICAgIC8vb25jbGlja1xyXG4gICAgICBtb3VzZURvd25JbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24gKGludGVyc2VjdCkge1xyXG4gICAgICAgIHZhciBvYmplY3QgPSBpbnRlcnNlY3Qub2JqZWN0O1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIGlmIChleGlzdChwcmVJbnRlcnNlY3RzLCBpbnRlcnNlY3QpKSB7XHJcbiAgICAgICAgICAgIG9iamVjdC5vbmNsaWNrKGludGVyc2VjdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcmVFdmVudCA9IGV2ZW50O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XHJcbiAgICB2YXIgcmVjdCA9IGRvbUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICBtb3VzZS54ID0gKChldmVudC5jbGllbnRYIC0gcmVjdC5sZWZ0KSAvIHJlY3Qud2lkdGgpICogMiAtIDE7XHJcbiAgICBtb3VzZS55ID0gLSgoZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKSAvIHJlY3QuaGVpZ2h0KSAqIDIgKyAxO1xyXG5cclxuICAgIHZhciByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKCk7XHJcbiAgICByYXljYXN0ZXIuc2V0RnJvbUNhbWVyYShtb3VzZSwgY2FtZXJhKTtcclxuXHJcbiAgICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKF90aGlzLmNoaWxkcmVuLCB0cnVlKTtcclxuICAgIGludGVyc2VjdHMubGVuZ3RoID0gMTsvL+aJi+WJjeOBruOCquODluOCuOOCp+OCr+ODiOOBruOBv1xyXG5cclxuICAgIGludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgIHZhciBvYmplY3QgPSBpbnRlcnNlY3Qub2JqZWN0O1xyXG4gICAgICAvL29ubW91c2Vtb3ZlXHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vtb3ZlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgb2JqZWN0Lm9ubW91c2Vtb3ZlKGludGVyc2VjdCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vb25tb3VzZW92ZXJcclxuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZW92ZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBpZiAoIWV4aXN0KHByZUludGVyc2VjdHMsIGludGVyc2VjdCkpIHtcclxuICAgICAgICAgIG9iamVjdC5vbm1vdXNlb3ZlcihpbnRlcnNlY3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy9vbm1vdXNlb3V0XHJcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24ocHJlSW50ZXJzZWN0KSB7XHJcbiAgICAgIHZhciBvYmplY3QgPSBwcmVJbnRlcnNlY3Qub2JqZWN0O1xyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3V0ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgaWYgKCFleGlzdChpbnRlcnNlY3RzLCBwcmVJbnRlcnNlY3QpKSB7XHJcbiAgICAgICAgICBwcmVJbnRlcnNlY3Qub2JqZWN0Lm9ubW91c2VvdXQocHJlSW50ZXJzZWN0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHByZUludGVyc2VjdHMgPSBpbnRlcnNlY3RzO1xyXG4gICAgcHJlRXZlbnQgPSBldmVudDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGV4aXN0KGludGVyc2VjdHMsIHRhcmdldEludGVyc2VjdCkge1xyXG4gICAgLy9pbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XHJcbiAgICAvLyAgaWYoaW50ZXJzZWN0Lm9iamVjdCA9PSB0YXJnZXRJbnRlcnNlY3Qub2JqZWN0KSByZXR1cm4gdHJ1ZTtcclxuICAgIC8vfSk7XHJcbiAgICAvL3JldHVybiBmYWxzZTtcclxuICAgIHJldHVybiAodHlwZW9mIGludGVyc2VjdHNbMF0gPT09ICdvYmplY3QnKSAmJiAoaW50ZXJzZWN0c1swXS5vYmplY3QgPT09IHRhcmdldEludGVyc2VjdC5vYmplY3QpO1xyXG4gIH1cclxuXHJcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZURvd24pO1xyXG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZU1vdXNlVXApO1xyXG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2VNb3ZlKTtcclxuXHJcbiAgVEhSRUUuU2NlbmUucHJvdG90eXBlLmhhbmRsZU1vdXNlRXZlbnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHByZUV2ZW50ICYmIGhhbmRsZU1vdXNlTW92ZShwcmVFdmVudCk7XHJcbiAgfTtcclxuXHJcbn07IiwiaW1wb3J0IEVtYnJ5byBmcm9tICcuL2VtYnJ5by5lczYnO1xyXG5cclxuKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgdmFyIGVtYnJ5bztcclxuXHJcbiAgLy9hbmd1bGFyIHRlc3RcclxuICBhbmd1bGFyLm1vZHVsZSgnbXlTZXJ2aWNlcycsIFtdKVxyXG4gICAgLnNlcnZpY2UoJ2ltYWdlU2VhcmNoJywgWyckaHR0cCcsIGZ1bmN0aW9uICgkaHR0cCkge1xyXG4gICAgICB0aGlzLmdldEltYWdlcyA9IGZ1bmN0aW9uIChxdWVyeSwgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICB2YXIgdXJsID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2N1c3RvbXNlYXJjaC92MT9rZXk9QUl6YVN5RDNpbkFVdGZhaUlxRmJCTU9JMFkzNFgxeF9xdnN4QThnJmN4PTAwMTU1NjU2ODk0MzU0NjgzODM1MDowYmRpZ3JkMXg4aSZzZWFyY2hUeXBlPWltYWdlJnE9JztcclxuICAgICAgICBxdWVyeSA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xyXG4gICAgICAgICRodHRwKHtcclxuICAgICAgICAgIHVybDogdXJsICsgcXVlcnksXHJcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmNvbmNhdChkYXRhLml0ZW1zKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xyXG4gICAgICAgICAgICBpZihpdGVtcy5sZW5ndGggPT09IDIwKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soaXRlbXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcclxuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUQzaW5BVXRmYWlJcUZiQk1PSTBZMzRYMXhfcXZzeEE4ZyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZzdGFydD0xMSZxPSc7XHJcbiAgICAgICAgcXVlcnkgPSBlbmNvZGVVUklDb21wb25lbnQocXVlcnkucmVwbGFjZSgvXFxzKy9nLCAnICcpKTtcclxuXHJcbiAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgdXJsOiB1cmwgKyBxdWVyeSxcclxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XHJcbiAgICAgICAgICAgIGlmKGl0ZW1zLmxlbmd0aCA9PT0gMjApIHtcclxuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5zZXJ2aWNlKCdjb250cmlidXRlcycsIFsnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcclxuICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAkaHR0cCh7XHJcbiAgICAgICAgICB1cmw6ICcvY29udHJpYnV0ZXMvYWxsJyxcclxuICAgICAgICAgIC8vdXJsOiAnLi9qYXZhc2NyaXB0cy9hbGwuanNvbicsXHJcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfTtcclxuICAgICAgdGhpcy5zdWJtaXQgPSBmdW5jdGlvbiAoY29udHJpYnV0aW9uLCBjYWxsYmFjaykge1xyXG4gICAgICAgICRodHRwKHtcclxuICAgICAgICAgIHVybDogJy9jb250cmlidXRlcy9wb3N0JyxcclxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgZGF0YTogY29udHJpYnV0aW9uXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfTtcclxuICAgICAgdGhpcy5lZGl0VGV4dCA9IGZ1bmN0aW9uICh0ZXh0LCBjb250cmlidXRpb25faWQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgdXJsOiAnL2NvbnRyaWJ1dGVzL2VkaXQnLFxyXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgIHRleHQ6IHRleHQsXHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbl9pZDogY29udHJpYnV0aW9uX2lkXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfTtcclxuICAgIH1dKTtcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoXCJlbWJyeW9cIiwgWydteVNlcnZpY2VzJ10pXHJcbiAgICAuY29udHJvbGxlcignbXlDdHJsJywgWyckc2NvcGUnLCAnaW1hZ2VTZWFyY2gnLCAnY29udHJpYnV0ZXMnLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZVNlYXJjaCwgY29udHJpYnV0ZXMpIHtcclxuICAgICAgLy9jb250aWJ1dGlvbnPjgpLlj5blvpdcclxuICAgICAgY29udHJpYnV0ZXMuZ2V0QWxsKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbnMgPSBkYXRhO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnR1dG9yaWFsID0gZGF0YS5sZW5ndGggPCAxO1xyXG4gICAgICAgIHZhciBjb250YWluZXIgPSAkKCcuZW1icnlvLXRocmVlJyk7XHJcbiAgICAgICAgdmFyIGNvbnRyaWJ1dGlvbkltYWdlID0gJCgnLmVtYnJ5by1jb250cmlidXRpb24taW1hZ2UnKTtcclxuICAgICAgICBlbWJyeW8gPSBuZXcgRW1icnlvKGRhdGEsIGNvbnRhaW5lci5nZXQoMCksIGNvbnRhaW5lci53aWR0aCgpLCBjb250YWluZXIuaGVpZ2h0KCksIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHdpbmRvdy5lbWJyeW8gPSBlbWJyeW87XHJcbiAgICAgICAgZW1icnlvLm9uc2VsZWN0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbikge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5oYXNTZWxlY3RlZCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICdoaWRkZW4nO1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wbHVzQnV0dG9uID0gdHJ1ZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkudGhyZWUgPSB0cnVlO1xyXG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ29wYWNpdHknOiAwXHJcbiAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgICAgIGVtYnJ5by50b2dnbGUoNjAwKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAnc2hvd24nO1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wbHVzQnV0dG9uID0gZmFsc2U7XHJcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvbiA9IGNvbnRyaWJ1dGlvbjtcclxuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uVGV4dCA9IGNvbnRyaWJ1dGlvbi50ZXh0O1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS50aHJlZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRJbWFnZSc6ICd1cmwoLi9jb250cmlidXRlcy9pbWFnZS8nICsgY29udHJpYnV0aW9uLl9pZCArICcpJyxcclxuICAgICAgICAgICAgICAnYmFja2dyb3VuZFNpemUnOiAnY292ZXInLFxyXG4gICAgICAgICAgICAgICdvcGFjaXR5JzogMVxyXG4gICAgICAgICAgICB9KTtcclxuLy8gICAgICAgICAgICBlbWJyeW8udG9nZ2xlKDYwMCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAkc2NvcGUudmlzaWJpbGl0eSA9IHtcclxuICAgICAgICBwb3N0OiBmYWxzZSxcclxuICAgICAgICBwbHVzQnV0dG9uOiB0cnVlLFxyXG4gICAgICAgIGNvbnRyaWJ1dGlvbkRldGFpbHM6ICdoaWRkZW4nLFxyXG4gICAgICAgIHBvc3RTZWFyY2g6IHRydWUsXHJcbiAgICAgICAgcG9zdENvbnRyaWJ1dGU6IGZhbHNlLFxyXG4gICAgICAgIHBvc3RMb2FkaW5nOiBmYWxzZSxcclxuICAgICAgICB0aHJlZTogdHJ1ZSxcclxuICAgICAgICBsb2FkaW5nOiB0cnVlLFxyXG4gICAgICAgIHR1dG9yaWFsOiBmYWxzZVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgJHNjb3BlLnF1ZXJ5ID0gJyc7XHJcbiAgICAgICRzY29wZS5jb250cmlidXRpb25EZXRhaWxzTWVzc2FnZSA9ICdVcGRhdGUnO1xyXG5cclxuICAgICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUuaXRlbXMgPSBbXTtcclxuICAgICAgICBpbWFnZVNlYXJjaC5nZXRJbWFnZXMoJHNjb3BlLnF1ZXJ5LCBmdW5jdGlvbiAoaXRlbXMpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcclxuICAgICAgICAgICRzY29wZS5pdGVtcyA9IGl0ZW1zO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWRJdGVtID0gaXRlbTtcclxuICAgICAgICAkc2NvcGUudXJsID0gaXRlbS5saW5rO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RTZWFyY2ggPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0Q29udHJpYnV0ZSA9IHRydWU7XHJcbiAgICAgICAgJHNjb3BlLnRleHQgPSAkc2NvcGUucXVlcnk7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS5zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHt0ZXh0OiAkc2NvcGUudGV4dCwgdXJsOiAkc2NvcGUudXJsfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgLy/mipXnqL/jga7ov73liqBcclxuICAgICAgICAgICRzY29wZS5jb250cmlidXRpb25zLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICBlbWJyeW8uYWRkQ29udHJpYnV0aW9uKGRhdGEsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkudHV0b3JpYWwgPSBmYWxzZTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RMb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLmVkaXRUZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvblRleHQpO1xyXG4gICAgICAgIGNvbnRyaWJ1dGVzLmVkaXRUZXh0KCRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvblRleHQsICRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvbi5faWQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ0NvbXBsZXRlZCc7XHJcbiAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XHJcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ1VwZGF0ZSc7XHJcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcclxuICAgICAgICAgIH0sIDIwMDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUuY2xvc2VMaWdodGJveCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLnRvZ2dsZVBvc3RQYW5lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3QgPSAhJHNjb3BlLnZpc2liaWxpdHkucG9zdDtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLnRvZ2dsZUNvbnRyaWJ1dGlvbkRldGFpbHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPT0gJ29wZW5lZCcgPyAnc2hvd24nIDogJ29wZW5lZCc7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS5iYWNrVG9TZWFyY2ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdFNlYXJjaCA9IHRydWU7XHJcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfV0pO1xyXG5cclxufSkoKTsiXX0=
