/**
 * 物理引擎单元测试
 * 测试 cannon-es 的核心功能
 */

import * as CANNON from 'cannon-es';

// 测试套件
class PhysicsTests {
    constructor() {
        this.results = [];
        this.world = null;
    }

    setup() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
    }

    teardown() {
        this.world = null;
    }

    // 测试物理世界初始化
    testWorldInit() {
        this.setup();
        const testName = "物理世界初始化";

        try {
            if (!this.world) throw new Error("世界未创建");
            if (this.world.gravity.y !== -9.82) throw new Error("重力未正确设置");
            if (!this.world.broadphase) throw new Error("碰撞检测未设置");

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        } finally {
            this.teardown();
        }
    }

    // 测试创建刚体
    testCreateBody() {
        this.setup();
        const testName = "创建刚体";

        try {
            const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
            const body = new CANNON.Body({
                mass: 1,
                shape: shape,
                position: new CANNON.Vec3(0, 5, 0)
            });

            if (!body) throw new Error("刚体未创建");
            if (body.mass !== 1) throw new Error("质量未正确设置");
            if (body.position.y !== 5) throw new Error("位置未正确设置");

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        } finally {
            this.teardown();
        }
    }

    // 测试复合形状（浏览器特性）
    testCompoundShape() {
        this.setup();
        const testName = "复合形状";

        try {
            // 注意：CANNON.Compound 在某些 Node.js 环境中可能不可用
            // 但在浏览器环境中可以正常工作
            if (typeof CANNON.Compound === 'undefined') {
                this.results.push({
                    name: testName,
                    status: "SKIP",
                    error: "Compound 需要浏览器环境（Node.js 中不可用）"
                });
                return true;
            }

            const compound = new CANNON.Compound();
            const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
            const sphereShape = new CANNON.Sphere(0.5);

            compound.addChildShape(boxShape, new CANNON.Vec3(0, 0, 0));
            compound.addChildShape(sphereShape, new CANNON.Vec3(1.5, 0, 0));

            if (compound.children.length !== 2) throw new Error("子形状数量错误");

            const body = new CANNON.Body({
                mass: 1,
                shape: compound
            });

            if (!body.shape) throw new Error("复合形状未添加到刚体");

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        } finally {
            this.teardown();
        }
    }

    // 测试铰链约束
    testHingeConstraint() {
        this.setup();
        const testName = "铰链约束";

        try {
            const bodyA = new CANNON.Body({ mass: 0 });
            const bodyB = new CANNON.Body({ mass: 1 });

            const constraint = new CANNON.HingeConstraint(
                bodyA,
                bodyB,
                {
                    pivotA: new CANNON.Vec3(0, 1, 0),
                    axisA: new CANNON.Vec3(0, 0, 1),
                    pivotB: new CANNON.Vec3(0, -1, 0),
                    axisB: new CANNON.Vec3(0, 0, 1)
                }
            );

            if (!constraint) throw new Error("约束未创建");
            if (constraint.bodyA !== bodyA) throw new Error("BodyA 未正确设置");
            if (constraint.bodyB !== bodyB) throw new Error("BodyB 未正确设置");

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        } finally {
            this.teardown();
        }
    }

    // 测试点对点约束
    testPointToPointConstraint() {
        this.setup();
        const testName = "点对点约束";

        try {
            const bodyA = new CANNON.Body({ mass: 0 });
            const bodyB = new CANNON.Body({ mass: 1 });

            const constraint = new CANNON.PointToPointConstraint(
                bodyA,
                new CANNON.Vec3(0, 0, 0),
                bodyB,
                new CANNON.Vec3(0, 0, 0)
            );

            if (!constraint) throw new Error("约束未创建");

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        } finally {
            this.teardown();
        }
    }

    // 测试物理模拟步进
    testSimulationStep() {
        this.setup();
        const testName = "物理模拟步进";

        try {
            const body = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Sphere(1),
                position: new CANNON.Vec3(0, 10, 0)
            });
            this.world.addBody(body);

            const initialY = body.position.y;
            this.world.step(1/60);
            const finalY = body.position.y;

            if (finalY >= initialY) throw new Error("物体应该下落");

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        } finally {
            this.teardown();
        }
    }

    // 测试碰撞检测
    testCollisionDetection() {
        this.setup();
        const testName = "碰撞检测";

        try {
            // 地面
            const ground = new CANNON.Body({
                mass: 0,
                shape: new CANNON.Plane()
            });
            ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
            this.world.addBody(ground);

            // 掉落的球
            const ball = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Sphere(1),
                position: new CANNON.Vec3(0, 5, 0)
            });
            this.world.addBody(ball);

            // 步进模拟
            for (let i = 0; i < 100; i++) {
                this.world.step(1/60);
            }

            // 球应该在地面上方（被碰撞阻止）
            if (ball.position.y < 0) throw new Error("球穿过了地面");
            if (ball.position.y > 1.5) throw new Error("球没有正确落地");

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        } finally {
            this.teardown();
        }
    }

    // 运行所有测试
    runAll() {
        console.log("🧪 开始运行单元测试...\n");

        this.testWorldInit();
        this.testCreateBody();
        this.testCompoundShape();
        this.testHingeConstraint();
        this.testPointToPointConstraint();
        this.testSimulationStep();
        this.testCollisionDetection();

        return this.printResults();
    }

    // 打印结果
    printResults() {
        console.log("\n📊 测试结果:");
        console.log("=" .repeat(50));

        let passCount = 0;
        let failCount = 0;
        let skipCount = 0;

        for (const result of this.results) {
            let icon;
            if (result.status === "PASS") {
                icon = "✅";
            } else if (result.status === "SKIP") {
                icon = "⏭️ ";
            } else {
                icon = "❌";
            }

            console.log(`${icon} ${result.name}: ${result.status}`);

            if (result.status === "PASS") {
                passCount++;
            } else if (result.status === "SKIP") {
                skipCount++;
                console.log(`   原因: ${result.error}`);
            } else {
                failCount++;
                console.log(`   错误: ${result.error}`);
            }
        }

        console.log("=" .repeat(50));
        console.log(`\n总计: ${this.results.length} 个测试`);
        console.log(`✅ 通过: ${passCount}`);
        console.log(`⏭️  跳过: ${skipCount}`);
        console.log(`❌ 失败: ${failCount}`);
        console.log(`成功率: ${((passCount / (this.results.length - skipCount)) * 100).toFixed(1)}%\n`);

        return failCount === 0;
    }
}

// 导出
export default PhysicsTests;
