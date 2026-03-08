/**
 * 测试运行器 (ES Module 版本)
 * 运行所有测试并生成报告
 */

import PhysicsTests from './unit/physics.test.mjs';
import E2ETests from './e2e/browser.test.mjs';

class TestRunner {
    constructor() {
        this.startTime = Date.now();
    }

    async runAll() {
        console.log("\n" + "=".repeat(60));
        console.log("🚀 刚体碰撞仿真 - 自动化测试套件");
        console.log("=".repeat(60) + "\n");

        let unitTestsPassed = false;
        let e2eTestsPassed = false;

        // 运行单元测试
        console.log("📦 第一阶段: 单元测试");
        console.log("-".repeat(60) + "\n");
        const physicsTests = new PhysicsTests();
        unitTestsPassed = physicsTests.runAll();

        // 等待一段时间
        await this.sleep(2000);

        // 运行E2E测试
        console.log("\n🌐 第二阶段: 端到端测试");
        console.log("-".repeat(60) + "\n");
        const e2eTests = new E2ETests();
        e2eTestsPassed = await e2eTests.runAll();

        // 生成总结报告
        this.generateSummary(unitTestsPassed, e2eTestsPassed);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateSummary(unitPassed, e2ePassed) {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

        console.log("\n" + "=".repeat(60));
        console.log("📋 最终测试报告");
        console.log("=".repeat(60));

        console.log(`\n⏱️  总耗时: ${duration}秒\n`);

        console.log("模块测试状态:");
        console.log(`  单元测试: ${unitPassed ? "✅ 通过" : "❌ 失败"}`);
        console.log(`  E2E测试: ${e2ePassed ? "✅ 通过" : "❌ 失败"}`);

        const allPassed = unitPassed && e2ePassed;

        console.log("\n" + "=".repeat(60));
        if (allPassed) {
            console.log("🎉 所有测试通过！应用已准备就绪。");
        } else {
            console.log("⚠️  部分测试失败，需要修复。");
        }
        console.log("=".repeat(60) + "\n");

        // 退出码
        process.exit(allPassed ? 0 : 1);
    }
}

// 运行测试
const runner = new TestRunner();
runner.runAll().catch(error => {
    console.error("❌ 测试运行失败:", error);
    process.exit(1);
});
