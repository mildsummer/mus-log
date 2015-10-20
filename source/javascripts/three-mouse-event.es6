THREE.Scene.prototype.watchMouseEvent = function(domElement, camera) {
  var preIntersects = [];
  var mouseDowns = [];
  var _this = this;

  domElement.addEventListener('mousedown', function() {
    //onmousedown
    preIntersects.forEach(function(preIntersect) {
      var object = preIntersect.object;
      if (typeof object.onmousedown === 'function') {
        object.onmousedown();
      }
    });
    mouseDowns = preIntersects;
  });

  domElement.addEventListener('mouseup', function() {
    //onclick
    mouseDowns.forEach(function(mouseDown) {
      var object = mouseDown.object;
      if (typeof object.onclick === 'function') {
        if(!exist(preIntersects, mouseDown)) {
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
    intersects.length = 1;//手前のオブジェクトのみ

    //console.log(intersects);
    intersects.forEach(function (intersect) {
      var object = intersect.object;
      //onmousemove
      if (typeof object.onmousemove === 'function') {
        object.onmousemove();
      }

      //onmouseover
      if (typeof object.onmouseover === 'function') {
        if (!exist(preIntersects, intersect)) {
          object.onmouseover();
        }
      }
    });

    //onmouseout
    preIntersects.forEach(function(preIntersect) {
      var object = preIntersect.object;
      if (typeof object.onmouseout === 'function') {
        if (!exist(intersects, preIntersect)) {
          preIntersect.object.onmouseout();
        }
      }
    });

    preIntersects = intersects;
  });

  function exist(intersects, targetIntersect) {
    //intersects.forEach(function(intersect) {
    //  if(intersect.object == targetIntersect.object) return true;
    //});
    //return false;
    if(intersects[0]) {
      return (intersects[0].object === targetIntersect.object);
    } else {
      return false;
    }
  }

};