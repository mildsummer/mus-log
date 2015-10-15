$(function () {
  var textures = [];
  $('.contribution').each(function () {
    var image = checkSize($(this).find('img').get(0));
    var texture = new THREE.Texture(image);
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    textures.push(texture);
  });

  //テクスチャ用にサイズを修正
  function checkSize(image) {
    console.log(image);
    var w = image.naturalWidth, h = image.naturalHeight;
    var size = Math.pow(2, Math.log(Math.min(w, h)) / Math.LN2 | 0); // largest 2^n integer that does not exceed s
    if (w !== h || w !== size) {
      var canvas = document.createElement('canvas');
      var offsetX = h / w > 1 ? 0 : (w - h) / 2;
      var offsetY = h / w > 1 ? (h - w) / 2 : 0;
      var clipSize = h / w > 1 ? w : h;
      console.log(offsetX);
      canvas.height = canvas.width = size;
      canvas.getContext('2d').drawImage(image, offsetX, offsetY, clipSize, clipSize, 0, 0, size, size);
      image = canvas;
    }
    return image;
  }

  //var width = 1500.0;
  //var height = 500.0;
  var width = window.innerWidth;
  var height = window.innerHeight;

  //init scene
  var scene = new THREE.Scene();

  //init camera
  var fov = 60;
  var aspect = width / height;
  var camera = new THREE.PerspectiveCamera(fov, aspect);
  camera.position.set(0, 0, (height / 2) / Math.tan((fov * Math.PI / 180) / 2));
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);

  //init renderer
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  renderer.setClearColor(0xffffff, 0);
  document.body.appendChild(renderer.domElement);

  //init controls
  var controls = new THREE.TrackballControls(camera, renderer.domElement);

  var wrapper = new THREE.Object3D();
  textures.forEach(function(texture) {
    var geometry = new THREE.BoxGeometry(100, 100, 100);
    var material = new THREE.MeshBasicMaterial();
    material.map = textures[0];
    var box = new THREE.Mesh(geometry, material);
    box.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 100);
    wrapper.add(box);
  });
  scene.add(wrapper);

  update();
  window.addEventListener("resize", resize);

  function update() {
    wrapper.rotation.y += 0.005;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(update);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

});