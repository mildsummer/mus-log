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
      var _this3 = this;

      //console.log(this.frames.children[0].geometry.vertices[0]);
      this.frames.children.forEach(function (frame) {
        var face = frame.geometry.faces[0];
        frame.geometry.vertices.forEach(function (vertex, index) {
          vertex.mix(face.normal, 0.1).setLength(vertex.originalLength + 5 * Math.cos(_this3.count / 10 + index * 10));
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

},{"./embryo.es6":2}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL0RvY3VtZW50cy9tdXMubG9nL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9Ob2Rva2EvRG9jdW1lbnRzL211cy5sb2cvc291cmNlL2phdmFzY3JpcHRzL0NvbnZleEdlb21ldHJ5LmpzIiwiQzovVXNlcnMvTm9kb2thL0RvY3VtZW50cy9tdXMubG9nL3NvdXJjZS9qYXZhc2NyaXB0cy9lbWJyeW8uZXM2IiwiQzovVXNlcnMvTm9kb2thL0RvY3VtZW50cy9tdXMubG9nL3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiLCJDOi9Vc2Vycy9Ob2Rva2EvRG9jdW1lbnRzL211cy5sb2cvc291cmNlL2phdmFzY3JpcHRzL21haW4uZXM2Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbUJBLEtBQUssQ0FBQyxjQUFjLEdBQUcsVUFBVSxRQUFRLEVBQUc7O0FBRTNDLE1BQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDOztBQUU1QixLQUFJLEtBQUssR0FBRyxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRTVDLFVBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVkOztBQUdELFVBQVMsUUFBUSxDQUFFLFFBQVEsRUFBRzs7QUFFN0IsTUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDLEtBQUssRUFBRSxDQUFDOztBQUUxQyxNQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDMUIsUUFBTSxDQUFDLENB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QUFVLENBQUMsSUFBSSxDQUFDO0tBQ2xELENBQUM7QUFDRixVQUFNLENBQUMseUJBQXlCLEdBQUcsWUFBWTtBQUM3QyxZQUFNLENBQUMsVUFBVSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsbUJBQW1CLElBQUksUUFBUSxHQUFHLE9BQU8sR0FBRyxRQUFRLENBQUM7S0FDaEgsQ0FBQztBQUNGLFVBQU0sQ0FBQyxZQUFZLEdBQUcsWUFBWTtBQUNoQyxZQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDcEMsWUFBTSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0tBQzFDLENBQUE7R0FDRixDQUFDLENBQUMsQ0FBQztDQUVQLENBQUEsRUFBRyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiBAYXV0aG9yIHFpYW8gLyBodHRwczovL2dpdGh1Yi5jb20vcWlhb1xyXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgYSBjb252ZXggaHVsbCBnZW5lcmF0b3IgdXNpbmcgdGhlIGluY3JlbWVudGFsIG1ldGhvZC4gXHJcbiAqIFRoZSBjb21wbGV4aXR5IGlzIE8obl4yKSB3aGVyZSBuIGlzIHRoZSBudW1iZXIgb2YgdmVydGljZXMuXHJcbiAqIE8obmxvZ24pIGFsZ29yaXRobXMgZG8gZXhpc3QsIGJ1dCB0aGV5IGFyZSBtdWNoIG1vcmUgY29tcGxpY2F0ZWQuXHJcbiAqXHJcbiAqIEJlbmNobWFyazogXHJcbiAqXHJcbiAqICBQbGF0Zm9ybTogQ1BVOiBQNzM1MCBAMi4wMEdIeiBFbmdpbmU6IFY4XHJcbiAqXHJcbiAqICBOdW0gVmVydGljZXNcdFRpbWUobXMpXHJcbiAqXHJcbiAqICAgICAxMCAgICAgICAgICAgMVxyXG4gKiAgICAgMjAgICAgICAgICAgIDNcclxuICogICAgIDMwICAgICAgICAgICAxOVxyXG4gKiAgICAgNDAgICAgICAgICAgIDQ4XHJcbiAqICAgICA1MCAgICAgICAgICAgMTA3XHJcbiAqL1xyXG5cclxuVEhSRUUuQ29udmV4R2VvbWV0cnkgPSBmdW5jdGlvbiggdmVydGljZXMgKSB7XHJcblxyXG5cdFRIUkVFLkdlb21ldHJ5LmNhbGwoIHRoaXMgKTtcclxuXHJcblx0dmFyIGZhY2VzID0gWyBbIDAsIDEsIDIgXSwgWyAwLCAyLCAxIF0gXTsgXHJcblxyXG5cdGZvciAoIHZhciBpID0gMzsgaSA8IHZlcnRpY2VzLmxlbmd0aDsgaSArKyApIHtcclxuXHJcblx0XHRhZGRQb2ludCggaSApO1xyXG5cclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBhZGRQb2ludCggdmVydGV4SWQgKSB7XHJcblxyXG5cdFx0dmFyIHZlcnRleCA9IHZlcnRpY2VzWyB2ZXJ0ZXhJZCBdLmNsb25lKCk7XHJcblxyXG5cdFx0dmFyIG1hZyA9IHZlcnRleC5sZW5ndGgoKTtcclxuXHRcdHZlcnRleC54ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xyXG5cdFx0dmVydGV4LnkgKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XHJcblx0XHR2ZXJ0ZXgueiArPSBtYWcgKiByYW5kb21PZmZzZXQoKTtcclxuXHJcblx0XHR2YXIgaG9sZSA9IFtdO1xyXG5cclxuXHRcdGZvciAoIHZhciBmID0gMDsgZiA8IGZhY2VzLmxlbmd0aDsgKSB7XHJcblxyXG5cdFx0XHR2YXIgZmFjZSA9IGZhY2VzWyBmIF07XHJcblxyXG5cdFx0XHQvLyBmb3IgZWFjaCBmYWNlLCBpZiB0aGUgdmVydGV4IGNhbiBzZWUgaXQsXHJcblx0XHRcdC8vIHRoZW4gd2UgdHJ5IHRvIGFkZCB0aGUgZmFjZSdzIGVkZ2VzIGludG8gdGhlIGhvbGUuXHJcblx0XHRcdGlmICggdmlzaWJsZSggZmFjZSwgdmVydGV4ICkgKSB7XHJcblxyXG5cdFx0XHRcdGZvciAoIHZhciBlID0gMDsgZSA8IDM7IGUgKysgKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIGVkZ2UgPSBbIGZhY2VbIGUgXSwgZmFjZVsgKCBlICsgMSApICUgMyBdIF07XHJcblx0XHRcdFx0XHR2YXIgYm91bmRhcnkgPSB0cnVlO1xyXG5cclxuXHRcdFx0XHRcdC8vIHJlbW92ZSBkdXBsaWNhdGVkIGVkZ2VzLlxyXG5cdFx0XHRcdFx0Zm9yICggdmFyIGggPSAwOyBoIDwgaG9sZS5sZW5ndGg7IGggKysgKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoIGVxdWFsRWRnZSggaG9sZVsgaCBdLCBlZGdlICkgKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGhvbGVbIGggXSA9IGhvbGVbIGhvbGUubGVuZ3RoIC0gMSBdO1xyXG5cdFx0XHRcdFx0XHRcdGhvbGUucG9wKCk7XHJcblx0XHRcdFx0XHRcdFx0Ym91bmRhcnkgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRicmVhaztcclxuXHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKCBib3VuZGFyeSApIHtcclxuXHJcblx0XHRcdFx0XHRcdGhvbGUucHVzaCggZWRnZSApO1xyXG5cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyByZW1vdmUgZmFjZXNbIGYgXVxyXG5cdFx0XHRcdGZhY2VzWyBmIF0gPSBmYWNlc1sgZmFjZXMubGVuZ3RoIC0gMSBdO1xyXG5cdFx0XHRcdGZhY2VzLnBvcCgpO1xyXG5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0Ly8gbm90IHZpc2libGVcclxuXHJcblx0XHRcdFx0ZiArKztcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gY29uc3RydWN0IHRoZSBuZXcgZmFjZXMgZm9ybWVkIGJ5IHRoZSBlZGdlcyBvZiB0aGUgaG9sZSBhbmQgdGhlIHZlcnRleFxyXG5cdFx0Zm9yICggdmFyIGggPSAwOyBoIDwgaG9sZS5sZW5ndGg7IGggKysgKSB7XHJcblxyXG5cdFx0XHRmYWNlcy5wdXNoKCBbIFxyXG5cdFx0XHRcdGhvbGVbIGggXVsgMCBdLFxyXG5cdFx0XHRcdGhvbGVbIGggXVsgMSBdLFxyXG5cdFx0XHRcdHZlcnRleElkXHJcblx0XHRcdF0gKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogV2hldGhlciB0aGUgZmFjZSBpcyB2aXNpYmxlIGZyb20gdGhlIHZlcnRleFxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHZpc2libGUoIGZhY2UsIHZlcnRleCApIHtcclxuXHJcblx0XHR2YXIgdmEgPSB2ZXJ0aWNlc1sgZmFjZVsgMCBdIF07XHJcblx0XHR2YXIgdmIgPSB2ZXJ0aWNlc1sgZmFjZVsgMSBdIF07XHJcblx0XHR2YXIgdmMgPSB2ZXJ0aWNlc1sgZmFjZVsgMiBdIF07XHJcblxyXG5cdFx0dmFyIG4gPSBub3JtYWwoIHZhLCB2YiwgdmMgKTtcclxuXHJcblx0XHQvLyBkaXN0YW5jZSBmcm9tIGZhY2UgdG8gb3JpZ2luXHJcblx0XHR2YXIgZGlzdCA9IG4uZG90KCB2YSApO1xyXG5cclxuXHRcdHJldHVybiBuLmRvdCggdmVydGV4ICkgPj0gZGlzdDsgXHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogRmFjZSBub3JtYWxcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBub3JtYWwoIHZhLCB2YiwgdmMgKSB7XHJcblxyXG5cdFx0dmFyIGNiID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcclxuXHRcdHZhciBhYiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XHJcblxyXG5cdFx0Y2Iuc3ViVmVjdG9ycyggdmMsIHZiICk7XHJcblx0XHRhYi5zdWJWZWN0b3JzKCB2YSwgdmIgKTtcclxuXHRcdGNiLmNyb3NzKCBhYiApO1xyXG5cclxuXHRcdGNiLm5vcm1hbGl6ZSgpO1xyXG5cclxuXHRcdHJldHVybiBjYjtcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBEZXRlY3Qgd2hldGhlciB0d28gZWRnZXMgYXJlIGVxdWFsLlxyXG5cdCAqIE5vdGUgdGhhdCB3aGVuIGNvbnN0cnVjdGluZyB0aGUgY29udmV4IGh1bGwsIHR3byBzYW1lIGVkZ2VzIGNhbiBvbmx5XHJcblx0ICogYmUgb2YgdGhlIG5lZ2F0aXZlIGRpcmVjdGlvbi5cclxuXHQgKi9cclxuXHRmdW5jdGlvbiBlcXVhbEVkZ2UoIGVhLCBlYiApIHtcclxuXHJcblx0XHRyZXR1cm4gZWFbIDAgXSA9PT0gZWJbIDEgXSAmJiBlYVsgMSBdID09PSBlYlsgMCBdOyBcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBDcmVhdGUgYSByYW5kb20gb2Zmc2V0IGJldHdlZW4gLTFlLTYgYW5kIDFlLTYuXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gcmFuZG9tT2Zmc2V0KCkge1xyXG5cclxuXHRcdHJldHVybiAoIE1hdGgucmFuZG9tKCkgLSAwLjUgKSAqIDIgKiAxZS02O1xyXG5cclxuXHR9XHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBYWFg6IE5vdCBzdXJlIGlmIHRoaXMgaXMgdGhlIGNvcnJlY3QgYXBwcm9hY2guIE5lZWQgc29tZW9uZSB0byByZXZpZXcuXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gdmVydGV4VXYoIHZlcnRleCApIHtcclxuXHJcblx0XHR2YXIgbWFnID0gdmVydGV4Lmxlbmd0aCgpO1xyXG5cdFx0cmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IyKCB2ZXJ0ZXgueCAvIG1hZywgdmVydGV4LnkgLyBtYWcgKTtcclxuXHJcblx0fVxyXG5cclxuXHQvLyBQdXNoIHZlcnRpY2VzIGludG8gYHRoaXMudmVydGljZXNgLCBza2lwcGluZyB0aG9zZSBpbnNpZGUgdGhlIGh1bGxcclxuXHR2YXIgaWQgPSAwO1xyXG5cdHZhciBuZXdJZCA9IG5ldyBBcnJheSggdmVydGljZXMubGVuZ3RoICk7IC8vIG1hcCBmcm9tIG9sZCB2ZXJ0ZXggaWQgdG8gbmV3IGlkXHJcblxyXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArKyApIHtcclxuXHJcblx0XHQgdmFyIGZhY2UgPSBmYWNlc1sgaSBdO1xyXG5cclxuXHRcdCBmb3IgKCB2YXIgaiA9IDA7IGogPCAzOyBqICsrICkge1xyXG5cclxuXHRcdFx0aWYgKCBuZXdJZFsgZmFjZVsgaiBdIF0gPT09IHVuZGVmaW5lZCApIHtcclxuXHJcblx0XHRcdFx0bmV3SWRbIGZhY2VbIGogXSBdID0gaWQgKys7XHJcblx0XHRcdFx0dGhpcy52ZXJ0aWNlcy5wdXNoKCB2ZXJ0aWNlc1sgZmFjZVsgaiBdIF0gKTtcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZhY2VbIGogXSA9IG5ld0lkWyBmYWNlWyBqIF0gXTtcclxuXHJcblx0XHQgfVxyXG5cclxuXHR9XHJcblxyXG5cdC8vIENvbnZlcnQgZmFjZXMgaW50byBpbnN0YW5jZXMgb2YgVEhSRUUuRmFjZTNcclxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkgKysgKSB7XHJcblxyXG5cdFx0dGhpcy5mYWNlcy5wdXNoKCBuZXcgVEhSRUUuRmFjZTMoIFxyXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDAgXSxcclxuXHRcdFx0XHRmYWNlc1sgaSBdWyAxIF0sXHJcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMiBdXHJcblx0XHQpICk7XHJcblxyXG5cdH1cclxuXHJcblx0Ly8gQ29tcHV0ZSBVVnNcclxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmZhY2VzLmxlbmd0aDsgaSArKyApIHtcclxuXHJcblx0XHR2YXIgZmFjZSA9IHRoaXMuZmFjZXNbIGkgXTtcclxuXHJcblx0XHR0aGlzLmZhY2VWZXJ0ZXhVdnNbIDAgXS5wdXNoKCBbXHJcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmEgXSApLFxyXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5iIF0gKSxcclxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYyBdIClcclxuXHRcdF0gKTtcclxuXHJcblx0fVxyXG5cclxuXHR0aGlzLmNvbXB1dGVGYWNlTm9ybWFscygpO1xyXG5cdHRoaXMuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcclxuXHJcbn07XHJcblxyXG5USFJFRS5Db252ZXhHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5HZW9tZXRyeS5wcm90b3R5cGUgKTtcclxuVEhSRUUuQ29udmV4R2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVEhSRUUuQ29udmV4R2VvbWV0cnk7XHJcbiIsImltcG9ydCAnLi90aHJlZS1tb3VzZS1ldmVudC5lczYnO1xyXG5pbXBvcnQgJy4vQ29udmV4R2VvbWV0cnknO1xyXG5cclxuVEhSRUUuVmVjdG9yMy5wcm90b3R5cGUubWl4ID0gZnVuY3Rpb24oeSwgYSkge1xyXG4gIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKDEgLSBhKS5hZGQoeS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKGEpKVxyXG59O1xyXG5cclxuY2xhc3MgRW1icnlvIHtcclxuXHJcbiAgY29uc3RydWN0b3IoZGF0YSwgY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0KSB7XHJcblxyXG4gICAgLy8qIGRhdGEgOiBhcnJheSBvZiBjb250cmlidXRpb25zXHJcbiAgICAvLyogY29udHJpYnV0aW9uXHJcbiAgICAvLyoge1xyXG4gICAgLy8qICAgaW1hZ2U6IERPTUltYWdlXHJcbiAgICAvLyogICB0ZXh0OiBTdHJpbmdcclxuICAgIC8vKiB9XHJcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG5cclxuICAgIC8v44OG44Kv44K544OB44Oj44Gu5L2c5oiQXHJcbiAgICB2YXIgbG9hZGVkTnVtID0gMDtcclxuICAgIGRhdGEuZm9yRWFjaCgoY29udHJpYnV0aW9uLCBpbmRleCkgPT4ge1xyXG4gICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgIHZhciB0ZXh0dXJlID0gRW1icnlvLmNyZWF0ZVRleHR1cmUoaW1hZ2UpO1xyXG4gICAgICAgIHRoaXMuZGF0YVtpbmRleF0udGV4dHVyZSA9IHRleHR1cmU7XHJcbiAgICAgICAgbG9hZGVkTnVtKys7XHJcbiAgICAgICAgaWYobG9hZGVkTnVtID09PSBkYXRhLmxlbmd0aCkge1xyXG4gICAgICAgICAgdGhpcy5pbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICBpbWFnZS5zcmMgPSBjb250cmlidXRpb24uYmFzZTY0O1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gIH1cclxuXHJcbiAgaW5pdGlhbGl6ZShjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgIC8vaW5pdCBzY2VuZVxyXG4gICAgdmFyIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XHJcblxyXG4gICAgLy9pbml0IGNhbWVyYVxyXG4gICAgdmFyIGZvdiA9IDYwO1xyXG4gICAgdmFyIGFzcGVjdCA9IHdpZHRoIC8gaGVpZ2h0O1xyXG4gICAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYShmb3YsIGFzcGVjdCk7XHJcbiAgICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIChoZWlnaHQgLyAyKSAvIE1hdGgudGFuKChmb3YgKiBNYXRoLlBJIC8gMTgwKSAvIDIpKTtcclxuICAgIGNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCkpO1xyXG4gICAgc2NlbmUuYWRkKGNhbWVyYSk7XHJcblxyXG4gICAgLy9pbml0IHJlbmRlcmVyXHJcbiAgICB2YXIgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7YWxwaGE6IHRydWUsIGFudGlhbGlhczogdHJ1ZX0pO1xyXG4gICAgcmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcclxuICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHhjY2NjY2MsIDApO1xyXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG5cclxuICAgIC8vaW5pdCBjb250cm9sc1xyXG4gICAgdmFyIGNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzKGNhbWVyYSwgcmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgLy93YXRjaCBtb3VzZSBldmVudHNcclxuICAgIHNjZW5lLndhdGNoTW91c2VFdmVudChyZW5kZXJlci5kb21FbGVtZW50LCBjYW1lcmEpO1xyXG5cclxuICAgIHRoaXMuc2NlbmUgPSBzY2VuZTtcclxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xyXG4gICAgdGhpcy5yZW5kZXJlciA9IHJlbmRlcmVyO1xyXG4gICAgdGhpcy5jb250cm9scyA9IGNvbnRyb2xzO1xyXG5cclxuICAgIC8v55Sf5oiQXHJcbiAgICB0aGlzLmNyZWF0ZSgpO1xyXG5cclxuICAgIHRoaXMuY291bnQgPSAwO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKHRoaXMuZnJhbWVzKTtcclxuXHJcbiAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24oKXtcclxuICAgICAgY29udHJvbHMudXBkYXRlKCk7XHJcbiAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcclxuICAgICAgLy9zY2VuZS5oYW5kbGVNb3VzZUV2ZW50KCk7XHJcbiAgICAgIHRoaXMuY291bnQrKztcclxuICAgICAgdGhpcy5tb3ZlVmVydGljZXMoKS5yb3RhdGUoKTtcclxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICB1cGRhdGUoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoY2FsbGJhY2spIHtcclxuICAgIHRoaXMuZ2VvbWV0cnkgPSBFbWJyeW8uY3JlYXRlR2VvbWV0cnkoMTAwLCB0aGlzLmRhdGEubGVuZ3RoKTtcclxuICAgIHRoaXMuZnJhbWVzID0gRW1icnlvLmNyZWF0ZUZyYW1lcyh0aGlzLmdlb21ldHJ5LCB0aGlzLmRhdGEpO1xyXG4gICAgdGhpcy5mcmFtZXMuY2hpbGRyZW4uZm9yRWFjaCgoZnJhbWUpID0+IHsvL+ODnuOCpuOCueOCpOODmeODs+ODiOOBruioreWumlxyXG4gICAgICBmcmFtZS5vbmNsaWNrID0gKGludGVyc2VjdCkgPT4ge1xyXG4gICAgICAgIGlmKHR5cGVvZiB0aGlzLm9uc2VsZWN0ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICB0aGlzLm9uc2VsZWN0KGZyYW1lLmRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgLy9mcmFtZS5vbm1vdXNlb3ZlciA9IChpbnRlcnNlY3QpID0+IHtcclxuICAgICAgLy8gIGludGVyc2VjdC5mYWNlLm1vdXNlb24gPSB0cnVlO1xyXG4gICAgICAvL307XHJcbiAgICB9KTtcclxuICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuZnJhbWVzKTtcclxuICAgIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyAmJiBjYWxsYmFjaygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLy/kuInop5Ljga7pnaLjgafmp4vmiJDjgZXjgozjgovlpJrpnaLkvZPjga7kvZzmiJBcclxuICBzdGF0aWMgY3JlYXRlR2VvbWV0cnkocmFkaXVzLCBzdXJmYWNlTnVtYmVyKSB7XHJcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcclxuICAgIHN1cmZhY2VOdW1iZXIgPSAoc3VyZmFjZU51bWJlciA8IDQpID8gNCA6IHN1cmZhY2VOdW1iZXI7Ly/vvJTku6XkuIvjga/kuI3lj69cclxuICAgIHN1cmZhY2VOdW1iZXIgPSAoc3VyZmFjZU51bWJlciAmIDEpID8gKHN1cmZhY2VOdW1iZXIgKyAxKSA6IHN1cmZhY2VOdW1iZXI7Ly/lpYfmlbDjga/kuI3lj68o44KI44KK5aSn44GN44GE5YG25pWw44Gr55u044GZKVxyXG4gICAgZm9yKHZhciBpID0gMCwgbCA9ICgyICsgc3VyZmFjZU51bWJlciAvIDIpOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgIHZlcnRpY2VzW2ldID0gbmV3IFRIUkVFLlZlY3RvcjMoTWF0aC5yYW5kb20oKSAtIDAuNSwgTWF0aC5yYW5kb20oKSAtIDAuNSwgTWF0aC5yYW5kb20oKSAtIDAuNSk7Ly/nkIPnirbjgavjg6njg7Pjg4Djg6DjgavngrnjgpLmiZPjgaRcclxuICAgICAgdmVydGljZXNbaV0uc2V0TGVuZ3RoKHJhZGl1cyk7XHJcbiAgICAgIHZlcnRpY2VzW2ldLm9yaWdpbmFsTGVuZ3RoID0gcmFkaXVzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBUSFJFRS5Db252ZXhHZW9tZXRyeSh2ZXJ0aWNlcyk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgY3JlYXRlRnJhbWVzKGdlb21ldHJ5LCBkYXRhKSB7XHJcbiAgICB2YXIgdmVydGV4dFNoYWRlciA9ICcnICtcclxuICAgICAgJ3ZhcnlpbmcgdmVjNCB2UG9zaXRpb247JyArXHJcbiAgICAgICd2b2lkIG1haW4oKSB7JyArXHJcbiAgICAgICcgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdHJpeCAqIHZpZXdNYXRyaXggKiBtb2RlbE1hdHJpeCAqIHZlYzQocG9zaXRpb24sIDEuMCk7JyArXHJcbiAgICAgICcgIHZQb3NpdGlvbiA9IGdsX1Bvc2l0aW9uOycgK1xyXG4gICAgICAnfSc7XHJcblxyXG4gICAgdmFyIGZyYWdtZW50U2hhZGVyID0gJycgK1xyXG4gICAgICAndW5pZm9ybSBzYW1wbGVyMkQgdGV4dHVyZTsnICtcclxuICAgICAgJ3VuaWZvcm0gZmxvYXQgb3BhY2l0eTsnICtcclxuICAgICAgJ3ZhcnlpbmcgdmVjNCB2UG9zaXRpb247JyArXHJcbiAgICAgICd2b2lkIG1haW4odm9pZCl7JyArXHJcbiAgICAgICcgIHZlYzQgdGV4dHVyZUNvbG9yID0gdGV4dHVyZTJEKHRleHR1cmUsIHZlYzIoKDEuMCArIHZQb3NpdGlvbi54IC8gMTAwLjApIC8gMi4wLCAoMS4wICsgdlBvc2l0aW9uLnkgLyAxMDAuMCkgLyAyLjApKTsnICtcclxuICAgICAgJyAgdGV4dHVyZUNvbG9yLncgPSBvcGFjaXR5OycgK1xyXG4gICAgICAnICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlQ29sb3I7JyArXHJcbiAgICAgIC8vJyAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoKHZQb3NpdGlvbi54IC8gMTAwLjAgKyAxLjApIC8gMi4wLCAodlBvc2l0aW9uLnkgLyAxMDAuMCArIDEuMCkgLyAyLjAsIDAsIDApOycgK1xyXG4gICAgICAnfSc7XHJcblxyXG4gICAgdmFyIGZyYW1lcyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xyXG4gICAgZ2VvbWV0cnkuZmFjZXMuZm9yRWFjaChmdW5jdGlvbihmYWNlLCBpbmRleCkge1xyXG4gICAgICB2YXIgYSA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV0sIGIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdLCBjID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcclxuXHJcbiAgICAgIC8vY3JlYXRlIGdlb21ldHJ5XHJcbiAgICAgIHZhciBmcmFtZUdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XHJcbiAgICAgIGZyYW1lR2VvbWV0cnkudmVydGljZXMgPSBbYSwgYiwgY107XHJcbiAgICAgIGZyYW1lR2VvbWV0cnkuZmFjZXMgPSBbbmV3IFRIUkVFLkZhY2UzKDAsIDEsIDIpXTtcclxuICAgICAgZnJhbWVHZW9tZXRyeS5jb21wdXRlRmFjZU5vcm1hbHMoKTtcclxuICAgICAgZnJhbWVHZW9tZXRyeS5jb21wdXRlVmVydGV4Tm9ybWFscygpO1xyXG5cclxuICAgICAgLy9jcmVhdGUgbWF0ZXJpYWxcclxuICAgICAgdmFyIGZyYW1lTWF0ZXJpYWwgPSBuZXcgVEhSRUUuU2hhZGVyTWF0ZXJpYWwoe1xyXG4gICAgICAgIHZlcnRleFNoYWRlcjogdmVydGV4dFNoYWRlcixcclxuICAgICAgICBmcmFnbWVudFNoYWRlcjogZnJhZ21lbnRTaGFkZXIsXHJcbiAgICAgICAgdW5pZm9ybXM6IHtcclxuICAgICAgICAgIHRleHR1cmU6IHsgdHlwZTogXCJ0XCIsIHZhbHVlOiBkYXRhW2luZGV4XSA/IGRhdGFbaW5kZXhdLnRleHR1cmUgOiBudWxsIH0sXHJcbiAgICAgICAgICBvcGFjaXR5OiB7IHR5cGU6IFwiZlwiLCB2YWx1ZTogMS4wIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChmcmFtZUdlb21ldHJ5LCBmcmFtZU1hdGVyaWFsKTtcclxuICAgICAgbWVzaC5kYXRhID0gZGF0YVtpbmRleF07XHJcblxyXG4gICAgICBmcmFtZXMuYWRkKG1lc2gpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZnJhbWVzO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGNyZWF0ZVRleHR1cmUoaW1hZ2UpIHtcclxuICAgIHZhciB0ZXh0dXJlID0gbmV3IFRIUkVFLlRleHR1cmUodGhpcy5nZXRTdWl0YWJsZUltYWdlKGltYWdlKSk7XHJcbiAgICAvL3RleHR1cmUubWFnRmlsdGVyID0gdGV4dHVyZS5taW5GaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xyXG4gICAgdGV4dHVyZS5uZWVkc1VwZGF0ZSA9IHRydWU7XHJcbiAgICByZXR1cm4gdGV4dHVyZTtcclxuICB9XHJcblxyXG4gIC8v55S75YOP44K144Kk44K644KS6Kq/5pW0XHJcbiAgc3RhdGljIGdldFN1aXRhYmxlSW1hZ2UoaW1hZ2UpIHtcclxuICAgIHZhciB3ID0gaW1hZ2UubmF0dXJhbFdpZHRoLCBoID0gaW1hZ2UubmF0dXJhbEhlaWdodDtcclxuICAgIHZhciBzaXplID0gTWF0aC5wb3coMiwgTWF0aC5sb2coTWF0aC5taW4odywgaCkpIC8gTWF0aC5MTjIgfCAwKTsgLy8gbGFyZ2VzdCAyXm4gaW50ZWdlciB0aGF0IGRvZXMgbm90IGV4Y2VlZFxyXG4gICAgaWYgKHcgIT09IGggfHwgdyAhPT0gc2l6ZSkge1xyXG4gICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgIHZhciBvZmZzZXRYID0gaCAvIHcgPiAxID8gMCA6ICh3IC0gaCkgLyAyO1xyXG4gICAgICB2YXIgb2Zmc2V0WSA9IGggLyB3ID4gMSA/IChoIC0gdykgLyAyIDogMDtcclxuICAgICAgdmFyIGNsaXBTaXplID0gaCAvIHcgPiAxID8gdyA6IGg7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMud2lkdGggPSBzaXplO1xyXG4gICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoaW1hZ2UsIG9mZnNldFgsIG9mZnNldFksIGNsaXBTaXplLCBjbGlwU2l6ZSwgMCwgMCwgc2l6ZSwgc2l6ZSk7XHJcbiAgICAgIGltYWdlID0gY2FudmFzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGltYWdlO1xyXG4gIH1cclxuXHJcbiAgbW92ZVZlcnRpY2VzKCkge1xyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLmZyYW1lcy5jaGlsZHJlblswXS5nZW9tZXRyeS52ZXJ0aWNlc1swXSk7XHJcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4ge1xyXG4gICAgICB2YXIgZmFjZSA9IGZyYW1lLmdlb21ldHJ5LmZhY2VzWzBdO1xyXG4gICAgICBmcmFtZS5nZW9tZXRyeS52ZXJ0aWNlcy5mb3JFYWNoKCh2ZXJ0ZXgsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgdmVydGV4Lm1peChmYWNlLm5vcm1hbCwgMC4xKS5zZXRMZW5ndGgodmVydGV4Lm9yaWdpbmFsTGVuZ3RoICsgNSAqIE1hdGguY29zKHRoaXMuY291bnQvMTAgKyBpbmRleCAqIDEwKSk7XHJcbiAgICB9KTtcclxuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXNOZWVkVXBkYXRlID0gdHJ1ZTtcclxuICAgICAgZnJhbWUuZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHJvdGF0ZSgpIHtcclxuICAgIHRoaXMuZnJhbWVzLnJvdGF0aW9uLnNldCgwLCB0aGlzLmNvdW50LzUwMCwgMCk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgdGhyZWUuanPjgqrjg5bjgrjjgqfjgq/jg4jjga7liYrpmaRcclxuICAgKi9cclxuICBjbGVhcigpIHtcclxuICAgIHRoaXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5mcmFtZXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihmcmFtZSkge1xyXG4gICAgICBmcmFtZS5nZW9tZXRyeS5kaXNwb3NlKCk7XHJcbiAgICAgIGZyYW1lLm1hdGVyaWFsLmRpc3Bvc2UoKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5zY2VuZS5yZW1vdmUodGhpcy5mcmFtZXMpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgIGNvbnRyaWJ1dGlvbuOBrui/veWKoFxyXG4gICAgQHBhcmFtIGNvbnRyaWJ1dGlvbiB7T2JqZWN0fSDmipXnqL9cclxuICAgKi9cclxuICBhZGRDb250cmlidXRpb24oY29udHJpYnV0aW9uLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGNvbnRyaWJ1dGlvbi50ZXh0dXJlID0gRW1icnlvLmNyZWF0ZVRleHR1cmUoaW1hZ2UpO1xyXG4gICAgICB0aGlzLmRhdGEucHVzaChjb250cmlidXRpb24pO1xyXG4gICAgICB0aGlzLmNsZWFyKCkuY3JlYXRlKGNhbGxiYWNrKTsvL+ODquOCu+ODg+ODiFxyXG4gICAgfTtcclxuICAgIGltYWdlLnNyYyA9IGNvbnRyaWJ1dGlvbi5iYXNlNjQ7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBzZXRTaXplKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcclxuICAgIHRoaXMuY2FtZXJhLmFzcGVjdCA9IHdpZHRoIC8gaGVpZ2h0O1xyXG4gICAgdGhpcy5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgRW1icnlvOyIsIlRIUkVFLlNjZW5lLnByb3RvdHlwZS53YXRjaE1vdXNlRXZlbnQgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYW1lcmEpIHtcclxuICB2YXIgcHJlSW50ZXJzZWN0cyA9IFtdO1xyXG4gIHZhciBtb3VzZURvd25JbnRlcnNlY3RzID0gW107XHJcbiAgdmFyIHByZUV2ZW50O1xyXG4gIHZhciBtb3VzZURvd25Qb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VEb3duKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgIC8vb25tb3VzZWRvd25cclxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihwcmVJbnRlcnNlY3QpIHtcclxuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vkb3duID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgb2JqZWN0Lm9ubW91c2Vkb3duKHByZUludGVyc2VjdCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgbW91c2VEb3duSW50ZXJzZWN0cyA9IHByZUludGVyc2VjdHM7XHJcblxyXG4gICAgcHJlRXZlbnQgPSBldmVudDtcclxuICAgIG1vdXNlRG93blBvaW50ID0gbmV3IFRIUkVFLlZlY3RvcjIoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZVVwKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgIC8vb25tb3VzZXVwXHJcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XHJcbiAgICAgIHZhciBvYmplY3QgPSBpbnRlcnNlY3Qub2JqZWN0O1xyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNldXAgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBvYmplY3Qub25tb3VzZXVwKGludGVyc2VjdCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGlmKG1vdXNlRG93blBvaW50LmRpc3RhbmNlVG8obmV3IFRIUkVFLlZlY3RvcjIoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpIDwgNSkge1xyXG4gICAgICAvL29uY2xpY2tcclxuICAgICAgbW91c2VEb3duSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcclxuICAgICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcclxuICAgICAgICBpZiAodHlwZW9mIG9iamVjdC5vbmNsaWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICBpZiAoZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xyXG4gICAgICAgICAgICBvYmplY3Qub25jbGljayhpbnRlcnNlY3QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlRXZlbnQgPSBldmVudDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlTW92ZShldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xyXG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgbW91c2UueCA9ICgoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCkgLyBkb21FbGVtZW50LndpZHRoKSAqIDIgLSAxO1xyXG4gICAgbW91c2UueSA9IC0oKGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCkgLyBkb21FbGVtZW50LmhlaWdodCkgKiAyICsgMTtcclxuXHJcbiAgICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xyXG4gICAgcmF5Y2FzdGVyLnNldEZyb21DYW1lcmEobW91c2UsIGNhbWVyYSk7XHJcblxyXG4gICAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhfdGhpcy5jaGlsZHJlbiwgdHJ1ZSk7XHJcbiAgICBpbnRlcnNlY3RzLmxlbmd0aCA9IDE7Ly/miYvliY3jga7jgqrjg5bjgrjjgqfjgq/jg4jjga7jgb9cclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKGludGVyc2VjdHMpO1xyXG4gICAgaW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcclxuICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XHJcbiAgICAgIC8vb25tb3VzZW1vdmVcclxuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZW1vdmUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBvYmplY3Qub25tb3VzZW1vdmUoaW50ZXJzZWN0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9vbm1vdXNlb3ZlclxyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3ZlciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGlmICghZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xyXG4gICAgICAgICAgb2JqZWN0Lm9ubW91c2VvdmVyKGludGVyc2VjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvL29ubW91c2VvdXRcclxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihwcmVJbnRlcnNlY3QpIHtcclxuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2VvdXQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBpZiAoIWV4aXN0KGludGVyc2VjdHMsIHByZUludGVyc2VjdCkpIHtcclxuICAgICAgICAgIHByZUludGVyc2VjdC5vYmplY3Qub25tb3VzZW91dChwcmVJbnRlcnNlY3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcHJlSW50ZXJzZWN0cyA9IGludGVyc2VjdHM7XHJcbiAgICBwcmVFdmVudCA9IGV2ZW50O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZXhpc3QoaW50ZXJzZWN0cywgdGFyZ2V0SW50ZXJzZWN0KSB7XHJcbiAgICAvL2ludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihpbnRlcnNlY3QpIHtcclxuICAgIC8vICBpZihpbnRlcnNlY3Qub2JqZWN0ID09IHRhcmdldEludGVyc2VjdC5vYmplY3QpIHJldHVybiB0cnVlO1xyXG4gICAgLy99KTtcclxuICAgIC8vcmV0dXJuIGZhbHNlO1xyXG4gICAgcmV0dXJuICh0eXBlb2YgaW50ZXJzZWN0c1swXSA9PT0gJ29iamVjdCcpICYmIChpbnRlcnNlY3RzWzBdLm9iamVjdCA9PT0gdGFyZ2V0SW50ZXJzZWN0Lm9iamVjdCk7XHJcbiAgfVxyXG5cclxuICBkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlRG93bik7XHJcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2VVcCk7XHJcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZU1vdmUpO1xyXG5cclxuICBUSFJFRS5TY2VuZS5wcm90b3R5cGUuaGFuZGxlTW91c2VFdmVudCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcHJlRXZlbnQgJiYgaGFuZGxlTW91c2VNb3ZlKHByZUV2ZW50KTtcclxuICB9O1xyXG5cclxufTsiLCJpbXBvcnQgRW1icnlvIGZyb20gJy4vZW1icnlvLmVzNic7XHJcblxyXG4oZnVuY3Rpb24gKCkge1xyXG5cclxuICB2YXIgZW1icnlvO1xyXG5cclxuICAvL2FuZ3VsYXIgdGVzdFxyXG4gIGFuZ3VsYXIubW9kdWxlKCdteVNlcnZpY2VzJywgW10pXHJcbiAgICAuc2VydmljZSgnaW1hZ2VTZWFyY2gnLCBbJyRodHRwJywgZnVuY3Rpb24gKCRodHRwKSB7XHJcbiAgICAgIHRoaXMuZ2V0SW1hZ2VzID0gZnVuY3Rpb24gKHF1ZXJ5LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIHZhciB1cmwgPSAnaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vY3VzdG9tc2VhcmNoL3YxP2tleT1BSXphU3lDTFJmZXVSMDZSTlBLYndGZ29PblkwemUwSUtFU0Y3S3cmY3g9MDAxNTU2NTY4OTQzNTQ2ODM4MzUwOjBiZGlncmQxeDhpJnNlYXJjaFR5cGU9aW1hZ2UmcT0nO1xyXG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XHJcbiAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgdXJsOiB1cmwgKyBxdWVyeSxcclxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XHJcbiAgICAgICAgICAgIGlmKGl0ZW1zLmxlbmd0aCA9PT0gMjApIHtcclxuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgdXJsID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2N1c3RvbXNlYXJjaC92MT9rZXk9QUl6YVN5Q0xSZmV1UjA2Uk5QS2J3RmdvT25ZMHplMElLRVNGN0t3JmN4PTAwMTU1NjU2ODk0MzU0NjgzODM1MDowYmRpZ3JkMXg4aSZzZWFyY2hUeXBlPWltYWdlJnN0YXJ0PTExJnE9JztcclxuICAgICAgICBxdWVyeSA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xyXG4gICAgICAgICRodHRwKHtcclxuICAgICAgICAgIHVybDogdXJsICsgcXVlcnksXHJcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmNvbmNhdChkYXRhLml0ZW1zKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xyXG4gICAgICAgICAgICBpZihpdGVtcy5sZW5ndGggPT09IDIwKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soaXRlbXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcclxuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuc2VydmljZSgnY29udHJpYnV0ZXMnLCBbJyRodHRwJywgZnVuY3Rpb24gKCRodHRwKSB7XHJcbiAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgLy91cmw6ICcvY29udHJpYnV0ZXMvYWxsJyxcclxuICAgICAgICAgIHVybDogJy4vamF2YXNjcmlwdHMvYWxsLmpzb24nLFxyXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJ1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgIGFsZXJ0KGRhdGEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICAgIHRoaXMuc3VibWl0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbiwgY2FsbGJhY2spIHtcclxuICAgICAgICAkaHR0cCh7XHJcbiAgICAgICAgICB1cmw6ICcvY29udHJpYnV0ZXMvcG9zdCcsXHJcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgIGRhdGE6IGNvbnRyaWJ1dGlvblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgIGFsZXJ0KGRhdGEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICB9XSk7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKFwiZW1icnlvXCIsIFsnbXlTZXJ2aWNlcyddKVxyXG4gICAgLmNvbnRyb2xsZXIoJ215Q3RybCcsIFsnJHNjb3BlJywgJ2ltYWdlU2VhcmNoJywgJ2NvbnRyaWJ1dGVzJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VTZWFyY2gsIGNvbnRyaWJ1dGVzKSB7XHJcbiAgICAgIC8vY29udGlidXRpb25z44KS5Y+W5b6XXHJcbiAgICAgIGNvbnRyaWJ1dGVzLmdldEFsbChmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICRzY29wZS5jb250cmlidXRpb25zID0gZGF0YTtcclxuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnLmVtYnJ5by10aHJlZScpO1xyXG4gICAgICAgIHZhciBjb250cmlidXRpb25JbWFnZSA9ICQoJy5lbWJyeW8tY29udHJpYnV0aW9uLWltYWdlJyk7XHJcbiAgICAgICAgZW1icnlvID0gbmV3IEVtYnJ5byhkYXRhLCBjb250YWluZXIuZ2V0KDApLCBjb250YWluZXIud2lkdGgoKSwgY29udGFpbmVyLmhlaWdodCgpKTtcclxuICAgICAgICB3aW5kb3cuZW1icnlvID0gZW1icnlvO1xyXG4gICAgICAgIGVtYnJ5by5vbnNlbGVjdCA9IGZ1bmN0aW9uIChjb250cmlidXRpb24pIHtcclxuICAgICAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAnaGlkZGVuJztcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucGx1c0J1dHRvbiA9IHRydWU7XHJcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcclxuICAgICAgICAgICAgY29udGFpbmVyLmNzcyh7XHJcbiAgICAgICAgICAgICAgJy13ZWJraXQtZmlsdGVyJzogJ2JsdXIoMHB4KSdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ29wYWNpdHknOiAwXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICdzaG93bic7XHJcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBsdXNCdXR0b24gPSBmYWxzZTtcclxuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uID0gY29udHJpYnV0aW9uO1xyXG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRJbWFnZSc6ICd1cmwoJyArIGNvbnRyaWJ1dGlvbi5iYXNlNjQgKyAnKScsXHJcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRTaXplJzogJ2NvdmVyJyxcclxuICAgICAgICAgICAgICAnb3BhY2l0eSc6IDFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5jc3Moe1xyXG4gICAgICAgICAgICAgICctd2Via2l0LWZpbHRlcic6ICdibHVyKDEwcHgpJ1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgJHNjb3BlLnZpc2liaWxpdHkgPSB7XHJcbiAgICAgICAgcG9zdDogZmFsc2UsXHJcbiAgICAgICAgcGx1c0J1dHRvbjogdHJ1ZSxcclxuICAgICAgICBjb250cmlidXRpb25EZXRhaWxzOiAnaGlkZGVuJyxcclxuICAgICAgICBwb3N0U2VhcmNoOiB0cnVlLFxyXG4gICAgICAgIHBvc3RDb250cmlidXRlOiBmYWxzZSxcclxuICAgICAgICBwb3N0TG9hZGluZzogZmFsc2VcclxuICAgICAgfTtcclxuXHJcbiAgICAgICRzY29wZS5xdWVyeSA9ICdza3knO1xyXG5cclxuICAgICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUuaXRlbXMgPSBbXTtcclxuICAgICAgICBpbWFnZVNlYXJjaC5nZXRJbWFnZXMoJHNjb3BlLnF1ZXJ5LCBmdW5jdGlvbiAoaXRlbXMpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcclxuICAgICAgICAgICRzY29wZS5pdGVtcyA9IGl0ZW1zO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWRJdGVtID0gaXRlbTtcclxuICAgICAgICAkc2NvcGUudXJsID0gaXRlbS5saW5rO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RTZWFyY2ggPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0Q29udHJpYnV0ZSA9IHRydWU7XHJcbiAgICAgICAgJHNjb3BlLnRleHQgPSAkc2NvcGUucXVlcnk7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS5zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHt0ZXh0OiAkc2NvcGUudGV4dCwgdXJsOiAkc2NvcGUudXJsfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgLy/mipXnqL/jga7ov73liqBcclxuICAgICAgICAgICRzY29wZS5jb250cmlidXRpb25zLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICBlbWJyeW8uYWRkQ29udHJpYnV0aW9uKGRhdGEsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RMb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLmNsb3NlTGlnaHRib3ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS50b2dnbGVQb3N0UGFuZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0ID0gISRzY29wZS52aXNpYmlsaXR5LnBvc3Q7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS50b2dnbGVDb250cmlidXRpb25EZXRhaWxzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID09ICdvcGVuZWQnID8gJ3Nob3duJyA6ICdvcGVuZWQnO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUuYmFja1RvU2VhcmNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RTZWFyY2ggPSB0cnVlO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1dKTtcclxuXHJcbn0pKCk7Il19
