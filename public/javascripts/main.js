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
    value: function create() {
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
    value: function addContribution(contribution) {
      var _this3 = this;

      var image = new Image();
      image.onload = function () {
        contribution.texture = Embryo.createTexture(image);
        _this3.data.push(contribution);
        _this3.clear().create(); //リセット
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
      var url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyCLRfeuR06RNPKbwFgoOnY0ze0IKESF7Kw&cx=001556568943546838350:0bdigrd1x8i&searchType=image&q=';
      query = encodeURIComponent(query.replace(/\s+/g, ' '));
      $http({
        url: url + query,
        method: 'GET'
      }).success(function (data, status, headers, config) {
        callback(data);
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
          });
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
      contributes.submit({ text: $scope.text, url: $scope.url }, function (data) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvQ29udmV4R2VvbWV0cnkuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvZW1icnlvLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy9tYWluLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNtQkEsS0FBSyxDQUFDLGNBQWMsR0FBRyxVQUFVLFFBQVEsRUFBRzs7QUFFM0MsTUFBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7O0FBRTVCLEtBQUksS0FBSyxHQUFHLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV6QyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRzs7QUFFNUMsVUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO0VBRWQ7O0FBR0QsVUFBUyxRQUFRLENBQUUsUUFBUSxFQUFHOztBQUU3QixNQUFJLE1BQU0sR0FBRyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRTFDLE1BQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxN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TUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTdCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWYsSUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVmLFNBQU8sRUFBRSxDQUFDO0VBRVY7Ozs7Ozs7QUFPRCxVQUFTLFNBQVMsQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFHOztBQUU1QixTQUFPLEVBQUUsQ0FBRSxDQUFDLENBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFFLElBQUksRUFBRSxDQUFFLENBQUMsQ0FBRSxLQUFLLEVBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVsRDs7Ozs7QUFLRCxVQUFTLFlBQVksR0FBRzs7QUFFdkIsU0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUEsR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0VBRTFDOzs7OztBQU1ELFVBQVMsUUFBUSxDQUFFLE1BQU0sRUFBRzs7QUFFM0IsTUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzFCLFNBQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUM7RUFFM0Q7OztBQUdELEtBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLEtBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUss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QWdCLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDOztBQUUxRCxPQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxZQUFXO0FBQ2xELFlBQVEsSUFBSSxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7R0FDdkMsQ0FBQztDQUVILENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAYXV0aG9yIHFpYW8gLyBodHRwczovL2dpdGh1Yi5jb20vcWlhb1xuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIGEgY29udmV4IGh1bGwgZ2VuZXJhdG9yIHVzaW5nIHRoZSBpbmNyZW1lbnRhbCBtZXRob2QuIFxuICogVGhlIGNvbXBsZXhpdHkgaXMgTyhuXjIpIHdoZXJlIG4gaXMgdGhlIG51bWJlciBvZiB2ZXJ0aWNlcy5cbiAqIE8obmxvZ24pIGFsZ29yaXRobXMgZG8gZXhpc3QsIGJ1dCB0aGV5IGFyZSBtdWNoIG1vcmUgY29tcGxpY2F0ZWQuXG4gKlxuICogQmVuY2htYXJrOiBcbiAqXG4gKiAgUGxhdGZvcm06IENQVTogUDczNTAgQDIuMDBHSHogRW5naW5lOiBWOFxuICpcbiAqICBOdW0gVmVydGljZXNcdFRpbWUobXMpXG4gKlxuICogICAgIDEwICAgICAgICAgICAxXG4gKiAgICAgMjAgICAgICAgICAgIDNcbiAqICAgICAzMCAgICAgICAgICAgMTlcbiAqICAgICA0MCAgICAgICAgICAgNDhcbiAqICAgICA1MCAgICAgICAgICAgMTA3XG4gKi9cblxuVEhSRUUuQ29udmV4R2VvbWV0cnkgPSBmdW5jdGlvbiggdmVydGljZXMgKSB7XG5cblx0VEhSRUUuR2VvbWV0cnkuY2FsbCggdGhpcyApO1xuXG5cdHZhciBmYWNlcyA9IFsgWyAwLCAxLCAyIF0sIFsgMCwgMiwgMSBdIF07IFxuXG5cdGZvciAoIHZhciBpID0gMzsgaSA8IHZlcnRpY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdGFkZFBvaW50KCBpICk7XG5cblx0fVxuXG5cblx0ZnVuY3Rpb24gYWRkUG9pbnQoIHZlcnRleElkICkge1xuXG5cdFx0dmFyIHZlcnRleCA9IHZlcnRpY2VzWyB2ZXJ0ZXhJZCBdLmNsb25lKCk7XG5cblx0XHR2YXIgbWFnID0gdmVydGV4Lmxlbmd0aCgpO1xuXHRcdHZlcnRleC54ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xuXHRcdHZlcnRleC55ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xuXHRcdHZlcnRleC56ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xuXG5cdFx0dmFyIGhvbGUgPSBbXTtcblxuXHRcdGZvciAoIHZhciBmID0gMDsgZiA8IGZhY2VzLmxlbmd0aDsgKSB7XG5cblx0XHRcdHZhciBmYWNlID0gZmFjZXNbIGYgXTtcblxuXHRcdFx0Ly8gZm9yIGVhY2ggZmFjZSwgaWYgdGhlIHZlcnRleCBjYW4gc2VlIGl0LFxuXHRcdFx0Ly8gdGhlbiB3ZSB0cnkgdG8gYWRkIHRoZSBmYWNlJ3MgZWRnZXMgaW50byB0aGUgaG9sZS5cblx0XHRcdGlmICggdmlzaWJsZSggZmFjZSwgdmVydGV4ICkgKSB7XG5cblx0XHRcdFx0Zm9yICggdmFyIGUgPSAwOyBlIDwgMzsgZSArKyApIHtcblxuXHRcdFx0XHRcdHZhciBlZGdlID0gWyBmYWNlWyBlIF0sIGZhY2VbICggZSArIDEgKSAlIDMgXSBdO1xuXHRcdFx0XHRcdHZhciBib3VuZGFyeSA9IHRydWU7XG5cblx0XHRcdFx0XHQvLyByZW1vdmUgZHVwbGljYXRlZCBlZGdlcy5cblx0XHRcdFx0XHRmb3IgKCB2YXIgaCA9IDA7IGggPCBob2xlLmxlbmd0aDsgaCArKyApIHtcblxuXHRcdFx0XHRcdFx0aWYgKCBlcXVhbEVkZ2UoIGhvbGVbIGggXSwgZWRnZSApICkge1xuXG5cdFx0XHRcdFx0XHRcdGhvbGVbIGggXSA9IGhvbGVbIGhvbGUubGVuZ3RoIC0gMSBdO1xuXHRcdFx0XHRcdFx0XHRob2xlLnBvcCgpO1xuXHRcdFx0XHRcdFx0XHRib3VuZGFyeSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKCBib3VuZGFyeSApIHtcblxuXHRcdFx0XHRcdFx0aG9sZS5wdXNoKCBlZGdlICk7XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHJlbW92ZSBmYWNlc1sgZiBdXG5cdFx0XHRcdGZhY2VzWyBmIF0gPSBmYWNlc1sgZmFjZXMubGVuZ3RoIC0gMSBdO1xuXHRcdFx0XHRmYWNlcy5wb3AoKTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBub3QgdmlzaWJsZVxuXG5cdFx0XHRcdGYgKys7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdC8vIGNvbnN0cnVjdCB0aGUgbmV3IGZhY2VzIGZvcm1lZCBieSB0aGUgZWRnZXMgb2YgdGhlIGhvbGUgYW5kIHRoZSB2ZXJ0ZXhcblx0XHRmb3IgKCB2YXIgaCA9IDA7IGggPCBob2xlLmxlbmd0aDsgaCArKyApIHtcblxuXHRcdFx0ZmFjZXMucHVzaCggWyBcblx0XHRcdFx0aG9sZVsgaCBdWyAwIF0sXG5cdFx0XHRcdGhvbGVbIGggXVsgMSBdLFxuXHRcdFx0XHR2ZXJ0ZXhJZFxuXHRcdFx0XSApO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogV2hldGhlciB0aGUgZmFjZSBpcyB2aXNpYmxlIGZyb20gdGhlIHZlcnRleFxuXHQgKi9cblx0ZnVuY3Rpb24gdmlzaWJsZSggZmFjZSwgdmVydGV4ICkge1xuXG5cdFx0dmFyIHZhID0gdmVydGljZXNbIGZhY2VbIDAgXSBdO1xuXHRcdHZhciB2YiA9IHZlcnRpY2VzWyBmYWNlWyAxIF0gXTtcblx0XHR2YXIgdmMgPSB2ZXJ0aWNlc1sgZmFjZVsgMiBdIF07XG5cblx0XHR2YXIgbiA9IG5vcm1hbCggdmEsIHZiLCB2YyApO1xuXG5cdFx0Ly8gZGlzdGFuY2UgZnJvbSBmYWNlIHRvIG9yaWdpblxuXHRcdHZhciBkaXN0ID0gbi5kb3QoIHZhICk7XG5cblx0XHRyZXR1cm4gbi5kb3QoIHZlcnRleCApID49IGRpc3Q7IFxuXG5cdH1cblxuXHQvKipcblx0ICogRmFjZSBub3JtYWxcblx0ICovXG5cdGZ1bmN0aW9uIG5vcm1hbCggdmEsIHZiLCB2YyApIHtcblxuXHRcdHZhciBjYiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dmFyIGFiID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHRcdGNiLnN1YlZlY3RvcnMoIHZjLCB2YiApO1xuXHRcdGFiLnN1YlZlY3RvcnMoIHZhLCB2YiApO1xuXHRcdGNiLmNyb3NzKCBhYiApO1xuXG5cdFx0Y2Iubm9ybWFsaXplKCk7XG5cblx0XHRyZXR1cm4gY2I7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBEZXRlY3Qgd2hldGhlciB0d28gZWRnZXMgYXJlIGVxdWFsLlxuXHQgKiBOb3RlIHRoYXQgd2hlbiBjb25zdHJ1Y3RpbmcgdGhlIGNvbnZleCBodWxsLCB0d28gc2FtZSBlZGdlcyBjYW4gb25seVxuXHQgKiBiZSBvZiB0aGUgbmVnYXRpdmUgZGlyZWN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gZXF1YWxFZGdlKCBlYSwgZWIgKSB7XG5cblx0XHRyZXR1cm4gZWFbIDAgXSA9PT0gZWJbIDEgXSAmJiBlYVsgMSBdID09PSBlYlsgMCBdOyBcblxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIHJhbmRvbSBvZmZzZXQgYmV0d2VlbiAtMWUtNiBhbmQgMWUtNi5cblx0ICovXG5cdGZ1bmN0aW9uIHJhbmRvbU9mZnNldCgpIHtcblxuXHRcdHJldHVybiAoIE1hdGgucmFuZG9tKCkgLSAwLjUgKSAqIDIgKiAxZS02O1xuXG5cdH1cblxuXG5cdC8qKlxuXHQgKiBYWFg6IE5vdCBzdXJlIGlmIHRoaXMgaXMgdGhlIGNvcnJlY3QgYXBwcm9hY2guIE5lZWQgc29tZW9uZSB0byByZXZpZXcuXG5cdCAqL1xuXHRmdW5jdGlvbiB2ZXJ0ZXhVdiggdmVydGV4ICkge1xuXG5cdFx0dmFyIG1hZyA9IHZlcnRleC5sZW5ndGgoKTtcblx0XHRyZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjIoIHZlcnRleC54IC8gbWFnLCB2ZXJ0ZXgueSAvIG1hZyApO1xuXG5cdH1cblxuXHQvLyBQdXNoIHZlcnRpY2VzIGludG8gYHRoaXMudmVydGljZXNgLCBza2lwcGluZyB0aG9zZSBpbnNpZGUgdGhlIGh1bGxcblx0dmFyIGlkID0gMDtcblx0dmFyIG5ld0lkID0gbmV3IEFycmF5KCB2ZXJ0aWNlcy5sZW5ndGggKTsgLy8gbWFwIGZyb20gb2xkIHZlcnRleCBpZCB0byBuZXcgaWRcblxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHQgdmFyIGZhY2UgPSBmYWNlc1sgaSBdO1xuXG5cdFx0IGZvciAoIHZhciBqID0gMDsgaiA8IDM7IGogKysgKSB7XG5cblx0XHRcdGlmICggbmV3SWRbIGZhY2VbIGogXSBdID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdFx0bmV3SWRbIGZhY2VbIGogXSBdID0gaWQgKys7XG5cdFx0XHRcdHRoaXMudmVydGljZXMucHVzaCggdmVydGljZXNbIGZhY2VbIGogXSBdICk7XG5cblx0XHRcdH1cblxuXHRcdFx0ZmFjZVsgaiBdID0gbmV3SWRbIGZhY2VbIGogXSBdO1xuXG5cdFx0IH1cblxuXHR9XG5cblx0Ly8gQ29udmVydCBmYWNlcyBpbnRvIGluc3RhbmNlcyBvZiBUSFJFRS5GYWNlM1xuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHR0aGlzLmZhY2VzLnB1c2goIG5ldyBUSFJFRS5GYWNlMyggXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDAgXSxcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMSBdLFxuXHRcdFx0XHRmYWNlc1sgaSBdWyAyIF1cblx0XHQpICk7XG5cblx0fVxuXG5cdC8vIENvbXB1dGUgVVZzXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMuZmFjZXMubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0dmFyIGZhY2UgPSB0aGlzLmZhY2VzWyBpIF07XG5cblx0XHR0aGlzLmZhY2VWZXJ0ZXhVdnNbIDAgXS5wdXNoKCBbXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5hIF0gKSxcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmIgXSApLFxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYyBdIClcblx0XHRdICk7XG5cblx0fVxuXG5cdHRoaXMuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG5cdHRoaXMuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcblxufTtcblxuVEhSRUUuQ29udmV4R2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVEhSRUUuR2VvbWV0cnkucHJvdG90eXBlICk7XG5USFJFRS5Db252ZXhHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUSFJFRS5Db252ZXhHZW9tZXRyeTtcbiIsImltcG9ydCAnLi90aHJlZS1tb3VzZS1ldmVudC5lczYnO1xuaW1wb3J0ICcuL0NvbnZleEdlb21ldHJ5JztcblxuVEhSRUUuVmVjdG9yMy5wcm90b3R5cGUubWl4ID0gZnVuY3Rpb24oeSwgYSkge1xuICByZXR1cm4gdGhpcy5tdWx0aXBseVNjYWxhcigxIC0gYSkuYWRkKHkuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihhKSlcbn07XG5cbmNsYXNzIEVtYnJ5byB7XG5cbiAgY29uc3RydWN0b3IoZGF0YSwgY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0KSB7XG5cbiAgICAvLyogZGF0YSA6IGFycmF5IG9mIGNvbnRyaWJ1dGlvbnNcbiAgICAvLyogY29udHJpYnV0aW9uXG4gICAgLy8qIHtcbiAgICAvLyogICBpbWFnZTogRE9NSW1hZ2VcbiAgICAvLyogICB0ZXh0OiBTdHJpbmdcbiAgICAvLyogfVxuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG5cbiAgICAvL+ODhuOCr+OCueODgeODo+OBruS9nOaIkFxuICAgIHZhciBsb2FkZWROdW0gPSAwO1xuICAgIGRhdGEuZm9yRWFjaCgoY29udHJpYnV0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHZhciB0ZXh0dXJlID0gRW1icnlvLmNyZWF0ZVRleHR1cmUoaW1hZ2UpO1xuICAgICAgICB0aGlzLmRhdGFbaW5kZXhdLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgICAgICBsb2FkZWROdW0rKztcbiAgICAgICAgaWYobG9hZGVkTnVtID09PSBkYXRhLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZShjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaW1hZ2Uuc3JjID0gY29udHJpYnV0aW9uLmJhc2U2NDtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuXG4gIH1cblxuICBpbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgIC8vaW5pdCBzY2VuZVxuICAgIHZhciBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuXG4gICAgLy9pbml0IGNhbWVyYVxuICAgIHZhciBmb3YgPSA2MDtcbiAgICB2YXIgYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYShmb3YsIGFzcGVjdCk7XG4gICAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAoaGVpZ2h0IC8gMikgLyBNYXRoLnRhbigoZm92ICogTWF0aC5QSSAvIDE4MCkgLyAyKSk7XG4gICAgY2FtZXJhLmxvb2tBdChuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKSk7XG4gICAgc2NlbmUuYWRkKGNhbWVyYSk7XG5cbiAgICAvL2luaXQgcmVuZGVyZXJcbiAgICB2YXIgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7YWxwaGE6IHRydWUsIGFudGlhbGlhczogdHJ1ZX0pO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGNjY2NjYywgMCk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgLy9pbml0IGNvbnRyb2xzXG4gICAgdmFyIGNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzKGNhbWVyYSwgcmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAvL3dhdGNoIG1vdXNlIGV2ZW50c1xuICAgIHNjZW5lLndhdGNoTW91c2VFdmVudChyZW5kZXJlci5kb21FbGVtZW50LCBjYW1lcmEpO1xuXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLmNvbnRyb2xzID0gY29udHJvbHM7XG5cbiAgICAvL+eUn+aIkFxuICAgIHRoaXMuY3JlYXRlKCk7XG5cbiAgICB0aGlzLmNvdW50ID0gMDtcblxuICAgIGNvbnNvbGUubG9nKHRoaXMuZnJhbWVzKTtcblxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbigpe1xuICAgICAgY29udHJvbHMudXBkYXRlKCk7XG4gICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgICAvL3NjZW5lLmhhbmRsZU1vdXNlRXZlbnQoKTtcbiAgICAgIHRoaXMuY291bnQrKztcbiAgICAgIHRoaXMubW92ZVZlcnRpY2VzKCkucm90YXRlKCk7XG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdXBkYXRlKCk7XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9XG5cbiAgY3JlYXRlKCkge1xuICAgIHRoaXMuZ2VvbWV0cnkgPSBFbWJyeW8uY3JlYXRlR2VvbWV0cnkoMTAwLCB0aGlzLmRhdGEubGVuZ3RoKTtcbiAgICB0aGlzLmZyYW1lcyA9IEVtYnJ5by5jcmVhdGVGcmFtZXModGhpcy5nZW9tZXRyeSwgdGhpcy5kYXRhKTtcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4gey8v44Oe44Km44K544Kk44OZ44Oz44OI44Gu6Kit5a6aXG4gICAgICBmcmFtZS5vbmNsaWNrID0gKGludGVyc2VjdCkgPT4ge1xuICAgICAgICBpZih0eXBlb2YgdGhpcy5vbnNlbGVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRoaXMub25zZWxlY3QoZnJhbWUuZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICAvL2ZyYW1lLm9ubW91c2VvdmVyID0gKGludGVyc2VjdCkgPT4ge1xuICAgICAgLy8gIGludGVyc2VjdC5mYWNlLm1vdXNlb24gPSB0cnVlO1xuICAgICAgLy99O1xuICAgIH0pO1xuICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuZnJhbWVzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy/kuInop5Ljga7pnaLjgafmp4vmiJDjgZXjgozjgovlpJrpnaLkvZPjga7kvZzmiJBcbiAgc3RhdGljIGNyZWF0ZUdlb21ldHJ5KHJhZGl1cywgc3VyZmFjZU51bWJlcikge1xuICAgIHZhciB2ZXJ0aWNlcyA9IFtdO1xuICAgIHN1cmZhY2VOdW1iZXIgPSAoc3VyZmFjZU51bWJlciA8IDQpID8gNCA6IHN1cmZhY2VOdW1iZXI7Ly/vvJTku6XkuIvjga/kuI3lj69cbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgJiAxKSA/IChzdXJmYWNlTnVtYmVyICsgMSkgOiBzdXJmYWNlTnVtYmVyOy8v5aWH5pWw44Gv5LiN5Y+vKOOCiOOCiuWkp+OBjeOBhOWBtuaVsOOBq+ebtOOBmSlcbiAgICBmb3IodmFyIGkgPSAwLCBsID0gKDIgKyBzdXJmYWNlTnVtYmVyIC8gMik7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZlcnRpY2VzW2ldID0gbmV3IFRIUkVFLlZlY3RvcjMoTWF0aC5yYW5kb20oKSAtIDAuNSwgTWF0aC5yYW5kb20oKSAtIDAuNSwgTWF0aC5yYW5kb20oKSAtIDAuNSk7Ly/nkIPnirbjgavjg6njg7Pjg4Djg6DjgavngrnjgpLmiZPjgaRcbiAgICAgIHZlcnRpY2VzW2ldLnNldExlbmd0aChyYWRpdXMpO1xuICAgICAgdmVydGljZXNbaV0ub3JpZ2luYWxMZW5ndGggPSByYWRpdXM7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVEhSRUUuQ29udmV4R2VvbWV0cnkodmVydGljZXMpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUZyYW1lcyhnZW9tZXRyeSwgZGF0YSkge1xuICAgIHZhciB2ZXJ0ZXh0U2hhZGVyID0gJycgK1xuICAgICAgJ3ZhcnlpbmcgdmVjNCB2UG9zaXRpb247JyArXG4gICAgICAndm9pZCBtYWluKCkgeycgK1xuICAgICAgJyAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0aW9uTWF0cml4ICogdmlld01hdHJpeCAqIG1vZGVsTWF0cml4ICogdmVjNChwb3NpdGlvbiwgMS4wKTsnICtcbiAgICAgICcgIHZQb3NpdGlvbiA9IGdsX1Bvc2l0aW9uOycgK1xuICAgICAgJ30nO1xuXG4gICAgdmFyIGZyYWdtZW50U2hhZGVyID0gJycgK1xuICAgICAgJ3VuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7JyArXG4gICAgICAndW5pZm9ybSBmbG9hdCBvcGFjaXR5OycgK1xuICAgICAgJ3ZhcnlpbmcgdmVjNCB2UG9zaXRpb247JyArXG4gICAgICAndm9pZCBtYWluKHZvaWQpeycgK1xuICAgICAgJyAgdmVjNCB0ZXh0dXJlQ29sb3IgPSB0ZXh0dXJlMkQodGV4dHVyZSwgdmVjMigoMS4wICsgdlBvc2l0aW9uLnggLyAxMDAuMCkgLyAyLjAsICgxLjAgKyB2UG9zaXRpb24ueSAvIDEwMC4wKSAvIDIuMCkpOycgK1xuICAgICAgJyAgdGV4dHVyZUNvbG9yLncgPSBvcGFjaXR5OycgK1xuICAgICAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZUNvbG9yOycgK1xuICAgICAgLy8nICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCgodlBvc2l0aW9uLnggLyAxMDAuMCArIDEuMCkgLyAyLjAsICh2UG9zaXRpb24ueSAvIDEwMC4wICsgMS4wKSAvIDIuMCwgMCwgMCk7JyArXG4gICAgICAnfSc7XG5cbiAgICB2YXIgZnJhbWVzID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgZ2VvbWV0cnkuZmFjZXMuZm9yRWFjaChmdW5jdGlvbihmYWNlLCBpbmRleCkge1xuICAgICAgdmFyIGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdLCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXSwgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICAgIC8vY3JlYXRlIGdlb21ldHJ5XG4gICAgICB2YXIgZnJhbWVHZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuICAgICAgZnJhbWVHZW9tZXRyeS52ZXJ0aWNlcyA9IFthLCBiLCBjXTtcbiAgICAgIGZyYW1lR2VvbWV0cnkuZmFjZXMgPSBbbmV3IFRIUkVFLkZhY2UzKDAsIDEsIDIpXTtcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgICBmcmFtZUdlb21ldHJ5LmNvbXB1dGVWZXJ0ZXhOb3JtYWxzKCk7XG5cbiAgICAgIC8vY3JlYXRlIG1hdGVyaWFsXG4gICAgICB2YXIgZnJhbWVNYXRlcmlhbCA9IG5ldyBUSFJFRS5TaGFkZXJNYXRlcmlhbCh7XG4gICAgICAgIHZlcnRleFNoYWRlcjogdmVydGV4dFNoYWRlcixcbiAgICAgICAgZnJhZ21lbnRTaGFkZXI6IGZyYWdtZW50U2hhZGVyLFxuICAgICAgICB1bmlmb3Jtczoge1xuICAgICAgICAgIHRleHR1cmU6IHsgdHlwZTogXCJ0XCIsIHZhbHVlOiBkYXRhW2luZGV4XSA/IGRhdGFbaW5kZXhdLnRleHR1cmUgOiBudWxsIH0sXG4gICAgICAgICAgb3BhY2l0eTogeyB0eXBlOiBcImZcIiwgdmFsdWU6IDEuMCB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGZyYW1lR2VvbWV0cnksIGZyYW1lTWF0ZXJpYWwpO1xuICAgICAgbWVzaC5kYXRhID0gZGF0YVtpbmRleF07XG5cbiAgICAgIGZyYW1lcy5hZGQobWVzaCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVUZXh0dXJlKGltYWdlKSB7XG4gICAgdmFyIHRleHR1cmUgPSBuZXcgVEhSRUUuVGV4dHVyZSh0aGlzLmdldFN1aXRhYmxlSW1hZ2UoaW1hZ2UpKTtcbiAgICAvL3RleHR1cmUubWFnRmlsdGVyID0gdGV4dHVyZS5taW5GaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICAgIHRleHR1cmUubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHJldHVybiB0ZXh0dXJlO1xuICB9XG5cbiAgLy/nlLvlg4/jgrXjgqTjgrrjgpLoqr/mlbRcbiAgc3RhdGljIGdldFN1aXRhYmxlSW1hZ2UoaW1hZ2UpIHtcbiAgICB2YXIgdyA9IGltYWdlLm5hdHVyYWxXaWR0aCwgaCA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG4gICAgdmFyIHNpemUgPSBNYXRoLnBvdygyLCBNYXRoLmxvZyhNYXRoLm1pbih3LCBoKSkgLyBNYXRoLkxOMiB8IDApOyAvLyBsYXJnZXN0IDJebiBpbnRlZ2VyIHRoYXQgZG9lcyBub3QgZXhjZWVkXG4gICAgaWYgKHcgIT09IGggfHwgdyAhPT0gc2l6ZSkge1xuICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgdmFyIG9mZnNldFggPSBoIC8gdyA+IDEgPyAwIDogKHcgLSBoKSAvIDI7XG4gICAgICB2YXIgb2Zmc2V0WSA9IGggLyB3ID4gMSA/IChoIC0gdykgLyAyIDogMDtcbiAgICAgIHZhciBjbGlwU2l6ZSA9IGggLyB3ID4gMSA/IHcgOiBoO1xuICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy53aWR0aCA9IHNpemU7XG4gICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoaW1hZ2UsIG9mZnNldFgsIG9mZnNldFksIGNsaXBTaXplLCBjbGlwU2l6ZSwgMCwgMCwgc2l6ZSwgc2l6ZSk7XG4gICAgICBpbWFnZSA9IGNhbnZhcztcbiAgICB9XG4gICAgcmV0dXJuIGltYWdlO1xuICB9XG5cbiAgbW92ZVZlcnRpY2VzKCkge1xuICAgIC8vY29uc29sZS5sb2codGhpcy5mcmFtZXMuY2hpbGRyZW5bMF0uZ2VvbWV0cnkudmVydGljZXNbMF0pO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgIHZhciBmYWNlID0gZnJhbWUuZ2VvbWV0cnkuZmFjZXNbMF07XG4gICAgICBmcmFtZS5nZW9tZXRyeS52ZXJ0aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHZlcnRleCkge1xuICAgICAgICB2ZXJ0ZXgubWl4KGZhY2Uubm9ybWFsLCAwLjEpLnNldExlbmd0aCh2ZXJ0ZXgub3JpZ2luYWxMZW5ndGgpO1xuICAgIH0pO1xuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXNOZWVkVXBkYXRlID0gdHJ1ZTtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LmNvbXB1dGVGYWNlTm9ybWFscygpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByb3RhdGUoKSB7XG4gICAgdGhpcy5mcmFtZXMucm90YXRpb24uc2V0KDAsIHRoaXMuY291bnQvMjAwLCAwKTtcbiAgfVxuXG4gIC8qXG4gICAgdGhyZWUuanPjgqrjg5bjgrjjgqfjgq/jg4jjga7liYrpmaRcbiAgICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICAgIGZyYW1lLm1hdGVyaWFsLmRpc3Bvc2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLnNjZW5lLnJlbW92ZSh0aGlzLmZyYW1lcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAgY29udHJpYnV0aW9u44Gu6L+95YqgXG4gICAgQHBhcmFtIGNvbnRyaWJ1dGlvbiB7T2JqZWN0fSDmipXnqL9cbiAgICovXG4gIGFkZENvbnRyaWJ1dGlvbihjb250cmlidXRpb24pIHtcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICBjb250cmlidXRpb24udGV4dHVyZSA9IEVtYnJ5by5jcmVhdGVUZXh0dXJlKGltYWdlKTtcbiAgICAgIHRoaXMuZGF0YS5wdXNoKGNvbnRyaWJ1dGlvbik7XG4gICAgICB0aGlzLmNsZWFyKCkuY3JlYXRlKCk7Ly/jg6rjgrvjg4Pjg4hcbiAgICB9O1xuICAgIGltYWdlLnNyYyA9IGNvbnRyaWJ1dGlvbi5iYXNlNjQ7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFNpemUod2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICB0aGlzLmNhbWVyYS5hc3BlY3QgPSB3aWR0aCAvIGhlaWdodDtcbiAgICB0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBFbWJyeW87IiwiaW1wb3J0IEVtYnJ5byBmcm9tICcuL2VtYnJ5by5lczYnO1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBlbWJyeW87XG5cbiAgLy9hbmd1bGFyIHRlc3RcbiAgYW5ndWxhci5tb2R1bGUoJ215U2VydmljZXMnLCBbXSlcbiAgICAuc2VydmljZSgnaW1hZ2VTZWFyY2gnLCBbJyRodHRwJywgZnVuY3Rpb24gKCRodHRwKSB7XG4gICAgICB0aGlzLmdldEltYWdlcyA9IGZ1bmN0aW9uIChxdWVyeSwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUNMUmZldVIwNlJOUEtid0Znb09uWTB6ZTBJS0VTRjdLdyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZxPSc7XG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6IHVybCArIHF1ZXJ5LFxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XSlcbiAgICAuc2VydmljZSgnY29udHJpYnV0ZXMnLCBbJyRodHRwJywgZnVuY3Rpb24gKCRodHRwKSB7XG4gICAgICB0aGlzLmdldEFsbCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgLy91cmw6ICcvY29udHJpYnV0ZXMvYWxsJyxcbiAgICAgICAgICB1cmw6ICcuL2phdmFzY3JpcHRzL2FsbC5qc29uJyxcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXG4gICAgICAgIH0pXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHRoaXMuc3VibWl0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIHVybDogJy9jb250cmlidXRlcy9wb3N0JyxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiBjb250cmlidXRpb25cbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGlmKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBhbGVydChkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1dKTtcblxuICBhbmd1bGFyLm1vZHVsZShcImVtYnJ5b1wiLCBbJ215U2VydmljZXMnXSlcbiAgICAuY29udHJvbGxlcignbXlDdHJsJywgWyckc2NvcGUnLCAnaW1hZ2VTZWFyY2gnLCAnY29udHJpYnV0ZXMnLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZVNlYXJjaCwgY29udHJpYnV0ZXMpIHtcbiAgICAgIC8vY29udGlidXRpb25z44KS5Y+W5b6XXG4gICAgICBjb250cmlidXRlcy5nZXRBbGwoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAkc2NvcGUuY29udHJpYnV0aW9ucyA9IGRhdGE7XG4gICAgICAgIHZhciBjb250YWluZXIgPSAkKCcuZW1icnlvLXRocmVlJyk7XG4gICAgICAgIHZhciBjb250cmlidXRpb25JbWFnZSA9ICQoJy5lbWJyeW8tY29udHJpYnV0aW9uLWltYWdlJyk7XG4gICAgICAgIGVtYnJ5byA9IG5ldyBFbWJyeW8oZGF0YSwgY29udGFpbmVyLmdldCgwKSwgY29udGFpbmVyLndpZHRoKCksIGNvbnRhaW5lci5oZWlnaHQoKSk7XG4gICAgICAgIHdpbmRvdy5lbWJyeW8gPSBlbWJyeW87XG4gICAgICAgIGVtYnJ5by5vbnNlbGVjdCA9IGZ1bmN0aW9uKGNvbnRyaWJ1dGlvbikge1xuICAgICAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICctd2Via2l0LWZpbHRlcic6ICdibHVyKDBweCknXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XG4gICAgICAgICAgICAgICdvcGFjaXR5JzogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRDb250cmlidXRpb24gPSBjb250cmlidXRpb247XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICBjb250cmlidXRpb25JbWFnZS5jc3Moe1xuICAgICAgICAgICAgICAnYmFja2dyb3VuZEltYWdlJzogJ3VybCgnICsgY29udHJpYnV0aW9uLmJhc2U2NCArICcpJyxcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRTaXplJzogJ2NvdmVyJyxcbiAgICAgICAgICAgICAgJ29wYWNpdHknOiAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5jc3Moe1xuICAgICAgICAgICAgICAnLXdlYmtpdC1maWx0ZXInOiAnYmx1cigxMHB4KSdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5xdWVyeSA9ICdza3knO1xuXG4gICAgICAkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuaXRlbXMgPSBbXTtcbiAgICAgICAgaW1hZ2VTZWFyY2guZ2V0SW1hZ2VzKCRzY29wZS5xdWVyeSwgZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gICAgICAgICAgJHNjb3BlLml0ZW1zID0gcmVzLml0ZW1zO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICAkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkSXRlbSA9IGl0ZW07XG4gICAgICAgICRzY29wZS51cmwgPSBpdGVtLmxpbms7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHsgdGV4dDogJHNjb3BlLnRleHQsIHVybDogJHNjb3BlLnVybCB9LCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgLy/mipXnqL/jga7ov73liqBcbiAgICAgICAgICAkc2NvcGUuY29udHJpYnV0aW9ucy5wdXNoKGRhdGEpO1xuICAgICAgICAgIGVtYnJ5by5hZGRDb250cmlidXRpb24oZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgICRzY29wZS5jbG9zZUxpZ2h0Ym94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH07XG4gICAgfV0pO1xuXG59KSgpOyIsIlRIUkVFLlNjZW5lLnByb3RvdHlwZS53YXRjaE1vdXNlRXZlbnQgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYW1lcmEpIHtcbiAgdmFyIHByZUludGVyc2VjdHMgPSBbXTtcbiAgdmFyIG1vdXNlRG93bkludGVyc2VjdHMgPSBbXTtcbiAgdmFyIHByZUV2ZW50O1xuICB2YXIgbW91c2VEb3duUG9pbnQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlRG93bihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAvL29ubW91c2Vkb3duXG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHByZUludGVyc2VjdCkge1xuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlZG93biA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3Qub25tb3VzZWRvd24ocHJlSW50ZXJzZWN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtb3VzZURvd25JbnRlcnNlY3RzID0gcHJlSW50ZXJzZWN0cztcblxuICAgIHByZUV2ZW50ID0gZXZlbnQ7XG4gICAgbW91c2VEb3duUG9pbnQgPSBuZXcgVEhSRUUuVmVjdG9yMihldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlVXAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgLy9vbm1vdXNldXBcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2V1cCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3Qub25tb3VzZXVwKGludGVyc2VjdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZihtb3VzZURvd25Qb2ludC5kaXN0YW5jZVRvKG5ldyBUSFJFRS5WZWN0b3IyKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpKSA8IDUpIHtcbiAgICAgIC8vb25jbGlja1xuICAgICAgbW91c2VEb3duSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcbiAgICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBpZiAoZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xuICAgICAgICAgICAgb2JqZWN0Lm9uY2xpY2soaW50ZXJzZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZUV2ZW50ID0gZXZlbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICB2YXIgcmVjdCA9IGRvbUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgbW91c2UueCA9ICgoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCkgLyBkb21FbGVtZW50LndpZHRoKSAqIDIgLSAxO1xuICAgIG1vdXNlLnkgPSAtKChldmVudC5jbGllbnRZIC0gcmVjdC50b3ApIC8gZG9tRWxlbWVudC5oZWlnaHQpICogMiArIDE7XG5cbiAgICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICAgIHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG1vdXNlLCBjYW1lcmEpO1xuXG4gICAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhfdGhpcy5jaGlsZHJlbiwgdHJ1ZSk7XG4gICAgaW50ZXJzZWN0cy5sZW5ndGggPSAxOy8v5omL5YmN44Gu44Kq44OW44K444Kn44Kv44OI44Gu44G/XG5cbiAgICAvL2NvbnNvbGUubG9nKGludGVyc2VjdHMpO1xuICAgIGludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbiAoaW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIC8vb25tb3VzZW1vdmVcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vtb3ZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdC5vbm1vdXNlbW92ZShpbnRlcnNlY3QpO1xuICAgICAgfVxuXG4gICAgICAvL29ubW91c2VvdmVyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3ZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoIWV4aXN0KHByZUludGVyc2VjdHMsIGludGVyc2VjdCkpIHtcbiAgICAgICAgICBvYmplY3Qub25tb3VzZW92ZXIoaW50ZXJzZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy9vbm1vdXNlb3V0XG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHByZUludGVyc2VjdCkge1xuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmICghZXhpc3QoaW50ZXJzZWN0cywgcHJlSW50ZXJzZWN0KSkge1xuICAgICAgICAgIHByZUludGVyc2VjdC5vYmplY3Qub25tb3VzZW91dChwcmVJbnRlcnNlY3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwcmVJbnRlcnNlY3RzID0gaW50ZXJzZWN0cztcbiAgICBwcmVFdmVudCA9IGV2ZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gZXhpc3QoaW50ZXJzZWN0cywgdGFyZ2V0SW50ZXJzZWN0KSB7XG4gICAgLy9pbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XG4gICAgLy8gIGlmKGludGVyc2VjdC5vYmplY3QgPT0gdGFyZ2V0SW50ZXJzZWN0Lm9iamVjdCkgcmV0dXJuIHRydWU7XG4gICAgLy99KTtcbiAgICAvL3JldHVybiBmYWxzZTtcbiAgICByZXR1cm4gKHR5cGVvZiBpbnRlcnNlY3RzWzBdID09PSAnb2JqZWN0JykgJiYgKGludGVyc2VjdHNbMF0ub2JqZWN0ID09PSB0YXJnZXRJbnRlcnNlY3Qub2JqZWN0KTtcbiAgfVxuXG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2VEb3duKTtcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2VVcCk7XG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2VNb3ZlKTtcblxuICBUSFJFRS5TY2VuZS5wcm90b3R5cGUuaGFuZGxlTW91c2VFdmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHByZUV2ZW50ICYmIGhhbmRsZU1vdXNlTW92ZShwcmVFdmVudCk7XG4gIH07XG5cbn07Il19
