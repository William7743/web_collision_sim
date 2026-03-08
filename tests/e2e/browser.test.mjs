/**
 * 端到端测试
 * 使用 Puppeteer 自动化测试浏览器交互
 */

import puppeteer from 'puppeteer';

class E2ETests {
    constructor() {
        this.results = [];
        this.browser = null;
        this.page = null;
    }

    async setup() {
        this.browser = await puppeteer.launch({
            headless: "new", // 新版 headless 模式
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1280, height: 720 });
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    // 测试页面加载
    async testPageLoad() {
        const testName = "页面加载";

        try {
            await this.page.goto('http://localhost:5173', {
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            const title = await this.page.title();
            if (!title) throw new Error("页面标题未找到");

            // 检查 canvas 是否存在
            const canvas = await this.page.$('#canvas-container canvas');
            if (!canvas) throw new Error("Canvas 未找到");

            // 检查控制面板
            const controls = await this.page.$('#controls');
            if (!controls) throw new Error("控制面板未找到");

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 辅助函数：等待指定毫秒数
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 测试添加盒子
    async testAddBox() {
        const testName = "添加盒子功能";

        try {
            // 获取初始物体数量
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            // 点击添加盒子按钮
            await this.page.click('button[onclick="app.addBox()"]');
            await this.wait(500);

            // 检查物体数量是否增加
            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error(`物体数量应该增加1，实际增加: ${newCount - initialCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试添加球体
    async testAddSphere() {
        const testName = "添加球体功能";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.addSphere()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error("物体数量未正确增加");
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试添加复合体
    async testAddCompound() {
        const testName = "添加复合体功能";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.addCompound()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error(`复合体数量未正确增加: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试创建钟摆
    async testCreatePendulum() {
        const testName = "创建钟摆";

        try {
            await this.page.click('button[onclick="app.resetScene()"]');
            await this.wait(200);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createPendulum()"]');
            await this.wait(1000);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            // 钟摆应该创建5个链接 + 1个锚点
            if (newCount < initialCount + 5) {
                throw new Error("钟摆链接数量不足");
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试创建铰链盒子
    async testHingedBoxes() {
        const testName = "创建铰链盒子";

        try {
            await this.page.click('button[onclick="app.resetScene()"]');
            await this.wait(200);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createHingedBoxes()"]');
            await this.wait(1000);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            // 铰链盒子应该创建4个盒子
            if (newCount < initialCount + 4) {
                throw new Error("铰链盒子数量不足");
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试重置场景
    async testResetScene() {
        const testName = "重置场景";

        try {
            // 先添加一些物体
            await this.page.click('button[onclick="app.addBox()"]');
            await this.wait(200);
            await this.page.click('button[onclick="app.addBox()"]');
            await this.wait(200);

            // 重置
            await this.page.click('button[onclick="app.resetScene()"]');
            await this.wait(500);

            let count = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (count !== 0) {
                throw new Error("场景未正确清空，剩余物体: " + count);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试FPS性能
    async testPerformance() {
        const testName = "FPS性能测试";

        try {
            // 获取FPS
            let fps = await this.page.evaluate(() => {
                return parseInt(document.getElementById('fps').textContent);
            });

            // FPS应该大于25 (headless模式下可能较低)
            if (fps < 25) {
                throw new Error(`FPS过低: ${fps}`);
            }

            this.results.push({ name: testName, status: "PASS", fps: fps });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试鼠标交互
    async testMouseInteraction() {
        const testName = "鼠标交互";

        try {
            // 添加一个盒子
            await this.page.click('button[onclick="app.addBox()"]');
            await this.wait(500);

            // 模拟鼠标点击（检查是否有错误）
            await this.page.mouse.click(640, 360);
            await this.wait(200);

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // ========== 新功能测试 ==========

    // 测试机器人手臂
    async testRobotArm() {
        const testName = "机器人手臂";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createRobotArm()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error(`机器人手臂: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试四足动物
    async testQuadruped() {
        const testName = "四足动物";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createQuadruped()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error(`四足动物: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试桌子
    async testTable() {
        const testName = "桌子";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createTable()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error(`桌子: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试椅子
    async testChair() {
        const testName = "椅子";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createChair()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error(`椅子: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试桥梁
    async testBridge() {
        const testName = "桥梁";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createBridge()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`桥梁: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试岩石
    async testRock() {
        const testName = "岩石";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createRock()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error(`岩石: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试分子结构
    async testMolecule() {
        const testName = "分子结构";

        try {
            await this.page.evaluate(() => app.resetScene());
            await this.wait(500);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.evaluate(() => app.createMolecule());
            await this.wait(1000);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`分子结构: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试链条
    async testChain() {
        const testName = "链条";

        try {
            await this.page.evaluate(() => app.resetScene());
            await this.wait(500);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.evaluate(() => app.createChain());
            await this.wait(1000);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`链条: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试固定约束
    async testLockConstraint() {
        const testName = "固定约束";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createLockConstraintDemo()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`固定约束: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试距离约束
    async testDistanceConstraint() {
        const testName = "距离约束";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createDistanceConstraintDemo()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`距离约束: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试圆锥扭转约束
    async testConeTwistConstraint() {
        const testName = "圆锥扭转约束";

        try {
            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createConeTwistConstraintDemo()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`圆锥扭转约束: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试机器人协作场景
    async testRobotCollaboration() {
        const testName = "机器人协作场景";

        try {
            await this.page.click('button[onclick="app.resetScene()"]');
            await this.wait(200);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createRobotCollaborationScene()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`机器人协作: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试分子碰撞场景
    async testMoleculeCollision() {
        const testName = "分子碰撞场景";

        try {
            await this.page.click('button[onclick="app.resetScene()"]');
            await this.wait(200);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createMoleculeCollisionScene()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`分子碰撞: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 测试建筑倒塌场景
    async testBuildingCollapse() {
        const testName = "建筑倒塌场景";

        try {
            await this.page.click('button[onclick="app.resetScene()"]');
            await this.wait(200);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createBuildingCollapseScene()"]');
            await this.wait(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount < initialCount + 1) {
                throw new Error(`建筑倒塌: 从 ${initialCount} 到 ${newCount}`);
            }

            this.results.push({ name: testName, status: "PASS" });
            return true;
        } catch (error) {
            this.results.push({ name: testName, status: "FAIL", error: error.message });
            return false;
        }
    }

    // 运行所有测试
    async runAll() {
        console.log("🌐 开始运行端到端测试...\n");

        await this.setup();

        // 基础功能测试
        console.log("📦 基础功能测试...\n");
        await this.testPageLoad();
        await this.testAddBox();
        await this.testAddSphere();
        await this.testAddCompound();
        await this.testResetScene();
        await this.testPerformance();
        await this.testMouseInteraction();

        // 复杂复合体测试
        console.log("\n🧩 复杂复合体测试...\n");
        await this.testRobotArm();
        await this.testQuadruped();
        await this.testTable();
        await this.testChair();
        await this.testBridge();
        await this.testRock();
        await this.testMolecule();
        await this.testChain();

        // 新约束类型测试
        console.log("\n🔗 新约束类型测试...\n");
        await this.testLockConstraint();
        await this.testDistanceConstraint();
        await this.testConeTwistConstraint();

        // 演示场景测试
        console.log("\n🎬 演示场景测试...\n");
        await this.testRobotCollaboration();
        await this.testMoleculeCollision();
        await this.testBuildingCollapse();

        // 约束系统测试
        console.log("\n⚙️ 约束系统测试...\n");
        await this.testCreatePendulum();
        await this.testHingedBoxes();

        await this.teardown();
        return this.printResults();
    }

    // 打印结果
    printResults() {
        console.log("\n📊 E2E 测试结果:");
        console.log("=" .repeat(50));

        let passCount = 0;
        let failCount = 0;

        for (const result of this.results) {
            const icon = result.status === "PASS" ? "✅" : "❌";
            console.log(`${icon} ${result.name}: ${result.status}`);

            if (result.status === "PASS") {
                passCount++;
                if (result.fps) console.log(`   FPS: ${result.fps}`);
            } else {
                failCount++;
                console.log(`   错误: ${result.error}`);
            }
        }

        console.log("=" .repeat(50));
        console.log(`\n总计: ${this.results.length} 个测试`);
        console.log(`✅ 通过: ${passCount}`);
        console.log(`❌ 失败: ${failCount}`);
        console.log(`成功率: ${((passCount / this.results.length) * 100).toFixed(1)}%\n`);

        return failCount === 0;
    }
}

export default E2ETests;
