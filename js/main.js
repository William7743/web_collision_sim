import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class PhysicsApp {
    constructor() {
        // Three.js 核心对象
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Cannon-es 物理世界
        this.world = null;
        this.objects = []; // 存储 { body, mesh } 对
        this.constraints = []; // 存储约束

        // 鼠标交互
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.mouseConstraint = null;
        this.isDragging = false;

        // FPS 计算
        this.lastTime = performance.now();
        this.frameCount = 0;

        this.init();
    }

    init() {
        this.initThree();
        this.initCannon();
        this.setupLights();
        this.setupGround();
        this.setupEventListeners();
        this.animate();
    }

    // ========== Three.js 初始化 ==========
    initThree() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // 添加轨道控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    // ========== Cannon-es 初始化 ==========
    initCannon() {
        // 创建物理世界
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);

        // 性能优化：使用 SAPBroadphase (Sweep and Prune) 更适合大量物体
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);

        // 性能优化：增加求解器迭代次数以提高精确度
        this.world.solver.iterations = 20;

        // 接触材质参数
        this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
        this.world.defaultContactMaterial.contactEquationRelaxation = 3;

        // 性能优化：允许休眠以提高性能
        this.world.allowSleep = true;

        console.log('✅ 物理引擎已优化: SAPBroadphase + 20 iterations + Sleep');
    }

    // ========== 设置光源 ==========
    setupLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // 定向光（模拟太阳）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
    }

    // ========== 设置地面 ==========
    setupGround() {
        // Cannon.js 地面
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, // 静态物体
            shape: groundShape
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);

        // Three.js 地面
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            depthWrite: false
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);

        // 添加网格辅助线
        const gridHelper = new THREE.GridHelper(50, 50, 0x000000, 0x000000);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    // ========== 创建盒子 ==========
    addBox() {
        const size = Math.random() * 1 + 0.5;
        const position = {
            x: Math.random() * 4 - 2,
            y: 5 + Math.random() * 5,
            z: Math.random() * 4 - 2
        };

        // Cannon.js 刚体
        const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        this.world.addBody(body);

        // Three.js 网格
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhongMaterial({
            color: Math.random() * 0xffffff
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.objects.push({ body, mesh });
        this.updateObjectCount();
    }

    // ========== 创建球体 ==========
    addSphere() {
        const radius = Math.random() * 0.5 + 0.3;
        const position = {
            x: Math.random() * 4 - 2,
            y: 5 + Math.random() * 5,
            z: Math.random() * 4 - 2
        };

        // Cannon.js 刚体
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        this.world.addBody(body);

        // Three.js 网格
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: Math.random() * 0xffffff
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.objects.push({ body, mesh });
        this.updateObjectCount();
    }

    // ========== 创建圆柱 ==========
    addCylinder() {
        const radius = Math.random() * 0.3 + 0.2;
        const height = Math.random() * 1 + 0.5;
        const position = {
            x: Math.random() * 4 - 2,
            y: 5 + Math.random() * 5,
            z: Math.random() * 4 - 2
        };

        // Cannon.js 刚体
        const shape = new CANNON.Cylinder(radius, radius, height, 20);
        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        this.world.addBody(body);

        // Three.js 网格
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        const material = new THREE.MeshPhongMaterial({
            color: Math.random() * 0xffffff
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.objects.push({ body, mesh });
        this.updateObjectCount();
    }

    // ========== 创建复合形状 ==========
    addCompound() {
        try {
            const position = {
                x: Math.random() * 2,
                y: 5 + Math.random() * 3,
                z: Math.random() * 2
            };

            // 检查 CANNON.Compound 是否可用
            if (typeof CANNON.Compound === 'undefined') {
                console.error('CANNON.Compound 不可用，使用简单盒子代替');
                this.addBox();
                return;
            }

            // 创建复合形状
            const compoundShape = new CANNON.Compound();

            // 添加盒子
            const boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            compoundShape.addChildShape(boxShape, new CANNON.Vec3(0, 0, 0));

            // 添加球体
            const sphereShape = new CANNON.Sphere(0.3);
            compoundShape.addChildShape(sphereShape, new CANNON.Vec3(0.8, 0, 0));

            // 添加另一个盒子
            const boxShape2 = new CANNON.Box(new CANNON.Vec3(0.3, 0.3, 0.3));
            compoundShape.addChildShape(boxShape2, new CANNON.Vec3(-0.5, 0.5, 0));

            // Cannon.js 刚体
            const body = new CANNON.Body({
                mass: 2,
                shape: compoundShape,
                position: new CANNON.Vec3(position.x, position.y, position.z)
            });
            this.world.addBody(body);

            // Three.js 网格（组合网格）
            const group = new THREE.Group();

            const boxGeo = new THREE.BoxGeometry(1, 1, 1);
            const sphereGeo = new THREE.SphereGeometry(0.3, 32, 32);
            const boxGeo2 = new THREE.BoxGeometry(0.6, 0.6, 0.6);

            const material = new THREE.MeshPhongMaterial({
                color: Math.random() * 0xffffff
            });

            const boxMesh = new THREE.Mesh(boxGeo, material);
            boxMesh.castShadow = true;
            group.add(boxMesh);

            const sphereMesh = new THREE.Mesh(sphereGeo, material);
            sphereMesh.position.set(0.8, 0, 0);
            sphereMesh.castShadow = true;
            group.add(sphereMesh);

            const boxMesh2 = new THREE.Mesh(boxGeo2, material);
            boxMesh2.position.set(-0.5, 0.5, 0);
            boxMesh2.castShadow = true;
            group.add(boxMesh2);

            group.position.set(position.x, position.y, position.z);
            this.scene.add(group);

            this.objects.push({ body, mesh: group });
            this.updateObjectCount();
        } catch (error) {
            console.error('addCompound 出错:', error);
            // 如果出错，添加一个简单盒子
            this.addBox();
        }
    }

    // ========== 创建钟摆 ==========
    createPendulum() {
        const numLinks = 5;
        const linkLength = 1.0;
        const startX = 0;
        const startY = 8;
        let previousBody = null;

        // 创建固定锚点
        const anchorShape = new CANNON.Box(new CANNON.Vec3(0.2, 0.2, 0.2));
        const anchorBody = new CANNON.Body({
            mass: 0,
            shape: anchorShape,
            position: new CANNON.Vec3(startX, startY, 0)
        });
        this.world.addBody(anchorBody);

        const anchorGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const anchorMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const anchorMesh = new THREE.Mesh(anchorGeo, anchorMat);
        anchorMesh.position.set(startX, startY, 0);
        this.scene.add(anchorMesh);

        for (let i = 0; i < numLinks; i++) {
            // 创建链接
            const linkShape = new CANNON.Box(new CANNON.Vec3(0.1, linkLength / 2, 0.1));
            const linkBody = new CANNON.Body({
                mass: 1,
                shape: linkShape,
                position: new CANNON.Vec3(startX, startY - i * linkLength - 0.5, 0)
            });
            this.world.addBody(linkBody);

            const linkGeo = new THREE.BoxGeometry(0.2, linkLength, 0.2);
            const linkMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            const linkMesh = new THREE.Mesh(linkGeo, linkMat);
            linkMesh.position.set(startX, startY - i * linkLength - 0.5, 0);
            linkMesh.castShadow = true;
            this.scene.add(linkMesh);

            this.objects.push({ body: linkBody, mesh: linkMesh });

            // 创建铰链约束
            let pivotA, pivotB;
            if (i === 0) {
                // 第一个链接连接到锚点
                pivotA = new CANNON.Vec3(0, -0.2, 0);
                pivotB = new CANNON.Vec3(0, linkLength / 2, 0);
            } else {
                // 后续链接
                pivotA = new CANNON.Vec3(0, -linkLength / 2, 0);
                pivotB = new CANNON.Vec3(0, linkLength / 2, 0);
            }

            const constraint = new CANNON.HingeConstraint(
                previousBody || anchorBody,
                linkBody,
                {
                    pivotA: pivotA,
                    axisA: new CANNON.Vec3(0, 0, 1),
                    pivotB: pivotB,
                    axisB: new CANNON.Vec3(0, 0, 1)
                }
            );
            this.world.addConstraint(constraint);
            this.constraints.push(constraint);

            previousBody = linkBody;
        }

        this.updateObjectCount();
    }

    // ========== 创建铰链连接的盒子 ==========
    createHingedBoxes() {
        const boxSize = 1;
        const numBoxes = 4;

        // 创建固定基座
        const baseShape = new CANNON.Box(new CANNON.Vec3(boxSize/2, boxSize/2, boxSize/2));
        const baseBody = new CANNON.Body({
            mass: 0,
            shape: baseShape,
            position: new CANNON.Vec3(0, boxSize/2, 0)
        });
        this.world.addBody(baseBody);

        const baseGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        const baseMat = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(0, boxSize/2, 0);
        baseMesh.castShadow = true;
        this.scene.add(baseMesh);

        let previousBody = baseBody;
        let previousMesh = baseMesh;

        for (let i = 0; i < numBoxes; i++) {
            const body = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Box(new CANNON.Vec3(boxSize/2, boxSize/2, boxSize/2)),
                position: new CANNON.Vec3(0, boxSize/2 + i * (boxSize + 0.1), boxSize/2)
            });
            this.world.addBody(body);

            const geo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
            const mat = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(i / numBoxes, 1, 0.5)
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(body.position);
            mesh.castShadow = true;
            this.scene.add(mesh);

            this.objects.push({ body, mesh });

            // 创建铰链约束
            const constraint = new CANNON.HingeConstraint(
                previousBody,
                body,
                {
                    pivotA: new CANNON.Vec3(boxSize/2, boxSize/2, 0),
                    axisA: new CANNON.Vec3(0, 1, 0),
                    pivotB: new CANNON.Vec3(-boxSize/2, boxSize/2, 0),
                    axisB: new CANNON.Vec3(0, 1, 0)
                }
            );
            this.world.addConstraint(constraint);
            this.constraints.push(constraint);

            previousBody = body;
            previousMesh = mesh;
        }

        this.updateObjectCount();
    }

    // ========== 创建车辆模型 ==========
    createVehicle() {
        const chassisWidth = 1.8;
        const chassisHeight = 0.5;
        const chassisLength = 3;
        const wheelRadius = 0.4;
        const wheelWidth = 0.3;

        // 创建车身（复合形状）
        const chassisShape = new CANNON.Compound();

        // 主体
        const mainBody = new CANNON.Box(new CANNON.Vec3(chassisWidth/2, chassisHeight/2, chassisLength/2));
        chassisShape.addChildShape(mainBody, new CANNON.Vec3(0, 0, 0));

        // 车顶
        const roofShape = new CANNON.Box(new CANNON.Vec3(chassisWidth/2 - 0.1, chassisHeight/2, chassisLength/3));
        chassisShape.addChildShape(roofShape, new CANNON.Vec3(0, chassisHeight, -chassisLength/6));

        const chassisBody = new CANNON.Body({
            mass: 150,
            shape: chassisShape,
            position: new CANNON.Vec3(0, 2, 0)
        });
        this.world.addBody(chassisBody);

        // Three.js 车身
        const chassisGroup = new THREE.Group();

        const mainGeo = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisLength);
        const chassisMat = new THREE.MeshPhongMaterial({ color: 0x3366ff });
        const mainMesh = new THREE.Mesh(mainGeo, chassisMat);
        mainMesh.castShadow = true;
        chassisGroup.add(mainMesh);

        const roofGeo = new THREE.BoxGeometry(chassisWidth - 0.2, chassisHeight, chassisLength/3 * 2);
        const roofMesh = new THREE.Mesh(roofGeo, chassisMat);
        roofMesh.position.set(0, chassisHeight, -chassisLength/6);
        roofMesh.castShadow = true;
        chassisGroup.add(roofMesh);

        chassisGroup.position.copy(chassisBody.position);
        this.scene.add(chassisGroup);

        this.objects.push({ body: chassisBody, mesh: chassisGroup });

        // 车轮位置
        const wheelPositions = [
            { x: -chassisWidth/2 - 0.1, y: -0.2, z: chassisLength/2 - 0.5 },  // 前左
            { x: chassisWidth/2 + 0.1, y: -0.2, z: chassisLength/2 - 0.5 },   // 前右
            { x: -chassisWidth/2 - 0.1, y: -0.2, z: -chassisLength/2 + 0.5 }, // 后左
            { x: chassisWidth/2 + 0.1, y: -0.2, z: -chassisLength/2 + 0.5 }   // 后右
        ];

        // 创建车轮
        for (const pos of wheelPositions) {
            // Cannon.js 车轮
            const wheelShape = new CANNON.Cylinder(wheelRadius, wheelRadius, wheelWidth, 20);
            const wheelBody = new CANNON.Body({
                mass: 10,
                shape: wheelShape,
                position: new CANNON.Vec3(
                    chassisBody.position.x + pos.x,
                    chassisBody.position.y + pos.y,
                    chassisBody.position.z + pos.z
                )
            });
            this.world.addBody(wheelBody);

            // Three.js 车轮
            const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32);
            const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
            const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
            wheelMesh.rotation.x = Math.PI / 2;
            wheelMesh.position.copy(wheelBody.position);
            wheelMesh.castShadow = true;
            this.scene.add(wheelMesh);

            this.objects.push({ body: wheelBody, mesh: wheelMesh });

            // 创建铰链约束连接车身和车轮
            const pivotA = new CANNON.Vec3(pos.x, pos.y, pos.z);
            const pivotB = new CANNON.Vec3(0, 0, 0);
            const axis = new CANNON.Vec3(1, 0, 0);

            const constraint = new CANNON.HingeConstraint(
                chassisBody,
                wheelBody,
                { pivotA: pivotA, axisA: axis },
                { pivotB: pivotB, axisB: axis }
            );
            this.world.addConstraint(constraint);
            this.constraints.push(constraint);
        }

        this.updateObjectCount();
    }

    // ========== 创建堆叠测试 ==========
    createStack() {
        const boxSize = 1;
        const stackHeight = 8;
        const rows = 3;

        for (let level = 0; level < stackHeight; level++) {
            for (let row = 0; row < rows; row++) {
                const x = (row - 1) * boxSize * 1.1;
                const y = 0.5 + level * boxSize * 1.05;
                const z = 0;

                // 随机微小偏移，使堆叠更真实
                const offsetX = (Math.random() - 0.5) * 0.05;
                const offsetZ = (Math.random() - 0.5) * 0.05;

                // Cannon.js 刚体
                const shape = new CANNON.Box(new CANNON.Vec3(boxSize/2, boxSize/2, boxSize/2));
                const body = new CANNON.Body({
                    mass: 1,
                    shape: shape,
                    position: new CANNON.Vec3(x + offsetX, y, z + offsetZ)
                });
                this.world.addBody(body);

                // Three.js 网格
                const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
                const hue = (level / stackHeight) * 0.7; // 渐变颜色
                const material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color().setHSL(hue, 0.8, 0.5)
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x + offsetX, y, z + offsetZ);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.scene.add(mesh);

                this.objects.push({ body, mesh });
            }
        }

        this.updateObjectCount();
    }

    // ========== 创建金字塔 ==========
    createPyramid() {
        const boxSize = 1;
        const baseSize = 5; // 底边盒子数

        for (let level = 0; level < baseSize; level++) {
            const boxesInLevel = baseSize - level;
            const levelY = 0.5 + level * boxSize * 1.05;

            for (let i = 0; i < boxesInLevel; i++) {
                for (let j = 0; j < boxesInLevel; j++) {
                    const x = (i - boxesInLevel/2 + 0.5) * boxSize * 1.1;
                    const z = (j - boxesInLevel/2 + 0.5) * boxSize * 1.1;

                    // Cannon.js 刚体
                    const shape = new CANNON.Box(new CANNON.Vec3(boxSize/2, boxSize/2, boxSize/2));
                    const body = new CANNON.Body({
                        mass: 1,
                        shape: shape,
                        position: new CANNON.Vec3(x, levelY, z)
                    });
                    this.world.addBody(body);

                    // Three.js 网格
                    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
                    const hue = (level / baseSize) * 0.3;
                    const material = new THREE.MeshPhongMaterial({
                        color: new THREE.Color().setHSL(hue, 0.9, 0.5)
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(x, levelY, z);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    this.scene.add(mesh);

                    this.objects.push({ body, mesh });
                }
            }
        }

        this.updateObjectCount();
    }

    // ========== 创建球体雨 ==========
    createBallRain() {
        const numBalls = 30;

        for (let i = 0; i < numBalls; i++) {
            const radius = Math.random() * 0.3 + 0.2;
            const x = Math.random() * 8 - 4;
            const y = 10 + Math.random() * 10;
            const z = Math.random() * 8 - 4;

            // Cannon.js 刚体
            const shape = new CANNON.Sphere(radius);
            const body = new CANNON.Body({
                mass: radius * 2, // 质量与大小相关
                shape: shape,
                position: new CANNON.Vec3(x, y, z)
            });
            this.world.addBody(body);

            // Three.js 网格
            const geometry = new THREE.SphereGeometry(radius, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);

            this.objects.push({ body, mesh });
        }

        this.updateObjectCount();
    }

    // ========== 重置场景 ==========
    resetScene() {
        // 移除所有物体
        for (const obj of this.objects) {
            this.world.removeBody(obj.body);
            this.scene.remove(obj.mesh);
        }
        this.objects = [];

        // 移除所有约束
        for (const constraint of this.constraints) {
            this.world.removeConstraint(constraint);
        }
        this.constraints = [];

        this.updateObjectCount();
    }

    // ========== 辅助函数：创建复合体 ==========
    createComplexShape(components, mass, position, color = null) {
        try {
            // 检查 CANNON.Compound 是否可用
            if (typeof CANNON.Compound === 'undefined') {
                console.error('CANNON.Compound 不可用，使用简单盒子代替');
                this.addBox();
                return null;
            }

            // components: [{shape, offset, rotation}, ...]
            const compoundShape = new CANNON.Compound();

            components.forEach(c => {
                compoundShape.addChildShape(c.shape, c.offset, c.rotation || new CANNON.Quaternion());
            });

            const body = new CANNON.Body({
                mass: mass,
                shape: compoundShape,
                position: new CANNON.Vec3(position.x, position.y, position.z)
            });
            this.world.addBody(body);

            // 创建可视化
            const group = new THREE.Group();
            const material = new THREE.MeshPhongMaterial({
                color: color || Math.random() * 0xffffff
            });

            components.forEach((c, index) => {
                let geometry;
                if (c.shape instanceof CANNON.Box) {
                    const hs = c.shape.halfExtents;
                    geometry = new THREE.BoxGeometry(hs.x * 2, hs.y * 2, hs.z * 2);
                } else if (c.shape instanceof CANNON.Sphere) {
                    geometry = new THREE.SphereGeometry(c.shape.radius, 32, 32);
                } else if (c.shape instanceof CANNON.Cylinder) {
                    geometry = new THREE.CylinderGeometry(c.shape.radiusTop, c.shape.radiusBottom, c.shape.height, 32);
                } else if (c.shape instanceof CANNON.Plane) {
                geometry = new THREE.PlaneGeometry(10, 10);
            }
            if (geometry) {
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(c.offset);
                if (c.rotation) {
                    mesh.quaternion.copy(c.rotation);
                }
                mesh.castShadow = true;
                group.add(mesh);
            }
        });

        group.position.copy(body.position);
        this.scene.add(group);
        this.objects.push({ body, mesh: group });
        this.updateObjectCount();

        return body;
        } catch (error) {
            console.error('createComplexShape 出错:', error);
            // 如果出错，添加一个简单盒子作为替代
            this.addBox();
            return null;
        }
    }

    // ========== 1. 机器人手臂 (7个子形状) ==========
    createRobotArm() {
        const components = [
            // 基座
            {
                shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 1)),
                offset: new CANNON.Vec3(0, 0.25, 0),
                rotation: new CANNON.Quaternion()
            },
            // 上臂
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.3, 1.5, 0.3)),
                offset: new CANNON.Vec3(0, 1.25, 0),
                rotation: new CANNON.Quaternion()
            },
            // 前臂
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.25, 1.2, 0.25)),
                offset: new CANNON.Vec3(0, 2.6, 0),
                rotation: new CANNON.Quaternion()
            },
            // 手腕
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.2, 0.2, 0.2)),
                offset: new CANNON.Vec3(0, 3.3, 0),
                rotation: new CANNON.Quaternion()
            },
            // 手指1
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.08, 0.4, 0.08)),
                offset: new CANNON.Vec3(0.15, 3.6, 0),
                rotation: new CANNON.Quaternion()
            },
            // 手指2
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.08, 0.4, 0.08)),
                offset: new CANNON.Vec3(-0.15, 3.6, 0),
                rotation: new CANNON.Quaternion()
            },
            // 手指3
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.08, 0.4, 0.08)),
                offset: new CANNON.Vec3(0, 3.6, 0.15),
                rotation: new CANNON.Quaternion()
            }
        ];

        return this.createComplexShape(components, 5, { x: 0, y: 5, z: 0 }, 0xff6600);
    }

    // ========== 2. 四足动物 (12个子形状) ==========
    createQuadruped() {
        const components = [
            // 躯干
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.8, 0.4, 2)),
                offset: new CANNON.Vec3(0, 1, 0),
                rotation: new CANNON.Quaternion()
            },
            // 左前腿上部
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.15, 0.6, 0.15)),
                offset: new CANNON.Vec3(0.6, 0.7, 1),
                rotation: new CANNON.Quaternion()
            },
            // 左前腿下部
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.6, 0.12)),
                offset: new CANNON.Vec3(0.6, 0.1, 1),
                rotation: new CANNON.Quaternion()
            },
            // 右前腿上部
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.15, 0.6, 0.15)),
                offset: new CANNON.Vec3(-0.6, 0.7, 1),
                rotation: new CANNON.Quaternion()
            },
            // 右前腿下部
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.6, 0.12)),
                offset: new CANNON.Vec3(-0.6, 0.1, 1),
                rotation: new CANNON.Quaternion()
            },
            // 左后腿上部
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.15, 0.6, 0.15)),
                offset: new CANNON.Vec3(0.6, 0.7, -1),
                rotation: new CANNON.Quaternion()
            },
            // 左后腿下部
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.6, 0.12)),
                offset: new CANNON.Vec3(0.6, 0.1, -1),
                rotation: new CANNON.Quaternion()
            },
            // 右后腿上部
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.15, 0.6, 0.15)),
                offset: new CANNON.Vec3(-0.6, 0.7, -1),
                rotation: new CANNON.Quaternion()
            },
            // 右后腿下部
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.6, 0.12)),
                offset: new CANNON.Vec3(-0.6, 0.1, -1),
                rotation: new CANNON.Quaternion()
            },
            // 头
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.3, 0.3, 0.4)),
                offset: new CANNON.Vec3(0, 1.4, 1.2),
                rotation: new CANNON.Quaternion()
            },
            // 尾巴
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.8)),
                offset: new CANNON.Vec3(0, 1, -1.4),
                rotation: new CANNON.Quaternion()
            }
        ];

        return this.createComplexShape(components, 3, { x: 0, y: 3, z: 0 }, 0x8B4513);
    }

    // ========== 3. 桌子 (5个子形状) ==========
    createTable() {
        const components = [
            // 桌面
            {
                shape: new CANNON.Box(new CANNON.Vec3(2, 0.1, 1.5)),
                offset: new CANNON.Vec3(0, 1.5, 0),
                rotation: new CANNON.Quaternion()
            },
            // 左前腿
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.1, 0.7, 0.1)),
                offset: new CANNON.Vec3(1.7, 0.75, 0.6),
                rotation: new CANNON.Quaternion()
            },
            // 右前腿
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.1, 0.7, 0.1)),
                offset: new CANNON.Vec3(-1.7, 0.75, 0.6),
                rotation: new CANNON.Quaternion()
            },
            // 左后腿
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.1, 0.7, 0.1)),
                offset: new CANNON.Vec3(1.7, 0.75, -0.6),
                rotation: new CANNON.Quaternion()
            },
            // 右后腿
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.1, 0.7, 0.1)),
                offset: new CANNON.Vec3(-1.7, 0.75, -0.6),
                rotation: new CANNON.Quaternion()
            }
        ];

        return this.createComplexShape(components, 2, { x: 0, y: 2, z: 0 }, 0xDEB887);
    }

    // ========== 4. 椅子 (6个子形状) ==========
    createChair() {
        const components = [
            // 座位
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.6, 0.08, 0.6)),
                offset: new CANNON.Vec3(0, 1, 0),
                rotation: new CANNON.Quaternion()
            },
            // 靠背
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.6, 0.8, 0.08)),
                offset: new CANNON.Vec3(0, 1.44, -0.26),
                rotation: new CANNON.Quaternion().setFromEuler(new CANNON.Vec3(Math.PI * 0.1, 0, 0))
            },
            // 左前腿
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.08, 0.5, 0.08)),
                offset: new CANNON.Vec3(0.4, 0.5, 0.4),
                rotation: new CANNON.Quaternion()
            },
            // 右前腿
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.08, 0.5, 0.08)),
                offset: new CANNON.Vec3(-0.4, 0.5, 0.4),
                rotation: new CANNON.Quaternion()
            },
            // 左后腿
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.08, 0.5, 0.08)),
                offset: new CANNON.Vec3(0.4, 0.5, -0.4),
                rotation: new CANNON.Quaternion()
            },
            // 右后腿
            {
                shape: new CANNON.Box(new CANNON.Vec3(0.08, 0.5, 0.08)),
                offset: new CANNON.Vec3(-0.4, 0.5, -0.4),
                rotation: new CANNON.Quaternion()
            }
        ];

        return this.createComplexShape(components, 1.5, { x: 0, y: 2, z: 0 }, 0xA0522D);
    }

    // ========== 5. 桥梁 (10个子形状) ==========
    createBridge() {
        const components = [];

        // 桥面（5段）
        for (let i = 0; i < 5; i++) {
            components.push({
                shape: new CANNON.Box(new CANNON.Vec3(1.5, 0.15, 1)),
                offset: new CANNON.Vec3((i - 2) * 1.5, 2, 0),
                rotation: new CANNON.Quaternion()
            });
        }

        // 左桥墩
        components.push({
            shape: new CANNON.Box(new CANNON.Vec3(0.8, 2, 1)),
            offset: new CANNON.Vec3(-4, 1, 0),
            rotation: new CANNON.Quaternion()
        });

        // 右桥墩
        components.push({
            shape: new CANNON.Box(new CANNON.Vec3(0.8, 2, 1)),
            offset: new CANNON.Vec3(4, 1, 0),
            rotation: new CANNON.Quaternion()
        });

        // 栏杆
        for (let i = 0; i < 5; i++) {
            components.push({
                shape: new CANNON.Box(new CANNON.Vec3(0.05, 0.3, 0.05)),
                offset: new CANNON.Vec3((i - 2) * 1.5, 2.22, 0.8),
                rotation: new CANNON.Quaternion()
            });
            components.push({
                shape: new CANNON.Box(new CANNON.Vec3(0.05, 0.3, 0.05)),
                offset: new CANNON.Vec3((i - 2) * 1.5, 2.22, -0.8),
                rotation: new CANNON.Quaternion()
            });
        }

        return this.createComplexShape(components, 10, { x: 0, y: 2, z: 0 }, 0x708090);
    }

    // ========== 6. 岩石 (12个子形状) ==========
    createRock() {
        const components = [];
        const numShapes = 10 + Math.floor(Math.random() * 5);

        for (let i = 0; i < numShapes; i++) {
            const shapeType = Math.random();
            let shape;

            if (shapeType < 0.6) {
                // 盒子
                shape = new CANNON.Box(new CANNON.Vec3(
                    0.2 + Math.random() * 0.4,
                    0.2 + Math.random() * 0.4,
                    0.2 + Math.random() * 0.4
                ));
            } else {
                // 球体
                shape = new CANNON.Sphere(0.2 + Math.random() * 0.3);
            }

            components.push({
                shape: shape,
                offset: new CANNON.Vec3(
                    (Math.random() - 0.5) * 1,
                    Math.random() * 1.5,
                    (Math.random() - 0.5) * 1
                ),
                rotation: new CANNON.Quaternion().setFromEuler(new CANNON.Vec3(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                ))
            });
        }

        return this.createComplexShape(components, 2 + Math.random() * 3, { x: 0, y: 5, z: 0 }, 0x808080);
    }

    // ========== 7. 分子结构 (用约束连接的球体) ==========
    createMolecule() {
        const atoms = [];
        const numAtoms = 8;
        const bondLength = 1.0;

        try {
            // 创建原子（球体）
            for (let i = 0; i < numAtoms; i++) {
                const shape = new CANNON.Sphere(0.25);
                const body = new CANNON.Body({
                    mass: 0.5,
                    shape: shape,
                    position: new CANNON.Vec3(i * bondLength, 5 + Math.sin(i) * 0.5, 0)
                });
                this.world.addBody(body);

                const geometry = new THREE.SphereGeometry(0.25, 32, 32);
                const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(body.position);
                mesh.castShadow = true;
                this.scene.add(mesh);

                this.objects.push({ body, mesh });
                atoms.push(body);
            }

            this.updateObjectCount();

            // 用距离约束连接原子
            try {
                if (typeof CANNON.DistanceConstraint !== 'undefined') {
                    for (let i = 0; i < atoms.length - 1; i++) {
                        const constraint = new CANNON.DistanceConstraint(atoms[i], atoms[i + 1], bondLength);
                        this.world.addConstraint(constraint);
                        this.constraints.push(constraint);
                    }
                } else {
                    console.warn('DistanceConstraint 不可用，原子未连接');
                }
            } catch (error) {
                console.warn('创建约束失败:', error);
            }
        } catch (error) {
            console.error('createMolecule 出错:', error);
            // 如果出错，添加一些球体
            for (let i = 0; i < 3; i++) {
                try {
                    this.addSphere();
                } catch (e) {
                    console.error('添加球体失败:', e);
                }
            }
        }
    }

    // ========== 8. 链条 (用约束连接的环) ==========
    createChain() {
        try {
            // 检查 CANNON.Compound 是否可用
            if (typeof CANNON.Compound === 'undefined') {
                console.error('CANNON.Compound 不可用，使用简单球体链代替');
                // 创建简单的球体链
                for (let i = 0; i < 12; i++) {
                    const body = this.addSphereAt(i * 0.5, 5, 0, 0.3, 0.5, 0xFFD700);
                }
                return;
            }

            const numLinks = 12;
            const linkSize = 0.5;
            const links = [];

            // 创建环节
            for (let i = 0; i < numLinks; i++) {
                const compound = new CANNON.Compound();

            // 主体
            compound.addChildShape(
                new CANNON.Box(new CANNON.Vec3(0.1, linkSize, 0.1)),
                new CANNON.Vec3(0, 0, 0)
            );

            // 连接环1
            compound.addChildShape(
                new CANNON.Box(new CANNON.Vec3(0.15, 0.15, 0.15)),
                new CANNON.Vec3(0.15, linkSize / 2, 0),
                new CANNON.Quaternion().setFromEuler(new CANNON.Vec3(0, 0, Math.PI / 2))
            );

            // 连接环2
            compound.addChildShape(
                new CANNON.Box(new CANNON.Vec3(0.15, 0.15, 0.15)),
                new CANNON.Vec3(-0.15, linkSize / 2, 0),
                new CANNON.Quaternion().setFromEuler(new CANNON.Vec3(0, 0, Math.PI / 2))
            );

            const body = new CANNON.Body({
                mass: 0.5,
                shape: compound,
                position: new CANNON.Vec3(i * 0.4, 5 + Math.random() * 2, 0)
            });
            this.world.addBody(body);

            // 可视化（简化为盒子）
            const geometry = new THREE.BoxGeometry(0.2, linkSize, 0.2);
            const material = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(body.position);
            mesh.castShadow = true;
            this.scene.add(mesh);

            this.objects.push({ body, mesh });
            links.push(body);
        }

        // 用铰链连接环节
        for (let i = 0; i < links.length - 1; i++) {
            const constraint = new CANNON.HingeConstraint(
                links[i],
                links[i + 1],
                {
                    pivotA: new CANNON.Vec3(0.2, linkSize / 2, 0),
                    axisA: new CANNON.Vec3(0, 0, 1),
                    pivotB: new CANNON.Vec3(-0.2, linkSize / 2, 0),
                    axisB: new CANNON.Vec3(0, 0, 1)
                }
            );
            this.world.addConstraint(constraint);
            this.constraints.push(constraint);
        }

        this.updateObjectCount();
        } catch (error) {
            console.error('createChain 出错:', error);
            // 如果出错，添加一些球体作为替代
            for (let i = 0; i < 5; i++) {
                this.addSphereAt(i * 0.5, 5, 0, 0.3, 0.5, 0xFFD700);
            }
        }
    }

    // ========== 3种新约束演示 ==========

    // LockConstraint (固定约束) - 两个刚体完全固定在一起
    createLockConstraintDemo() {
        // 创建两个盒子
        const box1 = this.addBoxAt(0, 5, 0, 2, 2, 2, 1, 0xff0000);
        const box2 = this.addBoxAt(2.5, 5, 0, 2, 2, 2, 1, 0x0000ff);

        // 使用固定约束连接两个盒子
        const constraint = new CANNON.LockConstraint(box1, box2);
        this.world.addConstraint(constraint);
        this.constraints.push(constraint);

        console.log('✅ LockConstraint 演示: 两个盒子固定在一起');
    }

    // DistanceConstraint (距离约束) - 保持两个刚体之间的固定距离
    createDistanceConstraintDemo() {
        const ballCount = 10;
        const spacing = 2;
        const startX = -10;

        let prevBody = null;

        for (let i = 0; i < ballCount; i++) {
            const body = this.addSphereAt(
                startX + i * spacing,
                8,
                0,
                0.8,
                1,
                `hsl(${i * 36}, 70%, 50%)`
            );

            if (prevBody) {
                // 创建距离约束，保持两个球之间的距离为 spacing
                const constraint = new CANNON.DistanceConstraint(
                    prevBody,
                    body,
                    spacing  // 距离
                );
                this.world.addConstraint(constraint);
                this.constraints.push(constraint);
            }

            prevBody = body;
        }

        console.log(`✅ DistanceConstraint 演示: ${ballCount} 个球用距离约束连接`);
    }

    // ConeTwistConstraint (圆锥扭转约束) - 类似球关节，但有旋转限制
    createConeTwistConstraintDemo() {
        // 创建一个类似摄像机云台的装置
        const base = this.addBoxAt(0, 0, 0, 2, 0.5, 2, 0, 0x333333);  // 底座
        const arm = this.addBoxAt(0, 2, 0, 0.5, 2, 0.5, 1, 0xff6600);  // 手臂

        // 圆锥扭转约束
        const constraint = new CANNON.ConeTwistConstraint(
            base,
            arm,
            {
                pivotA: new CANNON.Vec3(0, 0.5, 0),  // 底座的连接点
                pivotB: new CANNON.Vec3(0, -1, 0),   // 手臂的连接点
                axisA: new CANNON.Vec3(0, 1, 0),     // 底座的上方向
                axisB: new CANNON.Vec3(0, 1, 0),     // 手臂的上方向
                angle: Math.PI / 4,                   // 圆锥角度限制
                twistAngle: Math.PI / 2               // 扭转角度限制
            }
        );
        this.world.addConstraint(constraint);
        this.constraints.push(constraint);

        console.log('✅ ConeTwistConstraint 演示: 摄像机云台式约束');
    }

    // ========== 辅助方法：在指定位置添加盒子 ==========
    addBoxAt(x, y, z, w, h, d, mass, color) {
        const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2));
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: new CANNON.Vec3(x, y, z)
        });
        this.world.addBody(body);

        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        this.scene.add(mesh);

        this.objects.push({ body, mesh });
        this.updateObjectCount();

        return body;
    }

    // 辅助方法：在指定位置添加球体
    addSphereAt(x, y, z, radius, mass, color) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: new CANNON.Vec3(x, y, z)
        });
        this.world.addBody(body);

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        this.scene.add(mesh);

        this.objects.push({ body, mesh });
        this.updateObjectCount();

        return body;
    }

    // ========== 3个演示场景 ==========

    // 场景1: 机器人协作 - 3个机器人手臂组成协作系统
    createRobotCollaborationScene() {
        console.log('🤖 创建机器人协作场景...');

        // 创建3个机器人手臂，排列成三角形
        const positions = [
            { x: 0, z: 0 },
            { x: -5, z: 3 },
            { x: 5, z: 3 }
        ];

        const robotBodies = [];

        positions.forEach((pos, index) => {
            // 使用铰链约束创建一个类似机器人手臂的装置
            const base = this.addBoxAt(pos.x, 0, pos.z, 1.5, 1, 1.5, 0, 0x444444);
            const arm1 = this.addBoxAt(pos.x, 2, pos.z, 0.4, 2, 0.4, 1, `hsl(${index * 120}, 70%, 50%)`);
            const arm2 = this.addBoxAt(pos.x, 4.2, pos.z, 0.3, 1.5, 0.3, 0.5, `hsl(${index * 120}, 70%, 50%)`);

            // 铰链约束连接基座和第一段手臂
            const hinge1 = new CANNON.HingeConstraint(
                base,
                arm1,
                {
                    pivotA: new CANNON.Vec3(0, 0.5, 0),
                    axisA: new CANNON.Vec3(0, 0, 1),
                    pivotB: new CANNON.Vec3(0, -1, 0),
                    axisB: new CANNON.Vec3(0, 0, 1)
                }
            );
            this.world.addConstraint(hinge1);
            this.constraints.push(hinge1);

            // 铰链约束连接两段手臂
            const hinge2 = new CANNON.HingeConstraint(
                arm1,
                arm2,
                {
                    pivotA: new CANNON.Vec3(0, 1, 0),
                    axisA: new CANNON.Vec3(0, 0, 1),
                    pivotB: new CANNON.Vec3(0, -0.75, 0),
                    axisB: new CANNON.Vec3(0, 0, 1)
                }
            );
            this.world.addConstraint(hinge2);
            this.constraints.push(hinge2);

            robotBodies.push(arm1, arm2);
        });

        // 在中心添加一些可被抓取的物体
        for (let i = 0; i < 5; i++) {
            this.addSphereAt(
                Math.random() * 4 - 2,
                6 + i * 0.5,
                Math.random() * 4 - 2,
                0.5,
                0.3,
                0xffff00
            );
        }

        console.log('✅ 机器人协作场景已创建');
    }

    // 场景2: 分子碰撞 - 两个大分子结构碰撞
    createMoleculeCollisionScene() {
        console.log('⚛️ 创建分子碰撞场景...');

        // 创建第一个大分子 (左侧)
        const molecule1Center = { x: -5, y: 5, z: 0 };
        const mol1Atoms = [];

        // 中心原子
        mol1Atoms.push(this.addSphereAt(molecule1Center.x, molecule1Center.y, molecule1Center.z, 1, 1, 0xff0000));

        // 周围原子
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 1.8;
            const x = molecule1Center.x + Math.cos(angle) * radius;
            const y = molecule1Center.y + Math.sin(angle) * radius;
            const z = molecule1Center.z;

            const atom = this.addSphereAt(x, y, z, 0.6, 0.5, 0x00ff00);
            mol1Atoms.push(atom);

            // 用距离约束连接到中心
            const constraint = new CANNON.DistanceConstraint(
                mol1Atoms[0],
                atom,
                radius
            );
            this.world.addConstraint(constraint);
            this.constraints.push(constraint);
        }

        // 创建第二个大分子 (右侧)
        const molecule2Center = { x: 5, y: 5, z: 0 };
        const mol2Atoms = [];

        // 中心原子
        mol2Atoms.push(this.addSphereAt(molecule2Center.x, molecule2Center.y, molecule2Center.z, 1, 1, 0x0000ff));

        // 周围原子
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 1.8;
            const x = molecule2Center.x + Math.cos(angle) * radius;
            const y = molecule2Center.y + Math.sin(angle) * radius;
            const z = molecule2Center.z;

            const atom = this.addSphereAt(x, y, z, 0.6, 0.5, 0x00ffff);
            mol2Atoms.push(atom);

            // 用距离约束连接到中心
            const constraint = new CANNON.DistanceConstraint(
                mol2Atoms[0],
                atom,
                radius
            );
            this.world.addConstraint(constraint);
            this.constraints.push(constraint);
        }

        // 给两个分子初始速度，让它们相向运动
        mol1Atoms[0].velocity.set(3, 0, 0);
        mol2Atoms[0].velocity.set(-3, 0, 0);

        console.log('✅ 分子碰撞场景已创建');
    }

    // 场景3: 建筑倒塌 - 桥梁结构倒塌
    createBuildingCollapseScene() {
        console.log('🏗️ 创建建筑倒塌场景...');

        // 创建一个桥梁结构
        const bridgeLength = 8;
        const plankWidth = 1.5;
        const plankHeight = 0.2;
        const startX = -bridgeLength / 2 * plankWidth;

        const bridgePlanks = [];

        // 创建桥面
        for (let i = 0; i < bridgeLength; i++) {
            const x = startX + i * plankWidth;
            const plank = this.addBoxAt(
                x,
                5,
                0,
                plankWidth - 0.1,
                plankHeight,
                2,
                0.5,
                0x8B4513
            );
            bridgePlanks.push(plank);
        }

        // 用铰链约束连接桥板
        for (let i = 0; i < bridgePlanks.length - 1; i++) {
            const constraint = new CANNON.HingeConstraint(
                bridgePlanks[i],
                bridgePlanks[i + 1],
                {
                    pivotA: new CANNON.Vec3(plankWidth / 2 - 0.05, 0, 0),
                    axisA: new CANNON.Vec3(0, 0, 1),
                    pivotB: new CANNON.Vec3(-plankWidth / 2 + 0.05, 0, 0),
                    axisB: new CANNON.Vec3(0, 0, 1)
                }
            );
            this.world.addConstraint(constraint);
            this.constraints.push(constraint);
        }

        // 添加两个桥墩
        const pillar1 = this.addBoxAt(startX - 1, 2.5, 0, 1, 5, 2, 0, 0x808080);
        const pillar2 = this.addBoxAt(startX + bridgeLength * plankWidth, 2.5, 0, 1, 5, 2, 0, 0x808080);

        // 在桥上添加一些重物
        setTimeout(() => {
            console.log('⚠️ 添加重物...');
            for (let i = 0; i < 3; i++) {
                this.addBoxAt(
                    startX + bridgeLength / 2 * plankWidth + (i - 1) * 0.8,
                    8,
                    0,
                    1,
                    1,
                    1,
                    2,
                    0xff0000
                );
            }
        }, 1000);

        // 2秒后移除中间的支撑，触发倒塌
        setTimeout(() => {
            console.log('💥 移除中间支撑...');
            // 移除中间的铰链约束
            const middleConstraintIndex = Math.floor(this.constraints.length / 2);
            if (this.constraints[middleConstraintIndex]) {
                this.world.removeConstraint(this.constraints[middleConstraintIndex]);
                this.constraints.splice(middleConstraintIndex, 1);
            }
        }, 3000);

        console.log('✅ 建筑倒塌场景已创建 - 3秒后开始倒塌');
    }

    // ========== 更新物体数量显示 ==========
    updateObjectCount() {
        document.getElementById('object-count').textContent = this.objects.length;
    }

    // ========== 设置事件监听 ==========
    setupEventListeners() {
        // 窗口大小改变
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 鼠标事件
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    // ========== 鼠标按下 ==========
    onMouseDown(event) {
        if (event.button !== 0) return; // 只处理左键

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 获取所有网格
        const meshes = this.objects.map(obj => obj.mesh);
        const intersects = this.raycaster.intersectObjects(meshes, true);

        if (intersects.length > 0) {
            this.isDragging = true;
            this.controls.enabled = false; // 禁用轨道控制器

            // 找到对应的物理刚体
            let mesh = intersects[0].object;
            while (mesh.parent && !this.objects.find(obj => obj.mesh === mesh)) {
                mesh = mesh.parent;
            }

            const obj = this.objects.find(obj => obj.mesh === mesh);
            if (obj) {
                // 创建点对点约束实现拖拽
                const pivot = new CANNON.Vec3(
                    intersects[0].point.x,
                    intersects[0].point.y,
                    intersects[0].point.z
                );

                this.mouseConstraint = new CANNON.PointToPointConstraint(
                    obj.body,
                    obj.body.pointToLocalFrame(pivot),
                    new CANNON.Body({ mass: 0 }),
                    pivot
                );
                this.world.addConstraint(this.mouseConstraint);
            }
        }
    }

    // ========== 鼠标移动 ==========
    onMouseMove(event) {
        if (!this.isDragging || !this.mouseConstraint) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 在 y=5 平面上找到交点
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const target = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, target);

        if (target) {
            this.mouseConstraint.pivotB.set(target.x, target.y, target.z);
        }
    }

    // ========== 鼠标松开 ==========
    onMouseUp(event) {
        if (event.button !== 0) return;

        this.isDragging = false;
        this.controls.enabled = true; // 重新启用轨道控制器

        if (this.mouseConstraint) {
            this.world.removeConstraint(this.mouseConstraint);
            this.mouseConstraint = null;
        }
    }

    // ========== 动画循环 ==========
    animate() {
        requestAnimationFrame(() => this.animate());

        // 更新 FPS
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            document.getElementById('fps').textContent = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        // 步进物理模拟
        this.world.step(1 / 60);

        // 同步物理到视觉
        for (const obj of this.objects) {
            obj.mesh.position.copy(obj.body.position);
            obj.mesh.quaternion.copy(obj.body.quaternion);
        }

        // 更新控制器
        this.controls.update();

        // 渲染
        this.renderer.render(this.scene, this.camera);
    }
}

// 启动应用
const app = new PhysicsApp();
window.app = app; // 暴露给全局以便 HTML 按钮调用
