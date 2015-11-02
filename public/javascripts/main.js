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
          contributionImage.css({
            'opacity': 0
          });
          $scope.visibility.three = true;
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
            $scope.visibility.three = false;
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
      three: true
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvQ29udmV4R2VvbWV0cnkuanMiLCIvVXNlcnMveWFtYW1vdG9ub2Rva2EvRGVza3RvcC9hcnQtcHJvamVjdC9zb3VyY2UvamF2YXNjcmlwdHMvZW1icnlvLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy9tYWluLmVzNiIsIi9Vc2Vycy95YW1hbW90b25vZG9rYS9EZXNrdG9wL2FydC1wcm9qZWN0L3NvdXJjZS9qYXZhc2NyaXB0cy90aHJlZS1tb3VzZS1ldmVudC5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNtQkEsS0FBSyxDQUFDLGNBQWMsR0FBRyxVQUFVLFFBQVEsRUFBRzs7QUFFM0MsTUFBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7O0FBRTVCLEtBQUksS0FBSyxHQUFHLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztBQUV6QyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRzs7QUFFNUMsVUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO0VBRWQ7O0FBR0QsVUFBUyxRQUFRLENBQUUsUUFBUSxFQUFHOztBQUU3QixNQUFJLE1BQU0sR0FBRyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRTFDLE1BQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxN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TUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTdCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLElBQUUsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWYsSUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVmLFNBQU8sRUFBRSxDQUFDO0VBRVY7Ozs7Ozs7QUFPRCxVQUFTLFNBQVMsQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFHOztBQUU1QixTQUFPLEVBQUUsQ0FBRSxDQUFDLENBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFFLElBQUksRUFBRSxDQUFFLENBQUMsQ0FBRSxLQUFLLEVBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztFQUVsRDs7Ozs7QUFLRCxVQUFTLFlBQVksR0FBRzs7QUFFdkIsU0FBTyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUEsR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0VBRTFDOzs7OztBQU1ELFVBQVMsUUFBUSxDQUFFLE1BQU0sRUFBRzs7QUFFM0IsTUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzFCLFNBQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUM7RUFFM0Q7OztBQUdELEtBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLEtBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQzs7QUFFekMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUss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VUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxlQUFlLENBQUMsTUFBTSxBQUFDLENBQUM7R0FDakc7O0FBRUQsWUFBVSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUMxRCxZQUFVLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ3RELFlBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUM7O0FBRTFELE9BQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDbEQsWUFBUSxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztHQUN2QyxDQUFDO0NBRUgsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBhdXRob3IgcWlhbyAvIGh0dHBzOi8vZ2l0aHViLmNvbS9xaWFvXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgYSBjb252ZXggaHVsbCBnZW5lcmF0b3IgdXNpbmcgdGhlIGluY3JlbWVudGFsIG1ldGhvZC4gXG4gKiBUaGUgY29tcGxleGl0eSBpcyBPKG5eMikgd2hlcmUgbiBpcyB0aGUgbnVtYmVyIG9mIHZlcnRpY2VzLlxuICogTyhubG9nbikgYWxnb3JpdGhtcyBkbyBleGlzdCwgYnV0IHRoZXkgYXJlIG11Y2ggbW9yZSBjb21wbGljYXRlZC5cbiAqXG4gKiBCZW5jaG1hcms6IFxuICpcbiAqICBQbGF0Zm9ybTogQ1BVOiBQNzM1MCBAMi4wMEdIeiBFbmdpbmU6IFY4XG4gKlxuICogIE51bSBWZXJ0aWNlc1x0VGltZShtcylcbiAqXG4gKiAgICAgMTAgICAgICAgICAgIDFcbiAqICAgICAyMCAgICAgICAgICAgM1xuICogICAgIDMwICAgICAgICAgICAxOVxuICogICAgIDQwICAgICAgICAgICA0OFxuICogICAgIDUwICAgICAgICAgICAxMDdcbiAqL1xuXG5USFJFRS5Db252ZXhHZW9tZXRyeSA9IGZ1bmN0aW9uKCB2ZXJ0aWNlcyApIHtcblxuXHRUSFJFRS5HZW9tZXRyeS5jYWxsKCB0aGlzICk7XG5cblx0dmFyIGZhY2VzID0gWyBbIDAsIDEsIDIgXSwgWyAwLCAyLCAxIF0gXTsgXG5cblx0Zm9yICggdmFyIGkgPSAzOyBpIDwgdmVydGljZXMubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0YWRkUG9pbnQoIGkgKTtcblxuXHR9XG5cblxuXHRmdW5jdGlvbiBhZGRQb2ludCggdmVydGV4SWQgKSB7XG5cblx0XHR2YXIgdmVydGV4ID0gdmVydGljZXNbIHZlcnRleElkIF0uY2xvbmUoKTtcblxuXHRcdHZhciBtYWcgPSB2ZXJ0ZXgubGVuZ3RoKCk7XG5cdFx0dmVydGV4LnggKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cdFx0dmVydGV4LnkgKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cdFx0dmVydGV4LnogKz0gbWFnICogcmFuZG9tT2Zmc2V0KCk7XG5cblx0XHR2YXIgaG9sZSA9IFtdO1xuXG5cdFx0Zm9yICggdmFyIGYgPSAwOyBmIDwgZmFjZXMubGVuZ3RoOyApIHtcblxuXHRcdFx0dmFyIGZhY2UgPSBmYWNlc1sgZiBdO1xuXG5cdFx0XHQvLyBmb3IgZWFjaCBmYWNlLCBpZiB0aGUgdmVydGV4IGNhbiBzZWUgaXQsXG5cdFx0XHQvLyB0aGVuIHdlIHRyeSB0byBhZGQgdGhlIGZhY2UncyBlZGdlcyBpbnRvIHRoZSBob2xlLlxuXHRcdFx0aWYgKCB2aXNpYmxlKCBmYWNlLCB2ZXJ0ZXggKSApIHtcblxuXHRcdFx0XHRmb3IgKCB2YXIgZSA9IDA7IGUgPCAzOyBlICsrICkge1xuXG5cdFx0XHRcdFx0dmFyIGVkZ2UgPSBbIGZhY2VbIGUgXSwgZmFjZVsgKCBlICsgMSApICUgMyBdIF07XG5cdFx0XHRcdFx0dmFyIGJvdW5kYXJ5ID0gdHJ1ZTtcblxuXHRcdFx0XHRcdC8vIHJlbW92ZSBkdXBsaWNhdGVkIGVkZ2VzLlxuXHRcdFx0XHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xuXG5cdFx0XHRcdFx0XHRpZiAoIGVxdWFsRWRnZSggaG9sZVsgaCBdLCBlZGdlICkgKSB7XG5cblx0XHRcdFx0XHRcdFx0aG9sZVsgaCBdID0gaG9sZVsgaG9sZS5sZW5ndGggLSAxIF07XG5cdFx0XHRcdFx0XHRcdGhvbGUucG9wKCk7XG5cdFx0XHRcdFx0XHRcdGJvdW5kYXJ5ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIGJvdW5kYXJ5ICkge1xuXG5cdFx0XHRcdFx0XHRob2xlLnB1c2goIGVkZ2UgKTtcblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gcmVtb3ZlIGZhY2VzWyBmIF1cblx0XHRcdFx0ZmFjZXNbIGYgXSA9IGZhY2VzWyBmYWNlcy5sZW5ndGggLSAxIF07XG5cdFx0XHRcdGZhY2VzLnBvcCgpO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIG5vdCB2aXNpYmxlXG5cblx0XHRcdFx0ZiArKztcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0Ly8gY29uc3RydWN0IHRoZSBuZXcgZmFjZXMgZm9ybWVkIGJ5IHRoZSBlZGdlcyBvZiB0aGUgaG9sZSBhbmQgdGhlIHZlcnRleFxuXHRcdGZvciAoIHZhciBoID0gMDsgaCA8IGhvbGUubGVuZ3RoOyBoICsrICkge1xuXG5cdFx0XHRmYWNlcy5wdXNoKCBbIFxuXHRcdFx0XHRob2xlWyBoIF1bIDAgXSxcblx0XHRcdFx0aG9sZVsgaCBdWyAxIF0sXG5cdFx0XHRcdHZlcnRleElkXG5cdFx0XHRdICk7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBXaGV0aGVyIHRoZSBmYWNlIGlzIHZpc2libGUgZnJvbSB0aGUgdmVydGV4XG5cdCAqL1xuXHRmdW5jdGlvbiB2aXNpYmxlKCBmYWNlLCB2ZXJ0ZXggKSB7XG5cblx0XHR2YXIgdmEgPSB2ZXJ0aWNlc1sgZmFjZVsgMCBdIF07XG5cdFx0dmFyIHZiID0gdmVydGljZXNbIGZhY2VbIDEgXSBdO1xuXHRcdHZhciB2YyA9IHZlcnRpY2VzWyBmYWNlWyAyIF0gXTtcblxuXHRcdHZhciBuID0gbm9ybWFsKCB2YSwgdmIsIHZjICk7XG5cblx0XHQvLyBkaXN0YW5jZSBmcm9tIGZhY2UgdG8gb3JpZ2luXG5cdFx0dmFyIGRpc3QgPSBuLmRvdCggdmEgKTtcblxuXHRcdHJldHVybiBuLmRvdCggdmVydGV4ICkgPj0gZGlzdDsgXG5cblx0fVxuXG5cdC8qKlxuXHQgKiBGYWNlIG5vcm1hbFxuXHQgKi9cblx0ZnVuY3Rpb24gbm9ybWFsKCB2YSwgdmIsIHZjICkge1xuXG5cdFx0dmFyIGNiID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblx0XHR2YXIgYWIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdFx0Y2Iuc3ViVmVjdG9ycyggdmMsIHZiICk7XG5cdFx0YWIuc3ViVmVjdG9ycyggdmEsIHZiICk7XG5cdFx0Y2IuY3Jvc3MoIGFiICk7XG5cblx0XHRjYi5ub3JtYWxpemUoKTtcblxuXHRcdHJldHVybiBjYjtcblxuXHR9XG5cblx0LyoqXG5cdCAqIERldGVjdCB3aGV0aGVyIHR3byBlZGdlcyBhcmUgZXF1YWwuXG5cdCAqIE5vdGUgdGhhdCB3aGVuIGNvbnN0cnVjdGluZyB0aGUgY29udmV4IGh1bGwsIHR3byBzYW1lIGVkZ2VzIGNhbiBvbmx5XG5cdCAqIGJlIG9mIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBlcXVhbEVkZ2UoIGVhLCBlYiApIHtcblxuXHRcdHJldHVybiBlYVsgMCBdID09PSBlYlsgMSBdICYmIGVhWyAxIF0gPT09IGViWyAwIF07IFxuXG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGEgcmFuZG9tIG9mZnNldCBiZXR3ZWVuIC0xZS02IGFuZCAxZS02LlxuXHQgKi9cblx0ZnVuY3Rpb24gcmFuZG9tT2Zmc2V0KCkge1xuXG5cdFx0cmV0dXJuICggTWF0aC5yYW5kb20oKSAtIDAuNSApICogMiAqIDFlLTY7XG5cblx0fVxuXG5cblx0LyoqXG5cdCAqIFhYWDogTm90IHN1cmUgaWYgdGhpcyBpcyB0aGUgY29ycmVjdCBhcHByb2FjaC4gTmVlZCBzb21lb25lIHRvIHJldmlldy5cblx0ICovXG5cdGZ1bmN0aW9uIHZlcnRleFV2KCB2ZXJ0ZXggKSB7XG5cblx0XHR2YXIgbWFnID0gdmVydGV4Lmxlbmd0aCgpO1xuXHRcdHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMiggdmVydGV4LnggLyBtYWcsIHZlcnRleC55IC8gbWFnICk7XG5cblx0fVxuXG5cdC8vIFB1c2ggdmVydGljZXMgaW50byBgdGhpcy52ZXJ0aWNlc2AsIHNraXBwaW5nIHRob3NlIGluc2lkZSB0aGUgaHVsbFxuXHR2YXIgaWQgPSAwO1xuXHR2YXIgbmV3SWQgPSBuZXcgQXJyYXkoIHZlcnRpY2VzLmxlbmd0aCApOyAvLyBtYXAgZnJvbSBvbGQgdmVydGV4IGlkIHRvIG5ldyBpZFxuXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdCB2YXIgZmFjZSA9IGZhY2VzWyBpIF07XG5cblx0XHQgZm9yICggdmFyIGogPSAwOyBqIDwgMzsgaiArKyApIHtcblxuXHRcdFx0aWYgKCBuZXdJZFsgZmFjZVsgaiBdIF0gPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0XHRuZXdJZFsgZmFjZVsgaiBdIF0gPSBpZCArKztcblx0XHRcdFx0dGhpcy52ZXJ0aWNlcy5wdXNoKCB2ZXJ0aWNlc1sgZmFjZVsgaiBdIF0gKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRmYWNlWyBqIF0gPSBuZXdJZFsgZmFjZVsgaiBdIF07XG5cblx0XHQgfVxuXG5cdH1cblxuXHQvLyBDb252ZXJ0IGZhY2VzIGludG8gaW5zdGFuY2VzIG9mIFRIUkVFLkZhY2UzXG5cdGZvciAoIHZhciBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdHRoaXMuZmFjZXMucHVzaCggbmV3IFRIUkVFLkZhY2UzKCBcblx0XHRcdFx0ZmFjZXNbIGkgXVsgMCBdLFxuXHRcdFx0XHRmYWNlc1sgaSBdWyAxIF0sXG5cdFx0XHRcdGZhY2VzWyBpIF1bIDIgXVxuXHRcdCkgKTtcblxuXHR9XG5cblx0Ly8gQ29tcHV0ZSBVVnNcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5mYWNlcy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHR2YXIgZmFjZSA9IHRoaXMuZmFjZXNbIGkgXTtcblxuXHRcdHRoaXMuZmFjZVZlcnRleFV2c1sgMCBdLnB1c2goIFtcblx0XHRcdHZlcnRleFV2KCB0aGlzLnZlcnRpY2VzWyBmYWNlLmEgXSApLFxuXHRcdFx0dmVydGV4VXYoIHRoaXMudmVydGljZXNbIGZhY2UuYiBdICksXG5cdFx0XHR2ZXJ0ZXhVdiggdGhpcy52ZXJ0aWNlc1sgZmFjZS5jIF0gKVxuXHRcdF0gKTtcblxuXHR9XG5cblx0dGhpcy5jb21wdXRlRmFjZU5vcm1hbHMoKTtcblx0dGhpcy5jb21wdXRlVmVydGV4Tm9ybWFscygpO1xuXG59O1xuXG5USFJFRS5Db252ZXhHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBUSFJFRS5HZW9tZXRyeS5wcm90b3R5cGUgKTtcblRIUkVFLkNvbnZleEdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRIUkVFLkNvbnZleEdlb21ldHJ5O1xuIiwiaW1wb3J0ICcuL3RocmVlLW1vdXNlLWV2ZW50LmVzNic7XG5pbXBvcnQgJy4vQ29udmV4R2VvbWV0cnknO1xuXG5USFJFRS5WZWN0b3IzLnByb3RvdHlwZS5taXggPSBmdW5jdGlvbih5LCBhKSB7XG4gIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKDEgLSBhKS5hZGQoeS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKGEpKVxufTtcblxuY2xhc3MgRW1icnlvIHtcblxuICBjb25zdHJ1Y3RvcihkYXRhLCBjb250YWluZXIsIHdpZHRoLCBoZWlnaHQpIHtcblxuICAgIC8vKiBkYXRhIDogYXJyYXkgb2YgY29udHJpYnV0aW9uc1xuICAgIC8vKiBjb250cmlidXRpb25cbiAgICAvLyoge1xuICAgIC8vKiAgIGltYWdlOiBET01JbWFnZVxuICAgIC8vKiAgIHRleHQ6IFN0cmluZ1xuICAgIC8vKiB9XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcblxuICAgIC8v44OG44Kv44K544OB44Oj44Gu5L2c5oiQXG4gICAgdmFyIGxvYWRlZE51bSA9IDA7XG4gICAgZGF0YS5mb3JFYWNoKChjb250cmlidXRpb24sIGluZGV4KSA9PiB7XG4gICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XG4gICAgICAgIHRoaXMuZGF0YVtpbmRleF0udGV4dHVyZSA9IHRleHR1cmU7XG4gICAgICAgIGxvYWRlZE51bSsrO1xuICAgICAgICBpZihsb2FkZWROdW0gPT09IGRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5pbml0aWFsaXplKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBpbWFnZS5zcmMgPSBjb250cmlidXRpb24uYmFzZTY0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfVxuXG4gIGluaXRpYWxpemUoY29udGFpbmVyLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMuaXNIaWRkZW4gPSBmYWxzZTtcblxuICAgIC8vaW5pdCBzY2VuZVxuICAgIHZhciBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuXG4gICAgLy9pbml0IGNhbWVyYVxuICAgIHZhciBmb3YgPSA2MDtcbiAgICB2YXIgYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYShmb3YsIGFzcGVjdCk7XG4gICAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAoaGVpZ2h0IC8gMikgLyBNYXRoLnRhbigoZm92ICogTWF0aC5QSSAvIDE4MCkgLyAyKSk7XG4gICAgY2FtZXJhLmxvb2tBdChuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKSk7XG4gICAgc2NlbmUuYWRkKGNhbWVyYSk7XG5cbiAgICAvL2luaXQgcmVuZGVyZXJcbiAgICB2YXIgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7YWxwaGE6IHRydWUsIGFudGlhbGlhczogdHJ1ZX0pO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGNjY2NjYywgMCk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgLy9pbml0IGNvbnRyb2xzXG4gICAgdmFyIGNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzKGNhbWVyYSwgcmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAvL3dhdGNoIG1vdXNlIGV2ZW50c1xuICAgIHNjZW5lLndhdGNoTW91c2VFdmVudChyZW5kZXJlci5kb21FbGVtZW50LCBjYW1lcmEpO1xuXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLmNvbnRyb2xzID0gY29udHJvbHM7XG5cbiAgICAvL+eUn+aIkFxuICAgIHRoaXMuY3JlYXRlKCk7XG5cbiAgICB0aGlzLmNvdW50ID0gMDtcblxuICAgIGNvbnNvbGUubG9nKHRoaXMuZnJhbWVzKTtcblxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbigpe1xuICAgICAgY29udHJvbHMudXBkYXRlKCk7XG4gICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgICAvL3NjZW5lLmhhbmRsZU1vdXNlRXZlbnQoKTtcbiAgICAgIHRoaXMuY291bnQrKztcbiAgICAgIHRoaXMubW92ZVZlcnRpY2VzKCkucm90YXRlKCk7XG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdXBkYXRlKCk7XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9XG5cbiAgY3JlYXRlKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5nZW9tZXRyeSA9IEVtYnJ5by5jcmVhdGVHZW9tZXRyeSgxMDAsIHRoaXMuZGF0YS5sZW5ndGgpO1xuICAgIHRoaXMuZnJhbWVzID0gRW1icnlvLmNyZWF0ZUZyYW1lcyh0aGlzLmdlb21ldHJ5LCB0aGlzLmRhdGEpO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuICYmIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goKGZyYW1lKSA9PiB7Ly/jg57jgqbjgrnjgqTjg5njg7Pjg4jjga7oqK3lrppcbiAgICAgIGZyYW1lLm9uY2xpY2sgPSAoaW50ZXJzZWN0KSA9PiB7XG4gICAgICAgIGlmKHR5cGVvZiB0aGlzLm9uc2VsZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZnJhbWUuZGF0YSAmJiB0aGlzLm9uc2VsZWN0KGZyYW1lLmRhdGEpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgLy9mcmFtZS5vbm1vdXNlb3ZlciA9IChpbnRlcnNlY3QpID0+IHtcbiAgICAgIC8vICBpbnRlcnNlY3QuZmFjZS5tb3VzZW9uID0gdHJ1ZTtcbiAgICAgIC8vfTtcbiAgICB9KTtcbiAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLmZyYW1lcyk7XG4gICAgaWYodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy/kuInop5Ljga7pnaLjgafmp4vmiJDjgZXjgozjgovlpJrpnaLkvZPjga7kvZzmiJBcbiAgc3RhdGljIGNyZWF0ZUdlb21ldHJ5KHJhZGl1cywgc3VyZmFjZU51bWJlcikge1xuICAgIHZhciB2ZXJ0aWNlcyA9IFtdO1xuICAgIHN1cmZhY2VOdW1iZXIgPSAoc3VyZmFjZU51bWJlciA8IDQpID8gNCA6IHN1cmZhY2VOdW1iZXI7Ly/vvJTku6XkuIvjga/kuI3lj69cbiAgICBzdXJmYWNlTnVtYmVyID0gKHN1cmZhY2VOdW1iZXIgJiAxKSA/IChzdXJmYWNlTnVtYmVyICsgMSkgOiBzdXJmYWNlTnVtYmVyOy8v5aWH5pWw44Gv5LiN5Y+vKOOCiOOCiuWkp+OBjeOBhOWBtuaVsOOBq+ebtOOBmSlcbiAgICBmb3IodmFyIGkgPSAwLCBsID0gKDIgKyBzdXJmYWNlTnVtYmVyIC8gMik7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZlcnRpY2VzW2ldID0gbmV3IFRIUkVFLlZlY3RvcjMoTWF0aC5yYW5kb20oKSAtIDAuNSwgTWF0aC5yYW5kb20oKSAtIDAuNSwgTWF0aC5yYW5kb20oKSAtIDAuNSk7Ly/nkIPnirbjgavjg6njg7Pjg4Djg6DjgavngrnjgpLmiZPjgaRcbiAgICAgIHZlcnRpY2VzW2ldLnNldExlbmd0aChyYWRpdXMpO1xuICAgICAgdmVydGljZXNbaV0ub3JpZ2luYWxMZW5ndGggPSByYWRpdXM7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVEhSRUUuQ29udmV4R2VvbWV0cnkodmVydGljZXMpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUZyYW1lcyhnZW9tZXRyeSwgZGF0YSkge1xuICAgIHZhciB2ZXJ0ZXh0U2hhZGVyID0gJycgK1xuICAgICAgJ3ZhcnlpbmcgdmVjNCB2UG9zaXRpb247JyArXG4gICAgICAndm9pZCBtYWluKCkgeycgK1xuICAgICAgJyAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0aW9uTWF0cml4ICogdmlld01hdHJpeCAqIG1vZGVsTWF0cml4ICogdmVjNChwb3NpdGlvbiwgMS4wKTsnICtcbiAgICAgICcgIHZQb3NpdGlvbiA9IGdsX1Bvc2l0aW9uOycgK1xuICAgICAgJ30nO1xuXG4gICAgdmFyIGZyYWdtZW50U2hhZGVyID0gJycgK1xuICAgICAgJ3VuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7JyArXG4gICAgICAndW5pZm9ybSBmbG9hdCBvcGFjaXR5OycgK1xuICAgICAgJ3ZhcnlpbmcgdmVjNCB2UG9zaXRpb247JyArXG4gICAgICAndm9pZCBtYWluKHZvaWQpeycgK1xuICAgICAgJyAgdmVjNCB0ZXh0dXJlQ29sb3IgPSB0ZXh0dXJlMkQodGV4dHVyZSwgdmVjMigoMS4wICsgdlBvc2l0aW9uLnggLyAxMDAuMCkgLyAyLjAsICgxLjAgKyB2UG9zaXRpb24ueSAvIDEwMC4wKSAvIDIuMCkpOycgK1xuICAgICAgJyAgdGV4dHVyZUNvbG9yLncgPSBvcGFjaXR5OycgK1xuICAgICAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZUNvbG9yOycgK1xuICAgICAgLy8nICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCgodlBvc2l0aW9uLnggLyA4MDAuMCArIDEuMCkgLyAyLjAsICh2UG9zaXRpb24ueSAvIDgwMC4wICsgMS4wKSAvIDIuMCwgMCwgMCk7JyArXG4gICAgICAnfSc7XG5cbiAgICB2YXIgZnJhbWVzID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgZ2VvbWV0cnkuZmFjZXMuZm9yRWFjaChmdW5jdGlvbihmYWNlLCBpbmRleCkge1xuICAgICAgdmFyIGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdLCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXSwgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICAgIC8vY3JlYXRlIGdlb21ldHJ5XG4gICAgICB2YXIgZnJhbWVHZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuICAgICAgZnJhbWVHZW9tZXRyeS52ZXJ0aWNlcyA9IFthLCBiLCBjXTtcbiAgICAgIGZyYW1lR2VvbWV0cnkuZmFjZXMgPSBbbmV3IFRIUkVFLkZhY2UzKDAsIDEsIDIpXTtcbiAgICAgIGZyYW1lR2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgICBmcmFtZUdlb21ldHJ5LmNvbXB1dGVWZXJ0ZXhOb3JtYWxzKCk7XG5cbiAgICAgIC8vY3JlYXRlIG1hdGVyaWFsXG4gICAgICB2YXIgZnJhbWVNYXRlcmlhbCA9IG5ldyBUSFJFRS5TaGFkZXJNYXRlcmlhbCh7XG4gICAgICAgIHZlcnRleFNoYWRlcjogdmVydGV4dFNoYWRlcixcbiAgICAgICAgZnJhZ21lbnRTaGFkZXI6IGZyYWdtZW50U2hhZGVyLFxuICAgICAgICB1bmlmb3Jtczoge1xuICAgICAgICAgIHRleHR1cmU6IHsgdHlwZTogXCJ0XCIsIHZhbHVlOiBkYXRhW2luZGV4XSA/IGRhdGFbaW5kZXhdLnRleHR1cmUgOiBudWxsIH0sXG4gICAgICAgICAgb3BhY2l0eTogeyB0eXBlOiBcImZcIiwgdmFsdWU6IDEuMCB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGZyYW1lR2VvbWV0cnksIGZyYW1lTWF0ZXJpYWwpO1xuICAgICAgbWVzaC5kYXRhID0gZGF0YVtpbmRleF07XG5cbiAgICAgIGZyYW1lcy5hZGQobWVzaCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVUZXh0dXJlKGltYWdlKSB7XG4gICAgdmFyIHRleHR1cmUgPSBuZXcgVEhSRUUuVGV4dHVyZSh0aGlzLmdldFN1aXRhYmxlSW1hZ2UoaW1hZ2UpKTtcbiAgICAvL3RleHR1cmUubWFnRmlsdGVyID0gdGV4dHVyZS5taW5GaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICAgIHRleHR1cmUubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHJldHVybiB0ZXh0dXJlO1xuICB9XG5cbiAgLy/nlLvlg4/jgrXjgqTjgrrjgpLoqr/mlbRcbiAgc3RhdGljIGdldFN1aXRhYmxlSW1hZ2UoaW1hZ2UpIHtcbiAgICB2YXIgdyA9IGltYWdlLm5hdHVyYWxXaWR0aCwgaCA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG4gICAgdmFyIHNpemUgPSBNYXRoLnBvdygyLCBNYXRoLmxvZyhNYXRoLm1pbih3LCBoKSkgLyBNYXRoLkxOMiB8IDApOyAvLyBsYXJnZXN0IDJebiBpbnRlZ2VyIHRoYXQgZG9lcyBub3QgZXhjZWVkXG4gICAgaWYgKHcgIT09IGggfHwgdyAhPT0gc2l6ZSkge1xuICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgdmFyIG9mZnNldFggPSBoIC8gdyA+IDEgPyAwIDogKHcgLSBoKSAvIDI7XG4gICAgICB2YXIgb2Zmc2V0WSA9IGggLyB3ID4gMSA/IChoIC0gdykgLyAyIDogMDtcbiAgICAgIHZhciBjbGlwU2l6ZSA9IGggLyB3ID4gMSA/IHcgOiBoO1xuICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy53aWR0aCA9IHNpemU7XG4gICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoaW1hZ2UsIG9mZnNldFgsIG9mZnNldFksIGNsaXBTaXplLCBjbGlwU2l6ZSwgMCwgMCwgc2l6ZSwgc2l6ZSk7XG4gICAgICBpbWFnZSA9IGNhbnZhcztcbiAgICB9XG4gICAgcmV0dXJuIGltYWdlO1xuICB9XG5cbiAgbW92ZVZlcnRpY2VzKCkge1xuICAgIC8vY29uc29sZS5sb2codGhpcy5mcmFtZXMuY2hpbGRyZW5bMF0uZ2VvbWV0cnkudmVydGljZXNbMF0pO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goKGZyYW1lKSA9PiB7XG4gICAgICB2YXIgZmFjZSA9IGZyYW1lLmdlb21ldHJ5LmZhY2VzWzBdO1xuICAgICAgZnJhbWUuZ2VvbWV0cnkudmVydGljZXMuZm9yRWFjaCgodmVydGV4LCBpbmRleCkgPT4ge1xuICAgICAgICB2ZXJ0ZXgubWl4KGZhY2Uubm9ybWFsLCAwLjEpLnNldExlbmd0aCh2ZXJ0ZXgub3JpZ2luYWxMZW5ndGggKyA1ICogTWF0aC5jb3ModGhpcy5jb3VudC8yMCArIGluZGV4ICogMTApKTtcbiAgICB9KTtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LnZlcnRpY2VzTmVlZFVwZGF0ZSA9IHRydWU7XG4gICAgICBmcmFtZS5nZW9tZXRyeS5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcm90YXRlKCkge1xuICAgIHRoaXMuZnJhbWVzLnJvdGF0aW9uLnNldCgwLCB0aGlzLmNvdW50LzUwMCwgMCk7XG4gIH1cblxuICAvKlxuICAgIHRocmVlLmpz44Kq44OW44K444Kn44Kv44OI44Gu5YmK6ZmkXG4gICAqL1xuICBjbGVhcigpIHtcbiAgICB0aGlzLmdlb21ldHJ5ICYmIHRoaXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICAgIHRoaXMuZnJhbWVzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgIGZyYW1lLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICAgIGZyYW1lLm1hdGVyaWFsLmRpc3Bvc2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLnNjZW5lLnJlbW92ZSh0aGlzLmZyYW1lcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAgY29udHJpYnV0aW9u44Gu6L+95YqgXG4gICAgQHBhcmFtIGNvbnRyaWJ1dGlvbiB7T2JqZWN0fSDmipXnqL9cbiAgICovXG4gIGFkZENvbnRyaWJ1dGlvbihjb250cmlidXRpb24sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgY29udHJpYnV0aW9uLnRleHR1cmUgPSBFbWJyeW8uY3JlYXRlVGV4dHVyZShpbWFnZSk7XG4gICAgICB0aGlzLmRhdGEucHVzaChjb250cmlidXRpb24pO1xuICAgICAgdGhpcy5jbGVhcigpLmNyZWF0ZShjYWxsYmFjayk7Ly/jg6rjgrvjg4Pjg4hcbiAgICB9O1xuICAgIGltYWdlLnNyYyA9IGNvbnRyaWJ1dGlvbi5iYXNlNjQ7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFNpemUod2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICB0aGlzLmNhbWVyYS5hc3BlY3QgPSB3aWR0aCAvIGhlaWdodDtcbiAgICB0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgICBcbiAgdG9nZ2xlKCkge1xuICAgIHZhciBUT1RBTF9DT1VOVCA9IDM2O1xuICAgIHZhciBTVEFSVF9QT0lOVCA9IHRoaXMuZnJhbWVzLnBvc2l0aW9uLmNsb25lKCk7XG4gICAgdmFyIEVORF9QT0lOVCA9IHRoaXMuaXNIaWRkZW4gPyBuZXcgVEhSRUUuVmVjdG9yMygpIDogbmV3IFRIUkVFLlZlY3RvcjMoMCwgLTIwMCwgLTIwMCk7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICBjb25zb2xlLmxvZyhTVEFSVF9QT0lOVCk7XG4gICAgdmFyIGFuaW1hdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbiA9IGNvdW50IC8gVE9UQUxfQ09VTlQgLSAxO1xuICAgICAgdmFyIG5ld1BvaW50ID0gU1RBUlRfUE9JTlQuY2xvbmUoKS5taXgoRU5EX1BPSU5ULCBNYXRoLnBvdyhuLCA1KSArIDEpO1xuICAgICAgdGhpcy5mcmFtZXMucG9zaXRpb24uc2V0KG5ld1BvaW50LngsIG5ld1BvaW50LnksIG5ld1BvaW50LnopO1xuICAgICAgaWYoY291bnQgPCBUT1RBTF9DT1VOVCkge1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgfVxuICAgIH1cbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgIHRoaXMuaXNIaWRkZW4gPSAhdGhpcy5pc0hpZGRlbjtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEVtYnJ5bzsiLCJpbXBvcnQgRW1icnlvIGZyb20gJy4vZW1icnlvLmVzNic7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGVtYnJ5bztcblxuICAvL2FuZ3VsYXIgdGVzdFxuICBhbmd1bGFyLm1vZHVsZSgnbXlTZXJ2aWNlcycsIFtdKVxuICAgIC5zZXJ2aWNlKCdpbWFnZVNlYXJjaCcsIFsnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcbiAgICAgIHRoaXMuZ2V0SW1hZ2VzID0gZnVuY3Rpb24gKHF1ZXJ5LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdmFyIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUNMUmZldVIwNlJOUEtid0Znb09uWTB6ZTBJS0VTRjdLdyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZxPSc7XG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6IHVybCArIHF1ZXJ5LFxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xuICAgICAgICAgICAgaWYoaXRlbXMubGVuZ3RoID09PSAyMCkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHVybCA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9jdXN0b21zZWFyY2gvdjE/a2V5PUFJemFTeUNMUmZldVIwNlJOUEtid0Znb09uWTB6ZTBJS0VTRjdLdyZjeD0wMDE1NTY1Njg5NDM1NDY4MzgzNTA6MGJkaWdyZDF4OGkmc2VhcmNoVHlwZT1pbWFnZSZzdGFydD0xMSZxPSc7XG4gICAgICAgIHF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6IHVybCArIHF1ZXJ5LFxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KGRhdGEuaXRlbXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbXMpO1xuICAgICAgICAgICAgaWYoaXRlbXMubGVuZ3RoID09PSAyMCkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGFsZXJ0KHN0YXR1cyArICcgJyArIGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1dKVxuICAgIC5zZXJ2aWNlKCdjb250cmlidXRlcycsIFsnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcbiAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICB1cmw6ICcvY29udHJpYnV0ZXMvYWxsJyxcbiAgICAgICAgICAvL3VybDogJy4vamF2YXNjcmlwdHMvYWxsLmpzb24nLFxuICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHRoaXMuc3VibWl0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIHVybDogJy9jb250cmlidXRlcy9wb3N0JyxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiBjb250cmlidXRpb25cbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHRoaXMuZWRpdFRleHQgPSBmdW5jdGlvbiAodGV4dCwgY29udHJpYnV0aW9uX2lkLCBjYWxsYmFjaykge1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgdXJsOiAnL2NvbnRyaWJ1dGVzL2VkaXQnLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHRleHQsXG4gICAgICAgICAgICBjb250cmlidXRpb25faWQ6IGNvbnRyaWJ1dGlvbl9pZFxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgYWxlcnQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICBhbGVydChzdGF0dXMgKyAnICcgKyBkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XSk7XG5cbiAgYW5ndWxhci5tb2R1bGUoXCJlbWJyeW9cIiwgWydteVNlcnZpY2VzJ10pXG4gICAgLmNvbnRyb2xsZXIoJ215Q3RybCcsIFsnJHNjb3BlJywgJ2ltYWdlU2VhcmNoJywgJ2NvbnRyaWJ1dGVzJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VTZWFyY2gsIGNvbnRyaWJ1dGVzKSB7XG4gICAgICAvL2NvbnRpYnV0aW9uc+OCkuWPluW+l1xuICAgICAgY29udHJpYnV0ZXMuZ2V0QWxsKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICRzY29wZS5jb250cmlidXRpb25zID0gZGF0YTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9ICQoJy5lbWJyeW8tdGhyZWUnKTtcbiAgICAgICAgdmFyIGNvbnRyaWJ1dGlvbkltYWdlID0gJCgnLmVtYnJ5by1jb250cmlidXRpb24taW1hZ2UnKTtcbiAgICAgICAgZW1icnlvID0gbmV3IEVtYnJ5byhkYXRhLCBjb250YWluZXIuZ2V0KDApLCBjb250YWluZXIud2lkdGgoKSwgY29udGFpbmVyLmhlaWdodCgpKTtcbiAgICAgICAgd2luZG93LmVtYnJ5byA9IGVtYnJ5bztcbiAgICAgICAgZW1icnlvLm9uc2VsZWN0ID0gZnVuY3Rpb24gKGNvbnRyaWJ1dGlvbikge1xuICAgICAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucGx1c0J1dHRvbiA9IHRydWU7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICBjb250cmlidXRpb25JbWFnZS5jc3Moe1xuICAgICAgICAgICAgICAnb3BhY2l0eSc6IDBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkudGhyZWUgPSB0cnVlO1xuICAgICAgICAgICAgLy9lbWJyeW8udG9nZ2xlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID0gJ3Nob3duJztcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBsdXNCdXR0b24gPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvbiA9IGNvbnRyaWJ1dGlvbjtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZENvbnRyaWJ1dGlvblRleHQgPSBjb250cmlidXRpb24udGV4dDtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIGNvbnRyaWJ1dGlvbkltYWdlLmNzcyh7XG4gICAgICAgICAgICAgICdiYWNrZ3JvdW5kSW1hZ2UnOiAndXJsKCcgKyBjb250cmlidXRpb24uYmFzZTY0ICsgJyknLFxuICAgICAgICAgICAgICAnYmFja2dyb3VuZFNpemUnOiAnY292ZXInLFxuICAgICAgICAgICAgICAnb3BhY2l0eSc6IDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkudGhyZWUgPSBmYWxzZTtcbiAgICAgICAgICAgIC8vZW1icnlvLnRvZ2dsZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUudmlzaWJpbGl0eSA9IHtcbiAgICAgICAgcG9zdDogZmFsc2UsXG4gICAgICAgIHBsdXNCdXR0b246IHRydWUsXG4gICAgICAgIGNvbnRyaWJ1dGlvbkRldGFpbHM6ICdoaWRkZW4nLFxuICAgICAgICBwb3N0U2VhcmNoOiB0cnVlLFxuICAgICAgICBwb3N0Q29udHJpYnV0ZTogZmFsc2UsXG4gICAgICAgIHBvc3RMb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgdGhyZWU6IHRydWVcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5xdWVyeSA9ICcnO1xuICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ09LJztcblxuICAgICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLml0ZW1zID0gW107XG4gICAgICAgIGltYWdlU2VhcmNoLmdldEltYWdlcygkc2NvcGUucXVlcnksIGZ1bmN0aW9uIChpdGVtcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcbiAgICAgICAgICAkc2NvcGUuaXRlbXMgPSBpdGVtcztcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICRzY29wZS5zZWxlY3RlZEl0ZW0gPSBpdGVtO1xuICAgICAgICAkc2NvcGUudXJsID0gaXRlbS5saW5rO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gZmFsc2U7XG4gICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnRleHQgPSAkc2NvcGUucXVlcnk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29udHJpYnV0ZXMuc3VibWl0KHt0ZXh0OiAkc2NvcGUudGV4dCwgdXJsOiAkc2NvcGUudXJsfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAvL+aKleeov+OBrui/veWKoFxuICAgICAgICAgICRzY29wZS5jb250cmlidXRpb25zLnB1c2goZGF0YSk7XG4gICAgICAgICAgZW1icnlvLmFkZENvbnRyaWJ1dGlvbihkYXRhLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0ID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS52aXNpYmlsaXR5LnBvc3RDb250cmlidXRlID0gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0TG9hZGluZyA9IHRydWU7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmVkaXRUZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2VsZWN0ZWRDb250cmlidXRpb25UZXh0KTtcbiAgICAgICAgY29udHJpYnV0ZXMuZWRpdFRleHQoJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uVGV4dCwgJHNjb3BlLnNlbGVjdGVkQ29udHJpYnV0aW9uLl9pZCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ+abtOaWsOOBjOWujOS6huOBl+OBvuOBl+OBnyc7XG4gICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dGlvbkRldGFpbHNNZXNzYWdlID0gJ09LJztcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgJHNjb3BlLmNsb3NlTGlnaHRib3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5oYXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgfTtcbiAgICAgICRzY29wZS50b2dnbGVQb3N0UGFuZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdCA9ICEkc2NvcGUudmlzaWJpbGl0eS5wb3N0O1xuICAgICAgfTtcbiAgICAgICRzY29wZS50b2dnbGVDb250cmlidXRpb25EZXRhaWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5jb250cmlidXRpb25EZXRhaWxzID0gJHNjb3BlLnZpc2liaWxpdHkuY29udHJpYnV0aW9uRGV0YWlscyA9PSAnb3BlbmVkJyA/ICdzaG93bicgOiAnb3BlbmVkJztcbiAgICAgIH07XG4gICAgICAkc2NvcGUuYmFja1RvU2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUudmlzaWJpbGl0eS5wb3N0U2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnZpc2liaWxpdHkucG9zdENvbnRyaWJ1dGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XSk7XG5cbn0pKCk7IiwiVEhSRUUuU2NlbmUucHJvdG90eXBlLndhdGNoTW91c2VFdmVudCA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIGNhbWVyYSkge1xuICB2YXIgcHJlSW50ZXJzZWN0cyA9IFtdO1xuICB2YXIgbW91c2VEb3duSW50ZXJzZWN0cyA9IFtdO1xuICB2YXIgcHJlRXZlbnQ7XG4gIHZhciBtb3VzZURvd25Qb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VEb3duKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIG1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQpIC8gZG9tRWxlbWVudC53aWR0aCkgKiAyIC0gMTtcbiAgICBtb3VzZS55ID0gLSgoZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKSAvIGRvbUVsZW1lbnQuaGVpZ2h0KSAqIDIgKyAxO1xuXG4gICAgLy9vbm1vdXNlZG93blxuICAgIHByZUludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbihwcmVJbnRlcnNlY3QpIHtcbiAgICAgIHZhciBvYmplY3QgPSBwcmVJbnRlcnNlY3Qub2JqZWN0O1xuICAgICAgaWYgKHR5cGVvZiBvYmplY3Qub25tb3VzZWRvd24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb2JqZWN0Lm9ubW91c2Vkb3duKHByZUludGVyc2VjdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbW91c2VEb3duSW50ZXJzZWN0cyA9IHByZUludGVyc2VjdHM7XG5cbiAgICBwcmVFdmVudCA9IGV2ZW50O1xuICAgIG1vdXNlRG93blBvaW50ID0gbmV3IFRIUkVFLlZlY3RvcjIobW91c2UueCwgbW91c2UueSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZVVwKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgdmFyIHJlY3QgPSBkb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIG1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQpIC8gZG9tRWxlbWVudC53aWR0aCkgKiAyIC0gMTtcbiAgICBtb3VzZS55ID0gLSgoZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKSAvIGRvbUVsZW1lbnQuaGVpZ2h0KSAqIDIgKyAxO1xuXG4gICAgLy9vbm1vdXNldXBcbiAgICBwcmVJbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2V1cCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3Qub25tb3VzZXVwKGludGVyc2VjdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZihtb3VzZURvd25Qb2ludC5kaXN0YW5jZVRvKG5ldyBUSFJFRS5WZWN0b3IyKG1vdXNlLngsIG1vdXNlLnkpKSA8IDUpIHtcbiAgICAgIC8vb25jbGlja1xuICAgICAgbW91c2VEb3duSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QpIHtcbiAgICAgICAgdmFyIG9iamVjdCA9IGludGVyc2VjdC5vYmplY3Q7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBpZiAoZXhpc3QocHJlSW50ZXJzZWN0cywgaW50ZXJzZWN0KSkge1xuICAgICAgICAgICAgb2JqZWN0Lm9uY2xpY2soaW50ZXJzZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZUV2ZW50ID0gZXZlbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICB2YXIgcmVjdCA9IGRvbUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgbW91c2UueCA9ICgoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCkgLyBkb21FbGVtZW50LndpZHRoKSAqIDIgLSAxO1xuICAgIG1vdXNlLnkgPSAtKChldmVudC5jbGllbnRZIC0gcmVjdC50b3ApIC8gZG9tRWxlbWVudC5oZWlnaHQpICogMiArIDE7XG5cbiAgICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICAgIHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG1vdXNlLCBjYW1lcmEpO1xuXG4gICAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhfdGhpcy5jaGlsZHJlbiwgdHJ1ZSk7XG4gICAgaW50ZXJzZWN0cy5sZW5ndGggPSAxOy8v5omL5YmN44Gu44Kq44OW44K444Kn44Kv44OI44Gu44G/XG5cbiAgICAvL2NvbnNvbGUubG9nKGludGVyc2VjdHMpO1xuICAgIGludGVyc2VjdHMuZm9yRWFjaChmdW5jdGlvbiAoaW50ZXJzZWN0KSB7XG4gICAgICB2YXIgb2JqZWN0ID0gaW50ZXJzZWN0Lm9iamVjdDtcbiAgICAgIC8vb25tb3VzZW1vdmVcbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lm9ubW91c2Vtb3ZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdC5vbm1vdXNlbW92ZShpbnRlcnNlY3QpO1xuICAgICAgfVxuXG4gICAgICAvL29ubW91c2VvdmVyXG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3ZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoIWV4aXN0KHByZUludGVyc2VjdHMsIGludGVyc2VjdCkpIHtcbiAgICAgICAgICBvYmplY3Qub25tb3VzZW92ZXIoaW50ZXJzZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy9vbm1vdXNlb3V0XG4gICAgcHJlSW50ZXJzZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHByZUludGVyc2VjdCkge1xuICAgICAgdmFyIG9iamVjdCA9IHByZUludGVyc2VjdC5vYmplY3Q7XG4gICAgICBpZiAodHlwZW9mIG9iamVjdC5vbm1vdXNlb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmICghZXhpc3QoaW50ZXJzZWN0cywgcHJlSW50ZXJzZWN0KSkge1xuICAgICAgICAgIHByZUludGVyc2VjdC5vYmplY3Qub25tb3VzZW91dChwcmVJbnRlcnNlY3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwcmVJbnRlcnNlY3RzID0gaW50ZXJzZWN0cztcbiAgICBwcmVFdmVudCA9IGV2ZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gZXhpc3QoaW50ZXJzZWN0cywgdGFyZ2V0SW50ZXJzZWN0KSB7XG4gICAgLy9pbnRlcnNlY3RzLmZvckVhY2goZnVuY3Rpb24oaW50ZXJzZWN0KSB7XG4gICAgLy8gIGlmKGludGVyc2VjdC5vYmplY3QgPT0gdGFyZ2V0SW50ZXJzZWN0Lm9iamVjdCkgcmV0dXJuIHRydWU7XG4gICAgLy99KTtcbiAgICAvL3JldHVybiBmYWxzZTtcbiAgICByZXR1cm4gKHR5cGVvZiBpbnRlcnNlY3RzWzBdID09PSAnb2JqZWN0JykgJiYgKGludGVyc2VjdHNbMF0ub2JqZWN0ID09PSB0YXJnZXRJbnRlcnNlY3Qub2JqZWN0KTtcbiAgfVxuXG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2VEb3duKTtcbiAgZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2VVcCk7XG4gIGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2VNb3ZlKTtcblxuICBUSFJFRS5TY2VuZS5wcm90b3R5cGUuaGFuZGxlTW91c2VFdmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHByZUV2ZW50ICYmIGhhbmRsZU1vdXNlTW92ZShwcmVFdmVudCk7XG4gIH07XG5cbn07Il19
