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
        this.torchLayer = null;
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
        this._wallTorches = [];
        this._torchLights = [];
        this._flickerFrame = null;

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
        this.renderer.setPixelRatio(1);
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
        this.torchLayer = new THREE.Group();
        this.world.add(this.floorLayer, this.wallLayer, this.detailLayer, this.torchLayer);

        this._textures = {};
        this._generateProceduralTextures();
        this._startFlickerLoop();

        window.addEventListener('resize', this._resizeHandler);
        this._resize();
    }

    _generateProceduralTextures() {
        this._textures.stone = this._makeCanvasTexture(16, 16, function(ctx) {
            ctx.fillStyle = '#4a4640';
            ctx.fillRect(0, 0, 16, 16);
            for (var i = 0; i < 40; i++) {
                var v = 58 + Math.floor(Math.random() * 24);
                ctx.fillStyle = 'rgb(' + v + ',' + (v - 4) + ',' + (v - 8) + ')';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
            ctx.fillStyle = '#35322d';
            ctx.fillRect(0, 0, 16, 1);
            ctx.fillRect(0, 8, 16, 1);
            ctx.fillRect(0, 0, 1, 16);
            ctx.fillRect(8, 0, 1, 16);
        });

        this._textures.floor = this._makeCanvasTexture(16, 16, function(ctx) {
            ctx.fillStyle = '#3d3a32';
            ctx.fillRect(0, 0, 16, 16);
            for (var i = 0; i < 30; i++) {
                var v = 48 + Math.floor(Math.random() * 20);
                ctx.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 6) + ')';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
            ctx.fillStyle = '#2e2b26';
            ctx.fillRect(0, 0, 16, 1);
            ctx.fillRect(0, 0, 1, 16);
        });

        this._textures.darkStone = this._makeCanvasTexture(16, 16, function(ctx) {
            ctx.fillStyle = '#242522';
            ctx.fillRect(0, 0, 16, 16);
            for (var i = 0; i < 25; i++) {
                var v = 30 + Math.floor(Math.random() * 14);
                ctx.fillStyle = 'rgb(' + v + ',' + (v + 1) + ',' + (v - 2) + ')';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
        });

        this._textures.ceiling = this._makeCanvasTexture(16, 16, function(ctx) {
            ctx.fillStyle = '#161714';
            ctx.fillRect(0, 0, 16, 16);
            for (var i = 0; i < 20; i++) {
                var v = 18 + Math.floor(Math.random() * 10);
                ctx.fillStyle = 'rgb(' + v + ',' + (v + 1) + ',' + (v - 1) + ')';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
        });

        this._textures.mossStone = this._makeCanvasTexture(16, 16, function(ctx) {
            ctx.fillStyle = '#3e3d36';
            ctx.fillRect(0, 0, 16, 16);
            for (var i = 0; i < 30; i++) {
                var v = 50 + Math.floor(Math.random() * 18);
                ctx.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 8) + ')';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
            ctx.fillStyle = '#2a3224';
            ctx.fillRect(2, 12, 3, 2);
            ctx.fillRect(11, 14, 2, 2);
            ctx.fillStyle = '#35322d';
            ctx.fillRect(0, 0, 16, 1);
            ctx.fillRect(0, 8, 16, 1);
            ctx.fillRect(0, 0, 1, 16);
            ctx.fillRect(8, 0, 1, 16);
        });
    }

    _makeCanvasTexture(w, h, drawFn) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        drawFn(ctx);
        var tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    _startFlickerLoop() {
        var self = this;
        var startTime = performance.now();
        function tick(now) {
            if (!self._ready) return;
            var t = (now - startTime) / 1000;
            var flicker = Math.sin(t * 3.7) * 0.12 + Math.sin(t * 7.3) * 0.06 + Math.sin(t * 11.1) * 0.04;
            self.torch.intensity = 2.2 + flicker;
            for (var i = 0; i < self._torchLights.length; i++) {
                var tl = self._torchLights[i];
                var phase = t * 3.2 + i * 1.7;
                tl.intensity = tl._baseIntensity + Math.sin(phase) * 0.15 + Math.sin(phase * 2.1) * 0.08;
            }
            self._flickerFrame = requestAnimationFrame(tick);
        }
        this._flickerFrame = requestAnimationFrame(tick);
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
            this._clearTorchLayer();

            var floorMat = new THREE.MeshLambertMaterial({ map: this._textures.floor });
            var mossFloorMat = new THREE.MeshLambertMaterial({ map: this._textures.mossStone });
            var wallMat = new THREE.MeshLambertMaterial({ map: this._textures.stone });
            var darkWallMat = new THREE.MeshLambertMaterial({ map: this._textures.darkStone });
            var ceilingMat = new THREE.MeshLambertMaterial({ map: this._textures.ceiling, side: THREE.BackSide });
            var floorGeometry = new THREE.BoxGeometry(1, 0.08, 1);
            var wallGeometry = new THREE.BoxGeometry(1, 1.8, 1);
            var ceilingGeometry = new THREE.PlaneGeometry(map.width, map.height);

            var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMat);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.set(map.width / 2, 1.85, map.height / 2);
            this.floorLayer.add(ceiling);

            var floorPositions = [];

            for (var y = 0; y < map.height; y++) {
                for (var x = 0; x < map.width; x++) {
                    var tile = map.map[y][x];
                    var centerX = x + 0.5;
                    var centerZ = y + 0.5;

                    if (tile.type === 'wall') {
                        var useMat = tile.explored ? wallMat : darkWallMat;
                        var wall = new THREE.Mesh(wallGeometry, useMat);
                        wall.position.set(centerX, 0.9, centerZ);
                        this.wallLayer.add(wall);
                        continue;
                    }

                    var useFloorMat = (x + y) % 7 === 0 ? mossFloorMat : floorMat;
                    var floor = new THREE.Mesh(floorGeometry, useFloorMat);
                    floor.position.set(centerX, 0, centerZ);
                    this.floorLayer.add(floor);
                    floorPositions.push({ x: x, y: y });

                    if (tile.type === 'door') this._addDoor(centerX, centerZ, tile.locked);
                    if (tile.type === 'stairs') this._addStairs(centerX, centerZ);
                    if (tile.type === 'shop') this._addMarker(centerX, centerZ, 0xd1b47a);
                    if (tile.chest && !tile.chestOpen) this._addChest(centerX, centerZ);
                }
            }

            this._placeWallTorches(map, floorPositions);
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

    _placeWallTorches(map, floorPositions) {
        var floorSet = {};
        for (var i = 0; i < floorPositions.length; i++) {
            floorSet[floorPositions[i].x + ',' + floorPositions[i].y] = true;
        }

        var torchCount = 0;
        var maxTorches = 12;
        var dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

        for (var y = 0; y < map.height && torchCount < maxTorches; y++) {
            for (var x = 0; x < map.width && torchCount < maxTorches; x++) {
                if (map.map[y][x].type !== 'wall') continue;
                var floorDir = null;
                for (var d = 0; d < dirs.length; d++) {
                    var nx = x + dirs[d].dx;
                    var ny = y + dirs[d].dy;
                    if (floorSet[nx + ',' + ny]) { floorDir = dirs[d]; break; }
                }
                if (!floorDir) continue;
                if (x % 5 !== 0 || y % 5 !== 0) continue;
                var offsetX = -floorDir.dx * 0.42;
                var offsetZ = -floorDir.dy * 0.42;
                var tx = x + 0.5 + offsetX;
                var tz = y + 0.5 + offsetZ;

                var stickMat = new THREE.MeshLambertMaterial({ color: 0x5a3a20 });
                var stick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), stickMat);
                stick.position.set(tx, 1.2, tz);
                this.torchLayer.add(stick);

                var bracketMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
                var bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), bracketMat);
                bracket.position.set(tx, 1.05, tz);
                this.torchLayer.add(bracket);

                var flameMat = new THREE.MeshBasicMaterial({ color: 0xff8833 });
                var flame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), flameMat);
                flame.position.set(tx, 1.38, tz);
                this.torchLayer.add(flame);

                var torchLight = new THREE.PointLight(0xd49a62, 0.8, 3, 2);
                torchLight.position.set(tx, 1.3, tz);
                torchLight._baseIntensity = 0.8;
                this.torchLayer.add(torchLight);
                this._torchLights.push(torchLight);
                torchCount++;
            }
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
        var doorMat = new THREE.MeshLambertMaterial({ color: locked ? 0x5a2018 : 0x7a6540 });
        var door = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 0.82), doorMat);
        door.position.set(x, 0.72, z);
        this.detailLayer.add(door);

        var frameMat = new THREE.MeshLambertMaterial({ color: 0x3a3630 });
        var frameL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.45, 0.08), frameMat);
        frameL.position.set(x, 0.72, z - 0.42);
        this.detailLayer.add(frameL);
        var frameR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.45, 0.08), frameMat);
        frameR.position.set(x, 0.72, z + 0.42);
        this.detailLayer.add(frameR);
        var frameT = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.9), frameMat);
        frameT.position.set(x, 1.42, z);
        this.detailLayer.add(frameT);

        if (locked) {
            var lockMat = new THREE.MeshLambertMaterial({ color: 0x8a6a30 });
            var lock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), lockMat);
            lock.position.set(x - 0.08, 0.72, z + 0.32);
            this.detailLayer.add(lock);
        }
    }

    _addStairs(x, z) {
        var stairMat = new THREE.MeshLambertMaterial({ color: 0xb09460, emissive: 0x2a1c0c });
        for (var i = 0; i < 4; i++) {
            var step = new THREE.Mesh(new THREE.BoxGeometry(0.62 + i * 0.08, 0.08, 0.18), stairMat);
            step.position.set(x, 0.08 + i * 0.1, z - 0.25 + i * 0.14);
            this.detailLayer.add(step);
        }
        var beacon = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.12, 0),
            new THREE.MeshBasicMaterial({ color: 0xe0c27a })
        );
        beacon.position.set(x, 0.75, z);
        this.detailLayer.add(beacon);
    }

    _addChest(x, z) {
        var chestBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.22, 0.32),
            new THREE.MeshLambertMaterial({ color: 0x7a2820 })
        );
        chestBody.position.set(x, 0.14, z);
        this.detailLayer.add(chestBody);

        var chestLid = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.1, 0.32),
            new THREE.MeshLambertMaterial({ color: 0x8a3228 })
        );
        chestLid.position.set(x, 0.3, z);
        this.detailLayer.add(chestLid);

        var trimMat = new THREE.MeshLambertMaterial({ color: 0x9a7a30 });
        var trim = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.02), trimMat);
        trim.position.set(x, 0.22, z + 0.16);
        this.detailLayer.add(trim);
    }

    _addMarker(x, z, color) {
        var marker = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8),
            new THREE.MeshLambertMaterial({ color: color, emissive: 0x241b0c })
        );
        marker.position.set(x, 0.08, z);
        this.detailLayer.add(marker);
    }

    _clearTorchLayer() {
        this._torchLights = [];
        this._clear(this.torchLayer);
    }

    _clear(group) {
        while (group.children.length) {
            var child = group.children.pop();
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(function(m) { m.dispose(); });
                } else {
                    child.material.dispose();
                }
            }
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
        this._ready = false;
        window.removeEventListener('resize', this._resizeHandler);
        document.removeEventListener('mousemove', this._mouseMoveHandler);
        document.removeEventListener('pointerlockchange', this._pointerLockHandler);
        if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
        if (this._flickerFrame) cancelAnimationFrame(this._flickerFrame);
        if (this.canvas) this.canvas.remove();
        if (this.renderer) this.renderer.dispose();
        for (var k in this._textures) {
            if (this._textures[k]) this._textures[k].dispose();
        }
    }
}
