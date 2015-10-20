THREE.Scene.prototype.watchMouseEvent = function(domElement, camera) {
  var preIntersects = [];
  var mouseDowns = [];
  var _this = this;

  domElement.addEventListener('mousedown', function() {
    //onmousedown
    preIntersects.forEach(function(preIntersect) {
      var object = preIntersect.object;
      if (typeof object.onmousedown === 'function') {
        object.onmouseout();
      }
    });
    mouseDowns = preIntersects;
  });

  domElement.addEventListener('mouseup', function() {
    //onclick
    mouseDowns.forEach(function(mouseDown) {
      var object = mouseDown.object;
      if (typeof object.onclick === 'function') {
        if(preIntersects.indexOf(mouseDown) >= 0) {
          object.onclick();
        }
      }
    });
  });

  domElement.addEventListener('mousemove', function(event) {
    event.preventDefault();

    var mouse = new THREE.Vector2();
    var rect = domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / domElement.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / domElement.height) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(_this.children, true);
    //console.log(intersects);
    intersects.forEach(function (intersect) {
      var object = intersect.object;
      //onmousemove
      if (typeof object.onmousemove === 'function') {
        object.onmousemove();
      }

      //onmouseover
      if (typeof object.onmouseover === 'function') {
        if (preIntersects.indexOf(object) < 0) {
          object.onmouseover();
        }
      }
    });

    //onmouseout
    preIntersects.forEach(function(preIntersect) {
      var object = preIntersect.object;
      if (typeof object.onmouseout === 'function') {
        if (intersects.indexOf(preIntersect) < 0) {
          object.onmouseout();
        }
      }
    });

    preIntersects = intersects;
  });
};