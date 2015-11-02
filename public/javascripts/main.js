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
  function Embryo(data, container, width, height) {
    var _this = this;

    _classCallCheck(this, Embryo);

    //* data : array of contributions
    //* contribution
    //* {
    //*   image: DOMImage
    //*   text: String
    //* }
    this.data = data;

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
      this.create();

      this.count = 0;

      console.log(this.frames);

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
      this.frames.children.forEach(function (frame) {
        //マウスイベントの設定
        frame.onclick = function (intersect) {
          if (typeof _this2.onselect === 'function') {
            _this2.onselect(frame.data);
          }
        };
        //frame.onmouseover = (intersect) => {
        //  intersect.face.mouseon = true;
        //};
      });
      this.scene.add(this.frames);
      typeof callback === 'function' && callback();

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
      this.geometry.dispose();
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
      var size = Math.pow(2, Math.log(Math.min(w, h)) / Math.LN2 | 0); // largest 2^n integer that does not exceed
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
      var url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyCLRfeuR06RNPKbwFgoOnY0ze0IKESF7Kw&cx=001556568943546838350:0bdigrd1x8i&searchType=image&q=';
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
      url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyCLRfeuR06RNPKbwFgoOnY0ze0IKESF7Kw&cx=001556568943546838350:0bdigrd1x8i&searchType=image&start=11&q=';
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
  }]);

  angular.module("embryo", ['myServices']).controller('myCtrl', ['$scope', 'imageSearch', 'contributes', function ($scope, imageSearch, contributes) {
    //contibutionsを取得
    contributes.getAll(function (data) {
      $scope.contributions = data;
      var container = $('.embryo-three');
      var contributionImage = $('.embryo-contribution-image');
      embryo = new _embryoEs62['default'](data, container.get(0), container.width(), container.height());
      window.embryo = embryo;
      embryo.onselect = function (contribution) {
        if ($scope.hasSelected) {
          $scope.hasSelected = false;
          $scope.visibility.contributionDetails = 'hidden';
          $scope.visibility.plusButton = true;
          $scope.$apply();
          container.css({
            '-webkit-filter': 'blur(0px)'
          });
          contributionImage.css({
            'opacity': 0
          });
          embryo.toggle();
        } else {
          $scope.hasSelected = true;
          $scope.visibility.contributionDetails = 'shown';
          $scope.visibility.plusButton = false;
          $scope.selectedContribution = contribution;
          $scope.$apply();
          contributionImage.css({
            'backgroundImage': 'url(' + contribution.base64 + ')',
            'backgroundSize': 'cover',
            'opacity': 1
          });
          container.css({
            '-webkit-filter': 'blur(10px)'
          });
          embryo.toggle();
        }
      };
    });

    $scope.visibility = {
      post: false,
      plusButton: true,
      contributionDetails: 'hidden',
      postSearch: true,
      postContribute: false,
      postLoading: false
    };

    $scope.query = 'sky';

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

    //onmousedown
    preIntersects.forEach(function (preIntersect) {
      var object = preIntersect.object;
      if (typeof object.onmousedown === 'function') {
        object.onmousedown(preIntersect);
      }
    });
    mouseDownIntersects = preIntersects;

    preEvent = event;
    mouseDownPoint = new THREE.Vector2(event.clientX, event.clientY);
  }

  function handleMouseUp(event) {
    event.preventDefault();

    //onmouseup
    preIntersects.forEach(function (intersect) {
      var object = intersect.object;
      if (typeof object.onmouseup === 'function') {
        object.onmouseup(intersect);
      }
    });

    if (mouseDownPoint.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) < 5) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvQ29udmV4R2VvbWV0cnkuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvZW1icnlvLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy9tYWluLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNtQkEsS0FBSyxDQUFDLGNBQWMsR0FBRyxVQUFVLFFBQVEsRUFBRzs7QUFFM0MsTUFBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7O0FBRTVCLEtBQUksS0FBSyxHQUFHLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV6QyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRzs7QUFFNUMsVUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO0VBRWQ7O0FBR0QsVUFBUyxRQUFRLENBQUUsUUFBUSxFQUFHOztBQUU3QixNQUFJLE1BQU0sR0FBRyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRTFDLE1BQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxN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TUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTdCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWYsSUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVmLFNBQU8sRUFBRSxDQUFDO0VBRVY7Ozs7Ozs7QUFPRCxVQUFTLFNBQVMsQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFHOztBQUU1QixTQUFPLEVBQUUsQ0FBRSxDQUFDLENBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFFLElBQUksRUFBRSxDQUFFLENBQUMsQ0FBRSxLQUFLLEVBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVsRDs7Ozs7QUFLRCxVQUFTLFlBQVksR0FBRzs7QUFFdkIsU0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUEsR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0VBRTFDOzs7OztBQU1ELFVBQVMsUUFBUSxDQUFFLE1BQU0sRUFBRzs7QUFFM0IsTUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzFCLFNBQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUM7RUFFM0Q7OztBQUdELEtBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLEtBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUss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SyxDQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUU7Ozs7O0FBSzFDLFdBQU8sQUFBQyxPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLElBQU0sVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxlQUFlLENBQUMsTUFBTSxBQUFDLENBQUM7R0FDakc7O0FBRUQsWUFBVSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUMxRCxZQUFVLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ3RELFlBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUM7O0FBRTFELE9BQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDbEQsWUFBUSxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztHQUN2QyxDQUFDO0NBRUgsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBhdXRob3IgcWlhbyAvIGh0dHBzOi8vZ2l0aHViLmNvbS9xaWFvXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgYSBjb252ZXggaHVsbCBnZW5lcmF0b3IgdXNpbmcgdGhlIGluY3JlbWVudGFsIG1ldGhvZC4gXG4gKiBUaGUgY29tcGxleGl0eSBpcyBPKG5eMikgd2hlcmUgbiBpcyB0aGUgbnVtYmVyIG9mIHZlcnRpY2VzLlxuICogTyhubG9nbikgYWxnb3JpdGhtcyBkbyBleGlzdCwgYnV0IHRoZXkgYXJlIG11Y2ggbW9yZSBjb21wbGljYXRlZC5cbiAqXG4gKiBCZW5jaG1hcms6IFxuICpcbiAqICBQbGF0Zm9ybTogQ1BVOiBQNzM1MCBAMi4wMEdIeiBFbmdpbmU6IFY4XG4gKlxuICogIE51bSBWZXJ0aWNlc1x0VGltZShtcylcbiAqXG4gKiAgICAgMTAgICAgICAgICAgIDFcbiAqICAgICAyMCAgICAgICAgICAgM1xuICogICAgIDMwICAgICAgICAgICAxOVxuICogICAgIDQwICAgICAgICAgICA0OFxuICogICAgIDUwICAgICAgICAgICAxMDdcbiAqL1xuXG5USFJFRS5Db252ZXhHZW9tZXRyeSA9IGZ1bmN0aW9uKCB2ZXJ0aWNlcyApIHtcblxuXHRUSFJFRS5HZW9tZXRyeS5jYWxsKCB0aGlzICk7XG5cblx0dmFyIGZhY2VzID0gWyBbIDAsIDEsIDIgXSwgWyAwLCAyLCAxIF0gXTsgXG5cblx0Zm9yICggdmFyIGkgPSAzOyBpIDwgdmVydGljZXMubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0YWRkUG9pbnQoIGkgKTtcblxuXHR9XG5cblxuXHRmdW5jdGlvbiBhZGRQb2ludCggdmVydGV4SWQgKSB7XG5cblx0XHR2YXIgdmVydGV4ID0gdmVydGljZXNbIHZlcnRleElkIF0uY2xvbmUoKTtcblxuXHRcdHZhciBtYWcgPSB2ZXJ0ZXgubGVuZ3RoKCk7XG5cdFx0dmVydGV4LnggKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cdFx0dmVydGV4LnkgKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cdFx0dmVydGV4LnogKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cblx0XHR2YXIgaG9sZSA9IFtdO1xuXG5cdFx0Zm9yICggdmFyIGYgPSAwOyBmIDwgZmFjZXMubGVuZ3RoOyApIHtcblxuXHRcdFx0dmFyIGZhY2UgPSBmYWNlc1sgZiBdO1xuXG5cdFx0XHQvLyBmb3IgZWFjaCBmYWNlLCBpZiB0aGUgdmVydGV4IGNhbiBzZWUgaXQsXG5cdFx0XHQvLyB0aGVuIHdlIHRyeSB0byBhZGQgdGhlIGZhY2UncyBlZGdlcyBpbnRvIHRoZSBob2xlLlxuXHRcdFx0aWYgKCB2aXNpYmxlKCBmYWNlLCB2ZXJ0ZXggKSApIHtcblxuXHRcdFx0XHRmb3IgKCB2YXIgZSA9IDA7IGUgPCAzOyBlICsrICkge1xuXG5cdFx0XHRcdFx0dmFyIGVkZ2UgPSBbIGZhY2VbIGUgXSwgZmFjZVsgKCBlICsgMSApICUgMyBdIF07XG5cdFx0XHRcdFx0dmFyIGJvdW5kYXJ5ID0gdHJ1ZTtcblxuXHRcdFx0XHRcdC8vIHJlbW92ZSBkdXBsaWNhdGVkIGVkZ2VzLlxuXHRcdFx0XHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xuXG5cdFx0XHRcdFx0XHRpZiAoIGVxdWFsRWRnZSggaG9sZVsgaCBdLCBlZGdlICkgKSB7XG5cblx0XHRcdFx0XHRcdFx0aG9sZVsgaCBdID0gaG9sZVsgaG9sZS5sZW5ndGggLSAxIF07XG5cdFx0XHRcdFx0XHRcdGhvbGUucG9wKCk7XG5cdFx0XHRcdFx0XHRcdGJvdW5kYXJ5ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIGJvdW5kYXJ5ICkge1xuXG5cdFx0XHRcdFx0XHRob2xlLnB1c2goIGVkZ2UgKTtcblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gcmVtb3ZlIGZhY2VzWyBmIF1cblx0XHRcdFx0ZmFjZXNbIGYgXSA9IGZhY2VzWyBmYWNlcy5sZW5ndGggLSAxIF07XG5cdFx0XHRcdGZhY2VzLnBvcCgpO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIG5vdCB2aXNpYmxlXG5cblx0XHRcdFx0ZiArKztcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0Ly8gY29uc3RydWN0IHRoZSBuZXcgZmFjZXMgZm9ybWVkIGJ5IHRoZSBlZGdlcyBvZiB0aGUgaG9sZSBhbmQgdGhlIHZlcnRleFxuXHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xuXG5cdFx0XHRmYWNlcy5wdXNoKCBbIFxuXHRcdFx0XHRob2xlWyBoIF1bIDAgXSxcblx0XHRcdFx0aG9sZVsgaCBdWyAxIF0sXG5cdFx0XHRcdHZlcnRleElkXG5cdFx0XHRdICk7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBXaGV0aGVyIHRoZSBmYWNlIGlzIHZpc2libGUgZnJvbSB0aGUgdmVydGV4XG5cdCAqL1xuXHRmdW5jdGlvbiB2aXNpYmxlKCBmYWNlLCB2ZXJ0ZXggKSB7XG5cblx0XHR2YXIgdmEgPSB2ZXJ0aWNlc1sgZmFjZVsgMCBdIF07XG5cdFx0dmFyIHZiID0gdmVydGljZXNbIGZhY2VbIDEgXSBdO1xuXHRcdHZhciB2YyA9IHZlcnRpY2VzWyBmYWNlWyAyIF0gXTtcblxuXHRcdHZhciBuID0gbm9ybWFsKCB2YSwgdmIsIHZjICk7XG5cblx0XHQvLyBkaXN0YW5jZSBmcm9tIGZhY2UgdG8gb3JpZ2luXG5cdFx0dmFyIGRpc3QgPSBuLmRvdCggdmEgKTtcblxuXHRcdHJldHVybiBuLmRvdCggdmVydGV4ICkgPj0gZGlzdDsgXG5cblx0fVxuXG5cdC8qKlxuXHQgKiBGYWNlIG5vcm1hbFxuXHQgKi9cblx0ZnVuY3Rpb24gbm9ybWFsKCB2YSwgdmIsIHZjICkge1xuXG5cdFx0dmFyIGNiID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblx0XHR2YXIgYWIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdFx0Y2Iuc3ViVmVjdG9ycyggdmMsIHZiICk7XG5cdFx0YWIuc3ViVmVjdG9ycyggdmEsIHZiICk7XG5cdFx0Y2IuY3Jvc3MoIGFiICk7XG5cblx0XHRjYi5ub3JtYWxpemUoKTtcblxuXHRcdHJldHVybiBjYjtcblxuXHR9XG5cblx0LyoqXG5cdCAqIERldGVjdCB3aGV0aGVyIHR3byBlZGdlcyBhcmUgZXF1YWwuXG5cdCAqIE5vdGUgdGhhdCB3aGVuIGNvbnN0cnVjdGluZyB0aGUgY29udmV4IGh1bGwsIHR3byBzYW1lIGVkZ2VzIGNhbiBvbmx5XG5cdCAqIGJlIG9mIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBlcXVhbEVkZ2UoIGVhLCBlYiApIHtcblxuXHRcdHJldHVybiBlYVsgMCBdID09PSBlYlsgMSBdICYmIGVhWyAxIF0gPT09IGViWyAwIF07IFxuXG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGEgcmFuZG9tIG9mZnNldCBiZXR3ZWVuIC0xZS02IGFuZCAxZS02LlxuXHQgKi9cblx0ZnVuY3Rpb24gcmFuZG9tT2Zmc2V0KCkge1xuXG5cdFx0cmV0dXJuICggTWF0aC5yYW5kb20oKSAtIDAuNSApICogMiAqIDFlLTY7XG5cblx0fVxuXG5cblx0LyoqXG5cdCAqIFhYWDogTm90IHN1cmUgaWYgdGhpcyBpcyB0aGUgY29ycmVjdCBhcHByb2FjaC4gTmVlZCBzb21lb25lIHRvIHJldmlldy5cblx0ICovXG5cdGZ1bmN0aW9uIHZlcnRleFV2KCB2ZXJ0ZXggKSB7XG5cblx0XHR2YXIgbWFnID0gdmVydGV4Lmxlbmd0aCgpO1xuXHRcdHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMiggdmVydGV4LnggLyBtYWcsIHZlcnRleC55IC8gbWFnICk7XG5cblx0fVxuXG5cdC8vIFB1c2ggdmVydGljZXMgaW50byBgdGhpcy52ZXJ0aWNlc2AsIHNraXBwaW5nIHRob3NlIGluc2lkZSB0aGUgaHVsbFxuXHR2YXIgaWQgPSAwO1xuXHR2YXIgbmV3SWQgPSBuZXcgQXJyYXkoIHZlcnRpY2VzLmxlbmd0aCApOyAvLyBtYXAgZnJvbSBvbGQgdmVydGV4IGlkIHRvIG5ldyBpZFxuXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdCB2YXIgZmFjZSA9IGZhY2VzWyBpIF07XG5cblx0XHQgZm9yICggdmFyIGogPSAwOyBqIDwgMzsgaiArKyApIHtcblxuXHRcdFx0aWYgKCBuZXdJZFsgZmFjZVsgaiBdIF0gPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0XHRuZXdJZFsgZmFjZVsgaiBdIF0gPSBpZCArKztcblx0XHRcdFx0dGhpcy52ZXJ0aWNlcy5wdXNoKCB2ZXJ0aWNlc1sgZmFjZVsgaiBdIF0gKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRmYWNlWyBqIF0gPSBuZXdJZFsgZmFjZVsgaiBdIF07XG5cblx0XHQgfVxuXG5cdH1cblxuXHQvLyBDb252ZXJ0IGZhY2VzIGludG8gaW5zdGFuY2VzIG9mIFRIUkVFLkZhY2UzXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdHRoaXMuZmFjZXMucHVzaCggbmV3IFRIUkVFLkZhY2UzKCBcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMCBdLFxuXHRcdFx0XHRmYWNlc1sgaSBdWyAxIF0sXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDIgXVxuXHRcdCkgKTtcblxuXHR9XG5cblx0Ly8gQ29tcHV0ZSBVVnNcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5mYWNlcy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHR2YXIgZmFjZSA9IHRoaXMuZmFjZXNbIGkgXTtcblxuXHRcdHRoaXMuZmFjZVZlcnRleFV2c1sgMCBdLnB1c2goIFtcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmEgXSApLFxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYiBdICksXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5jIF0gKVxuXHRcdF0gKTtcblxuXHR9XG5cblx0dGhpcy5jb21wdXRlRmFjZU5vcm1hbHMoKTtcblx0dGhpcy5jb21wdXRlVmVydGV4Tm9ybWFscygpO1xuXG59O1xuXG5USFJFRS5Db252ZXhHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5HZW9tZXRyeS5wcm90b3R5cGUgKTtcblRIUkVFLkNvbnZleEdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRIUkVFLkNvbnZleEdlb21ldHJ5O1xuIiwiaW1wb3J0ICcuL3RocmVlLW1vdXNlLWV2ZW50LmVzNic7XG5pbXBvcnQgJy4vQ29udmV4R2VvbWV0cnknO1xuXG5USFJFRS5WZWN0b3IzLnByb3RvdHlwZS5taXggPSBmdW5jdGlvbih5LCBhKSB7XG4gIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKDEgLSBhKS5hZGQoeS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKGEpKVxufTtcblxuY2xhc3MgRW1icnlvIHtcblxuICBjb25zdHJ1Y3RvcihkYXRhLCBjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpIHtcblxuICAgIC8vKiBkYXRhIDogYXJyYXkgb2YgY29udHJpYnV0aW9uc1xuICAgIC8vKiBjb250cmlidXRpb25cbiAgICAvLyoge1xuICAgIC8vKiAgIGltYWdlOiBET01JbWFnZVxuICAgIC8vKiAgIHRleHQ6IFN0cmluZ1xuICAgIC8vKiB9XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcblxuICAgIC8v44OG44Kv44K544OB44Oj44Gu5L2c5oiQXG4gICAgdmFyIGxvYWRlZE51bSA9IDA7XG4gICAgZGF0YS5mb3JFYWNoKChjb250cmlidXRpb24sIGluZGV4KSA9PiB7XG4gICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XG4gICAgICAgIHRoaXMuZGF0YVtpbmRleF0udGV4dHVyZSA9IHRleHR1cmU7XG4gICAgICAgIGxvYWRlZE51bSsrO1xuICAgICAgICBpZihsb2FkZWROdW0gPT09IGRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5pbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBpbWFnZS5zcmMgPSBjb250cmlidXRpb24uYmFzZTY0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfVxuXG4gIGluaXRpYWxpemUoY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMuaXNIaWRkZW4gPSBmYWxzZTtcblxuICAgIC8vaW5pdCBzY2VuZVxuICAgIHZhciBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuXG4gICAgLy9pbml0IGNhbWVyYVxuICAgIHZhciBmb3YgPSA2MDtcbiAgICB2YXIgYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYShmb3YsIGFzcGVjdCk7XG4gICAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAoaGVpZ2h0IC8gMikgLyBNYXRoLnRhbigoZm92ICogTWF0aC5QSSAvIDE4MCkgLyAyKSk7XG4gICAgY2FtZXJhLmxvb2tBdChuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKSk7XG4gICAgc2NlbmUuYWRkKGNhbWVyYSk7XG5cbiAgICAvL2luaXQgcmVuZGVyZXJcbiAgICB2YXIgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7YWxwaGE6IHRydWUsIGFudGlhbGlhczogdHJ1ZX0pO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGNjY2NjYywgMCk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgLy9pbml0IGNvbnRyb2xzXG4gICAgdmFyIGNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzKGNhbWVyYSwgcmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAvL3dhdGNoIG1vdXNlIGV2ZW50c1xuICAgIHNjZW5lLndhdGNoTW91c2VFdmVudChyZW5kZXJlci5kb21FbGVtZW50LCBjYW1lcmEpO1xuXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLmNvbnRyb2xzID0gY29udHJvbHM7XG5cbiAgICAvL+eUn+aIkFxuICAgIHRoaXMuY3JlYXRlKCk7XG5cbiAgICB0aGlzLmNvdW50ID0gMDtcblxuICAgIGNvbnNvbGUubG9nKHRoaXMuZnJhbWVzKTtcblxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbigpe1xuICAgICAgY29udHJvbHMudXBkYXRlKCk7XG4gICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgICAvL3NjZW5lLmhhbmRsZU1vdXNlRXZlbnQoKTtcbiAgICAgIHRoaXMuY291bnQrKztcbiAgICAgIHRoaXMubW92ZVZlcnRpY2VzKCkucm90YXRlKCk7XG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdXBkYXRlKCk7XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9XG5cbiAgY3JlYXRlKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5nZW9tZXRyeSA9IEVtYnJ5by5jcmVhdGVHZW9tZXRyeSgxMDAsIHRoaXMuZGF0YS5sZW5ndGgpO1xuICAgIHRoaXMuZnJhbWVzID0gRW1icnlvLmNyZWF0ZUZyYW1lcyh0aGlzLmdlb21ldHJ5LCB0aGlzLmRhdGEpO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goKGZyYW1lKSA9PiB7Ly/jg57jgqbjgrnjgqTjg5njg7Pjg4jjga7oqK3lrppcbiAgICAgIGZyYW1lLm9uY2xpY2sgPSAoaW50ZXJzZWN0KSA9PiB7XG4gICAgICAgIGlmKHR5cGVvZiB0aGlzLm9uc2VsZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhpcy5vbnNlbGVjdChmcmFtZS5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8vZnJhbWUub25tb3VzZW92ZXIgPSAoaW50ZXJzZWN0KSA9PiB7XG4gICAgICAvLyAgaW50ZXJzZWN0LmZhY2UubW91c2VvbiA9IHRydWU7XG4gICAgICAvL307XG4gICAgfSk7XG4gICAgdGhpcy5zY2VuZS5hZGQodGhpcy5mcmFtZXMpO1xuICAgIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyAmJiBjYWxsYmFjaygpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvL+S4ieinkuOBrumdouOBp+ani+aIkOOBleOCjOOCi+WkmumdouS9k+OBruS9nOaIkFxuICBzdGF0aWMgY3JlYXRlR2VvbWV0cnkocmFkaXVzLCBzdXJmYWNlTnVtYmVyKSB7XG4gICAgdmFyIHZlcnRpY2VzID0gW107XG4gICAgc3VyZmFjZU51bWJlciA9IChzdXJmYWNlTnVtYmVyIDwgNCkgPyA0IDogc3VyZmFjZU51bWJlcjsvL++8lOS7peS4i+OBr+S4jeWPr1xuICAgIHN1cmZhY2VOdW1iZXIgPSAoc3VyZmFjZU51bWJlciAmIDEpID8gKHN1cmZhY2VOdW1iZXIgKyAxKSA6IHN1cmZhY2VOdW1iZXI7Ly/lpYfmlbDjga/kuI3lj68o44KI44KK5aSn44GN44GE5YG25pWw44Gr55u044GZKVxuICAgIGZvcih2YXIgaSA9IDAsIGwgPSAoMiArIHN1cmZhY2VOdW1iZXIgLyAyKTsgaSA8IGw7IGkrKykge1xuICAgICAgdmVydGljZXNbaV0gPSBuZXcgVEhSRUUuVmVjdG9yMyhNYXRoLnJhbmRvbSgpIC0gMC41LCBNYXRoLnJhbmRvbSgpIC0gMC41LCBNYXRoLnJhbmRvbSgpIC0gMC41KTsvL+eQg+eKtuOBq+ODqeODs+ODgOODoOOBq+eCueOCkuaJk+OBpFxuICAgICAgdmVydGljZXNbaV0uc2V0TGVuZ3RoKHJhZGl1cyk7XG4gICAgICB2ZXJ0aWNlc1tpXS5vcmlnaW5hbExlbmd0aCA9IHJhZGl1cztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUSFJFRS5Db252ZXhHZW9tZXRyeSh2ZXJ0aWNlcyk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlRnJhbWVzKGdlb21ldHJ5LCBkYXRhKSB7XG4gICAgdmFyIHZlcnRleHRTaGFkZXIgPSAnJyArXG4gICAgICAndmFyeWluZyB2ZWM0IHZQb3NpdGlvbjsnICtcbiAgICAgICd2b2lkIG1haW4oKSB7JyArXG4gICAgICAnICBnbF9Qb3NpdGlvbiA9IHByb2plY3Rpb25NYXRyaXggKiB2aWV3TWF0cml4ICogbW9kZWxNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLCAxLjApOycgK1xuICAgICAgJyAgdlBvc2l0aW9uID0gZ2xfUG9zaXRpb247JyArXG4gICAgICAnfSc7XG5cbiAgICB2YXIgZnJhZ21lbnRTaGFkZXIgPSAnJyArXG4gICAgICAndW5pZm9ybSBzYW1wbGVyMkQgdGV4dHVyZTsnICtcbiAgICAgICd1bmlmb3JtIGZsb2F0IG9wYWNpdHk7JyArXG4gICAgICAndmFyeWluZyB2ZWM0IHZQb3NpdGlvbjsnICtcbiAgICAgICd2b2lkIG1haW4odm9pZCl7JyArXG4gICAgICAnICB2ZWM0IHRleHR1cmVDb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB2ZWMyKCgxLjAgKyB2UG9zaXRpb24ueCAvIDEwMC4wKSAvIDIuMCwgKDEuMCArIHZQb3NpdGlvbi55IC8gMTAwLjApIC8gMi4wKSk7JyArXG4gICAgICAnICB0ZXh0dXJlQ29sb3IudyA9IG9wYWNpdHk7JyArXG4gICAgICAnICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlQ29sb3I7JyArXG4gICAgICAvLycgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCh2UG9zaXRpb24ueCAvIDgwMC4wICsgMS4wKSAvIDIuMCwgKHZQb3NpdGlvbi55IC8gODAwLjAgKyAxLjApIC8gMi4wLCAwLCAwKTsnICtcbiAgICAgICd9JztcblxuICAgIHZhciBmcmFtZXMgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICBnZW9tZXRyeS5mYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKGZhY2UsIGluZGV4KSB7XG4gICAgICB2YXIgYSA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV0sIGIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdLCBjID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgLy9jcmVhdGUgZ2VvbWV0cnlcbiAgICAgIHZhciBmcmFtZUdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG4gICAgICBmcmFtZUdlb21ldHJ5LnZlcnRpY2VzID0gW2EsIGIsIGNdO1xuICAgICAgZnJhbWVHZW9tZXRyeS5mYWNlcyA9IFtuZXcgVEhSRUUuRmFjZTMoMCwgMSwgMildO1xuICAgICAgZnJhbWVHZW9tZXRyeS5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcblxuICAgICAgLy9jcmVhdGUgbWF0ZXJpYWxcbiAgICAgIHZhciBmcmFtZU1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcbiAgICAgICAgdmVydGV4U2hhZGVyOiB2ZXJ0ZXh0U2hhZGVyLFxuICAgICAgICBmcmFnbWVudFNoYWRlcjogZnJhZ21lbnRTaGFkZXIsXG4gICAgICAgIHVuaWZvcm1zOiB7XG4gICAgICAgICAgdGV4dHVyZTogeyB0eXBlOiBcInRcIiwgdmFsdWU6IGRhdGFbaW5kZXhdID8gZGF0YVtpbmRleF0udGV4dHVyZSA6IG51bGwgfSxcbiAgICAgICAgICBvcGFjaXR5OiB7IHR5cGU6IFwiZlwiLCB2YWx1ZTogMS4wIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZnJhbWVHZW9tZXRyeSwgZnJhbWVNYXRlcmlhbCk7XG4gICAgICBtZXNoLmRhdGEgPSBkYXRhW2luZGV4XTtcblxuICAgICAgZnJhbWVzLmFkZChtZXNoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZnJhbWVzO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZVRleHR1cmUoaW1hZ2UpIHtcbiAgICB2YXIgdGV4dHVyZSA9IG5ldyBUSFJFRS5UZXh0dXJlKHRoaXMuZ2V0U3VpdGFibGVJbWFnZShpbWFnZSkpO1xuICAgIC8vdGV4dHVyZS5tYWdGaWx0ZXIgPSB0ZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gICAgdGV4dHVyZS5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgcmV0dXJuIHRleHR1cmU7XG4gIH1cblxuICAvL+eUu+WDj+OCteOCpOOCuuOCkuiqv+aVtFxuICBzdGF0aWMgZ2V0U3VpdGFibGVJbWFnZShpbWFnZSkge1xuICAgIHZhciB3ID0gaW1hZ2UubmF0dXJhbFdpZHRoLCBoID0gaW1hZ2UubmF0dXJhbEhlaWdodDtcbiAgICB2YXIgc2l6ZSA9IE1hdGgucG93KDIsIE1hdGgubG9nKE1hdGgubWluKHcsIGgpKSAvIE1hdGguTE4yIHwgMCk7IC8vIGxhcmdlc3QgMl5uIGludGVnZXIgdGhhdCBkb2VzIG5vdCBleGNlZWRcbiAgICBpZiAodyAhPT0gaCB8fCB3ICE9PSBzaXplKSB7XG4gICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICB2YXIgb2Zmc2V0WCA9IGggLyB3ID4gMSA/IDAgOiAodyAtIGgpIC8gMjtcbiAgICAgIHZhciBvZmZzZXRZID0gaCAvIHcgPiAxID8gKGggLSB3KSAvIDIgOiAwO1xuICAgICAgdmFyIGNsaXBTaXplID0gaCAvIHcgPiAxID8gdyA6IGg7XG4gICAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLndpZHRoID0gc2l6ZTtcbiAgICAgIGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLmRyYXdJbWFnZShpbWFnZSwgb2Zmc2V0WCwgb2Zmc2V0WSwgY2xpcFNpemUsIGNsaXBTaXplLCAwLCAwLCBzaXplLCBzaXplKTtcbiAgICAgIGltYWdlID0gY2FudmFzO1xuICAgIH1cbiAgICByZXR1cm4gaW1hZ2U7XG4gIH1cblxuICBtb3ZlVmVydGljZXMoKSB7XG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLmZyYW1lcy5jaGlsZHJlblswXS5nZW9tZXRyeS52ZXJ0aWNlc1swXSk7XG4gICAgdGhpcy5mcmFtZXMuY2hpbGRyZW4uZm9yRWFjaCgoZnJhbWUpID0+IHtcbiAgICAgIHZhciBmYWNlID0gZnJhbWUuZ2VvbWV0cnkuZmFjZXNbMF07XG4gICAgICBmcmFtZS5nZW9tZXRyeS52ZXJ0aWNlcy5mb3JFYWNoKCh2ZXJ0ZXgsIGluZGV4KSA9PiB7XG4gICAgICAgIHZlcnRleC5taXgoZmFjZS5ub3JtYWwsIDAuMSkuc2V0TGVuZ3RoKHZlcnRleC5vcmlnaW5hbExlbmd0aCArIDUgKiBNYXRoLmNvcyh0aGlzLmNvdW50LzIwICsgaW5kZXggKiAxMCkpO1xuICAgIH0pO1xuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXNOZWVkVXBkYXRlID0gdHJ1ZTtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LmNvbXB1dGVGYWNlTm9ybWFscygpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByb3RhdGUoKSB7XG4gICAgdGhpcy5mcmFtZXMucm90YXRpb24uc2V0KDAsIHRoaXMuY291bnQvNTAwLCAwKTtcbiAgfVxuXG4gIC8qXG4gICAgdGhyZWUuanPjgqrjg5bjgrjjgqfjgq/jg4jjga7liYrpmaRcbiAgICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICAgIGZyYW1lLm1hdGVyaWFsLmRpc3Bvc2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLnNjZW5lLnJlbW92ZSh0aGlzLmZyYW1lcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAgY29udHJpYnV0aW9u44Gu6L+95YqgXG4gICAgQHBhcmFtIGNvbnRyaWJ1dGlvbiB7T2JqZWN0fSDmipXnqL9cbiAgICovXG4gIGFkZENvbnRyaWJ1dGlvbihjb250cmlidXRpb24sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgY29udHJpYnV0aW9uLnRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XG4gICAgICB0aGlzLmRhdGEucHVzaChjb250cmlidXRpb24pO1xuICAgICAgdGhpcy5jbGVhcigpLmNyZWF0ZShjYWxsYmFjayk7Ly/jg6rjgrvjg4Pjg4hcbiAgICB9O1xuICAgIGltYWdlLnNyYyA9IGNvbnRyaWJ1dGlvbi5iYXNlNjQ7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFNpemUod2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICB0aGlzLmNhbWVyYS5hc3BlY3QgPSB3aWR0aCAvIGhlaWdodDtcbiAgICB0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgICBcbiAgdG9nZ2xlKCkge1xuICAgIHZhciBUT1RBTF9DT1VOVCA9IDM2O1xuICAgIHZhciBTVEFSVF9QT0lOVCA9IHRoaXMuZnJhbWVzLnBvc2l0aW9uLmNsb25lKCk7XG4gICAgdmFyIEVORF9QT0lOVCA9IHRoaXMuaXNIaWRkZW4gPyBuZXcgVEhSRUUuVmVjdG9yMygpIDogbmV3IFRIUkVFLlZlY3RvcjMoMCwgLTIwMCwgLTIwMCk7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICBjb25zb2xlLmxvZyhTVEFSVF9QT0lOVCk7XG4gICAgdmFyIGFuaW1hdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbiA9IGNvdW50IC8gVE9UQUxfQ09VTlQgLSAxO1xuICAgICAgdmFyIG5ld1BvaW50ID0gU1RBUlRfUE9JTlQuY2xvbmUoKS5taXgoRU5EX1BPSU5ULCBNYXRoLnBvdyhuLCA1KSArIDEpO1xuICAgICAgdGhpcy5mcmFtZXMucG9zaXRpb24uc2V0KG5ld1BvaW50LngsIG5ld1BvaW50LnksIG5ld1BvaW50LnopO1xuICAgICAgaWYoY291bnQgPCBUT1RBTF9DT1VOVCkge1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgfVxuICAgIH1cbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgIHRoaXMuaXNIaWRkZW4gPSAhdGhpcy5pc0hpZGRlbjtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEVtYnJ5bzsiLCJpbXBvcnQgRW1icnlvIGZyb20gJy4vZW1icnlvLmVzNic7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGVtYnJ5bztcblxuICAvL2FuZ3VsYXIgdGVzdFxuICBhbmd1bGFyLm1vZHVsZSgnbXlTZXJ2aWNlcycsIFtdKVxuICAgIC5zZXJ2aWNlKCdpbWFnZVNlYXJjaCcsIFsnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcbiAgICAgIHRoaXMuZ2V0SW1hZ2VzID0gZnVuY3Rpb24gKHF1ZXJ5LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdmFyIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUNMUmZldVIwNlJOUEtid0Znb09uWTB6ZTBJS0VTRjdLdyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZxPSc7XG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6IHVybCArIHF1ZXJ5LFxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xuICAgICAgICAgICAgaWYoaXRlbXMubGVuZ3RoID09PSAyMCkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUNMUmZldVIwNlJOUEtid0Znb09uWTB6ZTBJS0VTRjdLdyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZzdGFydD0xMSZxPSc7XG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6IHVybCArIHF1ZXJ5LFxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xuICAgICAgICAgICAgaWYoaXRlbXMubGVuZ3RoID09PSAyMCkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1dKVxuICAgIC5zZXJ2aWNlKCdjb250cmlidXRlcycsIFsnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcbiAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6ICcvY29udHJpYnV0ZXMvYWxsJyxcbiAgICAgICAgICAvL3VybDogJy4vamF2YXNjcmlwdHMvYWxsLmpzb24nLFxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHRoaXMuc3VibWl0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIHVybDogJy9jb250cmlidXRlcy9wb3N0JyxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiBjb250cmlidXRpb25cbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XSk7XG5cbiAgYW5ndWxhci5tb2R1bGUoXCJlbWJyeW9cIiwgWydteVNlcnZpY2VzJ10pXG4gICAgLmNvbnRyb2xsZXIoJ215Q3RybCcsIFsnJHNjb3BlJywgJ2ltYWdlU2VhcmNoJywgJ2NvbnRyaWJ1dGVzJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VTZWFyY2gsIGNvbnRyaWJ1dGVzKSB7XG4gICAgICAvL2NvbnRpYnV0aW9uc+OCkuWPluW+l1xuICAgICAgY29udHJpYnV0ZXMuZ2V0QWxsKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICRzY29wZS5jb250cmlidXRpb25zID0gZGF0YTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9ICQoJy5lbWJyeW8tdGhyZWUnKTtcbiAgICAgICAgdmFyIGNvbnRyaWJ1dGlvbkltYWdlID0gJCgnLmVtYnJ5by1jb250cmlidXRpb24taW1hZ2UnKTtcbiAgICAgICAgZW1icnlvID0gbmV3IEVtYnJ5byhkYXRhLCBjb250YWluZXIuZ2V0KDApLCBjb250YWluZXIud2lkdGgoKSwgY29udGFpbmVyLmhlaWdodCgpKTtcbiAgICAgICAgd2luZG93LmVtYnJ5byA9IGVtYnJ5bztcbiAgICAgICAgZW1icnlvLm9uc2VsZWN0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbikge1xuICAgICAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucGx1c0J1dHRvbiA9IHRydWU7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICBjb250YWluZXIuY3NzKHtcbiAgICAgICAgICAgICAgJy13ZWJraXQtZmlsdGVyJzogJ2JsdXIoMHB4KSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29udHJpYnV0aW9uSW1hZ2UuY3NzKHtcbiAgICAgICAgICAgICAgJ29wYWNpdHknOiAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGVtYnJ5by50b2dnbGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAnc2hvd24nO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucGx1c0J1dHRvbiA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uID0gY29udHJpYnV0aW9uO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgY29udHJpYnV0aW9uSW1hZ2UuY3NzKHtcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRJbWFnZSc6ICd1cmwoJyArIGNvbnRyaWJ1dGlvbi5iYXNlNjQgKyAnKScsXG4gICAgICAgICAgICAgICdiYWNrZ3JvdW5kU2l6ZSc6ICdjb3ZlcicsXG4gICAgICAgICAgICAgICdvcGFjaXR5JzogMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250YWluZXIuY3NzKHtcbiAgICAgICAgICAgICAgJy13ZWJraXQtZmlsdGVyJzogJ2JsdXIoMTBweCknXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZW1icnlvLnRvZ2dsZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUudmlzaWJpbGl0eSA9IHtcbiAgICAgICAgcG9zdDogZmFsc2UsXG4gICAgICAgIHBsdXNCdXR0b246IHRydWUsXG4gICAgICAgIGNvbnRyaWJ1dGlvbkRldGFpbHM6ICdoaWRkZW4nLFxuICAgICAgICBwb3N0U2VhcmNoOiB0cnVlLFxuICAgICAgICBwb3N0Q29udHJpYnV0ZTogZmFsc2UsXG4gICAgICAgIHBvc3RMb2FkaW5nOiBmYWxzZVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnF1ZXJ5ID0gJ3NreSc7XG5cbiAgICAgICRzY29wZS5zZWFyY2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5pdGVtcyA9IFtdO1xuICAgICAgICBpbWFnZVNlYXJjaC5nZXRJbWFnZXMoJHNjb3BlLnF1ZXJ5LCBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XG4gICAgICAgICAgJHNjb3BlLml0ZW1zID0gaXRlbXM7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgICRzY29wZS5zZWxlY3QgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAkc2NvcGUuc2VsZWN0ZWRJdGVtID0gaXRlbTtcbiAgICAgICAgJHNjb3BlLnVybCA9IGl0ZW0ubGluaztcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdFNlYXJjaCA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0Q29udHJpYnV0ZSA9IHRydWU7XG4gICAgICAgICRzY29wZS50ZXh0ID0gJHNjb3BlLnF1ZXJ5O1xuICAgICAgfTtcbiAgICAgICRzY29wZS5zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnRyaWJ1dGVzLnN1Ym1pdCh7dGV4dDogJHNjb3BlLnRleHQsIHVybDogJHNjb3BlLnVybH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgLy/mipXnqL/jga7ov73liqBcbiAgICAgICAgICAkc2NvcGUuY29udHJpYnV0aW9ucy5wdXNoKGRhdGEpO1xuICAgICAgICAgIGVtYnJ5by5hZGRDb250cmlidXRpb24oZGF0YSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdCA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdFNlYXJjaCA9IHRydWU7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0Q29udHJpYnV0ZSA9IGZhbHNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdExvYWRpbmcgPSB0cnVlO1xuICAgICAgfTtcbiAgICAgICRzY29wZS5jbG9zZUxpZ2h0Ym94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH07XG4gICAgICAkc2NvcGUudG9nZ2xlUG9zdFBhbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3QgPSAhJHNjb3BlLnZpc2liaWxpdHkucG9zdDtcbiAgICAgIH07XG4gICAgICAkc2NvcGUudG9nZ2xlQ29udHJpYnV0aW9uRGV0YWlscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPT0gJ29wZW5lZCcgPyAnc2hvd24nIDogJ29wZW5lZCc7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmJhY2tUb1NlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdFNlYXJjaCA9IHRydWU7XG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfV0pO1xuXG59KSgpOyIsIlRIUkVFLlNjZW5lLnByb3RvdHlwZS53YXRjaE1vdXNlRXZlbnQgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYW1lcmEpIHtcbiAgdmFyIHByZUludGVyc2VjdHMgPSBbXTtcbiAgdmFyIG1vdXNlRG93bkludGVyc2VjdHMgPSBbXTtcbiAgdmFyIHByZUV2ZW50O1xuICB2YXIgbW91c2VEb3duUG9pbnQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlRG93bihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAvL29ubW91c2Vkb3duXG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHByZUludGVyc2VjdCkge1xuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlZG93biA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3Qub25tb3VzZWRvd24ocHJlSW50ZXJzZWN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtb3VzZURvd25JbnRlcnNlY3RzID0gcHJlSW50ZXJzZWN0cztcblxuICAgIHByZUV2ZW50ID0gZXZlbnQ7XG4gICAgbW91c2VEb3duUG9pbnQgPSBuZXcgVEhSRUUuVmVjdG9yMihldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlVXAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgLy9vbm1vdXNldXBcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2V1cCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3Qub25tb3VzZXVwKGludGVyc2VjdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZihtb3VzZURvd25Qb2ludC5kaXN0YW5jZVRvKG5ldyBUSFJFRS5WZWN0b3IyKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpKSA8IDUpIHtcbiAgICAgIC8vb25jbGlja1xuICAgICAgbW91c2VEb3duSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcbiAgICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBpZiAoZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xuICAgICAgICAgICAgb2JqZWN0Lm9uY2xpY2soaW50ZXJzZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZUV2ZW50ID0gZXZlbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICB2YXIgcmVjdCA9IGRvbUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgbW91c2UueCA9ICgoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCkgLyBkb21FbGVtZW50LndpZHRoKSAqIDIgLSAxO1xuICAgIG1vdXNlLnkgPSAtKChldmVudC5jbGllbnRZIC0gcmVjdC50b3ApIC8gZG9tRWxlbWVudC5oZWlnaHQpICogMiArIDE7XG5cbiAgICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICAgIHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG1vdXNlLCBjYW1lcmEpO1xuXG4gICAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhfdGhpcy5jaGlsZHJlbiwgdHJ1ZSk7XG4gICAgaW50ZXJzZWN0cy5sZW5ndGggPSAxOy8v5omL5YmN44Gu44Kq44OW44K444Kn44Kv44OI44Gu44G/XG5cbiAgICAvL2NvbnNvbGUubG9nKGludGVyc2VjdHMpO1xuICAgIGludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbiAoaW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIC8vb25tb3VzZW1vdmVcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vtb3ZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdC5vbm1vdXNlbW92ZShpbnRlcnNlY3QpO1xuICAgICAgfVxuXG4gICAgICAvL29ubW91c2VvdmVyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3ZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoIWV4aXN0KHByZUludGVyc2VjdHMsIGludGVyc2VjdCkpIHtcbiAgICAgICAgICBvYmplY3Qub25tb3VzZW92ZXIoaW50ZXJzZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy9vbm1vdXNlb3V0XG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHByZUludGVyc2VjdCkge1xuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmICghZXhpc3QoaW50ZXJzZWN0cywgcHJlSW50ZXJzZWN0KSkge1xuICAgICAgICAgIHByZUludGVyc2VjdC5vYmplY3Qub25tb3VzZW91dChwcmVJbnRlcnNlY3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwcmVJbnRlcnNlY3RzID0gaW50ZXJzZWN0cztcbiAgICBwcmVFdmVudCA9IGV2ZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gZXhpc3QoaW50ZXJzZWN0cywgdGFyZ2V0SW50ZXJzZWN0KSB7XG4gICAgLy9pbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XG4gICAgLy8gIGlmKGludGVyc2VjdC5vYmplY3QgPT0gdGFyZ2V0SW50ZXJzZWN0Lm9iamVjdCkgcmV0dXJuIHRydWU7XG4gICAgLy99KTtcbiAgICAvL3JldHVybiBmYWxzZTtcbiAgICByZXR1cm4gKHR5cGVvZiBpbnRlcnNlY3RzWzBdID09PSAnb2JqZWN0JykgJiYgKGludGVyc2VjdHNbMF0ub2JqZWN0ID09PSB0YXJnZXRJbnRlcnNlY3Qub2JqZWN0KTtcbiAgfVxuXG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2VEb3duKTtcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2VVcCk7XG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2VNb3ZlKTtcblxuICBUSFJFRS5TY2VuZS5wcm90b3R5cGUuaGFuZGxlTW91c2VFdmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHByZUV2ZW50ICYmIGhhbmRsZU1vdXNlTW92ZShwcmVFdmVudCk7XG4gIH07XG5cbn07Il19
