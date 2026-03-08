import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class PhysicsEditor {
    constructor() {
        // 模式: 'editing' 或 'running'
        this.mode = 'editing';

        // Three.js 核心对象
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Cannon-es 物理世界
        this.world = null;

        // 刚体数据
        this.bodies = []; // { id, body, mesh, config, initialTransform }
        this.constraints = []; // { id, constraint, config }

        // 地面
        this.groundBody = null;
        this.groundMesh = null;

        // 复合体编辑器
        this.compoundShapes = []; // 正在编辑的复合体形状
        this.compoundPreviewGroup = null; // 预览用的Three.js Group

        // 选择状态
        this.selectedBodyId = null;
        this.selectedBodiesForConstraint = []; // 用于创建约束

        // 计数器
        this.bodyCounter = 0;
        this.constraintCounter = 0;
        this.deletedBodiesCount = 0; // 被删除的物体计数

        // FPS 计算
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;

        // 边界设置
        this.boundaryEnabled = false;
        this.boundaryRadius = 15; // 球形边界半径
        this.boundaryHelper = null;

        // 初始化
        this.init();
        this.setupUI();
        this.animate();
    }

    init() {
        this.initThree();
        this.initCannon();
        this.setupLights();
        this.setupGround();
        this.setupEventListeners();
    }

    // ========== Three.js 初始化 ==========
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // 网格辅助
        const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // 坐标系辅助 (RGB箭头)
        // X轴 = 红色, Y轴 = 绿色, Z轴 = 蓝色
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(15, 15, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    // ========== Cannon-es 初始化 ==========
    initCannon() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 20;
        this.world.allowSleep = true;
    }

    // ========== 设置光源 ==========
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    // ========== 设置地面 ==========
    setupGround() {
        // Cannon.js 地面
        const groundShape = new CANNON.Plane();
        this.groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape
        });
        this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(this.groundBody);

        // Three.js 地面
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            depthWrite: false
        });
        this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);
    }

    // ========== 设置事件监听 ==========
    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));
        this.renderer.domElement.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ========== 添加刚体 ==========
    addBox() {
        const id = ++this.bodyCounter;
        const config = {
            id,
            type: 'box',
            name: `盒子 ${id}`,
            position: { x: (Math.random() - 0.5) * 6, y: 5, z: (Math.random() - 0.5) * 6 },
            size: { x: 1, y: 1, z: 1 },
            mass: 1,
            friction: 0.3,
            restitution: 0.3,
            color: Math.random() * 0xffffff,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };

        this.createBody(config);
    }

    addSphere() {
        const id = ++this.bodyCounter;
        const config = {
            id,
            type: 'sphere',
            name: `球体 ${id}`,
            position: { x: (Math.random() - 0.5) * 6, y: 5, z: (Math.random() - 0.5) * 6 },
            radius: 0.5,
            mass: 1,
            friction: 0.3,
            restitution: 0.5,
            color: Math.random() * 0xffffff,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };

        this.createBody(config);
    }

    addCylinder() {
        const id = ++this.bodyCounter;
        const config = {
            id,
            type: 'cylinder',
            name: `圆柱 ${id}`,
            position: { x: (Math.random() - 0.5) * 6, y: 5, z: (Math.random() - 0.5) * 6 },
            radius: 0.5,
            height: 1,
            mass: 1,
            friction: 0.3,
            restitution: 0.3,
            color: Math.random() * 0xffffff,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };

        this.createBody(config);
    }

    addCompound() {
        // 这个方法现在用于快速创建默认复合体
        const id = ++this.bodyCounter;
        const config = {
            id,
            type: 'compound',
            name: `复合体 ${id}`,
            position: { x: (Math.random() - 0.5) * 6, y: 5, z: (Math.random() - 0.5) * 6 },
            shapes: [
                { type: 'box', offset: { x: 0, y: 0, z: 0 }, size: { x: 1, y: 0.5, z: 1 } },
                { type: 'sphere', offset: { x: 0, y: 0.5, z: 0 }, radius: 0.3 }
            ],
            mass: 2,
            friction: 0.3,
            restitution: 0.3,
            color: Math.random() * 0xffffff,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };

        this.createBody(config);
    }

    // ========== 复合体编辑器 ==========

    startCompoundEditor() {
        // 清空之前的编辑数据
        this.compoundShapes = [];

        // 隐藏预览组
        if (this.compoundPreviewGroup) {
            this.scene.remove(this.compoundPreviewGroup);
            this.compoundPreviewGroup = null;
        }

        // 创建新的预览组
        this.compoundPreviewGroup = new THREE.Group();
        this.compoundPreviewGroup.position.set(0, 5, 0);
        this.scene.add(this.compoundPreviewGroup);

        // 显示编辑器UI
        document.getElementById('compound-editor').style.display = 'block';
        this.updateCompoundShapesList();
        this.updateCompoundDebug();
    }

    cancelCompoundEditor() {
        // 清空编辑数据
        this.compoundShapes = [];

        // 移除预览
        if (this.compoundPreviewGroup) {
            this.scene.remove(this.compoundPreviewGroup);
            this.compoundPreviewGroup = null;
        }

        // 隐藏编辑器UI
        document.getElementById('compound-editor').style.display = 'none';
    }

    addShapeToCompound(type) {
        const id = Date.now();
        let shape;

        switch (type) {
            case 'box':
                shape = {
                    id,
                    type: 'box',
                    offset: { x: 0, y: 0, z: 0 },
                    size: { x: 1, y: 1, z: 1 }
                };
                break;
            case 'sphere':
                shape = {
                    id,
                    type: 'sphere',
                    offset: { x: 0, y: 0, z: 0 },
                    radius: 0.5
                };
                break;
            case 'cylinder':
                shape = {
                    id,
                    type: 'cylinder',
                    offset: { x: 0, y: 0, z: 0 },
                    radius: 0.5,
                    height: 1
                };
                break;
        }

        this.compoundShapes.push(shape);
        this.updateCompoundShapesList();
        this.updateCompoundPreview();
        this.updateCompoundDebug();
    }

    updateCompoundDebug() {
        const debugDiv = document.getElementById('compound-debug');
        if (debugDiv) {
            const types = this.compoundShapes.map(s => s.type);
            debugDiv.innerHTML = `形状数量: ${this.compoundShapes.length}<br>类型: ${types.join(', ')}`;
        }
    }

    removeShapeFromCompound(id) {
        this.compoundShapes = this.compoundShapes.filter(s => s.id !== id);
        this.updateCompoundShapesList();
        this.updateCompoundPreview();
        this.updateCompoundDebug();
    }

    updateCompoundShapeParam(id, param, value) {
        const shape = this.compoundShapes.find(s => s.id === id);
        if (shape) {
            if (param === 'offset') {
                const axis = value.axis;
                shape.offset[axis] = parseFloat(value.value);
            } else if (param === 'size') {
                const axis = value.axis;
                shape.size[axis] = parseFloat(value.value);
            } else {
                shape[param] = parseFloat(value);
            }
            this.updateCompoundPreview();
        }
    }

    updateCompoundShapesList() {
        const container = document.getElementById('compound-shapes-list');

        if (this.compoundShapes.length === 0) {
            container.innerHTML = `
                <div style="color: #666; font-size: 12px; text-align: center; padding: 20px;">
                    暂无形状<br>点击上方按钮添加
                </div>
            `;
            return;
        }

        container.innerHTML = this.compoundShapes.map((shape, index) => {
            const typeName = { box: '📦 盒子', sphere: '🔮 球体', cylinder: '🥫 圆柱' }[shape.type];

            let paramsHTML = '';

            if (shape.type === 'box') {
                paramsHTML = `
                    <div style="font-size: 11px; color: #888; margin-top: 5px;">
                        尺寸:
                        <input type="number" step="0.1" value="${shape.size.x}" style="width: 50px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'size', {axis: 'x', value: this.value})">
                        <input type="number" step="0.1" value="${shape.size.y}" style="width: 50px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'size', {axis: 'y', value: this.value})">
                        <input type="number" step="0.1" value="${shape.size.z}" style="width: 50px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'size', {axis: 'z', value: this.value})">
                    </div>
                `;
            } else if (shape.type === 'sphere') {
                paramsHTML = `
                    <div style="font-size: 11px; color: #888; margin-top: 5px;">
                        半径:
                        <input type="number" step="0.1" value="${shape.radius}" style="width: 60px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'radius', this.value)">
                    </div>
                `;
            } else if (shape.type === 'cylinder') {
                paramsHTML = `
                    <div style="font-size: 11px; color: #888; margin-top: 5px;">
                        半径: <input type="number" step="0.1" value="${shape.radius}" style="width: 50px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'radius', this.value})">
                        高度: <input type="number" step="0.1" value="${shape.height}" style="width: 50px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'height', this.value})">
                    </div>
                `;
            }

            return `
                <div style="background: #222; padding: 8px; border-radius: 4px; margin-bottom: 6px; border: 1px solid #333;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-size: 12px; font-weight: bold; color: #0af;">${typeName} #${index + 1}</span>
                        <span style="color: #f44; cursor: pointer; font-size: 18px;" onclick="editor.removeShapeFromCompound(${shape.id})">×</span>
                    </div>
                    <div style="font-size: 11px; color: #888;">
                        偏移:
                        <input type="number" step="0.5" value="${shape.offset.x}" style="width: 50px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'offset', {axis: 'x', value: this.value})">
                        <input type="number" step="0.5" value="${shape.offset.y}" style="width: 50px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'offset', {axis: 'y', value: this.value})">
                        <input type="number" step="0.5" value="${shape.offset.z}" style="width: 50px; padding: 3px; background: #333; border: 1px solid #555; color: white; font-size: 11px;"
                            onchange="editor.updateCompoundShapeParam(${shape.id}, 'offset', {axis: 'z', value: this.value})">
                    </div>
                    ${paramsHTML}
                </div>
            `;
        }).join('');
    }

    updateCompoundPreview() {
        if (!this.compoundPreviewGroup) return;

        // 清空预览组
        while (this.compoundPreviewGroup.children.length > 0) {
            this.compoundPreviewGroup.remove(this.compoundPreviewGroup.children[0]);
        }

        // 为每个形状创建预览mesh
        const color = 0x00aaff;
        this.compoundShapes.forEach(shape => {
            let mesh;
            const material = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.6
            });

            if (shape.type === 'box') {
                const geometry = new THREE.BoxGeometry(shape.size.x, shape.size.y, shape.size.z);
                mesh = new THREE.Mesh(geometry, material);
            } else if (shape.type === 'sphere') {
                const geometry = new THREE.SphereGeometry(shape.radius, 16, 16);
                mesh = new THREE.Mesh(geometry, material);
            } else if (shape.type === 'cylinder') {
                const geometry = new THREE.CylinderGeometry(shape.radius, shape.radius, shape.height, 16);
                mesh = new THREE.Mesh(geometry, material);
            }

            mesh.position.set(shape.offset.x, shape.offset.y, shape.offset.z);
            this.compoundPreviewGroup.add(mesh);
        });
    }

    createCompound() {
        console.log('开始创建复合体...');
        console.log('当前形状数量:', this.compoundShapes.length);

        if (this.compoundShapes.length === 0) {
            alert('请至少添加一个形状！');
            return;
        }

        const id = ++this.bodyCounter;
        const mass = parseFloat(document.getElementById('compound-mass').value) || 2;

        const config = {
            id,
            type: 'compound',
            name: `复合体 ${id}`,
            position: { x: 0, y: 5, z: 0 },
            shapes: [...this.compoundShapes],
            mass,
            friction: 0.3,
            restitution: 0.3,
            color: Math.random() * 0xffffff,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };

        console.log('复合体配置:', config);

        try {
            this.createBody(config);
            console.log('复合体创建成功！');
        } catch (error) {
            console.error('创建复合体时出错:', error);
            alert('创建复合体失败: ' + error.message);
            return;
        }

        // 关闭编辑器
        this.cancelCompoundEditor();
    }

    createBody(config) {
        console.log(`createBody: 创建刚体类型=${config.type}, id=${config.id}`);
        let body, mesh;

        switch (config.type) {
            case 'box':
                body = this.createBoxBody(config);
                mesh = this.createBoxMesh(config);
                break;
            case 'sphere':
                body = this.createSphereBody(config);
                mesh = this.createSphereMesh(config);
                break;
            case 'cylinder':
                body = this.createCylinderBody(config);
                mesh = this.createCylinderMesh(config);
                break;
            case 'compound':
                body = this.createCompoundBody(config);
                mesh = this.createCompoundMesh(config);
                break;
            default:
                console.error('未知的刚体类型:', config.type);
                return;
        }

        if (!body || !mesh) {
            console.error('创建刚体或网格失败');
            return;
        }

        // 应用初始速度
        if (config.velocity) {
            body.velocity.set(config.velocity.x, config.velocity.y, config.velocity.z);
        }
        if (config.angularVelocity) {
            body.angularVelocity.set(config.angularVelocity.x, config.angularVelocity.y, config.angularVelocity.z);
        }

        // 保存初始变换和速度
        const initialTransform = {
            position: body.position.clone(),
            quaternion: body.quaternion.clone(),
            velocity: config.velocity ? { ...config.velocity } : { x: 0, y: 0, z: 0 },
            angularVelocity: config.angularVelocity ? { ...config.angularVelocity } : { x: 0, y: 0, z: 0 }
        };

        this.bodies.push({ id: config.id, body, mesh, config, initialTransform });
        this.world.addBody(body);
        this.scene.add(mesh);

        console.log(`刚体创建成功，当前刚体总数: ${this.bodies.length}`);

        this.updateBodyList();
        this.updateStats();
        this.selectBody(config.id);
    }

    createBoxBody(config) {
        const shape = new CANNON.Box(new CANNON.Vec3(config.size.x / 2, config.size.y / 2, config.size.z / 2));
        const body = new CANNON.Body({
            mass: config.mass,
            shape: shape,
            position: new CANNON.Vec3(config.position.x, config.position.y, config.position.z),
            material: new CANNON.Material({ friction: config.friction, restitution: config.restitution })
        });
        return body;
    }

    createBoxMesh(config) {
        const geometry = new THREE.BoxGeometry(config.size.x, config.size.y, config.size.z);
        const material = new THREE.MeshPhongMaterial({ color: config.color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(config.position.x, config.position.y, config.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    createSphereBody(config) {
        const shape = new CANNON.Sphere(config.radius);
        const body = new CANNON.Body({
            mass: config.mass,
            shape: shape,
            position: new CANNON.Vec3(config.position.x, config.position.y, config.position.z),
            material: new CANNON.Material({ friction: config.friction, restitution: config.restitution })
        });
        return body;
    }

    createSphereMesh(config) {
        const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: config.color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(config.position.x, config.position.y, config.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    createCylinderBody(config) {
        const shape = new CANNON.Cylinder(config.radius, config.radius, config.height, 16);
        const body = new CANNON.Body({
            mass: config.mass,
            shape: shape,
            position: new CANNON.Vec3(config.position.x, config.position.y, config.position.z),
            material: new CANNON.Material({ friction: config.friction, restitution: config.restitution })
        });
        return body;
    }

    createCylinderMesh(config) {
        const geometry = new THREE.CylinderGeometry(config.radius, config.radius, config.height, 16);
        const material = new THREE.MeshPhongMaterial({ color: config.color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(config.position.x, config.position.y, config.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    createCompoundBody(config) {
        // cannon-es 中创建复合体的方法：创建空Body，然后添加多个形状
        const body = new CANNON.Body({
            mass: config.mass,
            position: new CANNON.Vec3(config.position.x, config.position.y, config.position.z),
            material: new CANNON.Material({ friction: config.friction, restitution: config.restitution })
        });

        // 添加每个形状到刚体
        config.shapes.forEach(shapeConfig => {
            let shape;
            if (shapeConfig.type === 'box') {
                shape = new CANNON.Box(new CANNON.Vec3(shapeConfig.size.x / 2, shapeConfig.size.y / 2, shapeConfig.size.z / 2));
            } else if (shapeConfig.type === 'sphere') {
                shape = new CANNON.Sphere(shapeConfig.radius);
            } else if (shapeConfig.type === 'cylinder') {
                shape = new CANNON.Cylinder(shapeConfig.radius, shapeConfig.radius, shapeConfig.height, 16);
            }

            // 使用 addShape 方法，而不是 addChildShape
            body.addShape(
                shape,
                new CANNON.Vec3(shapeConfig.offset.x, shapeConfig.offset.y, shapeConfig.offset.z)
            );
        });

        return body;
    }

    createCompoundMesh(config) {
        const group = new THREE.Group();
        config.shapes.forEach(shapeConfig => {
            let mesh;
            if (shapeConfig.type === 'box') {
                const geometry = new THREE.BoxGeometry(shapeConfig.size.x, shapeConfig.size.y, shapeConfig.size.z);
                const material = new THREE.MeshPhongMaterial({ color: config.color });
                mesh = new THREE.Mesh(geometry, material);
            } else if (shapeConfig.type === 'sphere') {
                const geometry = new THREE.SphereGeometry(shapeConfig.radius, 32, 32);
                const material = new THREE.MeshPhongMaterial({ color: config.color });
                mesh = new THREE.Mesh(geometry, material);
            } else if (shapeConfig.type === 'cylinder') {
                const geometry = new THREE.CylinderGeometry(shapeConfig.radius, shapeConfig.radius, shapeConfig.height, 16);
                const material = new THREE.MeshPhongMaterial({ color: config.color });
                mesh = new THREE.Mesh(geometry, material);
            }
            mesh.position.set(shapeConfig.offset.x, shapeConfig.offset.y, shapeConfig.offset.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        });
        group.position.set(config.position.x, config.position.y, config.position.z);
        return group;
    }

    // ========== 选择刚体 ==========
    selectBody(id) {
        this.selectedBodyId = id;
        this.updateBodyList();
        this.updateParamsPanel();
    }

    // ========== 删除刚体 ==========
    deleteBody(id) {
        const index = this.bodies.findIndex(b => b.id === id);
        if (index !== -1) {
            const { body, mesh } = this.bodies[index];
            this.world.removeBody(body);
            this.scene.remove(mesh);
            this.bodies.splice(index, 1);

            // 删除相关约束
            this.constraints = this.constraints.filter(c => {
                if (c.config.bodyA === id || c.config.bodyB === id) {
                    this.world.removeConstraint(c.constraint);
                    return false;
                }
                return true;
            });

            if (this.selectedBodyId === id) {
                this.selectedBodyId = null;
            }

            this.updateBodyList();
            this.updateConstraintList();
            this.updateParamsPanel();
            this.updateStats();
        }
    }

    // ========== 清空场景 ==========
    clearScene() {
        // 从物理世界中移除所有约束
        this.constraints.forEach(c => {
            this.world.removeConstraint(c.constraint);
        });

        // 删除所有刚体
        [...this.bodies].forEach(b => this.deleteBody(b.id));
        this.bodies = [];
        this.constraints = [];
        this.selectedBodyId = null;
        this.selectedBodiesForConstraint = [];
        this.bodyCounter = 0;
        this.constraintCounter = 0;
        this.updateBodyList();
        this.updateConstraintList();
        this.updateParamsPanel();
        this.updateStats();
    }

    // ========== 约束管理 ==========
    onCanvasClick(event) {
        if (this.mode !== 'editing') return;

        try {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);

            const meshes = this.bodies.map(b => b.mesh);
            const intersects = raycaster.intersectObjects(meshes, true);

            if (intersects.length > 0) {
                // 找到对应的刚体
                let clickedMesh = intersects[0].object;
                while (clickedMesh.parent && !this.bodies.find(b => b.mesh === clickedMesh)) {
                    clickedMesh = clickedMesh.parent;
                }

                const bodyData = this.bodies.find(b => b.mesh === clickedMesh);
                if (bodyData) {
                    // 检测 Ctrl (Windows/Linux) 或 Command (Mac)
                    const isModifierKey = event.ctrlKey || event.metaKey;

                    if (isModifierKey) {
                        // Ctrl/Command+点击：选择用于创建约束
                        event.preventDefault();
                        event.stopPropagation();
                        this.handleConstraintSelection(bodyData.id);
                    } else {
                        // 普通点击：选择刚体
                        this.selectBody(bodyData.id);
                    }
                }
            }
        } catch (error) {
            console.error('点击事件处理错误:', error);
        }
    }

    handleConstraintSelection(id) {
        console.log('选择刚体用于约束:', id);

        if (this.selectedBodiesForConstraint.includes(id)) {
            // 取消选择
            this.selectedBodiesForConstraint = this.selectedBodiesForConstraint.filter(bid => bid !== id);
            console.log('取消选择，当前已选择:', this.selectedBodiesForConstraint);
        } else if (this.selectedBodiesForConstraint.length < 2) {
            // 选择刚体（最多2个）
            this.selectedBodiesForConstraint.push(id);
            console.log('添加选择，当前已选择:', this.selectedBodiesForConstraint);
        } else {
            // 已经选择了2个，替换第一个
            this.selectedBodiesForConstraint.shift();
            this.selectedBodiesForConstraint.push(id);
            console.log('替换选择，当前已选择:', this.selectedBodiesForConstraint);
        }

        this.updateConstraintSelectionUI();
    }

    updateConstraintSelectionUI() {
        // 更新已选择的刚体显示
        const display = document.getElementById('selected-bodies-display');
        const btn = document.getElementById('btn-create-constraint');

        if (this.selectedBodiesForConstraint.length === 0) {
            display.innerHTML = '<span style="color: #666; font-size: 12px;">未选择</span>';
            btn.disabled = true;
        } else {
            display.innerHTML = this.selectedBodiesForConstraint.map(id => {
                const body = this.bodies.find(b => b.id === id);
                const name = body ? body.config.name : `刚体${id}`;
                return `<span style="background: #0af; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">${name}</span>`;
            }).join('');

            btn.disabled = this.selectedBodiesForConstraint.length !== 2;
        }

        // 更新提示信息
        this.updateConstraintHint();
    }

    updateConstraintHint() {
        const hint = document.getElementById('constraint-hint');
        if (this.selectedBodiesForConstraint.length === 0) {
            hint.innerHTML = '💡 <strong>Mac: 按住 ⌘ Command</strong> / <strong>Windows: 按住 Ctrl</strong> 点击两个刚体';
        } else if (this.selectedBodiesForConstraint.length === 1) {
            hint.innerHTML = '💡 再按住 <strong>⌘/Ctrl</strong> 点击一个刚体';
        } else {
            hint.textContent = '✅ 已选择2个刚体，点击"创建约束"按钮';
        }
    }

    createConstraintFromUI() {
        if (this.selectedBodiesForConstraint.length === 2) {
            this.createConstraint(this.selectedBodiesForConstraint[0], this.selectedBodiesForConstraint[1]);
            this.selectedBodiesForConstraint = [];
            this.updateConstraintSelectionUI();
        }
    }

    createConstraint(bodyAId, bodyBId) {
        const bodyA = this.bodies.find(b => b.id === bodyAId).body;
        const bodyB = this.bodies.find(b => b.id === bodyBId).body;
        const type = document.getElementById('constraint-type').value;
        const id = ++this.constraintCounter;

        // 计算两个刚体之间的距离和方向
        const distance = bodyA.position.distanceTo(bodyB.position);
        const direction = new CANNON.Vec3();
        bodyB.position.vsub(bodyA.position, direction);
        direction.normalize();

        let constraint;
        const config = {
            id,
            type,
            bodyA: bodyAId,
            bodyB: bodyBId,
            name: `${type}-${id}`
        };

        switch (type) {
            case 'hinge':
                // 铰链约束：像门一样，两个刚体共享一个旋转轴
                // 根据实际距离计算连接点
                const halfDistHinge = distance / 2;
                const pivotA_Hinge = direction.clone();
                pivotA_Hinge.scale(halfDistHinge, pivotA_Hinge);

                const pivotB_Hinge = direction.clone();
                pivotB_Hinge.scale(-halfDistHinge, pivotB_Hinge);

                constraint = new CANNON.HingeConstraint(bodyA, bodyB, {
                    pivotA: pivotA_Hinge,
                    axisA: new CANNON.Vec3(0, 1, 0),    // Y轴为旋转轴（垂直向上）
                    pivotB: pivotB_Hinge,
                    axisB: new CANNON.Vec3(0, 1, 0)     // Y轴为旋转轴
                });
                break;
            case 'pointToPoint':
                // 点对点约束：像用绳子系住
                // 根据实际距离计算连接点
                const halfDistPoint = distance / 2;
                const pivotA_Point = direction.clone();
                pivotA_Point.scale(halfDistPoint, pivotA_Point);

                const pivotB_Point = direction.clone();
                pivotB_Point.scale(-halfDistPoint, pivotB_Point);

                constraint = new CANNON.PointToPointConstraint(
                    bodyA,
                    pivotA_Point,
                    bodyB,
                    pivotB_Point
                );
                break;
            case 'distance':
                // 距离约束：保持两个刚体的当前距离
                constraint = new CANNON.DistanceConstraint(bodyA, bodyB, distance);
                break;
            case 'lock':
                // 固定约束：两个刚体完全固定在一起
                constraint = new CANNON.LockConstraint(bodyA, bodyB);
                break;
        }

        this.world.addConstraint(constraint);
        this.constraints.push({ id, constraint, config });
        this.updateConstraintList();
        this.updateStats();
    }

    deleteConstraint(id) {
        const index = this.constraints.findIndex(c => c.id === id);
        if (index !== -1) {
            this.world.removeConstraint(this.constraints[index].constraint);
            this.constraints.splice(index, 1);
            this.updateConstraintList();
            this.updateStats();
        }
    }

    // ========== 运行/停止/重置 ==========
    runSimulation() {
        if (this.mode === 'running') return;

        this.mode = 'running';
        this.updateModeIndicator();
        this.updateControlButtons();
    }

    stopSimulation() {
        if (this.mode === 'editing') return;

        this.mode = 'editing';
        this.updateModeIndicator();
        this.updateControlButtons();
    }

    resetPositions() {
        this.bodies.forEach(({ body, initialTransform }) => {
            body.position.copy(initialTransform.position);
            body.quaternion.copy(initialTransform.quaternion);
            body.velocity.set(initialTransform.velocity.x, initialTransform.velocity.y, initialTransform.velocity.z);
            body.angularVelocity.set(initialTransform.angularVelocity.x, initialTransform.angularVelocity.y, initialTransform.angularVelocity.z);
            body.wakeUp();
        });
    }

    // ========== 更新UI ==========
    setupUI() {
        document.getElementById('btn-run').onclick = () => this.runSimulation();
        document.getElementById('btn-stop').onclick = () => this.stopSimulation();
        document.getElementById('btn-reset').onclick = () => this.resetPositions();
        document.getElementById('btn-clear').onclick = () => {
            if (confirm('确定要清空所有刚体和约束吗？')) {
                this.clearScene();
            }
        };
        document.getElementById('btn-save').onclick = () => this.saveScene();
        document.getElementById('btn-load').onclick = () => this.loadScene();
        document.getElementById('btn-create-constraint').onclick = () => this.createConstraintFromUI();
    }

    updateModeIndicator() {
        const indicator = document.getElementById('mode-indicator');
        if (this.mode === 'editing') {
            indicator.className = 'mode-indicator editing';
            indicator.textContent = '编辑模式';
        } else {
            indicator.className = 'mode-indicator running';
            indicator.textContent = '运行模式';
        }
    }

    updateControlButtons() {
        const btnRun = document.getElementById('btn-run');
        const btnStop = document.getElementById('btn-stop');
        const btnReset = document.getElementById('btn-reset');

        if (this.mode === 'running') {
            btnRun.disabled = true;
            btnStop.disabled = false;
            btnReset.disabled = false;
        } else {
            btnRun.disabled = false;
            btnStop.disabled = true;
            btnReset.disabled = true;
        }
    }

    updateBodyList() {
        const container = document.getElementById('body-list');
        if (this.bodies.length === 0) {
            container.innerHTML = `
                <div class="no-selection">
                    <div>暂无刚体</div>
                    <small>点击上方按钮添加</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.bodies.map(({ id, config }) => {
            const isSelected = this.selectedBodyId === id;
            const isSelectedForConstraint = this.selectedBodiesForConstraint.includes(id);
            return `
                <div class="body-item ${isSelected ? 'selected' : ''} ${isSelectedForConstraint ? 'constraint-selected' : ''}"
                     onmousedown="editor.handleBodyListItemClick(event, ${id})">
                    <span class="delete-btn" onmousedown="event.stopPropagation(); editor.deleteBody(${id})">×</span>
                    <div class="name">${config.name}</div>
                    <div class="type">${this.getTypeName(config.type)}</div>
                    ${isSelectedForConstraint ? '<div style="font-size: 10px; color: #0af; margin-top: 3px;">✓ 已选择用于约束</div>' : ''}
                </div>
            `;
        }).join('');
    }

    handleBodyListItemClick(event, id) {
        console.log('刚体列表项点击, id:', id);
        console.log('ctrlKey:', event.ctrlKey, 'metaKey:', event.metaKey);

        // 检测 Ctrl (Windows/Linux) 或 Command (Mac)
        const isModifierKey = event.ctrlKey || event.metaKey;

        if (isModifierKey) {
            // Command/Ctrl+点击：选择用于创建约束
            console.log('检测到修饰键，选择用于创建约束');
            event.preventDefault();
            event.stopPropagation();
            this.handleConstraintSelection(id);
        } else {
            // 普通点击：选择刚体
            console.log('普通点击，选择刚体');
            this.selectBody(id);
        }
    }

    updateConstraintList() {
        const container = document.getElementById('constraint-list');
        if (this.constraints.length === 0) {
            container.innerHTML = '<div style="color: #666; font-size: 12px;">暂无约束</div>';
            return;
        }

        container.innerHTML = this.constraints.map(({ id, config }) => {
            const bodyA = this.bodies.find(b => b.id === config.bodyA)?.config?.name || 'Unknown';
            const bodyB = this.bodies.find(b => b.id === config.bodyB)?.config?.name || 'Unknown';
            return `
                <div class="constraint-item">
                    <span class="delete-btn" onclick="editor.deleteConstraint(${id})">×</span>
                    <strong>${config.name}</strong><br>
                    ${this.getConstraintTypeName(config.type)}<br>
                    ${bodyA} ↔ ${bodyB}
                </div>
            `;
        }).join('');
    }

    updateParamsPanel() {
        const container = document.getElementById('params-container');
        const bodyData = this.bodies.find(b => b.id === this.selectedBodyId);

        if (!bodyData) {
            container.innerHTML = `
                <div class="no-selection">
                    <div class="icon">👆</div>
                    <div>选择一个刚体</div>
                    <div>查看和编辑参数</div>
                </div>
            `;
            return;
        }

        const { config } = bodyData;
        container.innerHTML = `
            <div class="panel-section">
                <h3>基本参数</h3>
                <div class="param-group">
                    <label>名称</label>
                    <input type="text" value="${config.name}" onchange="editor.updateParam('name', this.value)">
                </div>
                <div class="param-group">
                    <label>质量 (kg)</label>
                    <input type="number" step="0.1" value="${config.mass}" onchange="editor.updateParam('mass', parseFloat(this.value))">
                </div>
                <div class="param-group">
                    <label>摩擦力 (0-1)</label>
                    <input type="number" step="0.1" min="0" max="1" value="${config.friction}" onchange="editor.updateParam('friction', parseFloat(this.value))">
                </div>
                <div class="param-group">
                    <label>弹性/恢复系数 (0-1)</label>
                    <input type="number" step="0.1" min="0" max="1" value="${config.restitution}" onchange="editor.updateParam('restitution', parseFloat(this.value))">
                </div>
            </div>

            <div class="panel-section">
                <h3>位置</h3>
                <div class="param-row">
                    <input type="number" step="0.5" value="${config.position.x.toFixed(2)}" onchange="editor.updatePosition('x', parseFloat(this.value))" placeholder="X">
                    <input type="number" step="0.5" value="${config.position.y.toFixed(2)}" onchange="editor.updatePosition('y', parseFloat(this.value))" placeholder="Y">
                    <input type="number" step="0.5" value="${config.position.z.toFixed(2)}" onchange="editor.updatePosition('z', parseFloat(this.value))" placeholder="Z">
                </div>
            </div>

            <div class="panel-section">
                <h3>初始速度 (m/s)</h3>
                <div class="param-row">
                    <input type="number" step="0.5" value="${(config.velocity?.x || 0).toFixed(2)}" onchange="editor.updateVelocity('x', parseFloat(this.value))" placeholder="X">
                    <input type="number" step="0.5" value="${(config.velocity?.y || 0).toFixed(2)}" onchange="editor.updateVelocity('y', parseFloat(this.value))" placeholder="Y">
                    <input type="number" step="0.5" value="${(config.velocity?.z || 0).toFixed(2)}" onchange="editor.updateVelocity('z', parseFloat(this.value))" placeholder="Z">
                </div>
                <div style="font-size: 11px; color: #888; margin-top: 5px;">刚体在开始时的线速度</div>
            </div>

            <div class="panel-section">
                <h3>初始角速度 (rad/s)</h3>
                <div class="param-row">
                    <input type="number" step="0.5" value="${(config.angularVelocity?.x || 0).toFixed(2)}" onchange="editor.updateAngularVelocity('x', parseFloat(this.value))" placeholder="X">
                    <input type="number" step="0.5" value="${(config.angularVelocity?.y || 0).toFixed(2)}" onchange="editor.updateAngularVelocity('y', parseFloat(this.value))" placeholder="Y">
                    <input type="number" step="0.5" value="${(config.angularVelocity?.z || 0).toFixed(2)}" onchange="editor.updateAngularVelocity('z', parseFloat(this.value))" placeholder="Z">
                </div>
                <div style="font-size: 11px; color: #888; margin-top: 5px;">刚体在开始时的旋转速度</div>
            </div>

            ${this.getTypeSpecificParams(config)}
        `;
    }

    getTypeSpecificParams(config) {
        switch (config.type) {
            case 'box':
                return `
                    <div class="panel-section">
                        <h3>尺寸</h3>
                        <div class="param-row">
                            <input type="number" step="0.1" value="${config.size.x}" onchange="editor.updateSize('x', parseFloat(this.value))" placeholder="宽">
                            <input type="number" step="0.1" value="${config.size.y}" onchange="editor.updateSize('y', parseFloat(this.value))" placeholder="高">
                            <input type="number" step="0.1" value="${config.size.z}" onchange="editor.updateSize('z', parseFloat(this.value))" placeholder="深">
                        </div>
                    </div>
                `;
            case 'sphere':
                return `
                    <div class="panel-section">
                        <h3>尺寸</h3>
                        <div class="param-group">
                            <label>半径</label>
                            <input type="number" step="0.1" value="${config.radius}" onchange="editor.updateSize('radius', parseFloat(this.value))">
                        </div>
                    </div>
                `;
            case 'cylinder':
                return `
                    <div class="panel-section">
                        <h3>尺寸</h3>
                        <div class="param-group">
                            <label>半径</label>
                            <input type="number" step="0.1" value="${config.radius}" onchange="editor.updateSize('radius', parseFloat(this.value))">
                        </div>
                        <div class="param-group">
                            <label>高度</label>
                            <input type="number" step="0.1" value="${config.height}" onchange="editor.updateSize('height', parseFloat(this.value))">
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    updateParam(key, value) {
        const bodyData = this.bodies.find(b => b.id === this.selectedBodyId);
        if (bodyData) {
            bodyData.config[key] = value;
            if (key === 'name') {
                this.updateBodyList();
            }
        }
    }

    updatePosition(axis, value) {
        const bodyData = this.bodies.find(b => b.id === this.selectedBodyId);
        if (bodyData && this.mode === 'editing') {
            bodyData.config.position[axis] = value;
            bodyData.body.position[axis] = value;
            bodyData.mesh.position[axis] = value;
            bodyData.initialTransform.position[axis] = value;
        }
    }

    updateVelocity(axis, value) {
        const bodyData = this.bodies.find(b => b.id === this.selectedBodyId);
        if (bodyData) {
            if (!bodyData.config.velocity) {
                bodyData.config.velocity = { x: 0, y: 0, z: 0 };
            }
            bodyData.config.velocity[axis] = value;
            bodyData.initialTransform.velocity[axis] = value;

            // 如果在编辑模式下，立即应用到刚体
            if (this.mode === 'editing') {
                bodyData.body.velocity[axis] = value;
            }
        }
    }

    updateAngularVelocity(axis, value) {
        const bodyData = this.bodies.find(b => b.id === this.selectedBodyId);
        if (bodyData) {
            if (!bodyData.config.angularVelocity) {
                bodyData.config.angularVelocity = { x: 0, y: 0, z: 0 };
            }
            bodyData.config.angularVelocity[axis] = value;
            bodyData.initialTransform.angularVelocity[axis] = value;

            // 如果在编辑模式下，立即应用到刚体
            if (this.mode === 'editing') {
                bodyData.body.angularVelocity[axis] = value;
            }
        }
    }

    updateSize(key, value) {
        const bodyData = this.bodies.find(b => b.id === this.selectedBodyId);
        if (bodyData && this.mode === 'editing') {
            // 需要重新创建刚体和网格
            const { config, body, mesh } = bodyData;

            if (key === 'radius') {
                config.radius = value;
            } else if (key === 'height') {
                config.height = value;
            } else {
                config.size[key] = value;
            }

            // 移除旧的
            this.world.removeBody(body);
            this.scene.remove(mesh);

            // 创建新的
            let newBody, newMesh;
            switch (config.type) {
                case 'box':
                    newBody = this.createBoxBody(config);
                    newMesh = this.createBoxMesh(config);
                    break;
                case 'sphere':
                    newBody = this.createSphereBody(config);
                    newMesh = this.createSphereMesh(config);
                    break;
                case 'cylinder':
                    newBody = this.createCylinderBody(config);
                    newMesh = this.createCylinderMesh(config);
                    break;
            }

            newBody.position.copy(body.position);
            newBody.quaternion.copy(body.quaternion);
            newMesh.position.copy(mesh.position);
            newMesh.quaternion.copy(mesh.quaternion);

            bodyData.body = newBody;
            bodyData.mesh = newMesh;
            bodyData.initialTransform.position = newBody.position.clone();
            bodyData.initialTransform.quaternion = newBody.quaternion.clone();

            this.world.addBody(newBody);
            this.scene.add(newMesh);
        }
    }

    updateStats() {
        const deletedText = this.deletedBodiesCount > 0 ? ` | 已删除: ${this.deletedBodiesCount}` : '';
        document.getElementById('stats').textContent =
            `刚体: ${this.bodies.length} | 约束: ${this.constraints.length} | FPS: ${this.fps}${deletedText}`;
    }

    // ========== 世界设置 ==========

    updateGravity(axis, value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // 重置X和Z轴重力为0，只保留Y轴（地面重力）
            this.world.gravity.set(0, numValue, 0);
            console.log(`重力已更新: ${numValue} m/s²`);

            // 零重力时隐藏地面，有重力时显示地面
            if (numValue === 0) {
                // 零重力：隐藏地面
                if (this.groundMesh) {
                    this.groundMesh.visible = false;
                }
                // 从物理世界移除地面
                if (this.groundBody) {
                    this.world.removeBody(this.groundBody);
                }
                console.log('零重力模式：地面已隐藏');
            } else {
                // 有重力：显示地面
                if (this.groundMesh) {
                    this.groundMesh.visible = true;
                }
                // 添加回物理世界
                if (this.groundBody && !this.world.bodies.includes(this.groundBody)) {
                    this.world.addBody(this.groundBody);
                }
                console.log('重力模式：地面已显示');
            }
        }
    }

    toggleBoundary(enabled) {
        this.boundaryEnabled = enabled;
        const settings = document.getElementById('boundary-settings');
        settings.style.display = enabled ? 'block' : 'none';

        if (enabled && this.boundaryHelper) {
            this.boundaryHelper.visible = true;
        } else if (!enabled && this.boundaryHelper) {
            this.boundaryHelper.visible = false;
        }

        console.log('边界检测:', enabled ? '已启用' : '已禁用');
    }

    updateBoundaryRadius(radius) {
        const numRadius = parseFloat(radius);
        if (!isNaN(numRadius) && numRadius > 0) {
            this.boundaryRadius = numRadius;

            // 更新边界可视化
            if (this.boundaryHelper) {
                this.scene.remove(this.boundaryHelper);
                this.createBoundaryHelper();
            }

            console.log(`球形边界半径已更新: ${numRadius} 米`);
        }
    }

    toggleBoundaryVisualization(show) {
        if (show && this.boundaryEnabled) {
            if (!this.boundaryHelper) {
                this.createBoundaryHelper();
            }
            this.boundaryHelper.visible = true;
        } else {
            if (this.boundaryHelper) {
                this.boundaryHelper.visible = false;
            }
        }
    }

    createBoundaryHelper() {
        // 创建球形边界线框
        const geometry = new THREE.SphereGeometry(this.boundaryRadius, 32, 32);
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        this.boundaryHelper = new THREE.LineSegments(wireframeGeometry, material);

        // 球心在原点 (0, 0, 0)
        this.boundaryHelper.position.set(0, 0, 0);

        this.scene.add(this.boundaryHelper);
    }

    checkBoundaries() {
        if (!this.boundaryEnabled) return;

        const bodiesToDelete = [];

        this.bodies.forEach(({ id, body, config, mesh }) => {
            const pos = body.position;

            // 计算物体到原点的距离
            const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);

            // 检查是否超出球形边界
            if (distance > this.boundaryRadius) {
                bodiesToDelete.push({ id, body, mesh, config });
            }
        });

        // 删除超出的物体
        bodiesToDelete.forEach(({ id, body, mesh, config }) => {
            const pos = body.position;
            const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
            console.log(`物体 "${config.name}" 超出球形边界，正在删除... 位置: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}), 距离: ${distance.toFixed(1)}米, 边界半径: ${this.boundaryRadius}米`);

            this.world.removeBody(body);
            this.scene.remove(mesh);

            // 从数组中移除
            const index = this.bodies.findIndex(b => b.id === id);
            if (index !== -1) {
                this.bodies.splice(index, 1);
            }

            this.deletedBodiesCount++;
        });

        // 删除相关约束
        this.constraints = this.constraints.filter(c => {
            const bodyAExists = this.bodies.find(b => b.id === c.config.bodyA);
            const bodyBExists = this.bodies.find(b => b.id === c.config.bodyB);

            if (!bodyAExists || !bodyBExists) {
                this.world.removeConstraint(c.constraint);
                return false;
            }
            return true;
        });

        if (bodiesToDelete.length > 0) {
            this.updateBodyList();
            this.updateConstraintList();
            this.updateStats();
        }
    }

    getTypeName(type) {
        const names = {
            box: '盒子',
            sphere: '球体',
            cylinder: '圆柱',
            compound: '复合体'
        };
        return names[type] || type;
    }

    getConstraintTypeName(type) {
        const names = {
            hinge: '铰链',
            pointToPoint: '点对点',
            distance: '距离',
            lock: '固定'
        };
        return names[type] || type;
    }

    // ========== 场景保存/加载 ==========
    saveScene() {
        const sceneData = {
            bodies: this.bodies.map(({ config, initialTransform }) => ({
                config,
                initialTransform: {
                    position: initialTransform.position.toArray(),
                    quaternion: initialTransform.quaternion.toArray()
                }
            })),
            constraints: this.constraints.map(({ config }) => config)
        };

        const json = JSON.stringify(sceneData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scene-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    loadScene() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const sceneData = JSON.parse(event.target.result);
                        this.clearScene();
                        sceneData.bodies.forEach(({ config, initialTransform }) => {
                            this.createBody(config);
                            const bodyData = this.bodies[this.bodies.length - 1];
                            bodyData.initialTransform.position.fromArray(initialTransform.position);
                            bodyData.initialTransform.quaternion.fromArray(initialTransform.quaternion);
                        });
                        sceneData.constraints.forEach(config => {
                            this.createConstraint(config.bodyA, config.bodyB);
                        });
                        alert('场景加载成功！');
                    } catch (error) {
                        alert('加载失败：' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // ========== 动画循环 ==========
    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 1 / 60;

        if (this.mode === 'running') {
            this.world.step(deltaTime);
            this.bodies.forEach(({ body, mesh }) => {
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
            });

            // 检查边界并删除超出的物体
            this.checkBoundaries();
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        // FPS 计算
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            this.updateStats();
        }
    }

    onKeyDown(event) {
        if (event.key === 'Delete' && this.selectedBodyId && this.mode === 'editing') {
            this.deleteBody(this.selectedBodyId);
        }
    }
}

// 启动编辑器
const editor = new PhysicsEditor();
window.editor = editor; // 暴露给全局以便HTML调用
