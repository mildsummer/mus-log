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
    value: function toggle(duration) {
      var _this5 = this;

      var TOTAL_COUNT = duration / (1000 / 60);
      var OFFSET = 200;
      var SCALE = 0.6;
      var count = 0;
      var startY = this.frames.position.y;
      var endY = this.isHidden ? 0 : OFFSET;
      var startScale = this.frames.scale;
      var endScale = this.isHidden ? 1 : SCALE;
      var animate = function animate() {
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
    console.log(mouse);

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
          embryo.toggle(600);
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
          embryo.toggle(600);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL0RvY3VtZW50cy9tdXMubG9nL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9Ob2Rva2EvRG9jdW1lbnRzL211cy5sb2cvc291cmNlL2phdmFzY3JpcHRzL0NvbnZleEdlb21ldHJ5LmpzIiwiQzovVXNlcnMvTm9kb2thL0RvY3VtZW50cy9tdXMubG9nL3NvdXJjZS9qYXZhc2NyaXB0cy9lbWJyeW8uZXM2IiwiQzovVXNlcnMvTm9kb2thL0RvY3VtZW50cy9tdXMubG9nL3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiLCJDOi9Vc2Vycy9Ob2Rva2EvRG9jdW1lbnRzL211cy5sb2cvc291cmNlL2phdmFzY3JpcHRzL21haW4uZXM2Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbUJBLEtBQUssQ0FBQyxjQUFjLEdBQUcsVUFBVSxRQUFRLEVBQUc7O0FBRTNDLE1BQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDOztBQUU1QixLQUFJLEtBQUssR0FBRyxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRTVDLFVBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVkOztBQUdELFVBQVMsUUFBUSxDQUFFLFFBQVEsRUFBRzs7QUFFN0IsTUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDLEtBQUssRUFBRSxDQUFDOztBQUUxQyxNQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDMUIsUUFBTSxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsWUFBWSxFQUFFLENBQUM7QUFDakMsUUFBTSxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsWUFBWSxFQUFFLENBQUM7QUFDakMsUUFBTSxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsWUFBWSxFQUFFLENBQUM7O0FBRWpDLE1BQUksSUFBSSxHQUFHLEVBQUUsQ0FBQzs7QUFFZCxPQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBSTs7QUFFcEMsT0FBSSxJQUFJLEdBQUcsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDOzs7O0FBSXRCLE9BQUssT0FBTyxDQUFFLElBQUksRUFBRSxNQUFNLENBQUUsRUFBRzs7QUFFOUIsU0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUcsRUFBRzs7QUFFOUIsU0FBSSxJQUFJLEdBQUcsQ0FBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLEVBQUUsSUFBSSxDQUFFLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQSxHQUFLLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDaEQsU0FBSSxRQUFRLEdBQUcsSUFBSSxDQUFDOzs7QUFHcEIsVUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRXhDLFVBQUssU0FBUyxDQUFFLElBQUksQ0FBRSxDQUFDLENBQUUsRUFBRSxJQUFJLENBQUUsRUFBRzs7QUFFbkMsV0FBSSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBRSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDO0FBQ3BDLFdBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGVBQVEsR0FBRyxLQUFLLENBQUM7QUFDakIsYUFBTTtPQUVOO01BRUQ7O0FBRUQsU0FBSyxRQUFRLEVBQUc7O0FBRWYsVUFBSSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQztNQUVsQjtLQUVEOzs7QUFHRCxTQUFLLENBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxDQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUM7QUFDdkMsU0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRVosTUFBTTs7OztBQUlOLEtBQUMsRUFBRyxDQUFDO0lBRUw7R0FFRDs7O0FBR0QsT0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRXhDLFFBQUssQ0FBQyxJQUFJLENBQUUsQ0FDWCxJQUFJLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQyxDQUFFLEVBQ2QsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUMsQ0FBRSxFQUNkLFFBQVEsQ0FDUixDQUFFLENBQUM7R0FFSjtFQUVEOzs7OztBQUtELFVBQVMsT0FBTyxDQUFFLElBQUksRUFBRSxNQUFNLEVBQUc7O0FBRWhDLE1BQUksRUFBRSxHQUFHLFFBQVEsQ0FBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztBQUMvQixNQUFJLEVBQUUsR0FBRyxRQUFRLENBQUUsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7QUFDL0IsTUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFFLElBQUksQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUUvQixNQUFJLENBQUMsR0FBRyxNQUFNLENBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQzs7O0FBRzdCLE1BQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRXZCLFNBQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUUsSUFBSSxJQUFJLENBQUM7RUFFL0I7Ozs7O0FBS0QsVUFBUyxNQUFNLENBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUc7O0FBRTdCLE1BQUksRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzdCLE1BQUksRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUU3QixJQUFFLENBQUMsVUFBVSxDQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztBQUN4QixJQUFFLENBQUMsVUFBVSxDQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztBQUN4QixJQUFFLENBQUMsS0FBSyxDQUFFLEVBQUUsQ0FBRSxDQUFDOztBQUVmLElBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7QUFFZixTQUFPLEVBQUUsQ0FBQztFQUVWOzs7Ozs7O0FBT0QsVUFBUyxTQUFTLENBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRzs7QUFFNUIsU0FBTyxFQUFFLENBQUUsQ0FBQyxDQUFFLEtBQUssRUFBRSxDQUFFLENBQUMsQ0FBRSxJQUFJLEVBQUUsQ0FBRSxDQUFDLENBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFFLENBQUM7RUFFbEQ7Ozs7O0FBS0QsVUFBUyxZQUFZLEdBQUc7O0FBRXZCLFNBQU8sQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFBLEdBQUssQ0FBQyxHQUFHLElBQUksQ0FBQztFQUUxQzs7Ozs7QUFNRCxVQUFTLFFBQVEsQ0FBRSxNQUFNLEVBQUc7O0FBRTNCLE1BQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUMxQixTQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBRSxDQUFDO0VBRTNEOzs7QUFHRCxLQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDWCxLQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBRSxRQUFRLENBQUMsTUFBTSxDQUFFLENBQUM7O0FBRXpDLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRyxFQUFHOztBQUV4QyxNQUFJLElBQUksR0FBRyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXRCLE9BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRS9CLE9BQUssS0FBSyxDQUFFLElBQUksQ0FBRSxDQUFDLENBQUUsQ0FBRSxLQUFLLFNBQVMsRUFBRzs7QUFFdkMsU0FBSyxDQUFFLElBQUksQ0FBRSxDQUFDLENBQUUsQ0FBRSxHQUFHLEVBQUUsRUFBRyxDQUFDO0FBQzNCLFFBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBRSxDQUFDO0lBRTVDOztBQUVELE9BQUksQ0FBRSxDQUFDLENBQUUsR0FBRyxLQUFLLENBQUUsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7R0FFOUI7RUFFRjs7O0FBR0QsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRXpDLE1BQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FDOUIsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUMsQ0FBRSxFQUNmLEtBQUssQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDLENBQUUsRUFDZixLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQyxDQUFFLENBQ2hCLENBQUUsQ0FBQztFQUVKOzs7QUFHRCxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRTlDLE1BQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRTNCLE1BQUksQ0FBQyxhQUFhLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQzdCLFFBQVEsQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBQyxDQUFDLENBQUUsQ0FBRSxFQUNuQyxRQUFRLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsQ0FBQyxDQUFFLENBQUUsRUFDbkMsUUFBUSxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFFLENBQ25DLENBQUUsQ0FBQztFQUVKOztBQUVELEtBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQzFCLEtBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0NBRTVCLENBQUM7O0FBRUYsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBRSxDQUFDO0FBQzNFLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDOzs7Ozs7Ozs7Ozs7O1FDak8zRCx5QkFBeUI7O1FBQ3pCLGtCQUFrQjs7QUFFekIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLFVBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMzQyxTQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7Q0FDbkUsQ0FBQzs7SUFFSSxNQUFNO0FBRUMsV0FGUCxNQUFNLENBRUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRTs7OzBCQUZsRCxNQUFNOzs7Ozs7OztBQVVSLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFFBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDOzs7QUFHL0IsUUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2xCLFFBQUksQ0FBQyxPQUFPLENBQUMsVUFBQyxZQUFZLEVBQUUsS0FBSyxFQUFLO0FBQ3BDLFVBQUksS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEIsV0FBSyxDQUFDLE1BQU0sR0FBRyxZQUFNO0FBQ25CLFlBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUMsY0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUNuQyxpQkFBUyxFQUFFLENBQUM7QUFDWixZQUFHLFNBQVMsS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQzVCLGdCQUFLLFVBQVUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzNDO09BQ0YsQ0FBQztBQUNGLFdBQUssQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztLQUNqQyxDQUFDLENBQUM7O0FBRUgsV0FBTyxJQUFJLENBQUM7R0FFYjs7ZUE5QkcsTUFBTTs7V0FnQ0Esb0JBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDbkMsVUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDbkIsVUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsVUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7OztBQUd0QixVQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7O0FBRzlCLFVBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNiLFVBQUksTUFBTSxHQUFHLEtBQUssR0FBRyxNQUFNLENBQUM7QUFDNUIsVUFBSSxNQUFNLEdBQUcsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3RELFlBQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQUFBQyxNQUFNLEdBQUcsQ0FBQyxHQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQUFBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5RSxZQUFNLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsV0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7O0FBR2xCLFVBQUksUUFBUSxHQUFHLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDdkUsY0FBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDaEMsY0FBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEMsZUFBUyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7OztBQUczQyxVQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzs7QUFHeEUsV0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUVuRCxVQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNuQixVQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUNyQixVQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUN6QixVQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQzs7O0FBR3pCLFVBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDOztBQUVqQyxVQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7OztBQUlmLFVBQUksTUFBTSxHQUFHLENBQUEsWUFBVTtBQUNyQixnQkFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2xCLGdCQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQzs7QUFFL0IsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsWUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzdCLDZCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQy9CLENBQUEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDYixZQUFNLEVBQUUsQ0FBQzs7QUFFVCxhQUFPLElBQUksQ0FBQztLQUViOzs7V0FFSyxnQkFBQyxRQUFRLEVBQUU7OztBQUNmLFVBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3RCxVQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUQsVUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQUMsS0FBSyxFQUFLOztBQUM5RCxhQUFLLENBQUMsT0FBTyxHQUFHLFVBQUMsU0FBUyxFQUFLO0FBQzdCLGNBQUcsT0FBTyxPQUFLLFFBQVEsS0FBSyxVQUFVLEVBQUU7QUFDdEMsaUJBQUssQ0FBQyxJQUFJLElBQUksT0FBSyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQ3pDO1NBQ0YsQ0FBQzs7OztPQUlILENBQUMsQ0FBQztBQUNILFVBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1QixVQUFHLE9BQU8sUUFBUSxLQUFLLFVBQVUsRUFBRTtBQUNqQyxnQkFBUSxFQUFFLENBQUM7T0FDWjs7QUFFRCxhQUFPLElBQUksQ0FBQztLQUNiOzs7OztXQXdGVyx3QkFBRzs7OztBQUViLFVBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssRUFBSztBQUN0QyxZQUFJLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxhQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFLO0FBQ2pELGdCQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBSyxLQUFLLEdBQUMsRUFBRSxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQzVHLENBQUMsQ0FBQztBQUNELGFBQUssQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztPQUNyQyxDQUFDLENBQUM7O0FBRUgsYUFBTyxJQUFJLENBQUM7S0FDYjs7O1dBRUssa0JBQUc7QUFDUCxVQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ2hEOzs7Ozs7O1dBS0ksaUJBQUc7QUFDTixVQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDekMsVUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVMsS0FBSyxFQUFFO0FBQzNDLGFBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDekIsYUFBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUMxQixDQUFDLENBQUM7QUFDSCxVQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRS9CLGFBQU8sSUFBSSxDQUFDO0tBQ2I7Ozs7Ozs7O1dBTWMseUJBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRTs7O0FBQ3RDLFVBQUksS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEIsV0FBSyxDQUFDLE1BQU0sR0FBRyxZQUFNO0FBQ25CLG9CQUFZLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkQsZUFBSyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzdCLGVBQUssS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO09BQy9CLENBQUM7QUFDRixXQUFLLENBQUMsR0FBRyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7O0FBRWhDLGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztXQUVNLGlCQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDckIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLFVBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssR0FBRyxNQUFNLENBQUM7QUFDcEMsVUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBQ3JDLGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztXQUVLLGdCQUFDLFFBQVEsRUFBRTs7O0FBQ2YsVUFBSSxXQUFXLEdBQUcsUUFBUSxJQUFJLElBQUksR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ3pDLFVBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUNqQixVQUFJLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDaEIsVUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsVUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLFVBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUN0QyxVQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNuQyxVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDekMsVUFBSSxPQUFPLEdBQUcsU0FBVixPQUFPLEdBQVM7QUFDbEIsWUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLFdBQVcsR0FBRyxDQUFDLENBQUM7QUFDaEMsU0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN4QixlQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM1RCxZQUFJLENBQUMsR0FBRyxVQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQztBQUM1QyxlQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0IsWUFBRyxLQUFLLEdBQUcsV0FBVyxFQUFFO0FBQ3RCLGVBQUssRUFBRSxDQUFDO0FBQ1IsZ0JBQU0sQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN2QztPQUNGLENBQUE7QUFDRCxZQUFNLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdEMsVUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7S0FDaEM7OztXQWxLb0Isd0JBQUMsTUFBTSxFQUFFLGFBQWEsRUFBRTtBQUMzQyxVQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDbEIsbUJBQWEsR0FBRyxBQUFDLGFBQWEsR0FBRyxDQUFDLEdBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQztBQUN4RCxtQkFBYSxHQUFHLEFBQUMsYUFBYSxHQUFHLENBQUMsR0FBSyxhQUFhLEdBQUcsQ0FBQyxHQUFJLGFBQWEsQ0FBQztBQUMxRSxXQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUksQ0FBQyxHQUFHLGFBQWEsR0FBRyxDQUFDLEFBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3RELGdCQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDL0YsZ0JBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZ0JBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDO09BQ3JDO0FBQ0QsYUFBTyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDM0M7OztXQUVrQixzQkFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFO0FBQ2xDLFVBQUksYUFBYSxHQUFHLEVBQUUsR0FDcEIseUJBQXlCLEdBQ3pCLGVBQWUsR0FDZixvRkFBb0YsR0FDcEYsNEJBQTRCLEdBQzVCLEdBQUcsQ0FBQzs7QUFFTixVQUFJLGNBQWMsR0FBRyxFQUFFLEdBQ3JCLDRCQUE0QixHQUM1Qix3QkFBd0IsR0FDeEIseUJBQXlCLEdBQ3pCLGtCQUFrQixHQUNsQix1SEFBdUgsR0FDdkgsNkJBQTZCLEdBQzdCLGdDQUFnQzs7QUFFaEMsU0FBRyxDQUFDOztBQUVOLFVBQUksTUFBTSxHQUFHLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2xDLGNBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUMzQyxZQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7QUFHaEcsWUFBSSxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDekMscUJBQWEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ25DLHFCQUFhLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRCxxQkFBYSxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFDbkMscUJBQWEsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDOzs7QUFHckMsWUFBSSxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDO0FBQzNDLHNCQUFZLEVBQUUsYUFBYTtBQUMzQix3QkFBYyxFQUFFLGNBQWM7QUFDOUIsa0JBQVEsRUFBRTtBQUNSLG1CQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLEVBQUU7QUFDdkUsbUJBQU8sRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUNsQyxtQkFBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO1dBQ2pDO1NBQ0YsQ0FBQyxDQUFDOztBQUVILFlBQUksSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDeEQsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRXhCLGNBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDbEIsQ0FBQyxDQUFDO0FBQ0gsYUFBTyxNQUFNLENBQUM7S0FDZjs7O1dBRW1CLHVCQUFDLEtBQUssRUFBRTtBQUMxQixVQUFJLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7O0FBRTlELGFBQU8sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQzNCLGFBQU8sT0FBTyxDQUFDO0tBQ2hCOzs7OztXQUdzQiwwQkFBQyxLQUFLLEVBQUU7QUFDN0IsVUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLFlBQVk7VUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQzs7QUFFcEQsVUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQ2YsVUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDekIsWUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM5QyxZQUFJLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEdBQUksQ0FBQyxDQUFDO0FBQzFDLFlBQUksT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQSxHQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDMUMsWUFBSSxRQUFRLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQyxjQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLGNBQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakcsYUFBSyxHQUFHLE1BQU0sQ0FBQztPQUNoQjtBQUNELGFBQU8sS0FBSyxDQUFDO0tBQ2Q7OztTQS9MRyxNQUFNOzs7cUJBa1JHLE1BQU07Ozs7OztBQ3pSckIsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsZUFBZSxHQUFHLFVBQVMsVUFBVSxFQUFFLE1BQU0sRUFBRTtBQUNuRSxNQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFDdkIsTUFBSSxtQkFBbUIsR0FBRyxFQUFFLENBQUM7QUFDN0IsTUFBSSxRQUFRLENBQUM7QUFDYixNQUFJLGNBQWMsR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN6QyxNQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7O0FBRWpCLFdBQVMsZUFBZSxDQUFDLEtBQUssRUFBRTtBQUM5QixTQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRXZCLFFBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFFBQUksSUFBSSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0FBQzlDLFNBQUssQ0FBQyxDQUFDLEdBQUcsQUFBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQSxHQUFJLElBQUksQ0FBQyxLQUFLLEdBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM3RCxTQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUEsR0FBSSxJQUFJLENBQUMsTUFBTSxDQUFBLEFBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7QUFHOUQsaUJBQWEsQ0FBQyxPQUFPLENBQUMsVUFBUyxZQUFZLEVBQUU7QUFDM0MsVUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztBQUNqQyxVQUFJLE9BQU8sTUFBTSxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUU7QUFDNUMsY0FBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztPQUNsQztLQUNGLENBQUMsQ0FBQztBQUNILHVCQUFtQixHQUFHLGFBQWEsQ0FBQzs7QUFFcEMsWUFBUSxHQUFHLEtBQUssQ0FBQztBQUNqQixrQkFBYyxHQUFHLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUN0RDs7QUFFRCxXQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUU7QUFDNUIsU0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUV2QixRQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQyxRQUFJLElBQUksR0FBRyxVQUFVLENBQUMscUJBQXFCLEVBQUUsQ0FBQztBQUM5QyxTQUFLLENBQUMsQ0FBQyxHQUFHLEFBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBSyxHQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0QsU0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBLEdBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQSxBQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O0FBRzlELGlCQUFhLENBQUMsT0FBTyxDQUFDLFVBQVMsU0FBUyxFQUFFO0FBQ3hDLFVBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDOUIsVUFBSSxPQUFPLE1BQU0sQ0FBQyxTQUFTLEtBQUssVUFBVSxFQUFFO0FBQzFDLGNBQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDN0I7S0FDRixDQUFDLENBQUM7O0FBRUgsUUFBRyxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTs7QUFFckUseUJBQW1CLENBQUMsT0FBTyxDQUFDLFVBQVUsU0FBUyxFQUFFO0FBQy9DLFlBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDOUIsWUFBSSxPQUFPLE1BQU0sQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUFFO0FBQ3hDLGNBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsRUFBRTtBQUNuQyxrQkFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztXQUMzQjtTQUNGO09BQ0YsQ0FBQyxDQUFDO0tBQ0o7O0FBRUQsWUFBUSxHQUFHLEtBQUssQ0FBQztHQUNsQjs7QUFFRCxXQUFTLGVBQWUsQ0FBQyxLQUFLLEVBQUU7QUFDOUIsU0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUV2QixRQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQyxRQUFJLElBQUksR0FBRyxVQUFVLENBQUMscUJBQXFCLEVBQUUsQ0FBQztBQUM5QyxTQUFLLENBQUMsQ0FBQyxHQUFHLEFBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBSyxHQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0QsU0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBLEdBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQSxBQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5RCxXQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUVuQixRQUFJLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUN0QyxhQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQzs7QUFFdkMsUUFBSSxVQUFVLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbEUsY0FBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7OztBQUd0QixjQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsU0FBUyxFQUFFO0FBQ3RDLFVBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7O0FBRTlCLFVBQUksT0FBTyxNQUFNLENBQUMsV0FBVyxLQUFLLFVBQVUsRUFBRTtBQUM1QyxjQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO09BQy9COzs7QUFHRCxVQUFJLE9BQU8sTUFBTSxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUU7QUFDNUMsWUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLEVBQUU7QUFDcEMsZ0JBQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDL0I7T0FDRjtLQUNGLENBQUMsQ0FBQzs7O0FBR0gsaUJBQWEsQ0FBQyxPQUFPLENBQUMsVUFBUyxZQUFZLEVBQUU7QUFDM0MsVUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztBQUNqQyxVQUFJLE9BQU8sTUFBTSxDQUFDLFVBQVUsS0FBSyxVQUFVLEVBQUU7QUFDM0MsWUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLEVBQUU7QUFDcEMsc0JBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQzlDO09BQ0Y7S0FDRixDQUFDLENBQUM7O0FBRUgsaUJBQWEsR0FBRyxVQUFVLENBQUM7QUFDM0IsWUFBUSxHQUFHLEtBQUssQ0FBQztHQUNsQjs7QUFFRCxXQUFTLEtBQUssQ0FBQyxVQUFVLEVBQUUsZUFBZSxFQUFFOzs7OztBQUsxQyxXQUFPLEFBQUMsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxJQUFNLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssZUFBZSxDQUFDLE1BQU0sQUFBQyxDQUFDO0dBQ2pHOztBQUVELFlBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDMUQsWUFBVSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUN0RCxZQUFVLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDOztBQUUxRCxPQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxZQUFXO0FBQ2xELFlBQVEsSUFBSSxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7R0FDdkMsQ0FBQztDQUVILENBQUM7Ozs7Ozs7eUJDeEhpQixjQUFjOzs7O0FBRWpDLENBQUMsWUFBWTs7QUFFWCxNQUFJLE1BQU0sQ0FBQzs7O0FBR1gsU0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQzdCLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxLQUFLLEVBQUU7QUFDakQsUUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLEtBQUssRUFBRSxRQUFRLEVBQUU7QUFDMUMsVUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2YsVUFBSSxHQUFHLEdBQUcsaUpBQWlKLENBQUM7QUFDNUosV0FBSyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdkQsV0FBSyxDQUFDO0FBQ0osV0FBRyxFQUFFLEdBQUcsR0FBRyxLQUFLO0FBQ2hCLGNBQU0sRUFBRSxLQUFLO09BQ2QsQ0FBQyxDQUNDLE9BQU8sQ0FBQyxVQUFVLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUNoRCxhQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsZUFBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuQixZQUFHLEtBQUssQ0FBQyxNQUFNLEtBQUssRUFBRSxFQUFFO0FBQ3RCLGtCQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDakI7T0FDRixDQUFDLENBRUQsS0FBSyxDQUFDLFVBQVUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQzlDLGFBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztPQUNwQyxDQUFDLENBQUM7QUFDTCxTQUFHLEdBQUcsMEpBQTBKLENBQUM7QUFDakssV0FBSyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0FBRXZELFdBQUssQ0FBQztBQUNKLFdBQUcsRUFBRSxHQUFHLEdBQUcsS0FBSztBQUNoQixjQUFNLEVBQUUsS0FBSztPQUNkLENBQUMsQ0FDQyxPQUFPLENBQUMsVUFBVSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDaEQsYUFBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLGVBQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkIsWUFBRyxLQUFLLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTtBQUN0QixrQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2pCO09BQ0YsQ0FBQyxDQUVELEtBQUssQ0FBQyxVQUFVLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUM5QyxhQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7T0FDcEMsQ0FBQyxDQUFDO0tBQ04sQ0FBQztHQUNILENBQUMsQ0FBQyxDQUNGLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxLQUFLLEVBQUU7QUFDakQsUUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLFFBQVEsRUFBRTtBQUNoQyxXQUFLLENBQUM7QUFDSixXQUFHLEVBQUUsa0JBQWtCOztBQUV2QixjQUFNLEVBQUUsS0FBSztPQUNkLENBQUMsQ0FDQyxPQUFPLENBQUMsVUFBVSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDaEQsWUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDNUIsZUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2IsTUFBTTtBQUNMLGtCQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDZjtPQUNGLENBQUMsQ0FFRCxLQUFLLENBQUMsVUFBVSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDOUMsYUFBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO09BQ3BDLENBQUMsQ0FBQztLQUNOLENBQUM7QUFDRixRQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsWUFBWSxFQUFFLFFBQVEsRUFBRTtBQUM5QyxXQUFLLENBQUM7QUFDSixXQUFHLEVBQUUsbUJBQW1CO0FBQ3hCLGNBQU0sRUFBRSxNQUFNO0FBQ2QsWUFBSSxFQUFFLFlBQVk7T0FDbkIsQ0FBQyxDQUNDLE9BQU8sQ0FBQyxVQUFVLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUNoRCxZQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUM1QixlQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDYixNQUFNO0FBQ0wsa0JBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUNmO09BQ0YsQ0FBQyxDQUVELEtBQUssQ0FBQyxVQUFVLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUM5QyxhQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7T0FDcEMsQ0FBQyxDQUFDO0tBQ04sQ0FBQztBQUNGLFFBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxJQUFJLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRTtBQUN6RCxXQUFLLENBQUM7QUFDSixXQUFHLEVBQUUsbUJBQW1CO0FBQ3hCLGNBQU0sRUFBRSxNQUFNO0FBQ2QsWUFBSSxFQUFFO0FBQ0osY0FBSSxFQUFFLElBQUk7QUFDVix5QkFBZSxFQUFFLGVBQWU7U0FDakM7T0FDRixDQUFDLENBQ0MsT0FBTyxDQUFDLFVBQVUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQ2hELFlBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQzVCLGVBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNiLE1BQU07QUFDTCxrQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQ2Y7T0FDRixDQUFDLENBRUQsS0FBSyxDQUFDLFVBQVUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQzlDLGFBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztPQUNwQyxDQUFDLENBQUM7S0FDTixDQUFDO0dBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRU4sU0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUNyQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsVUFBVSxNQUFNLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRTs7QUFFekcsZUFBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLElBQUksRUFBRTtBQUNqQyxZQUFNLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztBQUM1QixZQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUM3QyxVQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDbkMsVUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN4RCxZQUFNLEdBQUcsMkJBQVcsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxZQUFXO0FBQzVGLGNBQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNsQyxjQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7T0FDakIsQ0FBQyxDQUFDO0FBQ0gsWUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDdkIsWUFBTSxDQUFDLFFBQVEsR0FBRyxVQUFVLFlBQVksRUFBRTtBQUN4QyxZQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUU7QUFDdEIsZ0JBQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQzNCLGdCQUFNLENBQUMsVUFBVSxDQUFDLG1CQUFtQixHQUFHLFFBQVEsQ0FBQztBQUNqRCxnQkFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLGdCQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDL0IsZ0JBQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNoQiwyQkFBaUIsQ0FBQyxHQUFHLENBQUM7QUFDcEIscUJBQVMsRUFBRSxDQUFDO1dBQ2IsQ0FBQyxDQUFDO0FBQ0gsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDcEIsTUFBTTtBQUNMLGdCQUFNLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUMxQixnQkFBTSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsR0FBRyxPQUFPLENBQUM7QUFDaEQsZ0JBQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztBQUNyQyxnQkFBTSxDQUFDLG9CQUFvQixHQUFHLFlBQVksQ0FBQztBQUMzQyxnQkFBTSxDQUFDLHdCQUF3QixHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUM7QUFDcEQsZ0JBQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNoQyxnQkFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2hCLDJCQUFpQixDQUFDLEdBQUcsQ0FBQztBQUNwQiw2QkFBaUIsRUFBRSxNQUFNLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxHQUFHO0FBQ3JELDRCQUFnQixFQUFFLE9BQU87QUFDekIscUJBQVMsRUFBRSxDQUFDO1dBQ2IsQ0FBQyxDQUFDO0FBQ0gsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDcEI7T0FDRixDQUFDO0tBQ0gsQ0FBQyxDQUFDOztBQUVILFVBQU0sQ0FBQyxVQUFVLEdBQUc7QUFDbEIsVUFBSSxFQUFFLEtBQUs7QUFDWCxnQkFBVSxFQUFFLElBQUk7QUFDaEIseUJBQW1CLEVBQUUsUUFBUTtBQUM3QixnQkFBVSxFQUFFLElBQUk7QUFDaEIsb0JBQWMsRUFBRSxLQUFLO0FBQ3JCLGlCQUFXLEVBQUUsS0FBSztBQUNsQixXQUFLLEVBQUUsSUFBSTtBQUNYLGFBQU8sRUFBRSxJQUFJO0FBQ2IsY0FBUSxFQUFFLEtBQUs7S0FDaEIsQ0FBQzs7QUFFRixVQUFNLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNsQixVQUFNLENBQUMsMEJBQTBCLEdBQUcsUUFBUSxDQUFDOztBQUU3QyxVQUFNLENBQUMsTUFBTSxHQUFHLFlBQVk7QUFDMUIsWUFBTSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDbEIsaUJBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxVQUFVLEtBQUssRUFBRTtBQUNuRCxlQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ25CLGNBQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO09BQ3RCLENBQUMsQ0FBQztLQUNKLENBQUM7QUFDRixVQUFNLENBQUMsTUFBTSxHQUFHLFVBQVUsSUFBSSxFQUFFO0FBQzlCLFlBQU0sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFlBQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN2QixZQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDckMsWUFBTSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQ3hDLFlBQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztLQUM1QixDQUFDO0FBQ0YsVUFBTSxDQUFDLE1BQU0sR0FBRyxZQUFZO0FBQzFCLGlCQUFXLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUMsRUFBRSxVQUFVLElBQUksRUFBRTtBQUN2RSxlQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVsQixjQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQyxjQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxZQUFZO0FBQ3ZDLGdCQUFNLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7QUFDL0IsZ0JBQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUNwQyxnQkFBTSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBQ3pDLGdCQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7U0FDcEMsQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0FBQ0gsWUFBTSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0tBQ3RDLENBQUM7QUFDRixVQUFNLENBQUMsUUFBUSxHQUFHLFlBQVk7QUFDNUIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUM3QyxpQkFBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxZQUFXO0FBQ2hHLGNBQU0sQ0FBQywwQkFBMEIsR0FBRyxXQUFXLENBQUM7QUFDaEQsY0FBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2hCLGNBQU0sQ0FBQyxVQUFVLENBQUMsWUFBVztBQUMzQixnQkFBTSxDQUFDLDBCQUEwQixHQUFHLFFBQVEsQ0FBQztBQUM3QyxnQkFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2pCLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDVixDQUFDLENBQUM7S0FDSixDQUFDO0FBQ0YsVUFBTSxDQUFDLGFBQWEsR0FBRyxZQUFZO0FBQ2pDLFlBQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0tBQzVCLENBQUM7QUFDRixVQUFNLENBQUMsY0FBYyxHQUFHLFlBQVk7QUFDbEMsWUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztLQUNsRCxDQUFDO0FBQ0YsVUFBTSxDQUFDLHlCQUF5QixHQUFHLFlBQVk7QUFDN0MsWUFBTSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLG1CQUFtQixJQUFJLFFBQVEsR0FBRyxPQUFPLEdBQUcsUUFBUSxDQUFDO0tBQ2hILENBQUM7QUFDRixVQUFNLENBQUMsWUFBWSxHQUFHLFlBQVk7QUFDaEMsWUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLFlBQU0sQ0FBQyxVQUFVLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztLQUMxQyxDQUFBO0dBQ0YsQ0FBQyxDQUFDLENBQUM7Q0FFUCxDQUFBLEVBQUcsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQGF1dGhvciBxaWFvIC8gaHR0cHM6Ly9naXRodWIuY29tL3FpYW9cclxuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIGEgY29udmV4IGh1bGwgZ2VuZXJhdG9yIHVzaW5nIHRoZSBpbmNyZW1lbnRhbCBtZXRob2QuIFxyXG4gKiBUaGUgY29tcGxleGl0eSBpcyBPKG5eMikgd2hlcmUgbiBpcyB0aGUgbnVtYmVyIG9mIHZlcnRpY2VzLlxyXG4gKiBPKG5sb2duKSBhbGdvcml0aG1zIGRvIGV4aXN0LCBidXQgdGhleSBhcmUgbXVjaCBtb3JlIGNvbXBsaWNhdGVkLlxyXG4gKlxyXG4gKiBCZW5jaG1hcms6IFxyXG4gKlxyXG4gKiAgUGxhdGZvcm06IENQVTogUDczNTAgQDIuMDBHSHogRW5naW5lOiBWOFxyXG4gKlxyXG4gKiAgTnVtIFZlcnRpY2VzXHRUaW1lKG1zKVxyXG4gKlxyXG4gKiAgICAgMTAgICAgICAgICAgIDFcclxuICogICAgIDIwICAgICAgICAgICAzXHJcbiAqICAgICAzMCAgICAgICAgICAgMTlcclxuICogICAgIDQwICAgICAgICAgICA0OFxyXG4gKiAgICAgNTAgICAgICAgICAgIDEwN1xyXG4gKi9cclxuXHJcblRIUkVFLkNvbnZleEdlb21ldHJ5ID0gZnVuY3Rpb24oIHZlcnRpY2VzICkge1xyXG5cclxuXHRUSFJFRS5HZW9tZXRyeS5jYWxsKCB0aGlzICk7XHJcblxyXG5cdHZhciBmYWNlcyA9IFsgWyAwLCAxLCAyIF0sIFsgMCwgMiwgMSBdIF07IFxyXG5cclxuXHRmb3IgKCB2YXIgaSA9IDM7IGkgPCB2ZXJ0aWNlcy5sZW5ndGg7IGkgKysgKSB7XHJcblxyXG5cdFx0YWRkUG9pbnQoIGkgKTtcclxuXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYWRkUG9pbnQoIHZlcnRleElkICkge1xyXG5cclxuXHRcdHZhciB2ZXJ0ZXggPSB2ZXJ0aWNlc1sgdmVydGV4SWQgXS5jbG9uZSgpO1xyXG5cclxuXHRcdHZhciBtYWcgPSB2ZXJ0ZXgubGVuZ3RoKCk7XHJcblx0XHR2ZXJ0ZXgueCArPSBtYWcgKiByYW5kb21PZmZzZXQoKTtcclxuXHRcdHZlcnRleC55ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xyXG5cdFx0dmVydGV4LnogKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XHJcblxyXG5cdFx0dmFyIGhvbGUgPSBbXTtcclxuXHJcblx0XHRmb3IgKCB2YXIgZiA9IDA7IGYgPCBmYWNlcy5sZW5ndGg7ICkge1xyXG5cclxuXHRcdFx0dmFyIGZhY2UgPSBmYWNlc1sgZiBdO1xyXG5cclxuXHRcdFx0Ly8gZm9yIGVhY2ggZmFjZSwgaWYgdGhlIHZlcnRleCBjYW4gc2VlIGl0LFxyXG5cdFx0XHQvLyB0aGVuIHdlIHRyeSB0byBhZGQgdGhlIGZhY2UncyBlZGdlcyBpbnRvIHRoZSBob2xlLlxyXG5cdFx0XHRpZiAoIHZpc2libGUoIGZhY2UsIHZlcnRleCApICkge1xyXG5cclxuXHRcdFx0XHRmb3IgKCB2YXIgZSA9IDA7IGUgPCAzOyBlICsrICkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBlZGdlID0gWyBmYWNlWyBlIF0sIGZhY2VbICggZSArIDEgKSAlIDMgXSBdO1xyXG5cdFx0XHRcdFx0dmFyIGJvdW5kYXJ5ID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0XHQvLyByZW1vdmUgZHVwbGljYXRlZCBlZGdlcy5cclxuXHRcdFx0XHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKCBlcXVhbEVkZ2UoIGhvbGVbIGggXSwgZWRnZSApICkge1xyXG5cclxuXHRcdFx0XHRcdFx0XHRob2xlWyBoIF0gPSBob2xlWyBob2xlLmxlbmd0aCAtIDEgXTtcclxuXHRcdFx0XHRcdFx0XHRob2xlLnBvcCgpO1xyXG5cdFx0XHRcdFx0XHRcdGJvdW5kYXJ5ID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGlmICggYm91bmRhcnkgKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRob2xlLnB1c2goIGVkZ2UgKTtcclxuXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly8gcmVtb3ZlIGZhY2VzWyBmIF1cclxuXHRcdFx0XHRmYWNlc1sgZiBdID0gZmFjZXNbIGZhY2VzLmxlbmd0aCAtIDEgXTtcclxuXHRcdFx0XHRmYWNlcy5wb3AoKTtcclxuXHJcblx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdC8vIG5vdCB2aXNpYmxlXHJcblxyXG5cdFx0XHRcdGYgKys7XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGNvbnN0cnVjdCB0aGUgbmV3IGZhY2VzIGZvcm1lZCBieSB0aGUgZWRnZXMgb2YgdGhlIGhvbGUgYW5kIHRoZSB2ZXJ0ZXhcclxuXHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xyXG5cclxuXHRcdFx0ZmFjZXMucHVzaCggWyBcclxuXHRcdFx0XHRob2xlWyBoIF1bIDAgXSxcclxuXHRcdFx0XHRob2xlWyBoIF1bIDEgXSxcclxuXHRcdFx0XHR2ZXJ0ZXhJZFxyXG5cdFx0XHRdICk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFdoZXRoZXIgdGhlIGZhY2UgaXMgdmlzaWJsZSBmcm9tIHRoZSB2ZXJ0ZXhcclxuXHQgKi9cclxuXHRmdW5jdGlvbiB2aXNpYmxlKCBmYWNlLCB2ZXJ0ZXggKSB7XHJcblxyXG5cdFx0dmFyIHZhID0gdmVydGljZXNbIGZhY2VbIDAgXSBdO1xyXG5cdFx0dmFyIHZiID0gdmVydGljZXNbIGZhY2VbIDEgXSBdO1xyXG5cdFx0dmFyIHZjID0gdmVydGljZXNbIGZhY2VbIDIgXSBdO1xyXG5cclxuXHRcdHZhciBuID0gbm9ybWFsKCB2YSwgdmIsIHZjICk7XHJcblxyXG5cdFx0Ly8gZGlzdGFuY2UgZnJvbSBmYWNlIHRvIG9yaWdpblxyXG5cdFx0dmFyIGRpc3QgPSBuLmRvdCggdmEgKTtcclxuXHJcblx0XHRyZXR1cm4gbi5kb3QoIHZlcnRleCApID49IGRpc3Q7IFxyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIEZhY2Ugbm9ybWFsXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gbm9ybWFsKCB2YSwgdmIsIHZjICkge1xyXG5cclxuXHRcdHZhciBjYiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XHJcblx0XHR2YXIgYWIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xyXG5cclxuXHRcdGNiLnN1YlZlY3RvcnMoIHZjLCB2YiApO1xyXG5cdFx0YWIuc3ViVmVjdG9ycyggdmEsIHZiICk7XHJcblx0XHRjYi5jcm9zcyggYWIgKTtcclxuXHJcblx0XHRjYi5ub3JtYWxpemUoKTtcclxuXHJcblx0XHRyZXR1cm4gY2I7XHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogRGV0ZWN0IHdoZXRoZXIgdHdvIGVkZ2VzIGFyZSBlcXVhbC5cclxuXHQgKiBOb3RlIHRoYXQgd2hlbiBjb25zdHJ1Y3RpbmcgdGhlIGNvbnZleCBodWxsLCB0d28gc2FtZSBlZGdlcyBjYW4gb25seVxyXG5cdCAqIGJlIG9mIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gZXF1YWxFZGdlKCBlYSwgZWIgKSB7XHJcblxyXG5cdFx0cmV0dXJuIGVhWyAwIF0gPT09IGViWyAxIF0gJiYgZWFbIDEgXSA9PT0gZWJbIDAgXTsgXHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogQ3JlYXRlIGEgcmFuZG9tIG9mZnNldCBiZXR3ZWVuIC0xZS02IGFuZCAxZS02LlxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHJhbmRvbU9mZnNldCgpIHtcclxuXHJcblx0XHRyZXR1cm4gKCBNYXRoLnJhbmRvbSgpIC0gMC41ICkgKiAyICogMWUtNjtcclxuXHJcblx0fVxyXG5cclxuXHJcblx0LyoqXHJcblx0ICogWFhYOiBOb3Qgc3VyZSBpZiB0aGlzIGlzIHRoZSBjb3JyZWN0IGFwcHJvYWNoLiBOZWVkIHNvbWVvbmUgdG8gcmV2aWV3LlxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHZlcnRleFV2KCB2ZXJ0ZXggKSB7XHJcblxyXG5cdFx0dmFyIG1hZyA9IHZlcnRleC5sZW5ndGgoKTtcclxuXHRcdHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMiggdmVydGV4LnggLyBtYWcsIHZlcnRleC55IC8gbWFnICk7XHJcblxyXG5cdH1cclxuXHJcblx0Ly8gUHVzaCB2ZXJ0aWNlcyBpbnRvIGB0aGlzLnZlcnRpY2VzYCwgc2tpcHBpbmcgdGhvc2UgaW5zaWRlIHRoZSBodWxsXHJcblx0dmFyIGlkID0gMDtcclxuXHR2YXIgbmV3SWQgPSBuZXcgQXJyYXkoIHZlcnRpY2VzLmxlbmd0aCApOyAvLyBtYXAgZnJvbSBvbGQgdmVydGV4IGlkIHRvIG5ldyBpZFxyXG5cclxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkgKysgKSB7XHJcblxyXG5cdFx0IHZhciBmYWNlID0gZmFjZXNbIGkgXTtcclxuXHJcblx0XHQgZm9yICggdmFyIGogPSAwOyBqIDwgMzsgaiArKyApIHtcclxuXHJcblx0XHRcdGlmICggbmV3SWRbIGZhY2VbIGogXSBdID09PSB1bmRlZmluZWQgKSB7XHJcblxyXG5cdFx0XHRcdG5ld0lkWyBmYWNlWyBqIF0gXSA9IGlkICsrO1xyXG5cdFx0XHRcdHRoaXMudmVydGljZXMucHVzaCggdmVydGljZXNbIGZhY2VbIGogXSBdICk7XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmYWNlWyBqIF0gPSBuZXdJZFsgZmFjZVsgaiBdIF07XHJcblxyXG5cdFx0IH1cclxuXHJcblx0fVxyXG5cclxuXHQvLyBDb252ZXJ0IGZhY2VzIGludG8gaW5zdGFuY2VzIG9mIFRIUkVFLkZhY2UzXHJcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgZmFjZXMubGVuZ3RoOyBpICsrICkge1xyXG5cclxuXHRcdHRoaXMuZmFjZXMucHVzaCggbmV3IFRIUkVFLkZhY2UzKCBcclxuXHRcdFx0XHRmYWNlc1sgaSBdWyAwIF0sXHJcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMSBdLFxyXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDIgXVxyXG5cdFx0KSApO1xyXG5cclxuXHR9XHJcblxyXG5cdC8vIENvbXB1dGUgVVZzXHJcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5mYWNlcy5sZW5ndGg7IGkgKysgKSB7XHJcblxyXG5cdFx0dmFyIGZhY2UgPSB0aGlzLmZhY2VzWyBpIF07XHJcblxyXG5cdFx0dGhpcy5mYWNlVmVydGV4VXZzWyAwIF0ucHVzaCggW1xyXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5hIF0gKSxcclxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYiBdICksXHJcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmMgXSApXHJcblx0XHRdICk7XHJcblxyXG5cdH1cclxuXHJcblx0dGhpcy5jb21wdXRlRmFjZU5vcm1hbHMoKTtcclxuXHR0aGlzLmNvbXB1dGVWZXJ0ZXhOb3JtYWxzKCk7XHJcblxyXG59O1xyXG5cclxuVEhSRUUuQ29udmV4R2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVEhSRUUuR2VvbWV0cnkucHJvdG90eXBlICk7XHJcblRIUkVFLkNvbnZleEdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRIUkVFLkNvbnZleEdlb21ldHJ5O1xyXG4iLCJpbXBvcnQgJy4vdGhyZWUtbW91c2UtZXZlbnQuZXM2JztcclxuaW1wb3J0ICcuL0NvbnZleEdlb21ldHJ5JztcclxuXHJcblRIUkVFLlZlY3RvcjMucHJvdG90eXBlLm1peCA9IGZ1bmN0aW9uKHksIGEpIHtcclxuICByZXR1cm4gdGhpcy5tdWx0aXBseVNjYWxhcigxIC0gYSkuYWRkKHkuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihhKSlcclxufTtcclxuXHJcbmNsYXNzIEVtYnJ5byB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGRhdGEsIGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAvLyogZGF0YSA6IGFycmF5IG9mIGNvbnRyaWJ1dGlvbnNcclxuICAgIC8vKiBjb250cmlidXRpb25cclxuICAgIC8vKiB7XHJcbiAgICAvLyogICBpbWFnZTogRE9NSW1hZ2VcclxuICAgIC8vKiAgIHRleHQ6IFN0cmluZ1xyXG4gICAgLy8qIH1cclxuICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB0aGlzLmNyZWF0ZUNhbGxiYWNrID0gY2FsbGJhY2s7XHJcblxyXG4gICAgLy/jg4bjgq/jgrnjg4Hjg6Pjga7kvZzmiJBcclxuICAgIHZhciBsb2FkZWROdW0gPSAwO1xyXG4gICAgZGF0YS5mb3JFYWNoKChjb250cmlidXRpb24sIGluZGV4KSA9PiB7XHJcbiAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgdmFyIHRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XHJcbiAgICAgICAgdGhpcy5kYXRhW2luZGV4XS50ZXh0dXJlID0gdGV4dHVyZTtcclxuICAgICAgICBsb2FkZWROdW0rKztcclxuICAgICAgICBpZihsb2FkZWROdW0gPT09IGRhdGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICB0aGlzLmluaXRpYWxpemUoY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIGltYWdlLnNyYyA9IGNvbnRyaWJ1dGlvbi5iYXNlNjQ7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgfVxyXG5cclxuICBpbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCkge1xyXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB0aGlzLmlzSGlkZGVuID0gZmFsc2U7XHJcblxyXG4gICAgLy9pbml0IHNjZW5lXHJcbiAgICB2YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcclxuXHJcbiAgICAvL2luaXQgY2FtZXJhXHJcbiAgICB2YXIgZm92ID0gNjA7XHJcbiAgICB2YXIgYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XHJcbiAgICB2YXIgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0KTtcclxuICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgKGhlaWdodCAvIDIpIC8gTWF0aC50YW4oKGZvdiAqIE1hdGguUEkgLyAxODApIC8gMikpO1xyXG4gICAgY2FtZXJhLmxvb2tBdChuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKSk7XHJcbiAgICBzY2VuZS5hZGQoY2FtZXJhKTtcclxuXHJcbiAgICAvL2luaXQgcmVuZGVyZXJcclxuICAgIHZhciByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHthbHBoYTogdHJ1ZSwgYW50aWFsaWFzOiB0cnVlfSk7XHJcbiAgICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGNjY2NjYywgMCk7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgLy9pbml0IGNvbnRyb2xzXHJcbiAgICB2YXIgY29udHJvbHMgPSBuZXcgVEhSRUUuVHJhY2tiYWxsQ29udHJvbHMoY2FtZXJhLCByZW5kZXJlci5kb21FbGVtZW50KTtcclxuXHJcbiAgICAvL3dhdGNoIG1vdXNlIGV2ZW50c1xyXG4gICAgc2NlbmUud2F0Y2hNb3VzZUV2ZW50KHJlbmRlcmVyLmRvbUVsZW1lbnQsIGNhbWVyYSk7XHJcblxyXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xyXG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XHJcbiAgICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XHJcbiAgICB0aGlzLmNvbnRyb2xzID0gY29udHJvbHM7XHJcblxyXG4gICAgLy/nlJ/miJBcclxuICAgIHRoaXMuY3JlYXRlKHRoaXMuY3JlYXRlQ2FsbGJhY2spO1xyXG5cclxuICAgIHRoaXMuY291bnQgPSAwO1xyXG5cclxuICAgIC8vY29uc29sZS5sb2codGhpcy5mcmFtZXMpO1xyXG5cclxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbigpe1xyXG4gICAgICBjb250cm9scy51cGRhdGUoKTtcclxuICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xyXG4gICAgICAvL3NjZW5lLmhhbmRsZU1vdXNlRXZlbnQoKTtcclxuICAgICAgdGhpcy5jb3VudCsrO1xyXG4gICAgICB0aGlzLm1vdmVWZXJ0aWNlcygpLnJvdGF0ZSgpO1xyXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIHVwZGF0ZSgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG5cclxuICB9XHJcblxyXG4gIGNyZWF0ZShjYWxsYmFjaykge1xyXG4gICAgdGhpcy5nZW9tZXRyeSA9IEVtYnJ5by5jcmVhdGVHZW9tZXRyeSgxMDAsIHRoaXMuZGF0YS5sZW5ndGgpO1xyXG4gICAgdGhpcy5mcmFtZXMgPSBFbWJyeW8uY3JlYXRlRnJhbWVzKHRoaXMuZ2VvbWV0cnksIHRoaXMuZGF0YSk7XHJcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbiAmJiB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4gey8v44Oe44Km44K544Kk44OZ44Oz44OI44Gu6Kit5a6aXHJcbiAgICAgIGZyYW1lLm9uY2xpY2sgPSAoaW50ZXJzZWN0KSA9PiB7XHJcbiAgICAgICAgaWYodHlwZW9mIHRoaXMub25zZWxlY3QgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIGZyYW1lLmRhdGEgJiYgdGhpcy5vbnNlbGVjdChmcmFtZS5kYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIC8vZnJhbWUub25tb3VzZW92ZXIgPSAoaW50ZXJzZWN0KSA9PiB7XHJcbiAgICAgIC8vICBpbnRlcnNlY3QuZmFjZS5tb3VzZW9uID0gdHJ1ZTtcclxuICAgICAgLy99O1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLmZyYW1lcyk7XHJcbiAgICBpZih0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgY2FsbGJhY2soKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8v5LiJ6KeS44Gu6Z2i44Gn5qeL5oiQ44GV44KM44KL5aSa6Z2i5L2T44Gu5L2c5oiQXHJcbiAgc3RhdGljIGNyZWF0ZUdlb21ldHJ5KHJhZGl1cywgc3VyZmFjZU51bWJlcikge1xyXG4gICAgdmFyIHZlcnRpY2VzID0gW107XHJcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgPCA0KSA/IDQgOiBzdXJmYWNlTnVtYmVyOy8v77yU5Lul5LiL44Gv5LiN5Y+vXHJcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgJiAxKSA/IChzdXJmYWNlTnVtYmVyICsgMSkgOiBzdXJmYWNlTnVtYmVyOy8v5aWH5pWw44Gv5LiN5Y+vKOOCiOOCiuWkp+OBjeOBhOWBtuaVsOOBq+ebtOOBmSlcclxuICAgIGZvcih2YXIgaSA9IDAsIGwgPSAoMiArIHN1cmZhY2VOdW1iZXIgLyAyKTsgaSA8IGw7IGkrKykge1xyXG4gICAgICB2ZXJ0aWNlc1tpXSA9IG5ldyBUSFJFRS5WZWN0b3IzKE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUpOy8v55CD54q244Gr44Op44Oz44OA44Og44Gr54K544KS5omT44GkXHJcbiAgICAgIHZlcnRpY2VzW2ldLnNldExlbmd0aChyYWRpdXMpO1xyXG4gICAgICB2ZXJ0aWNlc1tpXS5vcmlnaW5hbExlbmd0aCA9IHJhZGl1cztcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgVEhSRUUuQ29udmV4R2VvbWV0cnkodmVydGljZXMpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGNyZWF0ZUZyYW1lcyhnZW9tZXRyeSwgZGF0YSkge1xyXG4gICAgdmFyIHZlcnRleHRTaGFkZXIgPSAnJyArXHJcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xyXG4gICAgICAndm9pZCBtYWluKCkgeycgK1xyXG4gICAgICAnICBnbF9Qb3NpdGlvbiA9IHByb2plY3Rpb25NYXRyaXggKiB2aWV3TWF0cml4ICogbW9kZWxNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLCAxLjApOycgK1xyXG4gICAgICAnICB2UG9zaXRpb24gPSBnbF9Qb3NpdGlvbjsnICtcclxuICAgICAgJ30nO1xyXG5cclxuICAgIHZhciBmcmFnbWVudFNoYWRlciA9ICcnICtcclxuICAgICAgJ3VuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7JyArXHJcbiAgICAgICd1bmlmb3JtIGZsb2F0IG9wYWNpdHk7JyArXHJcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xyXG4gICAgICAndm9pZCBtYWluKHZvaWQpeycgK1xyXG4gICAgICAnICB2ZWM0IHRleHR1cmVDb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB2ZWMyKCgxLjAgKyB2UG9zaXRpb24ueCAvIDIxMC4wKSAvIDIuMCwgKDEuMCArIHZQb3NpdGlvbi55IC8gMjEwLjApIC8gMi4wKSk7JyArXHJcbiAgICAgICcgIHRleHR1cmVDb2xvci53ID0gb3BhY2l0eTsnICtcclxuICAgICAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZUNvbG9yOycgK1xyXG4gICAgICAvLycgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCh2UG9zaXRpb24ueCAvIDgwMC4wICsgMS4wKSAvIDIuMCwgKHZQb3NpdGlvbi55IC8gODAwLjAgKyAxLjApIC8gMi4wLCAwLCAwKTsnICtcclxuICAgICAgJ30nO1xyXG5cclxuICAgIHZhciBmcmFtZXMgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcclxuICAgIGdlb21ldHJ5LmZhY2VzLmZvckVhY2goZnVuY3Rpb24oZmFjZSwgaW5kZXgpIHtcclxuICAgICAgdmFyIGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdLCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXSwgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XHJcblxyXG4gICAgICAvL2NyZWF0ZSBnZW9tZXRyeVxyXG4gICAgICB2YXIgZnJhbWVHZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xyXG4gICAgICBmcmFtZUdlb21ldHJ5LnZlcnRpY2VzID0gW2EsIGIsIGNdO1xyXG4gICAgICBmcmFtZUdlb21ldHJ5LmZhY2VzID0gW25ldyBUSFJFRS5GYWNlMygwLCAxLCAyKV07XHJcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XHJcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcclxuXHJcbiAgICAgIC8vY3JlYXRlIG1hdGVyaWFsXHJcbiAgICAgIHZhciBmcmFtZU1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcclxuICAgICAgICB2ZXJ0ZXhTaGFkZXI6IHZlcnRleHRTaGFkZXIsXHJcbiAgICAgICAgZnJhZ21lbnRTaGFkZXI6IGZyYWdtZW50U2hhZGVyLFxyXG4gICAgICAgIHVuaWZvcm1zOiB7XHJcbiAgICAgICAgICB0ZXh0dXJlOiB7IHR5cGU6IFwidFwiLCB2YWx1ZTogZGF0YVtpbmRleF0gPyBkYXRhW2luZGV4XS50ZXh0dXJlIDogbnVsbCB9LFxyXG4gICAgICAgICAgb3BhY2l0eTogeyB0eXBlOiBcImZcIiwgdmFsdWU6IDEuMCB9LFxyXG4gICAgICAgICAgb2Zmc2V0WTogeyB0eXBlOiBcImZcIiwgdmFsdWU6IDAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGZyYW1lR2VvbWV0cnksIGZyYW1lTWF0ZXJpYWwpO1xyXG4gICAgICBtZXNoLmRhdGEgPSBkYXRhW2luZGV4XTtcclxuXHJcbiAgICAgIGZyYW1lcy5hZGQobWVzaCk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBmcmFtZXM7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgY3JlYXRlVGV4dHVyZShpbWFnZSkge1xyXG4gICAgdmFyIHRleHR1cmUgPSBuZXcgVEhSRUUuVGV4dHVyZSh0aGlzLmdldFN1aXRhYmxlSW1hZ2UoaW1hZ2UpKTtcclxuICAgIC8vdGV4dHVyZS5tYWdGaWx0ZXIgPSB0ZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XHJcbiAgICB0ZXh0dXJlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcclxuICAgIHJldHVybiB0ZXh0dXJlO1xyXG4gIH1cclxuXHJcbiAgLy/nlLvlg4/jgrXjgqTjgrrjgpLoqr/mlbRcclxuICBzdGF0aWMgZ2V0U3VpdGFibGVJbWFnZShpbWFnZSkge1xyXG4gICAgdmFyIHcgPSBpbWFnZS5uYXR1cmFsV2lkdGgsIGggPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xyXG4gICAgLy92YXIgc2l6ZSA9IE1hdGgucG93KDIsIE1hdGgubG9nKE1hdGgubWluKHcsIGgpKSAvIE1hdGguTE4yIHwgMCk7IC8vIGxhcmdlc3QgMl5uIGludGVnZXIgdGhhdCBkb2VzIG5vdCBleGNlZWRcclxuICAgIHZhciBzaXplID0gMTI4O1xyXG4gICAgaWYgKHcgIT09IGggfHwgdyAhPT0gc2l6ZSkge1xyXG4gICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgIHZhciBvZmZzZXRYID0gaCAvIHcgPiAxID8gMCA6ICh3IC0gaCkgLyAyO1xyXG4gICAgICB2YXIgb2Zmc2V0WSA9IGggLyB3ID4gMSA/IChoIC0gdykgLyAyIDogMDtcclxuICAgICAgdmFyIGNsaXBTaXplID0gaCAvIHcgPiAxID8gdyA6IGg7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMud2lkdGggPSBzaXplO1xyXG4gICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoaW1hZ2UsIG9mZnNldFgsIG9mZnNldFksIGNsaXBTaXplLCBjbGlwU2l6ZSwgMCwgMCwgc2l6ZSwgc2l6ZSk7XHJcbiAgICAgIGltYWdlID0gY2FudmFzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGltYWdlO1xyXG4gIH1cclxuXHJcbiAgbW92ZVZlcnRpY2VzKCkge1xyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLmZyYW1lcy5jaGlsZHJlblswXS5nZW9tZXRyeS52ZXJ0aWNlc1swXSk7XHJcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4ge1xyXG4gICAgICB2YXIgZmFjZSA9IGZyYW1lLmdlb21ldHJ5LmZhY2VzWzBdO1xyXG4gICAgICBmcmFtZS5nZW9tZXRyeS52ZXJ0aWNlcy5mb3JFYWNoKCh2ZXJ0ZXgsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgdmVydGV4Lm1peChmYWNlLm5vcm1hbCwgMC4xKS5zZXRMZW5ndGgodmVydGV4Lm9yaWdpbmFsTGVuZ3RoICsgNSAqIE1hdGguY29zKHRoaXMuY291bnQvMjAgKyBpbmRleCAqIDEwKSk7XHJcbiAgICB9KTtcclxuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXNOZWVkVXBkYXRlID0gdHJ1ZTtcclxuICAgICAgZnJhbWUuZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHJvdGF0ZSgpIHtcclxuICAgIHRoaXMuZnJhbWVzLnJvdGF0aW9uLnNldCgwLCB0aGlzLmNvdW50LzUwMCwgMCk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgdGhyZWUuanPjgqrjg5bjgrjjgqfjgq/jg4jjga7liYrpmaRcclxuICAgKi9cclxuICBjbGVhcigpIHtcclxuICAgIHRoaXMuZ2VvbWV0cnkgJiYgdGhpcy5nZW9tZXRyeS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGZyYW1lKSB7XHJcbiAgICAgIGZyYW1lLmdlb21ldHJ5LmRpc3Bvc2UoKTtcclxuICAgICAgZnJhbWUubWF0ZXJpYWwuZGlzcG9zZSgpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnNjZW5lLnJlbW92ZSh0aGlzLmZyYW1lcyk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgY29udHJpYnV0aW9u44Gu6L+95YqgXHJcbiAgICBAcGFyYW0gY29udHJpYnV0aW9uIHtPYmplY3R9IOaKleeov1xyXG4gICAqL1xyXG4gIGFkZENvbnRyaWJ1dGlvbihjb250cmlidXRpb24sIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgY29udHJpYnV0aW9uLnRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XHJcbiAgICAgIHRoaXMuZGF0YS5wdXNoKGNvbnRyaWJ1dGlvbik7XHJcbiAgICAgIHRoaXMuY2xlYXIoKS5jcmVhdGUoY2FsbGJhY2spOy8v44Oq44K744OD44OIXHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gY29udHJpYnV0aW9uLmJhc2U2NDtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHNldFNpemUod2lkdGgsIGhlaWdodCkge1xyXG4gICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgdGhpcy5jYW1lcmEuYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XHJcbiAgICB0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgICBcclxuICB0b2dnbGUoZHVyYXRpb24pIHtcclxuICAgIHZhciBUT1RBTF9DT1VOVCA9IGR1cmF0aW9uIC8gKDEwMDAgLyA2MCk7XHJcbiAgICB2YXIgT0ZGU0VUID0gMjAwO1xyXG4gICAgdmFyIFNDQUxFID0gMC42O1xyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHZhciBzdGFydFkgPSB0aGlzLmZyYW1lcy5wb3NpdGlvbi55O1xyXG4gICAgdmFyIGVuZFkgPSB0aGlzLmlzSGlkZGVuID8gMCA6IE9GRlNFVDtcclxuICAgIHZhciBzdGFydFNjYWxlID0gdGhpcy5mcmFtZXMuc2NhbGU7XHJcbiAgICB2YXIgZW5kU2NhbGUgPSB0aGlzLmlzSGlkZGVuID8gMSA6IFNDQUxFO1xyXG4gICAgdmFyIGFuaW1hdGUgPSAoKSA9PiB7XHJcbiAgICAgIHZhciBuID0gY291bnQgLyBUT1RBTF9DT1VOVCAtIDE7XHJcbiAgICAgIG4gPSBNYXRoLnBvdyhuICwgNSkgKyAxO1xyXG4gICAgICB0aGlzLmZyYW1lcy5wb3NpdGlvbi5zZXQoMCwgc3RhcnRZICogKDEgLSBuKSArIGVuZFkgKiBuLCAwKTtcclxuICAgICAgdmFyIHMgPSBzdGFydFNjYWxlICogKDEgLSBuKSArIGVuZFNjYWxlICogbjtcclxuICAgICAgdGhpcy5mcmFtZXMuc2NhbGUuc2V0KHMsIHMsIHMpO1xyXG4gICAgICBpZihjb3VudCA8IFRPVEFMX0NPVU5UKSB7XHJcbiAgICAgICAgY291bnQrKztcclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xyXG4gICAgdGhpcy5pc0hpZGRlbiA9ICF0aGlzLmlzSGlkZGVuO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVtYnJ5bzsiLCJUSFJFRS5TY2VuZS5wcm90b3R5cGUud2F0Y2hNb3VzZUV2ZW50ID0gZnVuY3Rpb24oZG9tRWxlbWVudCwgY2FtZXJhKSB7XHJcbiAgdmFyIHByZUludGVyc2VjdHMgPSBbXTtcclxuICB2YXIgbW91c2VEb3duSW50ZXJzZWN0cyA9IFtdO1xyXG4gIHZhciBwcmVFdmVudDtcclxuICB2YXIgbW91c2VEb3duUG9pbnQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xyXG4gIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlRG93bihldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xyXG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgbW91c2UueCA9ICgoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCkgLyByZWN0LndpZHRoKSAqIDIgLSAxO1xyXG4gICAgbW91c2UueSA9IC0oKGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCkgLyByZWN0LmhlaWdodCkgKiAyICsgMTtcclxuXHJcbiAgICAvL29ubW91c2Vkb3duXHJcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24ocHJlSW50ZXJzZWN0KSB7XHJcbiAgICAgIHZhciBvYmplY3QgPSBwcmVJbnRlcnNlY3Qub2JqZWN0O1xyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlZG93biA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIG9iamVjdC5vbm1vdXNlZG93bihwcmVJbnRlcnNlY3QpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIG1vdXNlRG93bkludGVyc2VjdHMgPSBwcmVJbnRlcnNlY3RzO1xyXG5cclxuICAgIHByZUV2ZW50ID0gZXZlbnQ7XHJcbiAgICBtb3VzZURvd25Qb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IyKG1vdXNlLngsIG1vdXNlLnkpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VVcChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xyXG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgbW91c2UueCA9ICgoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCkgLyByZWN0LndpZHRoKSAqIDIgLSAxO1xyXG4gICAgbW91c2UueSA9IC0oKGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCkgLyByZWN0LmhlaWdodCkgKiAyICsgMTtcclxuXHJcbiAgICAvL29ubW91c2V1cFxyXG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKGludGVyc2VjdCkge1xyXG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcclxuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZXVwID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgb2JqZWN0Lm9ubW91c2V1cChpbnRlcnNlY3QpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZihtb3VzZURvd25Qb2ludC5kaXN0YW5jZVRvKG5ldyBUSFJFRS5WZWN0b3IyKG1vdXNlLngsIG1vdXNlLnkpKSA8IDUpIHtcclxuICAgICAgLy9vbmNsaWNrXHJcbiAgICAgIG1vdXNlRG93bkludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25jbGljayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgaWYgKGV4aXN0KHByZUludGVyc2VjdHMsIGludGVyc2VjdCkpIHtcclxuICAgICAgICAgICAgb2JqZWN0Lm9uY2xpY2soaW50ZXJzZWN0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByZUV2ZW50ID0gZXZlbnQ7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcclxuICAgIHZhciByZWN0ID0gZG9tRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgIG1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQpIC8gcmVjdC53aWR0aCkgKiAyIC0gMTtcclxuICAgIG1vdXNlLnkgPSAtKChldmVudC5jbGllbnRZIC0gcmVjdC50b3ApIC8gcmVjdC5oZWlnaHQpICogMiArIDE7XHJcbiAgICBjb25zb2xlLmxvZyhtb3VzZSk7XHJcblxyXG4gICAgdmFyIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcclxuICAgIHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG1vdXNlLCBjYW1lcmEpO1xyXG5cclxuICAgIHZhciBpbnRlcnNlY3RzID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMoX3RoaXMuY2hpbGRyZW4sIHRydWUpO1xyXG4gICAgaW50ZXJzZWN0cy5sZW5ndGggPSAxOy8v5omL5YmN44Gu44Kq44OW44K444Kn44Kv44OI44Gu44G/XHJcblxyXG4gICAgLy9jb25zb2xlLmxvZyhpbnRlcnNlY3RzKTtcclxuICAgIGludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgIHZhciBvYmplY3QgPSBpbnRlcnNlY3Qub2JqZWN0O1xyXG4gICAgICAvL29ubW91c2Vtb3ZlXHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vtb3ZlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgb2JqZWN0Lm9ubW91c2Vtb3ZlKGludGVyc2VjdCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vb25tb3VzZW92ZXJcclxuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZW92ZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBpZiAoIWV4aXN0KHByZUludGVyc2VjdHMsIGludGVyc2VjdCkpIHtcclxuICAgICAgICAgIG9iamVjdC5vbm1vdXNlb3ZlcihpbnRlcnNlY3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy9vbm1vdXNlb3V0XHJcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24ocHJlSW50ZXJzZWN0KSB7XHJcbiAgICAgIHZhciBvYmplY3QgPSBwcmVJbnRlcnNlY3Qub2JqZWN0O1xyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3V0ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgaWYgKCFleGlzdChpbnRlcnNlY3RzLCBwcmVJbnRlcnNlY3QpKSB7XHJcbiAgICAgICAgICBwcmVJbnRlcnNlY3Qub2JqZWN0Lm9ubW91c2VvdXQocHJlSW50ZXJzZWN0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHByZUludGVyc2VjdHMgPSBpbnRlcnNlY3RzO1xyXG4gICAgcHJlRXZlbnQgPSBldmVudDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGV4aXN0KGludGVyc2VjdHMsIHRhcmdldEludGVyc2VjdCkge1xyXG4gICAgLy9pbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XHJcbiAgICAvLyAgaWYoaW50ZXJzZWN0Lm9iamVjdCA9PSB0YXJnZXRJbnRlcnNlY3Qub2JqZWN0KSByZXR1cm4gdHJ1ZTtcclxuICAgIC8vfSk7XHJcbiAgICAvL3JldHVybiBmYWxzZTtcclxuICAgIHJldHVybiAodHlwZW9mIGludGVyc2VjdHNbMF0gPT09ICdvYmplY3QnKSAmJiAoaW50ZXJzZWN0c1swXS5vYmplY3QgPT09IHRhcmdldEludGVyc2VjdC5vYmplY3QpO1xyXG4gIH1cclxuXHJcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZURvd24pO1xyXG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZU1vdXNlVXApO1xyXG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2VNb3ZlKTtcclxuXHJcbiAgVEhSRUUuU2NlbmUucHJvdG90eXBlLmhhbmRsZU1vdXNlRXZlbnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHByZUV2ZW50ICYmIGhhbmRsZU1vdXNlTW92ZShwcmVFdmVudCk7XHJcbiAgfTtcclxuXHJcbn07IiwiaW1wb3J0IEVtYnJ5byBmcm9tICcuL2VtYnJ5by5lczYnO1xyXG5cclxuKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgdmFyIGVtYnJ5bztcclxuXHJcbiAgLy9hbmd1bGFyIHRlc3RcclxuICBhbmd1bGFyLm1vZHVsZSgnbXlTZXJ2aWNlcycsIFtdKVxyXG4gICAgLnNlcnZpY2UoJ2ltYWdlU2VhcmNoJywgWyckaHR0cCcsIGZ1bmN0aW9uICgkaHR0cCkge1xyXG4gICAgICB0aGlzLmdldEltYWdlcyA9IGZ1bmN0aW9uIChxdWVyeSwgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICB2YXIgdXJsID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2N1c3RvbXNlYXJjaC92MT9rZXk9QUl6YVN5RDNpbkFVdGZhaUlxRmJCTU9JMFkzNFgxeF9xdnN4QThnJmN4PTAwMTU1NjU2ODk0MzU0NjgzODM1MDowYmRpZ3JkMXg4aSZzZWFyY2hUeXBlPWltYWdlJnE9JztcclxuICAgICAgICBxdWVyeSA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xyXG4gICAgICAgICRodHRwKHtcclxuICAgICAgICAgIHVybDogdXJsICsgcXVlcnksXHJcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmNvbmNhdChkYXRhLml0ZW1zKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xyXG4gICAgICAgICAgICBpZihpdGVtcy5sZW5ndGggPT09IDIwKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soaXRlbXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcclxuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUQzaW5BVXRmYWlJcUZiQk1PSTBZMzRYMXhfcXZzeEE4ZyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZzdGFydD0xMSZxPSc7XHJcbiAgICAgICAgcXVlcnkgPSBlbmNvZGVVUklDb21wb25lbnQocXVlcnkucmVwbGFjZSgvXFxzKy9nLCAnICcpKTtcclxuXHJcbiAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgdXJsOiB1cmwgKyBxdWVyeSxcclxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XHJcbiAgICAgICAgICAgIGlmKGl0ZW1zLmxlbmd0aCA9PT0gMjApIHtcclxuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5zZXJ2aWNlKCdjb250cmlidXRlcycsIFsnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcclxuICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAkaHR0cCh7XHJcbiAgICAgICAgICB1cmw6ICcvY29udHJpYnV0ZXMvYWxsJyxcclxuICAgICAgICAgIC8vdXJsOiAnLi9qYXZhc2NyaXB0cy9hbGwuanNvbicsXHJcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfTtcclxuICAgICAgdGhpcy5zdWJtaXQgPSBmdW5jdGlvbiAoY29udHJpYnV0aW9uLCBjYWxsYmFjaykge1xyXG4gICAgICAgICRodHRwKHtcclxuICAgICAgICAgIHVybDogJy9jb250cmlidXRlcy9wb3N0JyxcclxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgZGF0YTogY29udHJpYnV0aW9uXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfTtcclxuICAgICAgdGhpcy5lZGl0VGV4dCA9IGZ1bmN0aW9uICh0ZXh0LCBjb250cmlidXRpb25faWQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgdXJsOiAnL2NvbnRyaWJ1dGVzL2VkaXQnLFxyXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgIHRleHQ6IHRleHQsXHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbl9pZDogY29udHJpYnV0aW9uX2lkXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfTtcclxuICAgIH1dKTtcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoXCJlbWJyeW9cIiwgWydteVNlcnZpY2VzJ10pXHJcbiAgICAuY29udHJvbGxlcignbXlDdHJsJywgWyckc2NvcGUnLCAnaW1hZ2VTZWFyY2gnLCAnY29udHJpYnV0ZXMnLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZVNlYXJjaCwgY29udHJpYnV0ZXMpIHtcclxuICAgICAgLy9jb250aWJ1dGlvbnPjgpLlj5blvpdcclxuICAgICAgY29udHJpYnV0ZXMuZ2V0QWxsKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbnMgPSBkYXRhO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnR1dG9yaWFsID0gZGF0YS5sZW5ndGggPCAxO1xyXG4gICAgICAgIHZhciBjb250YWluZXIgPSAkKCcuZW1icnlvLXRocmVlJyk7XHJcbiAgICAgICAgdmFyIGNvbnRyaWJ1dGlvbkltYWdlID0gJCgnLmVtYnJ5by1jb250cmlidXRpb24taW1hZ2UnKTtcclxuICAgICAgICBlbWJyeW8gPSBuZXcgRW1icnlvKGRhdGEsIGNvbnRhaW5lci5nZXQoMCksIGNvbnRhaW5lci53aWR0aCgpLCBjb250YWluZXIuaGVpZ2h0KCksIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHdpbmRvdy5lbWJyeW8gPSBlbWJyeW87XHJcbiAgICAgICAgZW1icnlvLm9uc2VsZWN0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbikge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5oYXNTZWxlY3RlZCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICdoaWRkZW4nO1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wbHVzQnV0dG9uID0gdHJ1ZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkudGhyZWUgPSB0cnVlO1xyXG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ29wYWNpdHknOiAwXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBlbWJyeW8udG9nZ2xlKDYwMCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID0gJ3Nob3duJztcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucGx1c0J1dHRvbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRDb250cmlidXRpb24gPSBjb250cmlidXRpb247XHJcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvblRleHQgPSBjb250cmlidXRpb24udGV4dDtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkudGhyZWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xyXG4gICAgICAgICAgICBjb250cmlidXRpb25JbWFnZS5jc3Moe1xyXG4gICAgICAgICAgICAgICdiYWNrZ3JvdW5kSW1hZ2UnOiAndXJsKCcgKyBjb250cmlidXRpb24uYmFzZTY0ICsgJyknLFxyXG4gICAgICAgICAgICAgICdiYWNrZ3JvdW5kU2l6ZSc6ICdjb3ZlcicsXHJcbiAgICAgICAgICAgICAgJ29wYWNpdHknOiAxXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBlbWJyeW8udG9nZ2xlKDYwMCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAkc2NvcGUudmlzaWJpbGl0eSA9IHtcclxuICAgICAgICBwb3N0OiBmYWxzZSxcclxuICAgICAgICBwbHVzQnV0dG9uOiB0cnVlLFxyXG4gICAgICAgIGNvbnRyaWJ1dGlvbkRldGFpbHM6ICdoaWRkZW4nLFxyXG4gICAgICAgIHBvc3RTZWFyY2g6IHRydWUsXHJcbiAgICAgICAgcG9zdENvbnRyaWJ1dGU6IGZhbHNlLFxyXG4gICAgICAgIHBvc3RMb2FkaW5nOiBmYWxzZSxcclxuICAgICAgICB0aHJlZTogdHJ1ZSxcclxuICAgICAgICBsb2FkaW5nOiB0cnVlLFxyXG4gICAgICAgIHR1dG9yaWFsOiBmYWxzZVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgJHNjb3BlLnF1ZXJ5ID0gJyc7XHJcbiAgICAgICRzY29wZS5jb250cmlidXRpb25EZXRhaWxzTWVzc2FnZSA9ICdVcGRhdGUnO1xyXG5cclxuICAgICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUuaXRlbXMgPSBbXTtcclxuICAgICAgICBpbWFnZVNlYXJjaC5nZXRJbWFnZXMoJHNjb3BlLnF1ZXJ5LCBmdW5jdGlvbiAoaXRlbXMpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcclxuICAgICAgICAgICRzY29wZS5pdGVtcyA9IGl0ZW1zO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWRJdGVtID0gaXRlbTtcclxuICAgICAgICAkc2NvcGUudXJsID0gaXRlbS5saW5rO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RTZWFyY2ggPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0Q29udHJpYnV0ZSA9IHRydWU7XHJcbiAgICAgICAgJHNjb3BlLnRleHQgPSAkc2NvcGUucXVlcnk7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS5zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHt0ZXh0OiAkc2NvcGUudGV4dCwgdXJsOiAkc2NvcGUudXJsfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgLy/mipXnqL/jga7ov73liqBcclxuICAgICAgICAgICRzY29wZS5jb250cmlidXRpb25zLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICBlbWJyeW8uYWRkQ29udHJpYnV0aW9uKGRhdGEsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkudHV0b3JpYWwgPSBmYWxzZTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RMb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLmVkaXRUZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvblRleHQpO1xyXG4gICAgICAgIGNvbnRyaWJ1dGVzLmVkaXRUZXh0KCRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvblRleHQsICRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvbi5faWQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ0NvbXBsZXRlZCc7XHJcbiAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XHJcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ1VwZGF0ZSc7XHJcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcclxuICAgICAgICAgIH0sIDIwMDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUuY2xvc2VMaWdodGJveCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLnRvZ2dsZVBvc3RQYW5lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3QgPSAhJHNjb3BlLnZpc2liaWxpdHkucG9zdDtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLnRvZ2dsZUNvbnRyaWJ1dGlvbkRldGFpbHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPT0gJ29wZW5lZCcgPyAnc2hvd24nIDogJ29wZW5lZCc7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS5iYWNrVG9TZWFyY2ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdFNlYXJjaCA9IHRydWU7XHJcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfV0pO1xyXG5cclxufSkoKTsiXX0=
