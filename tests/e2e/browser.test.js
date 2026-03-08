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
            headless: false, // 显示浏览器窗口
            slowMo: 100,     // 放慢操作，便于观察
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
            await this.page.goto('http://localhost:8080', {
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
            await this.page.waitForTimeout(500);

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
            await this.page.waitForTimeout(500);

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
            await this.page.waitForTimeout(500);

            let newCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            if (newCount !== initialCount + 1) {
                throw new Error("复合体数量未正确增加");
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
            await this.page.waitForTimeout(200);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createPendulum()"]');
            await this.page.waitForTimeout(1000);

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
            await this.page.waitForTimeout(200);

            let initialCount = await this.page.evaluate(() => {
                return parseInt(document.getElementById('object-count').textContent);
            });

            await this.page.click('button[onclick="app.createHingedBoxes()"]');
            await this.page.waitForTimeout(1000);

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
            await this.page.waitForTimeout(200);
            await this.page.click('button[onclick="app.addBox()"]');
            await this.page.waitForTimeout(200);

            // 重置
            await this.page.click('button[onclick="app.resetScene()"]');
            await this.page.waitForTimeout(500);

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

            // FPS应该大于30
            if (fps < 30) {
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
            await this.page.waitForTimeout(500);

            // 模拟鼠标点击（检查是否有错误）
            await this.page.mouse.click(640, 360);
            await this.page.waitForTimeout(200);

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

        await this.testPageLoad();
        await this.testAddBox();
        await this.testAddSphere();
        await this.testAddCompound();
        await this.testCreatePendulum();
        await this.testHingedBoxes();
        await this.testResetScene();
        await this.testPerformance();
        await this.testMouseInteraction();

        await this.teardown();
        this.printResults();
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
