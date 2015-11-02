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
      embryo = new _embryoEs62['default'](data, container.get(0), container.width(), container.height());
      window.embryo = embryo;
      embryo.onselect = function (contribution) {
        if ($scope.hasSelected) {
          $scope.hasSelected = false;
          $scope.visibility.contributionDetails = 'hidden';
          $scope.visibility.plusButton = true;
          $scope.$apply();
          container.css({
            //'-webkit-filter': 'blur(0px)'
            '-webkit-transform': 'translateY(0)',
            'transform': 'translateY(0)'
          });
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
            $scope.$apply();
            contributionImage.css({
              'backgroundImage': 'url(' + contribution.base64 + ')',
              'backgroundSize': 'cover',
              'opacity': 1
            });
            container.css({
              //'-webkit-filter': 'blur(10px)'
              '-webkit-transform': 'translateY(45%)',
              'transform': 'translateY(45%)'
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
      postLoading: false
    };

    $scope.query = '';
    $scope.contributionDetailsMessage = 'OK';

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
        $scope.contributionDetailsMessage = '更新が完了しました';
        $scope.$apply();
        window.setTimeout(function () {
          $scope.contributionDetailsMessage = 'OK';
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvQ29udmV4R2VvbWV0cnkuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvZW1icnlvLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy9tYWluLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNtQkEsS0FBSyxDQUFDLGNBQWMsR0FBRyxVQUFVLFFBQVEsRUFBRzs7QUFFM0MsTUFBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7O0FBRTVCLEtBQUksS0FBSyxHQUFHLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV6QyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRzs7QUFFNUMsVUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO0VBRWQ7O0FBR0QsVUFBUyxRQUFRLENBQUUsUUFBUSxFQUFHOztBQUU3QixNQUFJLE1BQU0sR0FBRyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRTFDLE1BQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxN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TUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTdCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWYsSUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVmLFNBQU8sRUFBRSxDQUFDO0VBRVY7Ozs7Ozs7QUFPRCxVQUFTLFNBQVMsQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFHOztBQUU1QixTQUFPLEVBQUUsQ0FBRSxDQUFDLENBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFFLElBQUksRUFBRSxDQUFFLENBQUMsQ0FBRSxLQUFLLEVBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVsRDs7Ozs7QUFLRCxVQUFTLFlBQVksR0FBRzs7QUFFdkIsU0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUEsR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0VBRTFDOzs7OztBQU1ELFVBQVMsUUFBUSxDQUFFLE1BQU0sRUFBRzs7QUFFM0IsTUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzFCLFNBQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUM7RUFFM0Q7OztBQUdELEtBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLEtBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUss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QUFFOzs7OztBQUsxQyxXQUFPLEFBQUMsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxJQUFNLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssZUFBZSxDQUFDLE1BQU0sQUFBQyxDQUFDO0dBQ2pHOztBQUVELFlBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDMUQsWUFBVSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUN0RCxZQUFVLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDOztBQUUxRCxPQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxZQUFXO0FBQ2xELFlBQVEsSUFBSSxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7R0FDdkMsQ0FBQztDQUVILENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAYXV0aG9yIHFpYW8gLyBodHRwczovL2dpdGh1Yi5jb20vcWlhb1xuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIGEgY29udmV4IGh1bGwgZ2VuZXJhdG9yIHVzaW5nIHRoZSBpbmNyZW1lbnRhbCBtZXRob2QuIFxuICogVGhlIGNvbXBsZXhpdHkgaXMgTyhuXjIpIHdoZXJlIG4gaXMgdGhlIG51bWJlciBvZiB2ZXJ0aWNlcy5cbiAqIE8obmxvZ24pIGFsZ29yaXRobXMgZG8gZXhpc3QsIGJ1dCB0aGV5IGFyZSBtdWNoIG1vcmUgY29tcGxpY2F0ZWQuXG4gKlxuICogQmVuY2htYXJrOiBcbiAqXG4gKiAgUGxhdGZvcm06IENQVTogUDczNTAgQDIuMDBHSHogRW5naW5lOiBWOFxuICpcbiAqICBOdW0gVmVydGljZXNcdFRpbWUobXMpXG4gKlxuICogICAgIDEwICAgICAgICAgICAxXG4gKiAgICAgMjAgICAgICAgICAgIDNcbiAqICAgICAzMCAgICAgICAgICAgMTlcbiAqICAgICA0MCAgICAgICAgICAgNDhcbiAqICAgICA1MCAgICAgICAgICAgMTA3XG4gKi9cblxuVEhSRUUuQ29udmV4R2VvbWV0cnkgPSBmdW5jdGlvbiggdmVydGljZXMgKSB7XG5cblx0VEhSRUUuR2VvbWV0cnkuY2FsbCggdGhpcyApO1xuXG5cdHZhciBmYWNlcyA9IFsgWyAwLCAxLCAyIF0sIFsgMCwgMiwgMSBdIF07IFxuXG5cdGZvciAoIHZhciBpID0gMzsgaSA8IHZlcnRpY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdGFkZFBvaW50KCBpICk7XG5cblx0fVxuXG5cblx0ZnVuY3Rpb24gYWRkUG9pbnQoIHZlcnRleElkICkge1xuXG5cdFx0dmFyIHZlcnRleCA9IHZlcnRpY2VzWyB2ZXJ0ZXhJZCBdLmNsb25lKCk7XG5cblx0XHR2YXIgbWFnID0gdmVydGV4Lmxlbmd0aCgpO1xuXHRcdHZlcnRleC54ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xuXHRcdHZlcnRleC55ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xuXHRcdHZlcnRleC56ICs9IG1hZyAqIHJhbmRvbU9mZnNldCgpO1xuXG5cdFx0dmFyIGhvbGUgPSBbXTtcblxuXHRcdGZvciAoIHZhciBmID0gMDsgZiA8IGZhY2VzLmxlbmd0aDsgKSB7XG5cblx0XHRcdHZhciBmYWNlID0gZmFjZXNbIGYgXTtcblxuXHRcdFx0Ly8gZm9yIGVhY2ggZmFjZSwgaWYgdGhlIHZlcnRleCBjYW4gc2VlIGl0LFxuXHRcdFx0Ly8gdGhlbiB3ZSB0cnkgdG8gYWRkIHRoZSBmYWNlJ3MgZWRnZXMgaW50byB0aGUgaG9sZS5cblx0XHRcdGlmICggdmlzaWJsZSggZmFjZSwgdmVydGV4ICkgKSB7XG5cblx0XHRcdFx0Zm9yICggdmFyIGUgPSAwOyBlIDwgMzsgZSArKyApIHtcblxuXHRcdFx0XHRcdHZhciBlZGdlID0gWyBmYWNlWyBlIF0sIGZhY2VbICggZSArIDEgKSAlIDMgXSBdO1xuXHRcdFx0XHRcdHZhciBib3VuZGFyeSA9IHRydWU7XG5cblx0XHRcdFx0XHQvLyByZW1vdmUgZHVwbGljYXRlZCBlZGdlcy5cblx0XHRcdFx0XHRmb3IgKCB2YXIgaCA9IDA7IGggPCBob2xlLmxlbmd0aDsgaCArKyApIHtcblxuXHRcdFx0XHRcdFx0aWYgKCBlcXVhbEVkZ2UoIGhvbGVbIGggXSwgZWRnZSApICkge1xuXG5cdFx0XHRcdFx0XHRcdGhvbGVbIGggXSA9IGhvbGVbIGhvbGUubGVuZ3RoIC0gMSBdO1xuXHRcdFx0XHRcdFx0XHRob2xlLnBvcCgpO1xuXHRcdFx0XHRcdFx0XHRib3VuZGFyeSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKCBib3VuZGFyeSApIHtcblxuXHRcdFx0XHRcdFx0aG9sZS5wdXNoKCBlZGdlICk7XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHJlbW92ZSBmYWNlc1sgZiBdXG5cdFx0XHRcdGZhY2VzWyBmIF0gPSBmYWNlc1sgZmFjZXMubGVuZ3RoIC0gMSBdO1xuXHRcdFx0XHRmYWNlcy5wb3AoKTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBub3QgdmlzaWJsZVxuXG5cdFx0XHRcdGYgKys7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdC8vIGNvbnN0cnVjdCB0aGUgbmV3IGZhY2VzIGZvcm1lZCBieSB0aGUgZWRnZXMgb2YgdGhlIGhvbGUgYW5kIHRoZSB2ZXJ0ZXhcblx0XHRmb3IgKCB2YXIgaCA9IDA7IGggPCBob2xlLmxlbmd0aDsgaCArKyApIHtcblxuXHRcdFx0ZmFjZXMucHVzaCggWyBcblx0XHRcdFx0aG9sZVsgaCBdWyAwIF0sXG5cdFx0XHRcdGhvbGVbIGggXVsgMSBdLFxuXHRcdFx0XHR2ZXJ0ZXhJZFxuXHRcdFx0XSApO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogV2hldGhlciB0aGUgZmFjZSBpcyB2aXNpYmxlIGZyb20gdGhlIHZlcnRleFxuXHQgKi9cblx0ZnVuY3Rpb24gdmlzaWJsZSggZmFjZSwgdmVydGV4ICkge1xuXG5cdFx0dmFyIHZhID0gdmVydGljZXNbIGZhY2VbIDAgXSBdO1xuXHRcdHZhciB2YiA9IHZlcnRpY2VzWyBmYWNlWyAxIF0gXTtcblx0XHR2YXIgdmMgPSB2ZXJ0aWNlc1sgZmFjZVsgMiBdIF07XG5cblx0XHR2YXIgbiA9IG5vcm1hbCggdmEsIHZiLCB2YyApO1xuXG5cdFx0Ly8gZGlzdGFuY2UgZnJvbSBmYWNlIHRvIG9yaWdpblxuXHRcdHZhciBkaXN0ID0gbi5kb3QoIHZhICk7XG5cblx0XHRyZXR1cm4gbi5kb3QoIHZlcnRleCApID49IGRpc3Q7IFxuXG5cdH1cblxuXHQvKipcblx0ICogRmFjZSBub3JtYWxcblx0ICovXG5cdGZ1bmN0aW9uIG5vcm1hbCggdmEsIHZiLCB2YyApIHtcblxuXHRcdHZhciBjYiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dmFyIGFiID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHRcdGNiLnN1YlZlY3RvcnMoIHZjLCB2YiApO1xuXHRcdGFiLnN1YlZlY3RvcnMoIHZhLCB2YiApO1xuXHRcdGNiLmNyb3NzKCBhYiApO1xuXG5cdFx0Y2Iubm9ybWFsaXplKCk7XG5cblx0XHRyZXR1cm4gY2I7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBEZXRlY3Qgd2hldGhlciB0d28gZWRnZXMgYXJlIGVxdWFsLlxuXHQgKiBOb3RlIHRoYXQgd2hlbiBjb25zdHJ1Y3RpbmcgdGhlIGNvbnZleCBodWxsLCB0d28gc2FtZSBlZGdlcyBjYW4gb25seVxuXHQgKiBiZSBvZiB0aGUgbmVnYXRpdmUgZGlyZWN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gZXF1YWxFZGdlKCBlYSwgZWIgKSB7XG5cblx0XHRyZXR1cm4gZWFbIDAgXSA9PT0gZWJbIDEgXSAmJiBlYVsgMSBdID09PSBlYlsgMCBdOyBcblxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIHJhbmRvbSBvZmZzZXQgYmV0d2VlbiAtMWUtNiBhbmQgMWUtNi5cblx0ICovXG5cdGZ1bmN0aW9uIHJhbmRvbU9mZnNldCgpIHtcblxuXHRcdHJldHVybiAoIE1hdGgucmFuZG9tKCkgLSAwLjUgKSAqIDIgKiAxZS02O1xuXG5cdH1cblxuXG5cdC8qKlxuXHQgKiBYWFg6IE5vdCBzdXJlIGlmIHRoaXMgaXMgdGhlIGNvcnJlY3QgYXBwcm9hY2guIE5lZWQgc29tZW9uZSB0byByZXZpZXcuXG5cdCAqL1xuXHRmdW5jdGlvbiB2ZXJ0ZXhVdiggdmVydGV4ICkge1xuXG5cdFx0dmFyIG1hZyA9IHZlcnRleC5sZW5ndGgoKTtcblx0XHRyZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjIoIHZlcnRleC54IC8gbWFnLCB2ZXJ0ZXgueSAvIG1hZyApO1xuXG5cdH1cblxuXHQvLyBQdXNoIHZlcnRpY2VzIGludG8gYHRoaXMudmVydGljZXNgLCBza2lwcGluZyB0aG9zZSBpbnNpZGUgdGhlIGh1bGxcblx0dmFyIGlkID0gMDtcblx0dmFyIG5ld0lkID0gbmV3IEFycmF5KCB2ZXJ0aWNlcy5sZW5ndGggKTsgLy8gbWFwIGZyb20gb2xkIHZlcnRleCBpZCB0byBuZXcgaWRcblxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHQgdmFyIGZhY2UgPSBmYWNlc1sgaSBdO1xuXG5cdFx0IGZvciAoIHZhciBqID0gMDsgaiA8IDM7IGogKysgKSB7XG5cblx0XHRcdGlmICggbmV3SWRbIGZhY2VbIGogXSBdID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdFx0bmV3SWRbIGZhY2VbIGogXSBdID0gaWQgKys7XG5cdFx0XHRcdHRoaXMudmVydGljZXMucHVzaCggdmVydGljZXNbIGZhY2VbIGogXSBdICk7XG5cblx0XHRcdH1cblxuXHRcdFx0ZmFjZVsgaiBdID0gbmV3SWRbIGZhY2VbIGogXSBdO1xuXG5cdFx0IH1cblxuXHR9XG5cblx0Ly8gQ29udmVydCBmYWNlcyBpbnRvIGluc3RhbmNlcyBvZiBUSFJFRS5GYWNlM1xuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHR0aGlzLmZhY2VzLnB1c2goIG5ldyBUSFJFRS5GYWNlMyggXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDAgXSxcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMSBdLFxuXHRcdFx0XHRmYWNlc1sgaSBdWyAyIF1cblx0XHQpICk7XG5cblx0fVxuXG5cdC8vIENvbXB1dGUgVVZzXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMuZmFjZXMubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0dmFyIGZhY2UgPSB0aGlzLmZhY2VzWyBpIF07XG5cblx0XHR0aGlzLmZhY2VWZXJ0ZXhVdnNbIDAgXS5wdXNoKCBbXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5hIF0gKSxcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmIgXSApLFxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYyBdIClcblx0XHRdICk7XG5cblx0fVxuXG5cdHRoaXMuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG5cdHRoaXMuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcblxufTtcblxuVEhSRUUuQ29udmV4R2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVEhSRUUuR2VvbWV0cnkucHJvdG90eXBlICk7XG5USFJFRS5Db252ZXhHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUSFJFRS5Db252ZXhHZW9tZXRyeTtcbiIsImltcG9ydCAnLi90aHJlZS1tb3VzZS1ldmVudC5lczYnO1xuaW1wb3J0ICcuL0NvbnZleEdlb21ldHJ5JztcblxuVEhSRUUuVmVjdG9yMy5wcm90b3R5cGUubWl4ID0gZnVuY3Rpb24oeSwgYSkge1xuICByZXR1cm4gdGhpcy5tdWx0aXBseVNjYWxhcigxIC0gYSkuYWRkKHkuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihhKSlcbn07XG5cbmNsYXNzIEVtYnJ5byB7XG5cbiAgY29uc3RydWN0b3IoZGF0YSwgY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0KSB7XG5cbiAgICAvLyogZGF0YSA6IGFycmF5IG9mIGNvbnRyaWJ1dGlvbnNcbiAgICAvLyogY29udHJpYnV0aW9uXG4gICAgLy8qIHtcbiAgICAvLyogICBpbWFnZTogRE9NSW1hZ2VcbiAgICAvLyogICB0ZXh0OiBTdHJpbmdcbiAgICAvLyogfVxuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG5cbiAgICAvL+ODhuOCr+OCueODgeODo+OBruS9nOaIkFxuICAgIHZhciBsb2FkZWROdW0gPSAwO1xuICAgIGRhdGEuZm9yRWFjaCgoY29udHJpYnV0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHZhciB0ZXh0dXJlID0gRW1icnlvLmNyZWF0ZVRleHR1cmUoaW1hZ2UpO1xuICAgICAgICB0aGlzLmRhdGFbaW5kZXhdLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgICAgICBsb2FkZWROdW0rKztcbiAgICAgICAgaWYobG9hZGVkTnVtID09PSBkYXRhLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZShjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaW1hZ2Uuc3JjID0gY29udHJpYnV0aW9uLmJhc2U2NDtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuXG4gIH1cblxuICBpbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLmlzSGlkZGVuID0gZmFsc2U7XG5cbiAgICAvL2luaXQgc2NlbmVcbiAgICB2YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcblxuICAgIC8vaW5pdCBjYW1lcmFcbiAgICB2YXIgZm92ID0gNjA7XG4gICAgdmFyIGFzcGVjdCA9IHdpZHRoIC8gaGVpZ2h0O1xuICAgIHZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoZm92LCBhc3BlY3QpO1xuICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgKGhlaWdodCAvIDIpIC8gTWF0aC50YW4oKGZvdiAqIE1hdGguUEkgLyAxODApIC8gMikpO1xuICAgIGNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCkpO1xuICAgIHNjZW5lLmFkZChjYW1lcmEpO1xuXG4gICAgLy9pbml0IHJlbmRlcmVyXG4gICAgdmFyIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe2FscGhhOiB0cnVlLCBhbnRpYWxpYXM6IHRydWV9KTtcbiAgICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHhjY2NjY2MsIDApO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgIC8vaW5pdCBjb250cm9sc1xuICAgIHZhciBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyhjYW1lcmEsIHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgLy93YXRjaCBtb3VzZSBldmVudHNcbiAgICBzY2VuZS53YXRjaE1vdXNlRXZlbnQocmVuZGVyZXIuZG9tRWxlbWVudCwgY2FtZXJhKTtcblxuICAgIHRoaXMuc2NlbmUgPSBzY2VuZTtcbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgdGhpcy5jb250cm9scyA9IGNvbnRyb2xzO1xuXG4gICAgLy/nlJ/miJBcbiAgICB0aGlzLmNyZWF0ZSgpO1xuXG4gICAgdGhpcy5jb3VudCA9IDA7XG5cbiAgICBjb25zb2xlLmxvZyh0aGlzLmZyYW1lcyk7XG5cbiAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24oKXtcbiAgICAgIGNvbnRyb2xzLnVwZGF0ZSgpO1xuICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgLy9zY2VuZS5oYW5kbGVNb3VzZUV2ZW50KCk7XG4gICAgICB0aGlzLmNvdW50Kys7XG4gICAgICB0aGlzLm1vdmVWZXJ0aWNlcygpLnJvdGF0ZSgpO1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHVwZGF0ZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfVxuXG4gIGNyZWF0ZShjYWxsYmFjaykge1xuICAgIHRoaXMuZ2VvbWV0cnkgPSBFbWJyeW8uY3JlYXRlR2VvbWV0cnkoMTAwLCB0aGlzLmRhdGEubGVuZ3RoKTtcbiAgICB0aGlzLmZyYW1lcyA9IEVtYnJ5by5jcmVhdGVGcmFtZXModGhpcy5nZW9tZXRyeSwgdGhpcy5kYXRhKTtcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbiAmJiB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4gey8v44Oe44Km44K544Kk44OZ44Oz44OI44Gu6Kit5a6aXG4gICAgICBmcmFtZS5vbmNsaWNrID0gKGludGVyc2VjdCkgPT4ge1xuICAgICAgICBpZih0eXBlb2YgdGhpcy5vbnNlbGVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGZyYW1lLmRhdGEgJiYgdGhpcy5vbnNlbGVjdChmcmFtZS5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8vZnJhbWUub25tb3VzZW92ZXIgPSAoaW50ZXJzZWN0KSA9PiB7XG4gICAgICAvLyAgaW50ZXJzZWN0LmZhY2UubW91c2VvbiA9IHRydWU7XG4gICAgICAvL307XG4gICAgfSk7XG4gICAgdGhpcy5zY2VuZS5hZGQodGhpcy5mcmFtZXMpO1xuICAgIGlmKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8v5LiJ6KeS44Gu6Z2i44Gn5qeL5oiQ44GV44KM44KL5aSa6Z2i5L2T44Gu5L2c5oiQXG4gIHN0YXRpYyBjcmVhdGVHZW9tZXRyeShyYWRpdXMsIHN1cmZhY2VOdW1iZXIpIHtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgPCA0KSA/IDQgOiBzdXJmYWNlTnVtYmVyOy8v77yU5Lul5LiL44Gv5LiN5Y+vXG4gICAgc3VyZmFjZU51bWJlciA9IChzdXJmYWNlTnVtYmVyICYgMSkgPyAoc3VyZmFjZU51bWJlciArIDEpIDogc3VyZmFjZU51bWJlcjsvL+Wlh+aVsOOBr+S4jeWPryjjgojjgorlpKfjgY3jgYTlgbbmlbDjgavnm7TjgZkpXG4gICAgZm9yKHZhciBpID0gMCwgbCA9ICgyICsgc3VyZmFjZU51bWJlciAvIDIpOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2ZXJ0aWNlc1tpXSA9IG5ldyBUSFJFRS5WZWN0b3IzKE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUsIE1hdGgucmFuZG9tKCkgLSAwLjUpOy8v55CD54q244Gr44Op44Oz44OA44Og44Gr54K544KS5omT44GkXG4gICAgICB2ZXJ0aWNlc1tpXS5zZXRMZW5ndGgocmFkaXVzKTtcbiAgICAgIHZlcnRpY2VzW2ldLm9yaWdpbmFsTGVuZ3RoID0gcmFkaXVzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFRIUkVFLkNvbnZleEdlb21ldHJ5KHZlcnRpY2VzKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVGcmFtZXMoZ2VvbWV0cnksIGRhdGEpIHtcbiAgICB2YXIgdmVydGV4dFNoYWRlciA9ICcnICtcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xuICAgICAgJ3ZvaWQgbWFpbigpIHsnICtcbiAgICAgICcgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdHJpeCAqIHZpZXdNYXRyaXggKiBtb2RlbE1hdHJpeCAqIHZlYzQocG9zaXRpb24sIDEuMCk7JyArXG4gICAgICAnICB2UG9zaXRpb24gPSBnbF9Qb3NpdGlvbjsnICtcbiAgICAgICd9JztcblxuICAgIHZhciBmcmFnbWVudFNoYWRlciA9ICcnICtcbiAgICAgICd1bmlmb3JtIHNhbXBsZXIyRCB0ZXh0dXJlOycgK1xuICAgICAgJ3VuaWZvcm0gZmxvYXQgb3BhY2l0eTsnICtcbiAgICAgICd2YXJ5aW5nIHZlYzQgdlBvc2l0aW9uOycgK1xuICAgICAgJ3ZvaWQgbWFpbih2b2lkKXsnICtcbiAgICAgICcgIHZlYzQgdGV4dHVyZUNvbG9yID0gdGV4dHVyZTJEKHRleHR1cmUsIHZlYzIoKDEuMCArIHZQb3NpdGlvbi54IC8gMTAwLjApIC8gMi4wLCAoMS4wICsgdlBvc2l0aW9uLnkgLyAxMDAuMCkgLyAyLjApKTsnICtcbiAgICAgICcgIHRleHR1cmVDb2xvci53ID0gb3BhY2l0eTsnICtcbiAgICAgICcgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmVDb2xvcjsnICtcbiAgICAgIC8vJyAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoKHZQb3NpdGlvbi54IC8gODAwLjAgKyAxLjApIC8gMi4wLCAodlBvc2l0aW9uLnkgLyA4MDAuMCArIDEuMCkgLyAyLjAsIDAsIDApOycgK1xuICAgICAgJ30nO1xuXG4gICAgdmFyIGZyYW1lcyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIGdlb21ldHJ5LmZhY2VzLmZvckVhY2goZnVuY3Rpb24oZmFjZSwgaW5kZXgpIHtcbiAgICAgIHZhciBhID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5hXSwgYiA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl0sIGMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAvL2NyZWF0ZSBnZW9tZXRyeVxuICAgICAgdmFyIGZyYW1lR2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcbiAgICAgIGZyYW1lR2VvbWV0cnkudmVydGljZXMgPSBbYSwgYiwgY107XG4gICAgICBmcmFtZUdlb21ldHJ5LmZhY2VzID0gW25ldyBUSFJFRS5GYWNlMygwLCAxLCAyKV07XG4gICAgICBmcmFtZUdlb21ldHJ5LmNvbXB1dGVGYWNlTm9ybWFscygpO1xuICAgICAgZnJhbWVHZW9tZXRyeS5jb21wdXRlVmVydGV4Tm9ybWFscygpO1xuXG4gICAgICAvL2NyZWF0ZSBtYXRlcmlhbFxuICAgICAgdmFyIGZyYW1lTWF0ZXJpYWwgPSBuZXcgVEhSRUUuU2hhZGVyTWF0ZXJpYWwoe1xuICAgICAgICB2ZXJ0ZXhTaGFkZXI6IHZlcnRleHRTaGFkZXIsXG4gICAgICAgIGZyYWdtZW50U2hhZGVyOiBmcmFnbWVudFNoYWRlcixcbiAgICAgICAgdW5pZm9ybXM6IHtcbiAgICAgICAgICB0ZXh0dXJlOiB7IHR5cGU6IFwidFwiLCB2YWx1ZTogZGF0YVtpbmRleF0gPyBkYXRhW2luZGV4XS50ZXh0dXJlIDogbnVsbCB9LFxuICAgICAgICAgIG9wYWNpdHk6IHsgdHlwZTogXCJmXCIsIHZhbHVlOiAxLjAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChmcmFtZUdlb21ldHJ5LCBmcmFtZU1hdGVyaWFsKTtcbiAgICAgIG1lc2guZGF0YSA9IGRhdGFbaW5kZXhdO1xuXG4gICAgICBmcmFtZXMuYWRkKG1lc2gpO1xuICAgIH0pO1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlVGV4dHVyZShpbWFnZSkge1xuICAgIHZhciB0ZXh0dXJlID0gbmV3IFRIUkVFLlRleHR1cmUodGhpcy5nZXRTdWl0YWJsZUltYWdlKGltYWdlKSk7XG4gICAgLy90ZXh0dXJlLm1hZ0ZpbHRlciA9IHRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcbiAgICB0ZXh0dXJlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gdGV4dHVyZTtcbiAgfVxuXG4gIC8v55S75YOP44K144Kk44K644KS6Kq/5pW0XG4gIHN0YXRpYyBnZXRTdWl0YWJsZUltYWdlKGltYWdlKSB7XG4gICAgdmFyIHcgPSBpbWFnZS5uYXR1cmFsV2lkdGgsIGggPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xuICAgIHZhciBzaXplID0gTWF0aC5wb3coMiwgTWF0aC5sb2coTWF0aC5taW4odywgaCkpIC8gTWF0aC5MTjIgfCAwKTsgLy8gbGFyZ2VzdCAyXm4gaW50ZWdlciB0aGF0IGRvZXMgbm90IGV4Y2VlZFxuICAgIGlmICh3ICE9PSBoIHx8IHcgIT09IHNpemUpIHtcbiAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIHZhciBvZmZzZXRYID0gaCAvIHcgPiAxID8gMCA6ICh3IC0gaCkgLyAyO1xuICAgICAgdmFyIG9mZnNldFkgPSBoIC8gdyA+IDEgPyAoaCAtIHcpIC8gMiA6IDA7XG4gICAgICB2YXIgY2xpcFNpemUgPSBoIC8gdyA+IDEgPyB3IDogaDtcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMud2lkdGggPSBzaXplO1xuICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKGltYWdlLCBvZmZzZXRYLCBvZmZzZXRZLCBjbGlwU2l6ZSwgY2xpcFNpemUsIDAsIDAsIHNpemUsIHNpemUpO1xuICAgICAgaW1hZ2UgPSBjYW52YXM7XG4gICAgfVxuICAgIHJldHVybiBpbWFnZTtcbiAgfVxuXG4gIG1vdmVWZXJ0aWNlcygpIHtcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuZnJhbWVzLmNoaWxkcmVuWzBdLmdlb21ldHJ5LnZlcnRpY2VzWzBdKTtcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKChmcmFtZSkgPT4ge1xuICAgICAgdmFyIGZhY2UgPSBmcmFtZS5nZW9tZXRyeS5mYWNlc1swXTtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LnZlcnRpY2VzLmZvckVhY2goKHZlcnRleCwgaW5kZXgpID0+IHtcbiAgICAgICAgdmVydGV4Lm1peChmYWNlLm5vcm1hbCwgMC4xKS5zZXRMZW5ndGgodmVydGV4Lm9yaWdpbmFsTGVuZ3RoICsgNSAqIE1hdGguY29zKHRoaXMuY291bnQvMjAgKyBpbmRleCAqIDEwKSk7XG4gICAgfSk7XG4gICAgICBmcmFtZS5nZW9tZXRyeS52ZXJ0aWNlc05lZWRVcGRhdGUgPSB0cnVlO1xuICAgICAgZnJhbWUuZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJvdGF0ZSgpIHtcbiAgICB0aGlzLmZyYW1lcy5yb3RhdGlvbi5zZXQoMCwgdGhpcy5jb3VudC81MDAsIDApO1xuICB9XG5cbiAgLypcbiAgICB0aHJlZS5qc+OCquODluOCuOOCp+OCr+ODiOOBruWJiumZpFxuICAgKi9cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5nZW9tZXRyeSAmJiB0aGlzLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICB0aGlzLmZyYW1lcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICBmcmFtZS5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgICBmcmFtZS5tYXRlcmlhbC5kaXNwb3NlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5zY2VuZS5yZW1vdmUodGhpcy5mcmFtZXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgIGNvbnRyaWJ1dGlvbuOBrui/veWKoFxuICAgIEBwYXJhbSBjb250cmlidXRpb24ge09iamVjdH0g5oqV56i/XG4gICAqL1xuICBhZGRDb250cmlidXRpb24oY29udHJpYnV0aW9uLCBjYWxsYmFjaykge1xuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgIGNvbnRyaWJ1dGlvbi50ZXh0dXJlID0gRW1icnlvLmNyZWF0ZVRleHR1cmUoaW1hZ2UpO1xuICAgICAgdGhpcy5kYXRhLnB1c2goY29udHJpYnV0aW9uKTtcbiAgICAgIHRoaXMuY2xlYXIoKS5jcmVhdGUoY2FsbGJhY2spOy8v44Oq44K744OD44OIXG4gICAgfTtcbiAgICBpbWFnZS5zcmMgPSBjb250cmlidXRpb24uYmFzZTY0O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRTaXplKHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgdGhpcy5jYW1lcmEuYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgdGhpcy5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gICAgXG4gIHRvZ2dsZSgpIHtcbiAgICB2YXIgVE9UQUxfQ09VTlQgPSAzNjtcbiAgICB2YXIgU1RBUlRfUE9JTlQgPSB0aGlzLmZyYW1lcy5wb3NpdGlvbi5jbG9uZSgpO1xuICAgIHZhciBFTkRfUE9JTlQgPSB0aGlzLmlzSGlkZGVuID8gbmV3IFRIUkVFLlZlY3RvcjMoKSA6IG5ldyBUSFJFRS5WZWN0b3IzKDAsIC0yMDAsIC0yMDApO1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgY29uc29sZS5sb2coU1RBUlRfUE9JTlQpO1xuICAgIHZhciBhbmltYXRlID0gKCkgPT4ge1xuICAgICAgdmFyIG4gPSBjb3VudCAvIFRPVEFMX0NPVU5UIC0gMTtcbiAgICAgIHZhciBuZXdQb2ludCA9IFNUQVJUX1BPSU5ULmNsb25lKCkubWl4KEVORF9QT0lOVCwgTWF0aC5wb3cobiwgNSkgKyAxKTtcbiAgICAgIHRoaXMuZnJhbWVzLnBvc2l0aW9uLnNldChuZXdQb2ludC54LCBuZXdQb2ludC55LCBuZXdQb2ludC56KTtcbiAgICAgIGlmKGNvdW50IDwgVE9UQUxfQ09VTlQpIHtcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICB0aGlzLmlzSGlkZGVuID0gIXRoaXMuaXNIaWRkZW47XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBFbWJyeW87IiwiaW1wb3J0IEVtYnJ5byBmcm9tICcuL2VtYnJ5by5lczYnO1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBlbWJyeW87XG5cbiAgLy9hbmd1bGFyIHRlc3RcbiAgYW5ndWxhci5tb2R1bGUoJ215U2VydmljZXMnLCBbXSlcbiAgICAuc2VydmljZSgnaW1hZ2VTZWFyY2gnLCBbJyRodHRwJywgZnVuY3Rpb24gKCRodHRwKSB7XG4gICAgICB0aGlzLmdldEltYWdlcyA9IGZ1bmN0aW9uIChxdWVyeSwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHZhciB1cmwgPSAnaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vY3VzdG9tc2VhcmNoL3YxP2tleT1BSXphU3lDTFJmZXVSMDZSTlBLYndGZ29PblkwemUwSUtFU0Y3S3cmY3g9MDAxNTU2NTY4OTQzNTQ2ODM4MzUwOjBiZGlncmQxeDhpJnNlYXJjaFR5cGU9aW1hZ2UmcT0nO1xuICAgICAgICBxdWVyeSA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgdXJsOiB1cmwgKyBxdWVyeSxcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXG4gICAgICAgIH0pXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmNvbmNhdChkYXRhLml0ZW1zKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcbiAgICAgICAgICAgIGlmKGl0ZW1zLmxlbmd0aCA9PT0gMjApIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soaXRlbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB1cmwgPSAnaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vY3VzdG9tc2VhcmNoL3YxP2tleT1BSXphU3lDTFJmZXVSMDZSTlBLYndGZ29PblkwemUwSUtFU0Y3S3cmY3g9MDAxNTU2NTY4OTQzNTQ2ODM4MzUwOjBiZGlncmQxeDhpJnNlYXJjaFR5cGU9aW1hZ2Umc3RhcnQ9MTEmcT0nO1xuICAgICAgICBxdWVyeSA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgdXJsOiB1cmwgKyBxdWVyeSxcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXG4gICAgICAgIH0pXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmNvbmNhdChkYXRhLml0ZW1zKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcbiAgICAgICAgICAgIGlmKGl0ZW1zLmxlbmd0aCA9PT0gMjApIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soaXRlbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XSlcbiAgICAuc2VydmljZSgnY29udHJpYnV0ZXMnLCBbJyRodHRwJywgZnVuY3Rpb24gKCRodHRwKSB7XG4gICAgICB0aGlzLmdldEFsbCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgdXJsOiAnL2NvbnRyaWJ1dGVzL2FsbCcsXG4gICAgICAgICAgLy91cmw6ICcuL2phdmFzY3JpcHRzL2FsbC5qc29uJyxcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnXG4gICAgICAgIH0pXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIGFsZXJ0KGRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICB0aGlzLnN1Ym1pdCA9IGZ1bmN0aW9uIChjb250cmlidXRpb24sIGNhbGxiYWNrKSB7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6ICcvY29udHJpYnV0ZXMvcG9zdCcsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgZGF0YTogY29udHJpYnV0aW9uXG4gICAgICAgIH0pXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIGFsZXJ0KGRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICB0aGlzLmVkaXRUZXh0ID0gZnVuY3Rpb24gKHRleHQsIGNvbnRyaWJ1dGlvbl9pZCwgY2FsbGJhY2spIHtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIHVybDogJy9jb250cmlidXRlcy9lZGl0JyxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgICAgY29udHJpYnV0aW9uX2lkOiBjb250cmlidXRpb25faWRcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIGFsZXJ0KGRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgYWxlcnQoc3RhdHVzICsgJyAnICsgZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfV0pO1xuXG4gIGFuZ3VsYXIubW9kdWxlKFwiZW1icnlvXCIsIFsnbXlTZXJ2aWNlcyddKVxuICAgIC5jb250cm9sbGVyKCdteUN0cmwnLCBbJyRzY29wZScsICdpbWFnZVNlYXJjaCcsICdjb250cmlidXRlcycsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlU2VhcmNoLCBjb250cmlidXRlcykge1xuICAgICAgLy9jb250aWJ1dGlvbnPjgpLlj5blvpdcbiAgICAgIGNvbnRyaWJ1dGVzLmdldEFsbChmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAkc2NvcGUuY29udHJpYnV0aW9ucyA9IGRhdGE7XG4gICAgICAgIHZhciBjb250YWluZXIgPSAkKCcuZW1icnlvLXRocmVlJyk7XG4gICAgICAgIHZhciBjb250cmlidXRpb25JbWFnZSA9ICQoJy5lbWJyeW8tY29udHJpYnV0aW9uLWltYWdlJyk7XG4gICAgICAgIGVtYnJ5byA9IG5ldyBFbWJyeW8oZGF0YSwgY29udGFpbmVyLmdldCgwKSwgY29udGFpbmVyLndpZHRoKCksIGNvbnRhaW5lci5oZWlnaHQoKSk7XG4gICAgICAgIHdpbmRvdy5lbWJyeW8gPSBlbWJyeW87XG4gICAgICAgIGVtYnJ5by5vbnNlbGVjdCA9IGZ1bmN0aW9uIChjb250cmlidXRpb24pIHtcbiAgICAgICAgICBpZiAoJHNjb3BlLmhhc1NlbGVjdGVkKSB7XG4gICAgICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAnaGlkZGVuJztcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBsdXNCdXR0b24gPSB0cnVlO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgIC8vJy13ZWJraXQtZmlsdGVyJzogJ2JsdXIoMHB4KSdcbiAgICAgICAgICAgICAgJy13ZWJraXQtdHJhbnNmb3JtJzogJ3RyYW5zbGF0ZVkoMCknLFxuICAgICAgICAgICAgICAndHJhbnNmb3JtJzogJ3RyYW5zbGF0ZVkoMCknXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XG4gICAgICAgICAgICAgICdvcGFjaXR5JzogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvL2VtYnJ5by50b2dnbGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LmNvbnRyaWJ1dGlvbkRldGFpbHMgPSAnc2hvd24nO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucGx1c0J1dHRvbiA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uID0gY29udHJpYnV0aW9uO1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uVGV4dCA9IGNvbnRyaWJ1dGlvbi50ZXh0O1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgY29udHJpYnV0aW9uSW1hZ2UuY3NzKHtcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRJbWFnZSc6ICd1cmwoJyArIGNvbnRyaWJ1dGlvbi5iYXNlNjQgKyAnKScsXG4gICAgICAgICAgICAgICdiYWNrZ3JvdW5kU2l6ZSc6ICdjb3ZlcicsXG4gICAgICAgICAgICAgICdvcGFjaXR5JzogMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250YWluZXIuY3NzKHtcbiAgICAgICAgICAgICAgLy8nLXdlYmtpdC1maWx0ZXInOiAnYmx1cigxMHB4KSdcbiAgICAgICAgICAgICAgJy13ZWJraXQtdHJhbnNmb3JtJzogJ3RyYW5zbGF0ZVkoNDUlKScsXG4gICAgICAgICAgICAgICd0cmFuc2Zvcm0nOiAndHJhbnNsYXRlWSg0NSUpJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvL2VtYnJ5by50b2dnbGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLnZpc2liaWxpdHkgPSB7XG4gICAgICAgIHBvc3Q6IGZhbHNlLFxuICAgICAgICBwbHVzQnV0dG9uOiB0cnVlLFxuICAgICAgICBjb250cmlidXRpb25EZXRhaWxzOiAnaGlkZGVuJyxcbiAgICAgICAgcG9zdFNlYXJjaDogdHJ1ZSxcbiAgICAgICAgcG9zdENvbnRyaWJ1dGU6IGZhbHNlLFxuICAgICAgICBwb3N0TG9hZGluZzogZmFsc2VcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5xdWVyeSA9ICcnO1xuICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ09LJztcblxuICAgICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLml0ZW1zID0gW107XG4gICAgICAgIGltYWdlU2VhcmNoLmdldEltYWdlcygkc2NvcGUucXVlcnksIGZ1bmN0aW9uIChpdGVtcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcbiAgICAgICAgICAkc2NvcGUuaXRlbXMgPSBpdGVtcztcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICRzY29wZS5zZWxlY3RlZEl0ZW0gPSBpdGVtO1xuICAgICAgICAkc2NvcGUudXJsID0gaXRlbS5saW5rO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gZmFsc2U7XG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnRleHQgPSAkc2NvcGUucXVlcnk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHt0ZXh0OiAkc2NvcGUudGV4dCwgdXJsOiAkc2NvcGUudXJsfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAvL+aKleeov+OBrui/veWKoFxuICAgICAgICAgICRzY29wZS5jb250cmlidXRpb25zLnB1c2goZGF0YSk7XG4gICAgICAgICAgZW1icnlvLmFkZENvbnRyaWJ1dGlvbihkYXRhLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0ID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0TG9hZGluZyA9IHRydWU7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmVkaXRUZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2VsZWN0ZWRDb250cmlidXRpb25UZXh0KTtcbiAgICAgICAgY29udHJpYnV0ZXMuZWRpdFRleHQoJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uVGV4dCwgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uLl9pZCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ+abtOaWsOOBjOWujOS6huOBl+OBvuOBl+OBnyc7XG4gICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ09LJztcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmNsb3NlTGlnaHRib3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgfTtcbiAgICAgICRzY29wZS50b2dnbGVQb3N0UGFuZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdCA9ICEkc2NvcGUudmlzaWJpbGl0eS5wb3N0O1xuICAgICAgfTtcbiAgICAgICRzY29wZS50b2dnbGVDb250cmlidXRpb25EZXRhaWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID0gJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9PSAnb3BlbmVkJyA/ICdzaG93bicgOiAnb3BlbmVkJztcbiAgICAgIH07XG4gICAgICAkc2NvcGUuYmFja1RvU2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XSk7XG5cbn0pKCk7IiwiVEhSRUUuU2NlbmUucHJvdG90eXBlLndhdGNoTW91c2VFdmVudCA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIGNhbWVyYSkge1xuICB2YXIgcHJlSW50ZXJzZWN0cyA9IFtdO1xuICB2YXIgbW91c2VEb3duSW50ZXJzZWN0cyA9IFtdO1xuICB2YXIgcHJlRXZlbnQ7XG4gIHZhciBtb3VzZURvd25Qb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VEb3duKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIG1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQpIC8gZG9tRWxlbWVudC53aWR0aCkgKiAyIC0gMTtcbiAgICBtb3VzZS55ID0gLSgoZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKSAvIGRvbUVsZW1lbnQuaGVpZ2h0KSAqIDIgKyAxO1xuXG4gICAgLy9vbm1vdXNlZG93blxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihwcmVJbnRlcnNlY3QpIHtcbiAgICAgIHZhciBvYmplY3QgPSBwcmVJbnRlcnNlY3Qub2JqZWN0O1xuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZWRvd24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb2JqZWN0Lm9ubW91c2Vkb3duKHByZUludGVyc2VjdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbW91c2VEb3duSW50ZXJzZWN0cyA9IHByZUludGVyc2VjdHM7XG5cbiAgICBwcmVFdmVudCA9IGV2ZW50O1xuICAgIG1vdXNlRG93blBvaW50ID0gbmV3IFRIUkVFLlZlY3RvcjIobW91c2UueCwgbW91c2UueSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZVVwKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIG1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQpIC8gZG9tRWxlbWVudC53aWR0aCkgKiAyIC0gMTtcbiAgICBtb3VzZS55ID0gLSgoZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKSAvIGRvbUVsZW1lbnQuaGVpZ2h0KSAqIDIgKyAxO1xuXG4gICAgLy9vbm1vdXNldXBcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2V1cCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3Qub25tb3VzZXVwKGludGVyc2VjdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZihtb3VzZURvd25Qb2ludC5kaXN0YW5jZVRvKG5ldyBUSFJFRS5WZWN0b3IyKG1vdXNlLngsIG1vdXNlLnkpKSA8IDUpIHtcbiAgICAgIC8vb25jbGlja1xuICAgICAgbW91c2VEb3duSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcbiAgICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBpZiAoZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xuICAgICAgICAgICAgb2JqZWN0Lm9uY2xpY2soaW50ZXJzZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZUV2ZW50ID0gZXZlbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICB2YXIgcmVjdCA9IGRvbUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgbW91c2UueCA9ICgoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCkgLyBkb21FbGVtZW50LndpZHRoKSAqIDIgLSAxO1xuICAgIG1vdXNlLnkgPSAtKChldmVudC5jbGllbnRZIC0gcmVjdC50b3ApIC8gZG9tRWxlbWVudC5oZWlnaHQpICogMiArIDE7XG5cbiAgICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICAgIHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG1vdXNlLCBjYW1lcmEpO1xuXG4gICAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhfdGhpcy5jaGlsZHJlbiwgdHJ1ZSk7XG4gICAgaW50ZXJzZWN0cy5sZW5ndGggPSAxOy8v5omL5YmN44Gu44Kq44OW44K444Kn44Kv44OI44Gu44G/XG5cbiAgICAvL2NvbnNvbGUubG9nKGludGVyc2VjdHMpO1xuICAgIGludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbiAoaW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIC8vb25tb3VzZW1vdmVcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vtb3ZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdC5vbm1vdXNlbW92ZShpbnRlcnNlY3QpO1xuICAgICAgfVxuXG4gICAgICAvL29ubW91c2VvdmVyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3ZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoIWV4aXN0KHByZUludGVyc2VjdHMsIGludGVyc2VjdCkpIHtcbiAgICAgICAgICBvYmplY3Qub25tb3VzZW92ZXIoaW50ZXJzZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy9vbm1vdXNlb3V0XG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHByZUludGVyc2VjdCkge1xuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmICghZXhpc3QoaW50ZXJzZWN0cywgcHJlSW50ZXJzZWN0KSkge1xuICAgICAgICAgIHByZUludGVyc2VjdC5vYmplY3Qub25tb3VzZW91dChwcmVJbnRlcnNlY3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwcmVJbnRlcnNlY3RzID0gaW50ZXJzZWN0cztcbiAgICBwcmVFdmVudCA9IGV2ZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gZXhpc3QoaW50ZXJzZWN0cywgdGFyZ2V0SW50ZXJzZWN0KSB7XG4gICAgLy9pbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XG4gICAgLy8gIGlmKGludGVyc2VjdC5vYmplY3QgPT0gdGFyZ2V0SW50ZXJzZWN0Lm9iamVjdCkgcmV0dXJuIHRydWU7XG4gICAgLy99KTtcbiAgICAvL3JldHVybiBmYWxzZTtcbiAgICByZXR1cm4gKHR5cGVvZiBpbnRlcnNlY3RzWzBdID09PSAnb2JqZWN0JykgJiYgKGludGVyc2VjdHNbMF0ub2JqZWN0ID09PSB0YXJnZXRJbnRlcnNlY3Qub2JqZWN0KTtcbiAgfVxuXG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2VEb3duKTtcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2VVcCk7XG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2VNb3ZlKTtcblxuICBUSFJFRS5TY2VuZS5wcm90b3R5cGUuaGFuZGxlTW91c2VFdmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHByZUV2ZW50ICYmIGhhbmRsZU1vdXNlTW92ZShwcmVFdmVudCk7XG4gIH07XG5cbn07Il19
