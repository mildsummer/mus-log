import './three-mouse-event.es6';
import './ConvexGeometry';

class Embryo {

  constructor(data, container, width, height) {

    //* data : array of contributions
    //* contribution
    //* {
    //*   image: DOMImage
    //*   text: String
    //* }
    this.data = data;

    //テクスチャの作成
    var loadedNum = 0;
    data.forEach((contribution, index) => {
      var image = new Image();
      image.onload = () => {
        var texture = Embryo.createTexture(image);
        this.data[index].texture = texture;
        loadedNum++;
        if(loadedNum === data.length) {
          this.initialize(container, width, height);
        }
      };
      image.src = contribution.base64;
    });

    return this;

  }

  initialize(container, width, height) {
    this.width = width;
    this.height = height;

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
    container.appendChild(renderer.domElement);

    //init controls
    var controls = new THREE.TrackballControls(camera, renderer.domElement);

    //watch mouse events
    scene.watchMouseEvent(renderer.domElement, camera);

    var wrapper = new THREE.Object3D();
    scene.add(wrapper);

    var mesh = new THREE.Mesh(Embryo.createGeometry(100, 4), new THREE.MeshBasicMaterial({color: 0xff0000}));
    scene.add(mesh);

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.wrapper = wrapper;

    //セルの生成
    this.data.forEach(this.addCell.bind(this));

    function update() {
      wrapper.rotation.y += 0.005;
      controls.update();
      renderer.render(scene, camera);
      scene.handleMouseEvent();
      requestAnimationFrame(update);
    }
    update();

    return this;

  }

  //三角の面で構成される多面体の作成
  static createGeometry(radius, surfaceNumber) {
    var vertices = [];
    surfaceNumber = (surfaceNumber < 4) ? 4 : surfaceNumber;//４以下は不可
    surfaceNumber = (surfaceNumber & 1) ? (surfaceNumber + 1) : surfaceNumber;//奇数は不可(より大きい偶数に直す)
    vertices.length = 2 + surfaceNumber / 2;//頂点の数
    vertices.forEach(function(value, index) {
      vertices[index] = new THREE.Vector3(Math.random(), Math.random(), Math.random());//球状にランダムに点を打つ
      vertices[index].setLength(radius);
    });
    console.log(vertices);
    return new THREE.ConvexGeometry(vertices);
  }

  static createTexture(image) {
    var texture = new THREE.Texture(this.getSuitableImage(image));
    //texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return texture;
  }

  //画像サイズを調整
  static getSuitableImage(image) {
    var w = image.naturalWidth, h = image.naturalHeight;
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

  addCell(contribution) {
    var geometry = new THREE.BoxGeometry(100, 100, 100);
    var material = new THREE.MeshBasicMaterial();
    material.map = contribution.texture;
    var box = new THREE.Mesh(geometry, material);
    box.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 100);
    //box.onmousemove = function() {
    //  console.log('mousemove: ' + contribution.text);
    //};
    //box.onmouseover = function() {
    //  console.log('mouseover: ' + contribution.text);
    //};
    //box.onmouseout = function() {
    //  console.log('mouseout: ' + contribution.text);
    //};
    //box.onclick = function() {
    //  console.log('click: ' + contribution.text);
    //};
    //box.onmousedown = function() {
    //  console.log('mousedown: ' + contribution.text);
    //};
    this.wrapper.add(box);
    return this;
  }

  addContribution(contribution) {
    var image = new Image();
    image.onload = () => {
      var texture = Embryo.createTexture(image);
      this.textures.push(texture);
      this.addCell(texture);
    };
    image.src = contribution.base64;
    return this;
  }

  setSize(width, height) {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    return this;
  }

}

export default Embryo;