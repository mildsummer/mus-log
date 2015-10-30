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
      //console.log(this.frames.children[0].geometry.vertices[0]);
      this.frames.children.forEach(function (frame) {
        var face = frame.geometry.faces[0];
        frame.geometry.vertices.forEach(function (vertex) {
          vertex.mix(face.normal, 0.1).setLength(vertex.originalLength);
        });
        frame.geometry.verticesNeedUpdate = true;
        frame.geometry.computeFaceNormals();
      });

      return this;
    }
  }, {
    key: 'rotate',
    value: function rotate() {
      this.frames.rotation.set(0, this.count / 200, 0);
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
      var _this3 = this;

      var image = new Image();
      image.onload = function () {
        contribution.texture = Embryo.createTexture(image);
        _this3.data.push(contribution);
        _this3.clear().create(callback); //リセット
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
      //'      gl_FragColor = vec4((vPosition.x / 100.0 + 1.0) / 2.0, (vPosition.y / 100.0 + 1.0) / 2.0, 0, 0);' +
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
        //url: '/contributes/all',
        url: './javascripts/all.json',
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvQ29udmV4R2VvbWV0cnkuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvZW1icnlvLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy9tYWluLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNtQkEsS0FBSyxDQUFDLGNBQWMsR0FBRyxVQUFVLFFBQVEsRUFBRzs7QUFFM0MsTUFBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7O0FBRTVCLEtBQUksS0FBSyxHQUFHLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV6QyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRzs7QUFFNUMsVUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO0VBRWQ7O0FBR0QsVUFBUyxRQUFRLENBQUUsUUFBUSxFQUFHOztBQUU3QixNQUFJLE1BQU0sR0FBRyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRTFDLE1BQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxN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TUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTdCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWYsSUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVmLFNBQU8sRUFBRSxDQUFDO0VBRVY7Ozs7Ozs7QUFPRCxVQUFTLFNBQVMsQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFHOztBQUU1QixTQUFPLEVBQUUsQ0FBRSxDQUFDLENBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFFLElBQUksRUFBRSxDQUFFLENBQUMsQ0FBRSxLQUFLLEVBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVsRDs7Ozs7QUFLRCxVQUFTLFlBQVksR0FBRzs7QUFFdkIsU0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUEsR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0VBRTFDOzs7OztBQU1ELFVBQVMsUUFBUSxDQUFFLE1BQU0sRUFBRzs7QUFFM0IsTUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzFCLFNBQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUM7RUFFM0Q7OztBQUdELEtBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLEtBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUss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QUM7R0FDakc7O0FBRUQsWUFBVSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUMxRCxZQUFVLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ3RELFlBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUM7O0FBRTFELE9BQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDbEQsWUFBUSxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztHQUN2QyxDQUFDO0NBRUgsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBhdXRob3IgcWlhbyAvIGh0dHBzOi8vZ2l0aHViLmNvbS9xaWFvXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgYSBjb252ZXggaHVsbCBnZW5lcmF0b3IgdXNpbmcgdGhlIGluY3JlbWVudGFsIG1ldGhvZC4gXG4gKiBUaGUgY29tcGxleGl0eSBpcyBPKG5eMikgd2hlcmUgbiBpcyB0aGUgbnVtYmVyIG9mIHZlcnRpY2VzLlxuICogTyhubG9nbikgYWxnb3JpdGhtcyBkbyBleGlzdCwgYnV0IHRoZXkgYXJlIG11Y2ggbW9yZSBjb21wbGljYXRlZC5cbiAqXG4gKiBCZW5jaG1hcms6IFxuICpcbiAqICBQbGF0Zm9ybTogQ1BVOiBQNzM1MCBAMi4wMEdIeiBFbmdpbmU6IFY4XG4gKlxuICogIE51bSBWZXJ0aWNlc1x0VGltZShtcylcbiAqXG4gKiAgICAgMTAgICAgICAgICAgIDFcbiAqICAgICAyMCAgICAgICAgICAgM1xuICogICAgIDMwICAgICAgICAgICAxOVxuICogICAgIDQwICAgICAgICAgICA0OFxuICogICAgIDUwICAgICAgICAgICAxMDdcbiAqL1xuXG5USFJFRS5Db252ZXhHZW9tZXRyeSA9IGZ1bmN0aW9uKCB2ZXJ0aWNlcyApIHtcblxuXHRUSFJFRS5HZW9tZXRyeS5jYWxsKCB0aGlzICk7XG5cblx0dmFyIGZhY2VzID0gWyBbIDAsIDEsIDIgXSwgWyAwLCAyLCAxIF0gXTsgXG5cblx0Zm9yICggdmFyIGkgPSAzOyBpIDwgdmVydGljZXMubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0YWRkUG9pbnQoIGkgKTtcblxuXHR9XG5cblxuXHRmdW5jdGlvbiBhZGRQb2ludCggdmVydGV4SWQgKSB7XG5cblx0XHR2YXIgdmVydGV4ID0gdmVydGljZXNbIHZlcnRleElkIF0uY2xvbmUoKTtcblxuXHRcdHZhciBtYWcgPSB2ZXJ0ZXgubGVuZ3RoKCk7XG5cdFx0dmVydGV4LnggKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cdFx0dmVydGV4LnkgKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cdFx0dmVydGV4LnogKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cblx0XHR2YXIgaG9sZSA9IFtdO1xuXG5cdFx0Zm9yICggdmFyIGYgPSAwOyBmIDwgZmFjZXMubGVuZ3RoOyApIHtcblxuXHRcdFx0dmFyIGZhY2UgPSBmYWNlc1sgZiBdO1xuXG5cdFx0XHQvLyBmb3IgZWFjaCBmYWNlLCBpZiB0aGUgdmVydGV4IGNhbiBzZWUgaXQsXG5cdFx0XHQvLyB0aGVuIHdlIHRyeSB0byBhZGQgdGhlIGZhY2UncyBlZGdlcyBpbnRvIHRoZSBob2xlLlxuXHRcdFx0aWYgKCB2aXNpYmxlKCBmYWNlLCB2ZXJ0ZXggKSApIHtcblxuXHRcdFx0XHRmb3IgKCB2YXIgZSA9IDA7IGUgPCAzOyBlICsrICkge1xuXG5cdFx0XHRcdFx0dmFyIGVkZ2UgPSBbIGZhY2VbIGUgXSwgZmFjZVsgKCBlICsgMSApICUgMyBdIF07XG5cdFx0XHRcdFx0dmFyIGJvdW5kYXJ5ID0gdHJ1ZTtcblxuXHRcdFx0XHRcdC8vIHJlbW92ZSBkdXBsaWNhdGVkIGVkZ2VzLlxuXHRcdFx0XHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xuXG5cdFx0XHRcdFx0XHRpZiAoIGVxdWFsRWRnZSggaG9sZVsgaCBdLCBlZGdlICkgKSB7XG5cblx0XHRcdFx0XHRcdFx0aG9sZVsgaCBdID0gaG9sZVsgaG9sZS5sZW5ndGggLSAxIF07XG5cdFx0XHRcdFx0XHRcdGhvbGUucG9wKCk7XG5cdFx0XHRcdFx0XHRcdGJvdW5kYXJ5ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIGJvdW5kYXJ5ICkge1xuXG5cdFx0XHRcdFx0XHRob2xlLnB1c2goIGVkZ2UgKTtcblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gcmVtb3ZlIGZhY2VzWyBmIF1cblx0XHRcdFx0ZmFjZXNbIGYgXSA9IGZhY2VzWyBmYWNlcy5sZW5ndGggLSAxIF07XG5cdFx0XHRcdGZhY2VzLnBvcCgpO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIG5vdCB2aXNpYmxlXG5cblx0XHRcdFx0ZiArKztcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0Ly8gY29uc3RydWN0IHRoZSBuZXcgZmFjZXMgZm9ybWVkIGJ5IHRoZSBlZGdlcyBvZiB0aGUgaG9sZSBhbmQgdGhlIHZlcnRleFxuXHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xuXG5cdFx0XHRmYWNlcy5wdXNoKCBbIFxuXHRcdFx0XHRob2xlWyBoIF1bIDAgXSxcblx0XHRcdFx0aG9sZVsgaCBdWyAxIF0sXG5cdFx0XHRcdHZlcnRleElkXG5cdFx0XHRdICk7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBXaGV0aGVyIHRoZSBmYWNlIGlzIHZpc2libGUgZnJvbSB0aGUgdmVydGV4XG5cdCAqL1xuXHRmdW5jdGlvbiB2aXNpYmxlKCBmYWNlLCB2ZXJ0ZXggKSB7XG5cblx0XHR2YXIgdmEgPSB2ZXJ0aWNlc1sgZmFjZVsgMCBdIF07XG5cdFx0dmFyIHZiID0gdmVydGljZXNbIGZhY2VbIDEgXSBdO1xuXHRcdHZhciB2YyA9IHZlcnRpY2VzWyBmYWNlWyAyIF0gXTtcblxuXHRcdHZhciBuID0gbm9ybWFsKCB2YSwgdmIsIHZjICk7XG5cblx0XHQvLyBkaXN0YW5jZSBmcm9tIGZhY2UgdG8gb3JpZ2luXG5cdFx0dmFyIGRpc3QgPSBuLmRvdCggdmEgKTtcblxuXHRcdHJldHVybiBuLmRvdCggdmVydGV4ICkgPj0gZGlzdDsgXG5cblx0fVxuXG5cdC8qKlxuXHQgKiBGYWNlIG5vcm1hbFxuXHQgKi9cblx0ZnVuY3Rpb24gbm9ybWFsKCB2YSwgdmIsIHZjICkge1xuXG5cdFx0dmFyIGNiID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblx0XHR2YXIgYWIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdFx0Y2Iuc3ViVmVjdG9ycyggdmMsIHZiICk7XG5cdFx0YWIuc3ViVmVjdG9ycyggdmEsIHZiICk7XG5cdFx0Y2IuY3Jvc3MoIGFiICk7XG5cblx0XHRjYi5ub3JtYWxpemUoKTtcblxuXHRcdHJldHVybiBjYjtcblxuXHR9XG5cblx0LyoqXG5cdCAqIERldGVjdCB3aGV0aGVyIHR3byBlZGdlcyBhcmUgZXF1YWwuXG5cdCAqIE5vdGUgdGhhdCB3aGVuIGNvbnN0cnVjdGluZyB0aGUgY29udmV4IGh1bGwsIHR3byBzYW1lIGVkZ2VzIGNhbiBvbmx5XG5cdCAqIGJlIG9mIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBlcXVhbEVkZ2UoIGVhLCBlYiApIHtcblxuXHRcdHJldHVybiBlYVsgMCBdID09PSBlYlsgMSBdICYmIGVhWyAxIF0gPT09IGViWyAwIF07IFxuXG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGEgcmFuZG9tIG9mZnNldCBiZXR3ZWVuIC0xZS02IGFuZCAxZS02LlxuXHQgKi9cblx0ZnVuY3Rpb24gcmFuZG9tT2Zmc2V0KCkge1xuXG5cdFx0cmV0dXJuICggTWF0aC5yYW5kb20oKSAtIDAuNSApICogMiAqIDFlLTY7XG5cblx0fVxuXG5cblx0LyoqXG5cdCAqIFhYWDogTm90IHN1cmUgaWYgdGhpcyBpcyB0aGUgY29ycmVjdCBhcHByb2FjaC4gTmVlZCBzb21lb25lIHRvIHJldmlldy5cblx0ICovXG5cdGZ1bmN0aW9uIHZlcnRleFV2KCB2ZXJ0ZXggKSB7XG5cblx0XHR2YXIgbWFnID0gdmVydGV4Lmxlbmd0aCgpO1xuXHRcdHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMiggdmVydGV4LnggLyBtYWcsIHZlcnRleC55IC8gbWFnICk7XG5cblx0fVxuXG5cdC8vIFB1c2ggdmVydGljZXMgaW50byBgdGhpcy52ZXJ0aWNlc2AsIHNraXBwaW5nIHRob3NlIGluc2lkZSB0aGUgaHVsbFxuXHR2YXIgaWQgPSAwO1xuXHR2YXIgbmV3SWQgPSBuZXcgQXJyYXkoIHZlcnRpY2VzLmxlbmd0aCApOyAvLyBtYXAgZnJvbSBvbGQgdmVydGV4IGlkIHRvIG5ldyBpZFxuXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdCB2YXIgZmFjZSA9IGZhY2VzWyBpIF07XG5cblx0XHQgZm9yICggdmFyIGogPSAwOyBqIDwgMzsgaiArKyApIHtcblxuXHRcdFx0aWYgKCBuZXdJZFsgZmFjZVsgaiBdIF0gPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0XHRuZXdJZFsgZmFjZVsgaiBdIF0gPSBpZCArKztcblx0XHRcdFx0dGhpcy52ZXJ0aWNlcy5wdXNoKCB2ZXJ0aWNlc1sgZmFjZVsgaiBdIF0gKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRmYWNlWyBqIF0gPSBuZXdJZFsgZmFjZVsgaiBdIF07XG5cblx0XHQgfVxuXG5cdH1cblxuXHQvLyBDb252ZXJ0IGZhY2VzIGludG8gaW5zdGFuY2VzIG9mIFRIUkVFLkZhY2UzXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdHRoaXMuZmFjZXMucHVzaCggbmV3IFRIUkVFLkZhY2UzKCBcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMCBdLFxuXHRcdFx0XHRmYWNlc1sgaSBdWyAxIF0sXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDIgXVxuXHRcdCkgKTtcblxuXHR9XG5cblx0Ly8gQ29tcHV0ZSBVVnNcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5mYWNlcy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHR2YXIgZmFjZSA9IHRoaXMuZmFjZXNbIGkgXTtcblxuXHRcdHRoaXMuZmFjZVZlcnRleFV2c1sgMCBdLnB1c2goIFtcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmEgXSApLFxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYiBdICksXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5jIF0gKVxuXHRcdF0gKTtcblxuXHR9XG5cblx0dGhpcy5jb21wdXRlRmFjZU5vcm1hbHMoKTtcblx0dGhpcy5jb21wdXRlVmVydGV4Tm9ybWFscygpO1xuXG59O1xuXG5USFJFRS5Db252ZXhHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5HZW9tZXRyeS5wcm90b3R5cGUgKTtcblRIUkVFLkNvbnZleEdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRIUkVFLkNvbnZleEdlb21ldHJ5O1xuIiwiaW1wb3J0ICcuL3RocmVlLW1vdXNlLWV2ZW50LmVzNic7XG5pbXBvcnQgJy4vQ29udmV4R2VvbWV0cnknO1xuXG5USFJFRS5WZWN0b3IzLnByb3RvdHlwZS5taXggPSBmdW5jdGlvbih5LCBhKSB7XG4gIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKDEgLSBhKS5hZGQoeS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKGEpKVxufTtcblxuY2xhc3MgRW1icnlvIHtcblxuICBjb25zdHJ1Y3RvcihkYXRhLCBjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpIHtcblxuICAgIC8vKiBkYXRhIDogYXJyYXkgb2YgY29udHJpYnV0aW9uc1xuICAgIC8vKiBjb250cmlidXRpb25cbiAgICAvLyoge1xuICAgIC8vKiAgIGltYWdlOiBET01JbWFnZVxuICAgIC8vKiAgIHRleHQ6IFN0cmluZ1xuICAgIC8vKiB9XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcblxuICAgIC8v44OG44Kv44K544OB44Oj44Gu5L2c5oiQXG4gICAgdmFyIGxvYWRlZE51bSA9IDA7XG4gICAgZGF0YS5mb3JFYWNoKChjb250cmlidXRpb24sIGluZGV4KSA9PiB7XG4gICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XG4gICAgICAgIHRoaXMuZGF0YVtpbmRleF0udGV4dHVyZSA9IHRleHR1cmU7XG4gICAgICAgIGxvYWRlZE51bSsrO1xuICAgICAgICBpZihsb2FkZWROdW0gPT09IGRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5pbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBpbWFnZS5zcmMgPSBjb250cmlidXRpb24uYmFzZTY0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfVxuXG4gIGluaXRpYWxpemUoY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgLy9pbml0IHNjZW5lXG4gICAgdmFyIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG5cbiAgICAvL2luaXQgY2FtZXJhXG4gICAgdmFyIGZvdiA9IDYwO1xuICAgIHZhciBhc3BlY3QgPSB3aWR0aCAvIGhlaWdodDtcbiAgICB2YXIgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0KTtcbiAgICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIChoZWlnaHQgLyAyKSAvIE1hdGgudGFuKChmb3YgKiBNYXRoLlBJIC8gMTgwKSAvIDIpKTtcbiAgICBjYW1lcmEubG9va0F0KG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApKTtcbiAgICBzY2VuZS5hZGQoY2FtZXJhKTtcblxuICAgIC8vaW5pdCByZW5kZXJlclxuICAgIHZhciByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHthbHBoYTogdHJ1ZSwgYW50aWFsaWFzOiB0cnVlfSk7XG4gICAgcmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICByZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4Y2NjY2NjLCAwKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAvL2luaXQgY29udHJvbHNcbiAgICB2YXIgY29udHJvbHMgPSBuZXcgVEhSRUUuVHJhY2tiYWxsQ29udHJvbHMoY2FtZXJhLCByZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgIC8vd2F0Y2ggbW91c2UgZXZlbnRzXG4gICAgc2NlbmUud2F0Y2hNb3VzZUV2ZW50KHJlbmRlcmVyLmRvbUVsZW1lbnQsIGNhbWVyYSk7XG5cbiAgICB0aGlzLnNjZW5lID0gc2NlbmU7XG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgdGhpcy5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICAgIHRoaXMuY29udHJvbHMgPSBjb250cm9scztcblxuICAgIC8v55Sf5oiQXG4gICAgdGhpcy5jcmVhdGUoKTtcblxuICAgIHRoaXMuY291bnQgPSAwO1xuXG4gICAgY29uc29sZS5sb2codGhpcy5mcmFtZXMpO1xuXG4gICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgICBjb250cm9scy51cGRhdGUoKTtcbiAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICAgIC8vc2NlbmUuaGFuZGxlTW91c2VFdmVudCgpO1xuICAgICAgdGhpcy5jb3VudCsrO1xuICAgICAgdGhpcy5tb3ZlVmVydGljZXMoKS5yb3RhdGUoKTtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh1cGRhdGUpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB1cGRhdGUoKTtcblxuICAgIHJldHVybiB0aGlzO1xuXG4gIH1cblxuICBjcmVhdGUoY2FsbGJhY2spIHtcbiAgICB0aGlzLmdlb21ldHJ5ID0gRW1icnlvLmNyZWF0ZUdlb21ldHJ5KDEwMCwgdGhpcy5kYXRhLmxlbmd0aCk7XG4gICAgdGhpcy5mcmFtZXMgPSBFbWJyeW8uY3JlYXRlRnJhbWVzKHRoaXMuZ2VvbWV0cnksIHRoaXMuZGF0YSk7XG4gICAgdGhpcy5mcmFtZXMuY2hpbGRyZW4uZm9yRWFjaCgoZnJhbWUpID0+IHsvL+ODnuOCpuOCueOCpOODmeODs+ODiOOBruioreWumlxuICAgICAgZnJhbWUub25jbGljayA9IChpbnRlcnNlY3QpID0+IHtcbiAgICAgICAgaWYodHlwZW9mIHRoaXMub25zZWxlY3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLm9uc2VsZWN0KGZyYW1lLmRhdGEpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgLy9mcmFtZS5vbm1vdXNlb3ZlciA9IChpbnRlcnNlY3QpID0+IHtcbiAgICAgIC8vICBpbnRlcnNlY3QuZmFjZS5tb3VzZW9uID0gdHJ1ZTtcbiAgICAgIC8vfTtcbiAgICB9KTtcbiAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLmZyYW1lcyk7XG4gICAgdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nICYmIGNhbGxiYWNrKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8v5LiJ6KeS44Gu6Z2i44Gn5qeL5oiQ44GV44KM44KL5aSa6Z2i5L2T44Gu5L2c5oiQXG4gIHN0YXRpYyBjcmVhdGVHZW9tZXRyeShyYWRpdXMsIHN1cmZhY2VOdW1iZXIpIHtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgPCA0KSA/IDQgOiBzdXJmYWNlTnVtYmVyOy8v77yU5Lul5LiL44Gv5LiN5Y+vXG4gICAgc3VyZmFjZU51bWJlciA9IChzdXJmYWNlTnVtYmVyICYgMSkgPyAoc3VyZmFjZU51bWJlciArIDEpIDogc3VyZmFjZU51bWJlcjsvL+Wlh+aVsOOBr+S4jeWPryjjgojjgorlpKfjgY3jgYTlgbbmlbDjgavnm7TjgZkpXG4gICAgZm9yKHZhciBpID0gMCwgbCA9ICgyICsgc3VyZmFjZU51bWJlciAvIDIpOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2ZXJ0aWNlc1tpXSA9IG5ldyBUSFJFRS5WZWN0b3IzKE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUpOy8v55CD54q244Gr44Op44Oz44OA44Og44Gr54K544KS5omT44GkXG4gICAgICB2ZXJ0aWNlc1tpXS5zZXRMZW5ndGgocmFkaXVzKTtcbiAgICAgIHZlcnRpY2VzW2ldLm9yaWdpbmFsTGVuZ3RoID0gcmFkaXVzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFRIUkVFLkNvbnZleEdlb21ldHJ5KHZlcnRpY2VzKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVGcmFtZXMoZ2VvbWV0cnksIGRhdGEpIHtcbiAgICB2YXIgdmVydGV4dFNoYWRlciA9ICcnICtcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xuICAgICAgJ3ZvaWQgbWFpbigpIHsnICtcbiAgICAgICcgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdHJpeCAqIHZpZXdNYXRyaXggKiBtb2RlbE1hdHJpeCAqIHZlYzQocG9zaXRpb24sIDEuMCk7JyArXG4gICAgICAnICB2UG9zaXRpb24gPSBnbF9Qb3NpdGlvbjsnICtcbiAgICAgICd9JztcblxuICAgIHZhciBmcmFnbWVudFNoYWRlciA9ICcnICtcbiAgICAgICd1bmlmb3JtIHNhbXBsZXIyRCB0ZXh0dXJlOycgK1xuICAgICAgJ3VuaWZvcm0gZmxvYXQgb3BhY2l0eTsnICtcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xuICAgICAgJ3ZvaWQgbWFpbih2b2lkKXsnICtcbiAgICAgICcgIHZlYzQgdGV4dHVyZUNvbG9yID0gdGV4dHVyZTJEKHRleHR1cmUsIHZlYzIoKDEuMCArIHZQb3NpdGlvbi54IC8gMTAwLjApIC8gMi4wLCAoMS4wICsgdlBvc2l0aW9uLnkgLyAxMDAuMCkgLyAyLjApKTsnICtcbiAgICAgICcgIHRleHR1cmVDb2xvci53ID0gb3BhY2l0eTsnICtcbiAgICAgICcgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmVDb2xvcjsnICtcbiAgICAgIC8vJyAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoKHZQb3NpdGlvbi54IC8gMTAwLjAgKyAxLjApIC8gMi4wLCAodlBvc2l0aW9uLnkgLyAxMDAuMCArIDEuMCkgLyAyLjAsIDAsIDApOycgK1xuICAgICAgJ30nO1xuXG4gICAgdmFyIGZyYW1lcyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIGdlb21ldHJ5LmZhY2VzLmZvckVhY2goZnVuY3Rpb24oZmFjZSwgaW5kZXgpIHtcbiAgICAgIHZhciBhID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5hXSwgYiA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl0sIGMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAvL2NyZWF0ZSBnZW9tZXRyeVxuICAgICAgdmFyIGZyYW1lR2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcbiAgICAgIGZyYW1lR2VvbWV0cnkudmVydGljZXMgPSBbYSwgYiwgY107XG4gICAgICBmcmFtZUdlb21ldHJ5LmZhY2VzID0gW25ldyBUSFJFRS5GYWNlMygwLCAxLCAyKV07XG4gICAgICBmcmFtZUdlb21ldHJ5LmNvbXB1dGVGYWNlTm9ybWFscygpO1xuICAgICAgZnJhbWVHZW9tZXRyeS5jb21wdXRlVmVydGV4Tm9ybWFscygpO1xuXG4gICAgICAvL2NyZWF0ZSBtYXRlcmlhbFxuICAgICAgdmFyIGZyYW1lTWF0ZXJpYWwgPSBuZXcgVEhSRUUuU2hhZGVyTWF0ZXJpYWwoe1xuICAgICAgICB2ZXJ0ZXhTaGFkZXI6IHZlcnRleHRTaGFkZXIsXG4gICAgICAgIGZyYWdtZW50U2hhZGVyOiBmcmFnbWVudFNoYWRlcixcbiAgICAgICAgdW5pZm9ybXM6IHtcbiAgICAgICAgICB0ZXh0dXJlOiB7IHR5cGU6IFwidFwiLCB2YWx1ZTogZGF0YVtpbmRleF0gPyBkYXRhW2luZGV4XS50ZXh0dXJlIDogbnVsbCB9LFxuICAgICAgICAgIG9wYWNpdHk6IHsgdHlwZTogXCJmXCIsIHZhbHVlOiAxLjAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChmcmFtZUdlb21ldHJ5LCBmcmFtZU1hdGVyaWFsKTtcbiAgICAgIG1lc2guZGF0YSA9IGRhdGFbaW5kZXhdO1xuXG4gICAgICBmcmFtZXMuYWRkKG1lc2gpO1xuICAgIH0pO1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlVGV4dHVyZShpbWFnZSkge1xuICAgIHZhciB0ZXh0dXJlID0gbmV3IFRIUkVFLlRleHR1cmUodGhpcy5nZXRTdWl0YWJsZUltYWdlKGltYWdlKSk7XG4gICAgLy90ZXh0dXJlLm1hZ0ZpbHRlciA9IHRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcbiAgICB0ZXh0dXJlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gdGV4dHVyZTtcbiAgfVxuXG4gIC8v55S75YOP44K144Kk44K644KS6Kq/5pW0XG4gIHN0YXRpYyBnZXRTdWl0YWJsZUltYWdlKGltYWdlKSB7XG4gICAgdmFyIHcgPSBpbWFnZS5uYXR1cmFsV2lkdGgsIGggPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xuICAgIHZhciBzaXplID0gTWF0aC5wb3coMiwgTWF0aC5sb2coTWF0aC5taW4odywgaCkpIC8gTWF0aC5MTjIgfCAwKTsgLy8gbGFyZ2VzdCAyXm4gaW50ZWdlciB0aGF0IGRvZXMgbm90IGV4Y2VlZFxuICAgIGlmICh3ICE9PSBoIHx8IHcgIT09IHNpemUpIHtcbiAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIHZhciBvZmZzZXRYID0gaCAvIHcgPiAxID8gMCA6ICh3IC0gaCkgLyAyO1xuICAgICAgdmFyIG9mZnNldFkgPSBoIC8gdyA+IDEgPyAoaCAtIHcpIC8gMiA6IDA7XG4gICAgICB2YXIgY2xpcFNpemUgPSBoIC8gdyA+IDEgPyB3IDogaDtcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMud2lkdGggPSBzaXplO1xuICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKGltYWdlLCBvZmZzZXRYLCBvZmZzZXRZLCBjbGlwU2l6ZSwgY2xpcFNpemUsIDAsIDAsIHNpemUsIHNpemUpO1xuICAgICAgaW1hZ2UgPSBjYW52YXM7XG4gICAgfVxuICAgIHJldHVybiBpbWFnZTtcbiAgfVxuXG4gIG1vdmVWZXJ0aWNlcygpIHtcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuZnJhbWVzLmNoaWxkcmVuWzBdLmdlb21ldHJ5LnZlcnRpY2VzWzBdKTtcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICB2YXIgZmFjZSA9IGZyYW1lLmdlb21ldHJ5LmZhY2VzWzBdO1xuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXMuZm9yRWFjaChmdW5jdGlvbih2ZXJ0ZXgpIHtcbiAgICAgICAgdmVydGV4Lm1peChmYWNlLm5vcm1hbCwgMC4xKS5zZXRMZW5ndGgodmVydGV4Lm9yaWdpbmFsTGVuZ3RoKTtcbiAgICB9KTtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LnZlcnRpY2VzTmVlZFVwZGF0ZSA9IHRydWU7XG4gICAgICBmcmFtZS5nZW9tZXRyeS5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcm90YXRlKCkge1xuICAgIHRoaXMuZnJhbWVzLnJvdGF0aW9uLnNldCgwLCB0aGlzLmNvdW50LzIwMCwgMCk7XG4gIH1cblxuICAvKlxuICAgIHRocmVlLmpz44Kq44OW44K444Kn44Kv44OI44Gu5YmK6ZmkXG4gICAqL1xuICBjbGVhcigpIHtcbiAgICB0aGlzLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICBmcmFtZS5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgICBmcmFtZS5tYXRlcmlhbC5kaXNwb3NlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5zY2VuZS5yZW1vdmUodGhpcy5mcmFtZXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgIGNvbnRyaWJ1dGlvbuOBrui/veWKoFxuICAgIEBwYXJhbSBjb250cmlidXRpb24ge09iamVjdH0g5oqV56i/XG4gICAqL1xuICBhZGRDb250cmlidXRpb24oY29udHJpYnV0aW9uLCBjYWxsYmFjaykge1xuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgIGNvbnRyaWJ1dGlvbi50ZXh0dXJlID0gRW1icnlvLmNyZWF0ZVRleHR1cmUoaW1hZ2UpO1xuICAgICAgdGhpcy5kYXRhLnB1c2goY29udHJpYnV0aW9uKTtcbiAgICAgIHRoaXMuY2xlYXIoKS5jcmVhdGUoY2FsbGJhY2spOy8v44Oq44K744OD44OIXG4gICAgfTtcbiAgICBpbWFnZS5zcmMgPSBjb250cmlidXRpb24uYmFzZTY0O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRTaXplKHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgdGhpcy5jYW1lcmEuYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgdGhpcy5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgRW1icnlvOyIsImltcG9ydCBFbWJyeW8gZnJvbSAnLi9lbWJyeW8uZXM2JztcblxuKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgZW1icnlvO1xuXG4gIC8vYW5ndWxhciB0ZXN0XG4gIGFuZ3VsYXIubW9kdWxlKCdteVNlcnZpY2VzJywgW10pXG4gICAgLnNlcnZpY2UoJ2ltYWdlU2VhcmNoJywgWyckaHR0cCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuICAgICAgdGhpcy5nZXRJbWFnZXMgPSBmdW5jdGlvbiAocXVlcnksIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xuICAgICAgICB2YXIgdXJsID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2N1c3RvbXNlYXJjaC92MT9rZXk9QUl6YVN5Q0xSZmV1UjA2Uk5QS2J3RmdvT25ZMHplMElLRVNGN0t3JmN4PTAwMTU1NjU2ODk0MzU0NjgzODM1MDowYmRpZ3JkMXg4aSZzZWFyY2hUeXBlPWltYWdlJnE9JztcbiAgICAgICAgcXVlcnkgPSBlbmNvZGVVUklDb21wb25lbnQocXVlcnkucmVwbGFjZSgvXFxzKy9nLCAnICcpKTtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIHVybDogdXJsICsgcXVlcnksXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJ1xuICAgICAgICB9KVxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgaXRlbXMgPSBpdGVtcy5jb25jYXQoZGF0YS5pdGVtcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XG4gICAgICAgICAgICBpZihpdGVtcy5sZW5ndGggPT09IDIwKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGl0ZW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgdXJsID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2N1c3RvbXNlYXJjaC92MT9rZXk9QUl6YVN5Q0xSZmV1UjA2Uk5QS2J3RmdvT25ZMHplMElLRVNGN0t3JmN4PTAwMTU1NjU2ODk0MzU0NjgzODM1MDowYmRpZ3JkMXg4aSZzZWFyY2hUeXBlPWltYWdlJnN0YXJ0PTExJnE9JztcbiAgICAgICAgcXVlcnkgPSBlbmNvZGVVUklDb21wb25lbnQocXVlcnkucmVwbGFjZSgvXFxzKy9nLCAnICcpKTtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIHVybDogdXJsICsgcXVlcnksXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJ1xuICAgICAgICB9KVxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgaXRlbXMgPSBpdGVtcy5jb25jYXQoZGF0YS5pdGVtcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XG4gICAgICAgICAgICBpZihpdGVtcy5sZW5ndGggPT09IDIwKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGl0ZW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfV0pXG4gICAgLnNlcnZpY2UoJ2NvbnRyaWJ1dGVzJywgWyckaHR0cCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIC8vdXJsOiAnL2NvbnRyaWJ1dGVzL2FsbCcsXG4gICAgICAgICAgdXJsOiAnLi9qYXZhc2NyaXB0cy9hbGwuanNvbicsXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJ1xuICAgICAgICB9KVxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBhbGVydChkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgdGhpcy5zdWJtaXQgPSBmdW5jdGlvbiAoY29udHJpYnV0aW9uLCBjYWxsYmFjaykge1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgdXJsOiAnL2NvbnRyaWJ1dGVzL3Bvc3QnLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IGNvbnRyaWJ1dGlvblxuICAgICAgICB9KVxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBhbGVydChkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1dKTtcblxuICBhbmd1bGFyLm1vZHVsZShcImVtYnJ5b1wiLCBbJ215U2VydmljZXMnXSlcbiAgICAuY29udHJvbGxlcignbXlDdHJsJywgWyckc2NvcGUnLCAnaW1hZ2VTZWFyY2gnLCAnY29udHJpYnV0ZXMnLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZVNlYXJjaCwgY29udHJpYnV0ZXMpIHtcbiAgICAgIC8vY29udGlidXRpb25z44KS5Y+W5b6XXG4gICAgICBjb250cmlidXRlcy5nZXRBbGwoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbnMgPSBkYXRhO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnLmVtYnJ5by10aHJlZScpO1xuICAgICAgICB2YXIgY29udHJpYnV0aW9uSW1hZ2UgPSAkKCcuZW1icnlvLWNvbnRyaWJ1dGlvbi1pbWFnZScpO1xuICAgICAgICBlbWJyeW8gPSBuZXcgRW1icnlvKGRhdGEsIGNvbnRhaW5lci5nZXQoMCksIGNvbnRhaW5lci53aWR0aCgpLCBjb250YWluZXIuaGVpZ2h0KCkpO1xuICAgICAgICB3aW5kb3cuZW1icnlvID0gZW1icnlvO1xuICAgICAgICBlbWJyeW8ub25zZWxlY3QgPSBmdW5jdGlvbiAoY29udHJpYnV0aW9uKSB7XG4gICAgICAgICAgaWYgKCRzY29wZS5oYXNTZWxlY3RlZCkge1xuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID0gJ2hpZGRlbic7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wbHVzQnV0dG9uID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5jc3Moe1xuICAgICAgICAgICAgICAnLXdlYmtpdC1maWx0ZXInOiAnYmx1cigwcHgpJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250cmlidXRpb25JbWFnZS5jc3Moe1xuICAgICAgICAgICAgICAnb3BhY2l0eSc6IDBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICdzaG93bic7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wbHVzQnV0dG9uID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRDb250cmlidXRpb24gPSBjb250cmlidXRpb247XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICBjb250cmlidXRpb25JbWFnZS5jc3Moe1xuICAgICAgICAgICAgICAnYmFja2dyb3VuZEltYWdlJzogJ3VybCgnICsgY29udHJpYnV0aW9uLmJhc2U2NCArICcpJyxcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRTaXplJzogJ2NvdmVyJyxcbiAgICAgICAgICAgICAgJ29wYWNpdHknOiAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5jc3Moe1xuICAgICAgICAgICAgICAnLXdlYmtpdC1maWx0ZXInOiAnYmx1cigxMHB4KSdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS52aXNpYmlsaXR5ID0ge1xuICAgICAgICBwb3N0OiBmYWxzZSxcbiAgICAgICAgcGx1c0J1dHRvbjogdHJ1ZSxcbiAgICAgICAgY29udHJpYnV0aW9uRGV0YWlsczogJ2hpZGRlbicsXG4gICAgICAgIHBvc3RTZWFyY2g6IHRydWUsXG4gICAgICAgIHBvc3RDb250cmlidXRlOiBmYWxzZSxcbiAgICAgICAgcG9zdExvYWRpbmc6IGZhbHNlXG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUucXVlcnkgPSAnc2t5JztcblxuICAgICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLml0ZW1zID0gW107XG4gICAgICAgIGltYWdlU2VhcmNoLmdldEltYWdlcygkc2NvcGUucXVlcnksIGZ1bmN0aW9uIChpdGVtcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcbiAgICAgICAgICAkc2NvcGUuaXRlbXMgPSBpdGVtcztcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICRzY29wZS5zZWxlY3RlZEl0ZW0gPSBpdGVtO1xuICAgICAgICAkc2NvcGUudXJsID0gaXRlbS5saW5rO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gZmFsc2U7XG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnRleHQgPSAkc2NvcGUucXVlcnk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHt0ZXh0OiAkc2NvcGUudGV4dCwgdXJsOiAkc2NvcGUudXJsfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAvL+aKleeov+OBrui/veWKoFxuICAgICAgICAgICRzY29wZS5jb250cmlidXRpb25zLnB1c2goZGF0YSk7XG4gICAgICAgICAgZW1icnlvLmFkZENvbnRyaWJ1dGlvbihkYXRhLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0ID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0TG9hZGluZyA9IHRydWU7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmNsb3NlTGlnaHRib3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgfTtcbiAgICAgICRzY29wZS50b2dnbGVQb3N0UGFuZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdCA9ICEkc2NvcGUudmlzaWJpbGl0eS5wb3N0O1xuICAgICAgfTtcbiAgICAgICRzY29wZS50b2dnbGVDb250cmlidXRpb25EZXRhaWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID0gJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9PSAnb3BlbmVkJyA/ICdzaG93bicgOiAnb3BlbmVkJztcbiAgICAgIH07XG4gICAgICAkc2NvcGUuYmFja1RvU2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XSk7XG5cbn0pKCk7IiwiVEhSRUUuU2NlbmUucHJvdG90eXBlLndhdGNoTW91c2VFdmVudCA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIGNhbWVyYSkge1xuICB2YXIgcHJlSW50ZXJzZWN0cyA9IFtdO1xuICB2YXIgbW91c2VEb3duSW50ZXJzZWN0cyA9IFtdO1xuICB2YXIgcHJlRXZlbnQ7XG4gIHZhciBtb3VzZURvd25Qb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VEb3duKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIC8vb25tb3VzZWRvd25cbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24ocHJlSW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gcHJlSW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vkb3duID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdC5vbm1vdXNlZG93bihwcmVJbnRlcnNlY3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1vdXNlRG93bkludGVyc2VjdHMgPSBwcmVJbnRlcnNlY3RzO1xuXG4gICAgcHJlRXZlbnQgPSBldmVudDtcbiAgICBtb3VzZURvd25Qb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IyKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VVcChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAvL29ubW91c2V1cFxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihpbnRlcnNlY3QpIHtcbiAgICAgIHZhciBvYmplY3QgPSBpbnRlcnNlY3Qub2JqZWN0O1xuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZXVwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdC5vbm1vdXNldXAoaW50ZXJzZWN0KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmKG1vdXNlRG93blBvaW50LmRpc3RhbmNlVG8obmV3IFRIUkVFLlZlY3RvcjIoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpIDwgNSkge1xuICAgICAgLy9vbmNsaWNrXG4gICAgICBtb3VzZURvd25JbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24gKGludGVyc2VjdCkge1xuICAgICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25jbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGlmIChleGlzdChwcmVJbnRlcnNlY3RzLCBpbnRlcnNlY3QpKSB7XG4gICAgICAgICAgICBvYmplY3Qub25jbGljayhpbnRlcnNlY3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJlRXZlbnQgPSBldmVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlTW92ZShldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIHZhciByZWN0ID0gZG9tRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBtb3VzZS54ID0gKChldmVudC5jbGllbnRYIC0gcmVjdC5sZWZ0KSAvIGRvbUVsZW1lbnQud2lkdGgpICogMiAtIDE7XG4gICAgbW91c2UueSA9IC0oKGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCkgLyBkb21FbGVtZW50LmhlaWdodCkgKiAyICsgMTtcblxuICAgIHZhciByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKCk7XG4gICAgcmF5Y2FzdGVyLnNldEZyb21DYW1lcmEobW91c2UsIGNhbWVyYSk7XG5cbiAgICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKF90aGlzLmNoaWxkcmVuLCB0cnVlKTtcbiAgICBpbnRlcnNlY3RzLmxlbmd0aCA9IDE7Ly/miYvliY3jga7jgqrjg5bjgrjjgqfjgq/jg4jjga7jgb9cblxuICAgIC8vY29uc29sZS5sb2coaW50ZXJzZWN0cyk7XG4gICAgaW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcbiAgICAgIHZhciBvYmplY3QgPSBpbnRlcnNlY3Qub2JqZWN0O1xuICAgICAgLy9vbm1vdXNlbW92ZVxuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZW1vdmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb2JqZWN0Lm9ubW91c2Vtb3ZlKGludGVyc2VjdCk7XG4gICAgICB9XG5cbiAgICAgIC8vb25tb3VzZW92ZXJcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2VvdmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmICghZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xuICAgICAgICAgIG9iamVjdC5vbm1vdXNlb3ZlcihpbnRlcnNlY3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvL29ubW91c2VvdXRcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24ocHJlSW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gcHJlSW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2VvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKCFleGlzdChpbnRlcnNlY3RzLCBwcmVJbnRlcnNlY3QpKSB7XG4gICAgICAgICAgcHJlSW50ZXJzZWN0Lm9iamVjdC5vbm1vdXNlb3V0KHByZUludGVyc2VjdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHByZUludGVyc2VjdHMgPSBpbnRlcnNlY3RzO1xuICAgIHByZUV2ZW50ID0gZXZlbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBleGlzdChpbnRlcnNlY3RzLCB0YXJnZXRJbnRlcnNlY3QpIHtcbiAgICAvL2ludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihpbnRlcnNlY3QpIHtcbiAgICAvLyAgaWYoaW50ZXJzZWN0Lm9iamVjdCA9PSB0YXJnZXRJbnRlcnNlY3Qub2JqZWN0KSByZXR1cm4gdHJ1ZTtcbiAgICAvL30pO1xuICAgIC8vcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiAodHlwZW9mIGludGVyc2VjdHNbMF0gPT09ICdvYmplY3QnKSAmJiAoaW50ZXJzZWN0c1swXS5vYmplY3QgPT09IHRhcmdldEludGVyc2VjdC5vYmplY3QpO1xuICB9XG5cbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZURvd24pO1xuICBkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBoYW5kbGVNb3VzZVVwKTtcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZU1vdmUpO1xuXG4gIFRIUkVFLlNjZW5lLnByb3RvdHlwZS5oYW5kbGVNb3VzZUV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcHJlRXZlbnQgJiYgaGFuZGxlTW91c2VNb3ZlKHByZUV2ZW50KTtcbiAgfTtcblxufTsiXX0=
