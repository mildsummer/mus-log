THREE.Scene.prototype.watchMouseEvent = function(domElement, camera) {
  var preIntersects = [];
  var mouseDownIntersects = [];
  var preEvent;
  var _this = this;

  function handleMouseDown(event) {
    event.preventDefault();

    //onmousedown
      preIntersects.forEach(function(preIntersect) {
        var object = preIntersect.object;
        if (typeof object.onmousedown === 'function') {
          object.onmousedown();
        }
      });
      mouseDownIntersects = preIntersects;
  }

  function handleMouseUp(event) {
    event.preventDefault();

    //onmouseup
    preIntersects.forEach(function(intersect) {
      var object = intersect.object;
      if (typeof object.onmouseup === 'function') {
        object.onmouseup();
      }
    });

    //onclick
    mouseDownIntersects.forEach(function(intersect) {
      var object = intersect.object;
      if (typeof object.onclick === 'function') {
        if(exist(preIntersects, intersect)) {
          object.onclick();
        }
      }
    });
  }

  function handleMouseMove(event) {
    event.preventDefault();

    var mouse = new THREE.Vector2();
    var rect = domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / domElement.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / domElement.height) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(_this.children, true);
    intersects.length = 1;//手前のオブジェクトのみ
    console.log(intersects[0]);

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
    preEvent = event;
  }

  function exist(intersects, targetIntersect) {
    //intersects.forEach(function(intersect) {
    //  if(intersect.object == targetIntersect.object) return true;
    //});
    //return false;
    return (typeof intersects[0] === 'object') && (intersects[0].object === targetIntersect.object);
  }

  domElement.addEventListener('mousedown', handleMouseDown);
  domElement.addEventListener('mouseup', handleMouseUp);
  domElement.addEventListener('mousemove', handleMouseMove);

  THREE.Scene.prototype.handleMouseEvent = function() {
    preEvent && handleMouseMove(preEvent);
  };

};