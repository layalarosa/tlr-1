class ThreeDungeonView {
    constructor(scene) {
        this.scene = scene;
        this.canvas = null;
        this.renderer = null;
        this.camera = null;
        this.world = null;
        this.floorLayer = null;
        this.wallLayer = null;
        this.detailLayer = null;
        this._resizeHandler = this._resize.bind(this);
        this._mouseMoveHandler = this._onMouseMove.bind(this);
        this._pointerLockHandler = this._onPointerLockChange.bind(this);
        this._ready = typeof THREE !== 'undefined';
        this._lookYaw = 0;
        this._lookPitch = 0;
        this._baseYaw = 0;
        this._dragging = false;
        this._lastPointerX = 0;
        this._lastPointerY = 0;

        if (!this._ready) return;

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'three-dungeon-canvas';
        this.canvas.setAttribute('aria-hidden', 'true');
        this.canvas.title = 'Haz clic y mueve el raton para mirar';
        document.getElementById('game-container').appendChild(this.canvas);
        this.canvas.addEventListener('pointerdown', this._onPointerDown.bind(this));
        this.canvas.addEventListener('pointerup', this._onPointerUp.bind(this));
        this.canvas.addEventListener('pointerleave', this._onPointerUp.bind(this));
        document.addEventListener('mousemove', this._mouseMoveHandler);
        document.addEventListener('pointerlockchange', this._pointerLockHandler);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setClearColor(0x080807, 1);

        this.world = new THREE.Scene();
        this.world.background = new THREE.Color(0x080807);
        this.world.fog = new THREE.Fog(0x080807, 3.5, 12);
        this.camera = new THREE.PerspectiveCamera(72, 640 / 290, 0.05, 40);
        this.camera.rotation.order = 'YXZ';

        this.world.add(new THREE.HemisphereLight(0xaaa58e, 0x171513, 1.15));
        var torch = new THREE.PointLight(0xd49a62, 2.2, 5.5, 2);
        torch.position.set(0, 1.45, 0);
        this.world.add(torch);
        this.torch = torch;
        this._hasCamera = false;
        this._animationFrame = null;
        this._animating = false;
        this._mapRenderKey = null;

        this.floorLayer = new THREE.Group();
        this.wallLayer = new THREE.Group();
        this.detailLayer = new THREE.Group();
        this.world.add(this.floorLayer, this.wallLayer, this.detailLayer);
        window.addEventListener('resize', this._resizeHandler);
        this._resize();
    }

    isReady() {
        return this._ready;
    }

    isAnimating() {
        return this._animating;
    }

    setVisible(visible) {
        if (this.canvas) this.canvas.style.display = visible ? 'block' : 'none';
    }

    _onPointerDown(event) {
        if (window.isTouchDevice && window.isTouchDevice()) return;
        this._dragging = true;
        this._lastPointerX = event.clientX;
        this._lastPointerY = event.clientY;
        if (this.canvas.requestPointerLock) {
            var lockRequest = this.canvas.requestPointerLock();
            if (lockRequest && lockRequest.catch) lockRequest.catch(function() {});
        }
    }

    _onPointerUp() {
        this._dragging = false;
    }

    _onPointerLockChange() {
        if (document.pointerLockElement !== this.canvas) this._dragging = false;
    }

    _onMouseMove(event) {
        if (!this._ready || this._animating) return;
        var locked = document.pointerLockElement === this.canvas;
        if (!locked && !this._dragging) return;
        var dx = locked ? event.movementX : event.clientX - this._lastPointerX;
        var dy = locked ? event.movementY : event.clientY - this._lastPointerY;
        this._lastPointerX = event.clientX;
        this._lastPointerY = event.clientY;
        this._lookYaw = THREE.MathUtils.clamp(this._lookYaw - dx * 0.0025, -0.55, 0.55);
        this._lookPitch = THREE.MathUtils.clamp(this._lookPitch - dy * 0.0018, -0.18, 0.18);
        this._renderCamera();
    }

    render(map, px, py, pdir, onComplete) {
        if (!this._ready) return;
        var mapRenderKey = this._getMapRenderKey(map);
        if (mapRenderKey !== this._mapRenderKey) {
            this._mapRenderKey = mapRenderKey;
            this._clear(this.floorLayer);
            this._clear(this.wallLayer);
            this._clear(this.detailLayer);

            var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x565249 });
            var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4942 });
            var darkWallMaterial = new THREE.MeshLambertMaterial({ color: 0x242522 });
            var ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0x161714, side: THREE.BackSide });
            var floorGeometry = new THREE.BoxGeometry(1, 0.08, 1);
            var wallGeometry = new THREE.BoxGeometry(1, 1.8, 1);
            var ceilingGeometry = new THREE.PlaneGeometry(map.width, map.height);

            var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.set(map.width / 2, 1.85, map.height / 2);
            this.floorLayer.add(ceiling);

            for (var y = 0; y < map.height; y++) {
                for (var x = 0; x < map.width; x++) {
                    var tile = map.map[y][x];
                    var centerX = x + 0.5;
                    var centerZ = y + 0.5;

                    if (tile.type === 'wall') {
                        var wall = new THREE.Mesh(wallGeometry, tile.explored ? wallMaterial : darkWallMaterial);
                        wall.position.set(centerX, 0.9, centerZ);
                        this.wallLayer.add(wall);
                        continue;
                    }

                    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
                    floor.position.set(centerX, 0, centerZ);
                    this.floorLayer.add(floor);

                    if (tile.type === 'door') this._addDoor(centerX, centerZ, tile.locked);
                    if (tile.type === 'stairs') this._addStairs(centerX, centerZ);
                    if (tile.type === 'shop') this._addMarker(centerX, centerZ, 0xd1b47a);
                    if (tile.chest && !tile.chestOpen) this._addChest(centerX, centerZ);
                }
            }
        }

        var targetX = px + 0.5;
        var targetZ = py + 0.5;
        var targetRotation = -pdir * Math.PI / 2;
        if (this._hasCamera && Math.abs(this._baseYaw - targetRotation) > 0.01) {
            this._lookYaw = 0;
            this._lookPitch = 0;
        }
        this._baseYaw = targetRotation;
        targetRotation += this._lookYaw;
        var fromX = this.camera.position.x;
        var fromZ = this.camera.position.z;
        var sameDirection = Math.abs(this.camera.rotation.y - targetRotation) < 0.01;
        var shouldAnimate = this._hasCamera && sameDirection && Math.abs(fromX - targetX) <= 1.1 && Math.abs(fromZ - targetZ) <= 1.1;

        if (!shouldAnimate) {
            this.camera.position.set(targetX, 0.62, targetZ);
            this.camera.rotation.y = targetRotation;
        }
        this.camera.rotation.x = this._lookPitch;
        this.torch.position.set(targetX, 1.35, targetZ);
        this._hasCamera = true;

        if (shouldAnimate) {
            this._animateCamera(fromX, fromZ, targetX, targetZ, targetRotation, onComplete);
        } else {
            this.renderer.render(this.world, this.camera);
            if (onComplete) onComplete();
        }
    }

    _animateCamera(fromX, fromZ, targetX, targetZ, targetRotation, onComplete) {
        if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
        this._animating = true;
        var start = performance.now();
        var duration = 180;
        var self = this;
        function tick(now) {
            var progress = Math.min(1, (now - start) / duration);
            var eased = 1 - Math.pow(1 - progress, 3);
            self.camera.position.x = fromX + (targetX - fromX) * eased;
            self.camera.position.z = fromZ + (targetZ - fromZ) * eased;
            self.camera.rotation.y = targetRotation;
            self.camera.rotation.x = self._lookPitch;
            self.renderer.render(self.world, self.camera);
            if (progress < 1) {
                self._animationFrame = requestAnimationFrame(tick);
            } else {
                self._animationFrame = null;
                self._animating = false;
                if (onComplete) onComplete();
            }
        }
        this._animationFrame = requestAnimationFrame(tick);
    }

    _getMapRenderKey(map) {
        var key = map.width + 'x' + map.height + ':';
        for (var y = 0; y < map.height; y++) {
            for (var x = 0; x < map.width; x++) {
                var tile = map.map[y][x];
                key += tile.type + (tile.locked ? '1' : '0') + (tile.explored ? '1' : '0') + (tile.visible ? '1' : '0') + (tile.chest && !tile.chestOpen ? '1' : '0') + ';';
            }
        }
        return key;
    }

    _renderCamera() {
        if (!this._ready || !this._hasCamera) return;
        this.camera.rotation.y = this._baseYaw + this._lookYaw;
        this.camera.rotation.x = this._lookPitch;
        this.renderer.render(this.world, this.camera);
    }

    _addDoor(x, z, locked) {
        var material = new THREE.MeshLambertMaterial({ color: locked ? 0x722d27 : 0x927b55 });
        var door = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 0.82), material);
        door.position.set(x, 0.72, z);
        this.detailLayer.add(door);
    }

    _addStairs(x, z) {
        var material = new THREE.MeshLambertMaterial({ color: 0xc7a96d, emissive: 0x352815 });
        for (var i = 0; i < 4; i++) {
            var step = new THREE.Mesh(new THREE.BoxGeometry(0.62 + i * 0.08, 0.08, 0.18), material);
            step.position.set(x, 0.08 + i * 0.1, z - 0.25 + i * 0.14);
            this.detailLayer.add(step);
        }
        var beacon = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.12, 0),
            new THREE.MeshLambertMaterial({ color: 0xe0c27a, emissive: 0x5a3c16 })
        );
        beacon.position.set(x, 0.75, z);
        this.detailLayer.add(beacon);
    }

    _addChest(x, z) {
        var chest = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.28, 0.32),
            new THREE.MeshLambertMaterial({ color: 0x9b382d, emissive: 0x160605 })
        );
        chest.position.set(x, 0.18, z);
        this.detailLayer.add(chest);
    }

    _addMarker(x, z, color) {
        var marker = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8),
            new THREE.MeshLambertMaterial({ color: color, emissive: 0x241b0c })
        );
        marker.position.set(x, 0.08, z);
        this.detailLayer.add(marker);
    }

    _clear(group) {
        while (group.children.length) {
            var child = group.children.pop();
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
    }

    _resize() {
        if (!this._ready || !this.renderer) return;
        var gameContainer = document.getElementById('game-container');
        var width = gameContainer ? gameContainer.clientWidth : 640;
        var height = gameContainer ? gameContainer.clientHeight : 480;
        var viewHeight = Math.max(180, Math.min(height * 0.62, height - 180));
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = viewHeight + 'px';
        this.renderer.setSize(width, viewHeight, false);
        this.camera.aspect = width / viewHeight;
        this.camera.updateProjectionMatrix();
    }

    destroy() {
        window.removeEventListener('resize', this._resizeHandler);
        document.removeEventListener('mousemove', this._mouseMoveHandler);
        document.removeEventListener('pointerlockchange', this._pointerLockHandler);
        if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
        if (this.canvas) this.canvas.remove();
        if (this.renderer) this.renderer.dispose();
        this._ready = false;
    }
}
