THREE.Scene.prototype.watchMouseEvent = function(domElement, camera) {
  var preIntersects = [];
  var mouseDowns = [];
  var _this = this;

  domElement.addEventListener('mousedown', function() {
    //onmousedown
    preIntersects.forEach(function(preIntersect) {
      if (typeof preIntersect.onmousedown === 'function') {
        preIntersects.onmouseout();
      }
    });
    mouseDown = preIntersects;
  });

  domElement.addEventListener('mouseup', function() {
    //onclick
    mouseDowns.forEach(function(mouseDown) {
      if (typeof mouseDown.onclick === 'function') {
        if(preIntersects.indexOf(mouseDown) >= 0) {
          mouseDown.onclick();
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
    intersects.forEach(function (intersect) {
      //onmousemove
      if (typeof intersect.onmousemove === 'function') {
        intersect.onmousemove();
      }

      //onmouseover
      if (typeof intersect.onmousemove === 'function') {
        if (preIntersects.indexOf(intersect) < 0) {
          intersect.onmouseover();
        }
      }
    });

    //onmouseout
    preIntersects.forEach(function(preIntersect) {
      if (typeof preIntersect.onmouseout === 'function') {
        if (intersects.indexOf(preIntersect) < 0) {
          preIntersects.onmouseout();
        }
      }
    });

    preIntersects = intersects;
  });
};