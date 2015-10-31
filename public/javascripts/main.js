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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL0RvY3VtZW50cy9tdXMubG9nL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9Ob2Rva2EvRG9jdW1lbnRzL211cy5sb2cvc291cmNlL2phdmFzY3JpcHRzL0NvbnZleEdlb21ldHJ5LmpzIiwiQzovVXNlcnMvTm9kb2thL0RvY3VtZW50cy9tdXMubG9nL3NvdXJjZS9qYXZhc2NyaXB0cy9lbWJyeW8uZXM2IiwiQzovVXNlcnMvTm9kb2thL0RvY3VtZW50cy9tdXMubG9nL3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiLCJDOi9Vc2Vycy9Ob2Rva2EvRG9jdW1lbnRzL211cy5sb2cvc291cmNlL2phdmFzY3JpcHRzL21haW4uZXM2Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbUJBLEtBQUssQ0FBQyxjQUFjLEdBQUcsVUFBVSxRQUFRLEVBQUc7O0FBRTNDLE1BQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDOztBQUU1QixLQUFJLEtBQUssR0FBRyxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7O0FBRTVDLFVBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVkOztBQUdELFVBQVMsUUFBUSxDQUFFLFFBQVEsRUFBRzs7QUFFN0IsTUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDLEtBQUssRUFBRSxDQUFDOztBQUUxQyxNQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDMUIsUUFBTSxDQUFDLENB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bUIsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLG1CQUFtQixJQUFJLFFBQVEsR0FBRyxPQUFPLEdBQUcsUUFBUSxDQUFDO0tBQ2hILENBQUM7QUFDRixVQUFNLENBQUMsWUFBWSxHQUFHLFlBQVk7QUFDaEMsWUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLFlBQU0sQ0FBQyxVQUFVLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztLQUMxQyxDQUFBO0dBQ0YsQ0FBQyxDQUFDLENBQUM7Q0FFUCxDQUFBLEVBQUcsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQGF1dGhvciBxaWFvIC8gaHR0cHM6Ly9naXRodWIuY29tL3FpYW9cclxuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIGEgY29udmV4IGh1bGwgZ2VuZXJhdG9yIHVzaW5nIHRoZSBpbmNyZW1lbnRhbCBtZXRob2QuIFxyXG4gKiBUaGUgY29tcGxleGl0eSBpcyBPKG5eMikgd2hlcmUgbiBpcyB0aGUgbnVtYmVyIG9mIHZlcnRpY2VzLlxyXG4gKiBPKG5sb2duKSBhbGdvcml0aG1zIGRvIGV4aXN0LCBidXQgdGhleSBhcmUgbXVjaCBtb3JlIGNvbXBsaWNhdGVkLlxyXG4gKlxyXG4gKiBCZW5jaG1hcms6IFxyXG4gKlxyXG4gKiAgUGxhdGZvcm06IENQVTogUDczNTAgQDIuMDBHSHogRW5naW5lOiBWOFxyXG4gKlxyXG4gKiAgTnVtIFZlcnRpY2VzXHRUaW1lKG1zKVxyXG4gKlxyXG4gKiAgICAgMTAgICAgICAgICAgIDFcclxuICogICAgIDIwICAgICAgICAgICAzXHJcbiAqICAgICAzMCAgICAgICAgICAgMTlcclxuICogICAgIDQwICAgICAgICAgICA0OFxyXG4gKiAgICAgNTAgICAgICAgICAgIDEwN1xyXG4gKi9cclxuXHJcblRIUkVFLkNvbnZleEdlb21ldHJ5ID0gZnVuY3Rpb24oIHZlcnRpY2VzICkge1xyXG5cclxuXHRUSFJFRS5HZW9tZXRyeS5jYWxsKCB0aGlzICk7XHJcblxyXG5cdHZhciBmYWNlcyA9IFsgWyAwLCAxLCAyIF0sIFsgMCwgMiwgMSBdIF07IFxyXG5cclxuXHRmb3IgKCB2YXIgaSA9IDM7IGkgPCB2ZXJ0aWNlcy5sZW5ndGg7IGkgKysgKSB7XHJcblxyXG5cdFx0YWRkUG9pbnQoIGkgKTtcclxuXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYWRkUG9pbnQoIHZlcnRleElkICkge1xyXG5cclxuXHRcdHZhciB2ZXJ0ZXggPSB2ZXJ0aWNlc1sgdmVydGV4SWQgXS5jbG9uZSgpO1xyXG5cclxuXHRcdHZhciBtYWcgPSB2ZXJ0ZXgubGVuZ3RoKCk7XHJcblx0XHR2ZXJ0ZXgueCArPSBtYWcgKiByYW5kb21PZmZzZXQoKTtcclxuXHRcdHZlcnRleC55ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xyXG5cdFx0dmVydGV4LnogKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XHJcblxyXG5cdFx0dmFyIGhvbGUgPSBbXTtcclxuXHJcblx0XHRmb3IgKCB2YXIgZiA9IDA7IGYgPCBmYWNlcy5sZW5ndGg7ICkge1xyXG5cclxuXHRcdFx0dmFyIGZhY2UgPSBmYWNlc1sgZiBdO1xyXG5cclxuXHRcdFx0Ly8gZm9yIGVhY2ggZmFjZSwgaWYgdGhlIHZlcnRleCBjYW4gc2VlIGl0LFxyXG5cdFx0XHQvLyB0aGVuIHdlIHRyeSB0byBhZGQgdGhlIGZhY2UncyBlZGdlcyBpbnRvIHRoZSBob2xlLlxyXG5cdFx0XHRpZiAoIHZpc2libGUoIGZhY2UsIHZlcnRleCApICkge1xyXG5cclxuXHRcdFx0XHRmb3IgKCB2YXIgZSA9IDA7IGUgPCAzOyBlICsrICkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBlZGdlID0gWyBmYWNlWyBlIF0sIGZhY2VbICggZSArIDEgKSAlIDMgXSBdO1xyXG5cdFx0XHRcdFx0dmFyIGJvdW5kYXJ5ID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0XHQvLyByZW1vdmUgZHVwbGljYXRlZCBlZGdlcy5cclxuXHRcdFx0XHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKCBlcXVhbEVkZ2UoIGhvbGVbIGggXSwgZWRnZSApICkge1xyXG5cclxuXHRcdFx0XHRcdFx0XHRob2xlWyBoIF0gPSBob2xlWyBob2xlLmxlbmd0aCAtIDEgXTtcclxuXHRcdFx0XHRcdFx0XHRob2xlLnBvcCgpO1xyXG5cdFx0XHRcdFx0XHRcdGJvdW5kYXJ5ID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGlmICggYm91bmRhcnkgKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRob2xlLnB1c2goIGVkZ2UgKTtcclxuXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly8gcmVtb3ZlIGZhY2VzWyBmIF1cclxuXHRcdFx0XHRmYWNlc1sgZiBdID0gZmFjZXNbIGZhY2VzLmxlbmd0aCAtIDEgXTtcclxuXHRcdFx0XHRmYWNlcy5wb3AoKTtcclxuXHJcblx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdC8vIG5vdCB2aXNpYmxlXHJcblxyXG5cdFx0XHRcdGYgKys7XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGNvbnN0cnVjdCB0aGUgbmV3IGZhY2VzIGZvcm1lZCBieSB0aGUgZWRnZXMgb2YgdGhlIGhvbGUgYW5kIHRoZSB2ZXJ0ZXhcclxuXHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xyXG5cclxuXHRcdFx0ZmFjZXMucHVzaCggWyBcclxuXHRcdFx0XHRob2xlWyBoIF1bIDAgXSxcclxuXHRcdFx0XHRob2xlWyBoIF1bIDEgXSxcclxuXHRcdFx0XHR2ZXJ0ZXhJZFxyXG5cdFx0XHRdICk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFdoZXRoZXIgdGhlIGZhY2UgaXMgdmlzaWJsZSBmcm9tIHRoZSB2ZXJ0ZXhcclxuXHQgKi9cclxuXHRmdW5jdGlvbiB2aXNpYmxlKCBmYWNlLCB2ZXJ0ZXggKSB7XHJcblxyXG5cdFx0dmFyIHZhID0gdmVydGljZXNbIGZhY2VbIDAgXSBdO1xyXG5cdFx0dmFyIHZiID0gdmVydGljZXNbIGZhY2VbIDEgXSBdO1xyXG5cdFx0dmFyIHZjID0gdmVydGljZXNbIGZhY2VbIDIgXSBdO1xyXG5cclxuXHRcdHZhciBuID0gbm9ybWFsKCB2YSwgdmIsIHZjICk7XHJcblxyXG5cdFx0Ly8gZGlzdGFuY2UgZnJvbSBmYWNlIHRvIG9yaWdpblxyXG5cdFx0dmFyIGRpc3QgPSBuLmRvdCggdmEgKTtcclxuXHJcblx0XHRyZXR1cm4gbi5kb3QoIHZlcnRleCApID49IGRpc3Q7IFxyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIEZhY2Ugbm9ybWFsXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gbm9ybWFsKCB2YSwgdmIsIHZjICkge1xyXG5cclxuXHRcdHZhciBjYiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XHJcblx0XHR2YXIgYWIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xyXG5cclxuXHRcdGNiLnN1YlZlY3RvcnMoIHZjLCB2YiApO1xyXG5cdFx0YWIuc3ViVmVjdG9ycyggdmEsIHZiICk7XHJcblx0XHRjYi5jcm9zcyggYWIgKTtcclxuXHJcblx0XHRjYi5ub3JtYWxpemUoKTtcclxuXHJcblx0XHRyZXR1cm4gY2I7XHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogRGV0ZWN0IHdoZXRoZXIgdHdvIGVkZ2VzIGFyZSBlcXVhbC5cclxuXHQgKiBOb3RlIHRoYXQgd2hlbiBjb25zdHJ1Y3RpbmcgdGhlIGNvbnZleCBodWxsLCB0d28gc2FtZSBlZGdlcyBjYW4gb25seVxyXG5cdCAqIGJlIG9mIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gZXF1YWxFZGdlKCBlYSwgZWIgKSB7XHJcblxyXG5cdFx0cmV0dXJuIGVhWyAwIF0gPT09IGViWyAxIF0gJiYgZWFbIDEgXSA9PT0gZWJbIDAgXTsgXHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogQ3JlYXRlIGEgcmFuZG9tIG9mZnNldCBiZXR3ZWVuIC0xZS02IGFuZCAxZS02LlxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHJhbmRvbU9mZnNldCgpIHtcclxuXHJcblx0XHRyZXR1cm4gKCBNYXRoLnJhbmRvbSgpIC0gMC41ICkgKiAyICogMWUtNjtcclxuXHJcblx0fVxyXG5cclxuXHJcblx0LyoqXHJcblx0ICogWFhYOiBOb3Qgc3VyZSBpZiB0aGlzIGlzIHRoZSBjb3JyZWN0IGFwcHJvYWNoLiBOZWVkIHNvbWVvbmUgdG8gcmV2aWV3LlxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHZlcnRleFV2KCB2ZXJ0ZXggKSB7XHJcblxyXG5cdFx0dmFyIG1hZyA9IHZlcnRleC5sZW5ndGgoKTtcclxuXHRcdHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMiggdmVydGV4LnggLyBtYWcsIHZlcnRleC55IC8gbWFnICk7XHJcblxyXG5cdH1cclxuXHJcblx0Ly8gUHVzaCB2ZXJ0aWNlcyBpbnRvIGB0aGlzLnZlcnRpY2VzYCwgc2tpcHBpbmcgdGhvc2UgaW5zaWRlIHRoZSBodWxsXHJcblx0dmFyIGlkID0gMDtcclxuXHR2YXIgbmV3SWQgPSBuZXcgQXJyYXkoIHZlcnRpY2VzLmxlbmd0aCApOyAvLyBtYXAgZnJvbSBvbGQgdmVydGV4IGlkIHRvIG5ldyBpZFxyXG5cclxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkgKysgKSB7XHJcblxyXG5cdFx0IHZhciBmYWNlID0gZmFjZXNbIGkgXTtcclxuXHJcblx0XHQgZm9yICggdmFyIGogPSAwOyBqIDwgMzsgaiArKyApIHtcclxuXHJcblx0XHRcdGlmICggbmV3SWRbIGZhY2VbIGogXSBdID09PSB1bmRlZmluZWQgKSB7XHJcblxyXG5cdFx0XHRcdG5ld0lkWyBmYWNlWyBqIF0gXSA9IGlkICsrO1xyXG5cdFx0XHRcdHRoaXMudmVydGljZXMucHVzaCggdmVydGljZXNbIGZhY2VbIGogXSBdICk7XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmYWNlWyBqIF0gPSBuZXdJZFsgZmFjZVsgaiBdIF07XHJcblxyXG5cdFx0IH1cclxuXHJcblx0fVxyXG5cclxuXHQvLyBDb252ZXJ0IGZhY2VzIGludG8gaW5zdGFuY2VzIG9mIFRIUkVFLkZhY2UzXHJcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgZmFjZXMubGVuZ3RoOyBpICsrICkge1xyXG5cclxuXHRcdHRoaXMuZmFjZXMucHVzaCggbmV3IFRIUkVFLkZhY2UzKCBcclxuXHRcdFx0XHRmYWNlc1sgaSBdWyAwIF0sXHJcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMSBdLFxyXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDIgXVxyXG5cdFx0KSApO1xyXG5cclxuXHR9XHJcblxyXG5cdC8vIENvbXB1dGUgVVZzXHJcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5mYWNlcy5sZW5ndGg7IGkgKysgKSB7XHJcblxyXG5cdFx0dmFyIGZhY2UgPSB0aGlzLmZhY2VzWyBpIF07XHJcblxyXG5cdFx0dGhpcy5mYWNlVmVydGV4VXZzWyAwIF0ucHVzaCggW1xyXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5hIF0gKSxcclxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYiBdICksXHJcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmMgXSApXHJcblx0XHRdICk7XHJcblxyXG5cdH1cclxuXHJcblx0dGhpcy5jb21wdXRlRmFjZU5vcm1hbHMoKTtcclxuXHR0aGlzLmNvbXB1dGVWZXJ0ZXhOb3JtYWxzKCk7XHJcblxyXG59O1xyXG5cclxuVEhSRUUuQ29udmV4R2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVEhSRUUuR2VvbWV0cnkucHJvdG90eXBlICk7XHJcblRIUkVFLkNvbnZleEdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRIUkVFLkNvbnZleEdlb21ldHJ5O1xyXG4iLCJpbXBvcnQgJy4vdGhyZWUtbW91c2UtZXZlbnQuZXM2JztcclxuaW1wb3J0ICcuL0NvbnZleEdlb21ldHJ5JztcclxuXHJcblRIUkVFLlZlY3RvcjMucHJvdG90eXBlLm1peCA9IGZ1bmN0aW9uKHksIGEpIHtcclxuICByZXR1cm4gdGhpcy5tdWx0aXBseVNjYWxhcigxIC0gYSkuYWRkKHkuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihhKSlcclxufTtcclxuXHJcbmNsYXNzIEVtYnJ5byB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGRhdGEsIGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCkge1xyXG5cclxuICAgIC8vKiBkYXRhIDogYXJyYXkgb2YgY29udHJpYnV0aW9uc1xyXG4gICAgLy8qIGNvbnRyaWJ1dGlvblxyXG4gICAgLy8qIHtcclxuICAgIC8vKiAgIGltYWdlOiBET01JbWFnZVxyXG4gICAgLy8qICAgdGV4dDogU3RyaW5nXHJcbiAgICAvLyogfVxyXG4gICAgdGhpcy5kYXRhID0gZGF0YTtcclxuXHJcbiAgICAvL+ODhuOCr+OCueODgeODo+OBruS9nOaIkFxyXG4gICAgdmFyIGxvYWRlZE51bSA9IDA7XHJcbiAgICBkYXRhLmZvckVhY2goKGNvbnRyaWJ1dGlvbiwgaW5kZXgpID0+IHtcclxuICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICB2YXIgdGV4dHVyZSA9IEVtYnJ5by5jcmVhdGVUZXh0dXJlKGltYWdlKTtcclxuICAgICAgICB0aGlzLmRhdGFbaW5kZXhdLnRleHR1cmUgPSB0ZXh0dXJlO1xyXG4gICAgICAgIGxvYWRlZE51bSsrO1xyXG4gICAgICAgIGlmKGxvYWRlZE51bSA9PT0gZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZShjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgaW1hZ2Uuc3JjID0gY29udHJpYnV0aW9uLmJhc2U2NDtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG5cclxuICB9XHJcblxyXG4gIGluaXRpYWxpemUoY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAvL2luaXQgc2NlbmVcclxuICAgIHZhciBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xyXG5cclxuICAgIC8vaW5pdCBjYW1lcmFcclxuICAgIHZhciBmb3YgPSA2MDtcclxuICAgIHZhciBhc3BlY3QgPSB3aWR0aCAvIGhlaWdodDtcclxuICAgIHZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoZm92LCBhc3BlY3QpO1xyXG4gICAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAoaGVpZ2h0IC8gMikgLyBNYXRoLnRhbigoZm92ICogTWF0aC5QSSAvIDE4MCkgLyAyKSk7XHJcbiAgICBjYW1lcmEubG9va0F0KG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApKTtcclxuICAgIHNjZW5lLmFkZChjYW1lcmEpO1xyXG5cclxuICAgIC8vaW5pdCByZW5kZXJlclxyXG4gICAgdmFyIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe2FscGhhOiB0cnVlLCBhbnRpYWxpYXM6IHRydWV9KTtcclxuICAgIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XHJcbiAgICByZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4Y2NjY2NjLCAwKTtcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcclxuXHJcbiAgICAvL2luaXQgY29udHJvbHNcclxuICAgIHZhciBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyhjYW1lcmEsIHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG5cclxuICAgIC8vd2F0Y2ggbW91c2UgZXZlbnRzXHJcbiAgICBzY2VuZS53YXRjaE1vdXNlRXZlbnQocmVuZGVyZXIuZG9tRWxlbWVudCwgY2FtZXJhKTtcclxuXHJcbiAgICB0aGlzLnNjZW5lID0gc2NlbmU7XHJcbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcclxuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcclxuICAgIHRoaXMuY29udHJvbHMgPSBjb250cm9scztcclxuXHJcbiAgICAvL+eUn+aIkFxyXG4gICAgdGhpcy5jcmVhdGUoKTtcclxuXHJcbiAgICB0aGlzLmNvdW50ID0gMDtcclxuXHJcbiAgICBjb25zb2xlLmxvZyh0aGlzLmZyYW1lcyk7XHJcblxyXG4gICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGNvbnRyb2xzLnVwZGF0ZSgpO1xyXG4gICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XHJcbiAgICAgIC8vc2NlbmUuaGFuZGxlTW91c2VFdmVudCgpO1xyXG4gICAgICB0aGlzLmNvdW50Kys7XHJcbiAgICAgIHRoaXMubW92ZVZlcnRpY2VzKCkucm90YXRlKCk7XHJcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh1cGRhdGUpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgdXBkYXRlKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gIH1cclxuXHJcbiAgY3JlYXRlKGNhbGxiYWNrKSB7XHJcbiAgICB0aGlzLmdlb21ldHJ5ID0gRW1icnlvLmNyZWF0ZUdlb21ldHJ5KDEwMCwgdGhpcy5kYXRhLmxlbmd0aCk7XHJcbiAgICB0aGlzLmZyYW1lcyA9IEVtYnJ5by5jcmVhdGVGcmFtZXModGhpcy5nZW9tZXRyeSwgdGhpcy5kYXRhKTtcclxuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goKGZyYW1lKSA9PiB7Ly/jg57jgqbjgrnjgqTjg5njg7Pjg4jjga7oqK3lrppcclxuICAgICAgZnJhbWUub25jbGljayA9IChpbnRlcnNlY3QpID0+IHtcclxuICAgICAgICBpZih0eXBlb2YgdGhpcy5vbnNlbGVjdCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgdGhpcy5vbnNlbGVjdChmcmFtZS5kYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIC8vZnJhbWUub25tb3VzZW92ZXIgPSAoaW50ZXJzZWN0KSA9PiB7XHJcbiAgICAgIC8vICBpbnRlcnNlY3QuZmFjZS5tb3VzZW9uID0gdHJ1ZTtcclxuICAgICAgLy99O1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLmZyYW1lcyk7XHJcbiAgICB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgJiYgY2FsbGJhY2soKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8v5LiJ6KeS44Gu6Z2i44Gn5qeL5oiQ44GV44KM44KL5aSa6Z2i5L2T44Gu5L2c5oiQXHJcbiAgc3RhdGljIGNyZWF0ZUdlb21ldHJ5KHJhZGl1cywgc3VyZmFjZU51bWJlcikge1xyXG4gICAgdmFyIHZlcnRpY2VzID0gW107XHJcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgPCA0KSA/IDQgOiBzdXJmYWNlTnVtYmVyOy8v77yU5Lul5LiL44Gv5LiN5Y+vXHJcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgJiAxKSA/IChzdXJmYWNlTnVtYmVyICsgMSkgOiBzdXJmYWNlTnVtYmVyOy8v5aWH5pWw44Gv5LiN5Y+vKOOCiOOCiuWkp+OBjeOBhOWBtuaVsOOBq+ebtOOBmSlcclxuICAgIGZvcih2YXIgaSA9IDAsIGwgPSAoMiArIHN1cmZhY2VOdW1iZXIgLyAyKTsgaSA8IGw7IGkrKykge1xyXG4gICAgICB2ZXJ0aWNlc1tpXSA9IG5ldyBUSFJFRS5WZWN0b3IzKE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUpOy8v55CD54q244Gr44Op44Oz44OA44Og44Gr54K544KS5omT44GkXHJcbiAgICAgIHZlcnRpY2VzW2ldLnNldExlbmd0aChyYWRpdXMpO1xyXG4gICAgICB2ZXJ0aWNlc1tpXS5vcmlnaW5hbExlbmd0aCA9IHJhZGl1cztcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgVEhSRUUuQ29udmV4R2VvbWV0cnkodmVydGljZXMpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGNyZWF0ZUZyYW1lcyhnZW9tZXRyeSwgZGF0YSkge1xyXG4gICAgdmFyIHZlcnRleHRTaGFkZXIgPSAnJyArXHJcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xyXG4gICAgICAndm9pZCBtYWluKCkgeycgK1xyXG4gICAgICAnICBnbF9Qb3NpdGlvbiA9IHByb2plY3Rpb25NYXRyaXggKiB2aWV3TWF0cml4ICogbW9kZWxNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLCAxLjApOycgK1xyXG4gICAgICAnICB2UG9zaXRpb24gPSBnbF9Qb3NpdGlvbjsnICtcclxuICAgICAgJ30nO1xyXG5cclxuICAgIHZhciBmcmFnbWVudFNoYWRlciA9ICcnICtcclxuICAgICAgJ3VuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7JyArXHJcbiAgICAgICd1bmlmb3JtIGZsb2F0IG9wYWNpdHk7JyArXHJcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xyXG4gICAgICAndm9pZCBtYWluKHZvaWQpeycgK1xyXG4gICAgICAnICB2ZWM0IHRleHR1cmVDb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB2ZWMyKCgxLjAgKyB2UG9zaXRpb24ueCAvIDEwMC4wKSAvIDIuMCwgKDEuMCArIHZQb3NpdGlvbi55IC8gMTAwLjApIC8gMi4wKSk7JyArXHJcbiAgICAgICcgIHRleHR1cmVDb2xvci53ID0gb3BhY2l0eTsnICtcclxuICAgICAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZUNvbG9yOycgK1xyXG4gICAgICAvLycgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCh2UG9zaXRpb24ueCAvIDEwMC4wICsgMS4wKSAvIDIuMCwgKHZQb3NpdGlvbi55IC8gMTAwLjAgKyAxLjApIC8gMi4wLCAwLCAwKTsnICtcclxuICAgICAgJ30nO1xyXG5cclxuICAgIHZhciBmcmFtZXMgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcclxuICAgIGdlb21ldHJ5LmZhY2VzLmZvckVhY2goZnVuY3Rpb24oZmFjZSwgaW5kZXgpIHtcclxuICAgICAgdmFyIGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdLCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXSwgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XHJcblxyXG4gICAgICAvL2NyZWF0ZSBnZW9tZXRyeVxyXG4gICAgICB2YXIgZnJhbWVHZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xyXG4gICAgICBmcmFtZUdlb21ldHJ5LnZlcnRpY2VzID0gW2EsIGIsIGNdO1xyXG4gICAgICBmcmFtZUdlb21ldHJ5LmZhY2VzID0gW25ldyBUSFJFRS5GYWNlMygwLCAxLCAyKV07XHJcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XHJcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcclxuXHJcbiAgICAgIC8vY3JlYXRlIG1hdGVyaWFsXHJcbiAgICAgIHZhciBmcmFtZU1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcclxuICAgICAgICB2ZXJ0ZXhTaGFkZXI6IHZlcnRleHRTaGFkZXIsXHJcbiAgICAgICAgZnJhZ21lbnRTaGFkZXI6IGZyYWdtZW50U2hhZGVyLFxyXG4gICAgICAgIHVuaWZvcm1zOiB7XHJcbiAgICAgICAgICB0ZXh0dXJlOiB7IHR5cGU6IFwidFwiLCB2YWx1ZTogZGF0YVtpbmRleF0gPyBkYXRhW2luZGV4XS50ZXh0dXJlIDogbnVsbCB9LFxyXG4gICAgICAgICAgb3BhY2l0eTogeyB0eXBlOiBcImZcIiwgdmFsdWU6IDEuMCB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZnJhbWVHZW9tZXRyeSwgZnJhbWVNYXRlcmlhbCk7XHJcbiAgICAgIG1lc2guZGF0YSA9IGRhdGFbaW5kZXhdO1xyXG5cclxuICAgICAgZnJhbWVzLmFkZChtZXNoKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGZyYW1lcztcclxuICB9XHJcblxyXG4gIHN0YXRpYyBjcmVhdGVUZXh0dXJlKGltYWdlKSB7XHJcbiAgICB2YXIgdGV4dHVyZSA9IG5ldyBUSFJFRS5UZXh0dXJlKHRoaXMuZ2V0U3VpdGFibGVJbWFnZShpbWFnZSkpO1xyXG4gICAgLy90ZXh0dXJlLm1hZ0ZpbHRlciA9IHRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcclxuICAgIHRleHR1cmUubmVlZHNVcGRhdGUgPSB0cnVlO1xyXG4gICAgcmV0dXJuIHRleHR1cmU7XHJcbiAgfVxyXG5cclxuICAvL+eUu+WDj+OCteOCpOOCuuOCkuiqv+aVtFxyXG4gIHN0YXRpYyBnZXRTdWl0YWJsZUltYWdlKGltYWdlKSB7XHJcbiAgICB2YXIgdyA9IGltYWdlLm5hdHVyYWxXaWR0aCwgaCA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XHJcbiAgICB2YXIgc2l6ZSA9IE1hdGgucG93KDIsIE1hdGgubG9nKE1hdGgubWluKHcsIGgpKSAvIE1hdGguTE4yIHwgMCk7IC8vIGxhcmdlc3QgMl5uIGludGVnZXIgdGhhdCBkb2VzIG5vdCBleGNlZWRcclxuICAgIGlmICh3ICE9PSBoIHx8IHcgIT09IHNpemUpIHtcclxuICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICB2YXIgb2Zmc2V0WCA9IGggLyB3ID4gMSA/IDAgOiAodyAtIGgpIC8gMjtcclxuICAgICAgdmFyIG9mZnNldFkgPSBoIC8gdyA+IDEgPyAoaCAtIHcpIC8gMiA6IDA7XHJcbiAgICAgIHZhciBjbGlwU2l6ZSA9IGggLyB3ID4gMSA/IHcgOiBoO1xyXG4gICAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLndpZHRoID0gc2l6ZTtcclxuICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKGltYWdlLCBvZmZzZXRYLCBvZmZzZXRZLCBjbGlwU2l6ZSwgY2xpcFNpemUsIDAsIDAsIHNpemUsIHNpemUpO1xyXG4gICAgICBpbWFnZSA9IGNhbnZhcztcclxuICAgIH1cclxuICAgIHJldHVybiBpbWFnZTtcclxuICB9XHJcblxyXG4gIG1vdmVWZXJ0aWNlcygpIHtcclxuICAgIC8vY29uc29sZS5sb2codGhpcy5mcmFtZXMuY2hpbGRyZW5bMF0uZ2VvbWV0cnkudmVydGljZXNbMF0pO1xyXG4gICAgdGhpcy5mcmFtZXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihmcmFtZSkge1xyXG4gICAgICB2YXIgZmFjZSA9IGZyYW1lLmdlb21ldHJ5LmZhY2VzWzBdO1xyXG4gICAgICBmcmFtZS5nZW9tZXRyeS52ZXJ0aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHZlcnRleCkge1xyXG4gICAgICAgIHZlcnRleC5taXgoZmFjZS5ub3JtYWwsIDAuMSkuc2V0TGVuZ3RoKHZlcnRleC5vcmlnaW5hbExlbmd0aCk7XHJcbiAgICB9KTtcclxuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXNOZWVkVXBkYXRlID0gdHJ1ZTtcclxuICAgICAgZnJhbWUuZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHJvdGF0ZSgpIHtcclxuICAgIHRoaXMuZnJhbWVzLnJvdGF0aW9uLnNldCgwLCB0aGlzLmNvdW50LzIwMCwgMCk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgdGhyZWUuanPjgqrjg5bjgrjjgqfjgq/jg4jjga7liYrpmaRcclxuICAgKi9cclxuICBjbGVhcigpIHtcclxuICAgIHRoaXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5mcmFtZXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihmcmFtZSkge1xyXG4gICAgICBmcmFtZS5nZW9tZXRyeS5kaXNwb3NlKCk7XHJcbiAgICAgIGZyYW1lLm1hdGVyaWFsLmRpc3Bvc2UoKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5zY2VuZS5yZW1vdmUodGhpcy5mcmFtZXMpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgIGNvbnRyaWJ1dGlvbuOBrui/veWKoFxyXG4gICAgQHBhcmFtIGNvbnRyaWJ1dGlvbiB7T2JqZWN0fSDmipXnqL9cclxuICAgKi9cclxuICBhZGRDb250cmlidXRpb24oY29udHJpYnV0aW9uLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGNvbnRyaWJ1dGlvbi50ZXh0dXJlID0gRW1icnlvLmNyZWF0ZVRleHR1cmUoaW1hZ2UpO1xyXG4gICAgICB0aGlzLmRhdGEucHVzaChjb250cmlidXRpb24pO1xyXG4gICAgICB0aGlzLmNsZWFyKCkuY3JlYXRlKGNhbGxiYWNrKTsvL+ODquOCu+ODg+ODiFxyXG4gICAgfTtcclxuICAgIGltYWdlLnNyYyA9IGNvbnRyaWJ1dGlvbi5iYXNlNjQ7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBzZXRTaXplKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcclxuICAgIHRoaXMuY2FtZXJhLmFzcGVjdCA9IHdpZHRoIC8gaGVpZ2h0O1xyXG4gICAgdGhpcy5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgRW1icnlvOyIsIlRIUkVFLlNjZW5lLnByb3RvdHlwZS53YXRjaE1vdXNlRXZlbnQgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYW1lcmEpIHtcclxuICB2YXIgcHJlSW50ZXJzZWN0cyA9IFtdO1xyXG4gIHZhciBtb3VzZURvd25JbnRlcnNlY3RzID0gW107XHJcbiAgdmFyIHByZUV2ZW50O1xyXG4gIHZhciBtb3VzZURvd25Qb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VEb3duKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgIC8vb25tb3VzZWRvd25cclxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihwcmVJbnRlcnNlY3QpIHtcclxuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vkb3duID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgb2JqZWN0Lm9ubW91c2Vkb3duKHByZUludGVyc2VjdCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgbW91c2VEb3duSW50ZXJzZWN0cyA9IHByZUludGVyc2VjdHM7XHJcblxyXG4gICAgcHJlRXZlbnQgPSBldmVudDtcclxuICAgIG1vdXNlRG93blBvaW50ID0gbmV3IFRIUkVFLlZlY3RvcjIoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZVVwKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgIC8vb25tb3VzZXVwXHJcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XHJcbiAgICAgIHZhciBvYmplY3QgPSBpbnRlcnNlY3Qub2JqZWN0O1xyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNldXAgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBvYmplY3Qub25tb3VzZXVwKGludGVyc2VjdCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGlmKG1vdXNlRG93blBvaW50LmRpc3RhbmNlVG8obmV3IFRIUkVFLlZlY3RvcjIoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpIDwgNSkge1xyXG4gICAgICAvL29uY2xpY2tcclxuICAgICAgbW91c2VEb3duSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcclxuICAgICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcclxuICAgICAgICBpZiAodHlwZW9mIG9iamVjdC5vbmNsaWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICBpZiAoZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xyXG4gICAgICAgICAgICBvYmplY3Qub25jbGljayhpbnRlcnNlY3QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlRXZlbnQgPSBldmVudDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlTW92ZShldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xyXG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgbW91c2UueCA9ICgoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCkgLyBkb21FbGVtZW50LndpZHRoKSAqIDIgLSAxO1xyXG4gICAgbW91c2UueSA9IC0oKGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCkgLyBkb21FbGVtZW50LmhlaWdodCkgKiAyICsgMTtcclxuXHJcbiAgICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xyXG4gICAgcmF5Y2FzdGVyLnNldEZyb21DYW1lcmEobW91c2UsIGNhbWVyYSk7XHJcblxyXG4gICAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhfdGhpcy5jaGlsZHJlbiwgdHJ1ZSk7XHJcbiAgICBpbnRlcnNlY3RzLmxlbmd0aCA9IDE7Ly/miYvliY3jga7jgqrjg5bjgrjjgqfjgq/jg4jjga7jgb9cclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKGludGVyc2VjdHMpO1xyXG4gICAgaW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcclxuICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XHJcbiAgICAgIC8vb25tb3VzZW1vdmVcclxuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZW1vdmUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBvYmplY3Qub25tb3VzZW1vdmUoaW50ZXJzZWN0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9vbm1vdXNlb3ZlclxyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3ZlciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGlmICghZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xyXG4gICAgICAgICAgb2JqZWN0Lm9ubW91c2VvdmVyKGludGVyc2VjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvL29ubW91c2VvdXRcclxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihwcmVJbnRlcnNlY3QpIHtcclxuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2VvdXQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBpZiAoIWV4aXN0KGludGVyc2VjdHMsIHByZUludGVyc2VjdCkpIHtcclxuICAgICAgICAgIHByZUludGVyc2VjdC5vYmplY3Qub25tb3VzZW91dChwcmVJbnRlcnNlY3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcHJlSW50ZXJzZWN0cyA9IGludGVyc2VjdHM7XHJcbiAgICBwcmVFdmVudCA9IGV2ZW50O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZXhpc3QoaW50ZXJzZWN0cywgdGFyZ2V0SW50ZXJzZWN0KSB7XHJcbiAgICAvL2ludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihpbnRlcnNlY3QpIHtcclxuICAgIC8vICBpZihpbnRlcnNlY3Qub2JqZWN0ID09IHRhcmdldEludGVyc2VjdC5vYmplY3QpIHJldHVybiB0cnVlO1xyXG4gICAgLy99KTtcclxuICAgIC8vcmV0dXJuIGZhbHNlO1xyXG4gICAgcmV0dXJuICh0eXBlb2YgaW50ZXJzZWN0c1swXSA9PT0gJ29iamVjdCcpICYmIChpbnRlcnNlY3RzWzBdLm9iamVjdCA9PT0gdGFyZ2V0SW50ZXJzZWN0Lm9iamVjdCk7XHJcbiAgfVxyXG5cclxuICBkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlRG93bik7XHJcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2VVcCk7XHJcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZU1vdmUpO1xyXG5cclxuICBUSFJFRS5TY2VuZS5wcm90b3R5cGUuaGFuZGxlTW91c2VFdmVudCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcHJlRXZlbnQgJiYgaGFuZGxlTW91c2VNb3ZlKHByZUV2ZW50KTtcclxuICB9O1xyXG5cclxufTsiLCJpbXBvcnQgRW1icnlvIGZyb20gJy4vZW1icnlvLmVzNic7XHJcblxyXG4oZnVuY3Rpb24gKCkge1xyXG5cclxuICB2YXIgZW1icnlvO1xyXG5cclxuICAvL2FuZ3VsYXIgdGVzdFxyXG4gIGFuZ3VsYXIubW9kdWxlKCdteVNlcnZpY2VzJywgW10pXHJcbiAgICAuc2VydmljZSgnaW1hZ2VTZWFyY2gnLCBbJyRodHRwJywgZnVuY3Rpb24gKCRodHRwKSB7XHJcbiAgICAgIHRoaXMuZ2V0SW1hZ2VzID0gZnVuY3Rpb24gKHF1ZXJ5LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIHZhciB1cmwgPSAnaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vY3VzdG9tc2VhcmNoL3YxP2tleT1BSXphU3lDTFJmZXVSMDZSTlBLYndGZ29PblkwemUwSUtFU0Y3S3cmY3g9MDAxNTU2NTY4OTQzNTQ2ODM4MzUwOjBiZGlncmQxeDhpJnNlYXJjaFR5cGU9aW1hZ2UmcT0nO1xyXG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XHJcbiAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgdXJsOiB1cmwgKyBxdWVyeSxcclxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XHJcbiAgICAgICAgICAgIGlmKGl0ZW1zLmxlbmd0aCA9PT0gMjApIHtcclxuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgdXJsID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2N1c3RvbXNlYXJjaC92MT9rZXk9QUl6YVN5Q0xSZmV1UjA2Uk5QS2J3RmdvT25ZMHplMElLRVNGN0t3JmN4PTAwMTU1NjU2ODk0MzU0NjgzODM1MDowYmRpZ3JkMXg4aSZzZWFyY2hUeXBlPWltYWdlJnN0YXJ0PTExJnE9JztcclxuICAgICAgICBxdWVyeSA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xyXG4gICAgICAgICRodHRwKHtcclxuICAgICAgICAgIHVybDogdXJsICsgcXVlcnksXHJcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmNvbmNhdChkYXRhLml0ZW1zKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xyXG4gICAgICAgICAgICBpZihpdGVtcy5sZW5ndGggPT09IDIwKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2soaXRlbXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcclxuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuc2VydmljZSgnY29udHJpYnV0ZXMnLCBbJyRodHRwJywgZnVuY3Rpb24gKCRodHRwKSB7XHJcbiAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgLy91cmw6ICcvY29udHJpYnV0ZXMvYWxsJyxcclxuICAgICAgICAgIHVybDogJy4vamF2YXNjcmlwdHMvYWxsLmpzb24nLFxyXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJ1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgIGFsZXJ0KGRhdGEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICAgIHRoaXMuc3VibWl0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbiwgY2FsbGJhY2spIHtcclxuICAgICAgICAkaHR0cCh7XHJcbiAgICAgICAgICB1cmw6ICcvY29udHJpYnV0ZXMvcG9zdCcsXHJcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgIGRhdGE6IGNvbnRyaWJ1dGlvblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgIGFsZXJ0KGRhdGEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xyXG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICB9XSk7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKFwiZW1icnlvXCIsIFsnbXlTZXJ2aWNlcyddKVxyXG4gICAgLmNvbnRyb2xsZXIoJ215Q3RybCcsIFsnJHNjb3BlJywgJ2ltYWdlU2VhcmNoJywgJ2NvbnRyaWJ1dGVzJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VTZWFyY2gsIGNvbnRyaWJ1dGVzKSB7XHJcbiAgICAgIC8vY29udGlidXRpb25z44KS5Y+W5b6XXHJcbiAgICAgIGNvbnRyaWJ1dGVzLmdldEFsbChmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICRzY29wZS5jb250cmlidXRpb25zID0gZGF0YTtcclxuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnLmVtYnJ5by10aHJlZScpO1xyXG4gICAgICAgIHZhciBjb250cmlidXRpb25JbWFnZSA9ICQoJy5lbWJyeW8tY29udHJpYnV0aW9uLWltYWdlJyk7XHJcbiAgICAgICAgZW1icnlvID0gbmV3IEVtYnJ5byhkYXRhLCBjb250YWluZXIuZ2V0KDApLCBjb250YWluZXIud2lkdGgoKSwgY29udGFpbmVyLmhlaWdodCgpKTtcclxuICAgICAgICB3aW5kb3cuZW1icnlvID0gZW1icnlvO1xyXG4gICAgICAgIGVtYnJ5by5vbnNlbGVjdCA9IGZ1bmN0aW9uIChjb250cmlidXRpb24pIHtcclxuICAgICAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAnaGlkZGVuJztcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucGx1c0J1dHRvbiA9IHRydWU7XHJcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcclxuICAgICAgICAgICAgY29udGFpbmVyLmNzcyh7XHJcbiAgICAgICAgICAgICAgJy13ZWJraXQtZmlsdGVyJzogJ2JsdXIoMHB4KSdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ29wYWNpdHknOiAwXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICdzaG93bic7XHJcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBsdXNCdXR0b24gPSBmYWxzZTtcclxuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uID0gY29udHJpYnV0aW9uO1xyXG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XHJcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRJbWFnZSc6ICd1cmwoJyArIGNvbnRyaWJ1dGlvbi5iYXNlNjQgKyAnKScsXHJcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRTaXplJzogJ2NvdmVyJyxcclxuICAgICAgICAgICAgICAnb3BhY2l0eSc6IDFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5jc3Moe1xyXG4gICAgICAgICAgICAgICctd2Via2l0LWZpbHRlcic6ICdibHVyKDEwcHgpJ1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgJHNjb3BlLnZpc2liaWxpdHkgPSB7XHJcbiAgICAgICAgcG9zdDogZmFsc2UsXHJcbiAgICAgICAgcGx1c0J1dHRvbjogdHJ1ZSxcclxuICAgICAgICBjb250cmlidXRpb25EZXRhaWxzOiAnaGlkZGVuJyxcclxuICAgICAgICBwb3N0U2VhcmNoOiB0cnVlLFxyXG4gICAgICAgIHBvc3RDb250cmlidXRlOiBmYWxzZSxcclxuICAgICAgICBwb3N0TG9hZGluZzogZmFsc2VcclxuICAgICAgfTtcclxuXHJcbiAgICAgICRzY29wZS5xdWVyeSA9ICdza3knO1xyXG5cclxuICAgICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUuaXRlbXMgPSBbXTtcclxuICAgICAgICBpbWFnZVNlYXJjaC5nZXRJbWFnZXMoJHNjb3BlLnF1ZXJ5LCBmdW5jdGlvbiAoaXRlbXMpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcclxuICAgICAgICAgICRzY29wZS5pdGVtcyA9IGl0ZW1zO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWRJdGVtID0gaXRlbTtcclxuICAgICAgICAkc2NvcGUudXJsID0gaXRlbS5saW5rO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RTZWFyY2ggPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0Q29udHJpYnV0ZSA9IHRydWU7XHJcbiAgICAgICAgJHNjb3BlLnRleHQgPSAkc2NvcGUucXVlcnk7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS5zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHt0ZXh0OiAkc2NvcGUudGV4dCwgdXJsOiAkc2NvcGUudXJsfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgLy/mipXnqL/jga7ov73liqBcclxuICAgICAgICAgICRzY29wZS5jb250cmlidXRpb25zLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICBlbWJyeW8uYWRkQ29udHJpYnV0aW9uKGRhdGEsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RMb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLmNsb3NlTGlnaHRib3ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS50b2dnbGVQb3N0UGFuZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0ID0gISRzY29wZS52aXNpYmlsaXR5LnBvc3Q7XHJcbiAgICAgIH07XHJcbiAgICAgICRzY29wZS50b2dnbGVDb250cmlidXRpb25EZXRhaWxzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID09ICdvcGVuZWQnID8gJ3Nob3duJyA6ICdvcGVuZWQnO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUuYmFja1RvU2VhcmNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RTZWFyY2ggPSB0cnVlO1xyXG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1dKTtcclxuXHJcbn0pKCk7Il19
