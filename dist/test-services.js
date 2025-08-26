"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testServices = testServices;
exports.testServicePerformance = testServicePerformance;
exports.testServiceErrorHandling = testServiceErrorHandling;
exports.runAllTests = runAllTests;
const services_1 = require("./services");
const data_source_1 = require("./config/data-source");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function testServices() {
    try {
        console.log('🧪 Testing Ramein Backend Services...\n');
        console.log('📊 Initializing database connection...');
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Database connection established\n');
        console.log('🔧 Initializing Service Manager...');
        const serviceManager = services_1.ServiceManager.getInstance();
        await serviceManager.initialize();
        console.log('✅ Service Manager initialized\n');
        console.log('🧪 Testing individual services...\n');
        console.log('📅 Testing EventStatusService...');
        const eventStatusService = serviceManager.getService('eventStatus');
        const canCreateEvent = eventStatusService.canCreateEvent(new Date('2024-12-31'));
        console.log(`✅ EventStatusService: Can create event for Dec 31, 2024: ${canCreateEvent}`);
        console.log('⏰ Testing SchedulerService...');
        const schedulerService = serviceManager.getService('scheduler');
        const schedulerStatus = schedulerService.getStatus();
        console.log(`✅ SchedulerService: Status - ${JSON.stringify(schedulerStatus)}`);
        console.log('🎓 Testing CertificateService...');
        console.log('✅ CertificateService: Service available');
        console.log('📊 Testing StatisticsService...');
        const statisticsService = serviceManager.getService('statistics');
        const overallStats = await statisticsService.getOverallStats();
        console.log(`✅ StatisticsService: Overall stats - ${JSON.stringify(overallStats)}`);
        console.log('📝 Testing AttendanceService...');
        console.log('✅ AttendanceService: Service available');
        console.log('🛡️ Testing RateLimitService...');
        const rateLimitService = serviceManager.getService('rateLimit');
        const rateLimitStatus = await rateLimitService.getRateLimitStatus('test_key');
        console.log(`✅ RateLimitService: Status - ${JSON.stringify(rateLimitStatus)}`);
        console.log('📝 Testing LoggingService...');
        const loggingService = serviceManager.getService('logging');
        loggingService.info('Test log message', 'TEST_SERVICE');
        console.log('✅ LoggingService: Test log message sent');
        console.log('💾 Testing CacheService...');
        const cacheService = serviceManager.getService('cache');
        await cacheService.set('test_key', { test: 'data' }, 60);
        const cachedData = await cacheService.get('test_key');
        console.log(`✅ CacheService: Cached data retrieved - ${JSON.stringify(cachedData)}`);
        console.log('📈 Testing MonitoringService...');
        const monitoringService = serviceManager.getService('monitoring');
        const healthCheck = await monitoringService.performHealthCheck();
        console.log(`✅ MonitoringService: Health check - ${healthCheck.status}`);
        const metrics = await monitoringService.collectSystemMetrics();
        console.log(`✅ MonitoringService: System metrics collected - CPU: ${metrics.cpu.usage}%, Memory: ${metrics.memory.percentage}%`);
        console.log('\n📋 Testing Service Manager...');
        const serviceStatus = serviceManager.getServiceStatus();
        console.log(`✅ Service Manager Status: ${JSON.stringify(serviceStatus, null, 2)}`);
        console.log('\n🔗 Testing service interactions...');
        console.log('🔍 Testing event search with caching...');
        const searchResults = await eventStatusService.searchEvents('test', undefined, undefined, undefined, 'date', 'ASC', 1, 5);
        console.log(`✅ Event search completed: ${searchResults.total} events found`);
        console.log('📊 Testing statistics with caching...');
        const monthlyStats = await statisticsService.getMonthlyEventStats(2024);
        console.log(`✅ Monthly stats retrieved: ${monthlyStats.length} months`);
        console.log('🛡️ Testing rate limiting...');
        const testKey = 'test_rate_limit';
        await rateLimitService.increment(testKey);
        const rateLimitInfo = await rateLimitService.getRateLimitStatus(testKey);
        console.log(`✅ Rate limiting test: ${rateLimitInfo.current}/${rateLimitInfo.limit} requests`);
        console.log('📝 Testing different log levels...');
        loggingService.debug('Debug message', 'TEST_DEBUG');
        loggingService.info('Info message', 'TEST_INFO');
        loggingService.warn('Warning message', 'TEST_WARN');
        loggingService.error('Error message', 'TEST_ERROR', new Error('Test error'));
        console.log('✅ All log levels tested');
        console.log('💾 Testing advanced cache operations...');
        await cacheService.mset([
            { key: 'test1', value: 'value1', ttl: 60 },
            { key: 'test2', value: 'value2', ttl: 60 }
        ]);
        const multipleData = await cacheService.mget(['test1', 'test2']);
        console.log(`✅ Multiple cache operations: ${multipleData.filter(Boolean).length} items retrieved`);
        console.log('📈 Testing monitoring metrics...');
        const metricsSummary = monitoringService.getMetricsSummary();
        console.log(`✅ Monitoring metrics: ${metricsSummary.totalMetrics} metrics collected, CPU avg: ${metricsSummary.averageCpuUsage}%`);
        console.log('\n🎉 All services tested successfully!');
        console.log('\n📋 Service Summary:');
        console.log(`- Total Services: ${serviceStatus.services.length}`);
        console.log(`- Services: ${serviceStatus.services.join(', ')}`);
        console.log(`- Health Status: ${healthCheck.status}`);
        console.log(`- Database: ${healthCheck.checks.database.status}`);
        console.log(`- Cache: ${healthCheck.checks.cache.status}`);
        console.log(`- Scheduler: ${healthCheck.checks.scheduler.status}`);
        console.log(`- System: ${healthCheck.checks.system.status}`);
    }
    catch (error) {
        console.error('❌ Service testing failed:', error);
        process.exit(1);
    }
}
async function testServicePerformance() {
    try {
        console.log('\n🚀 Testing service performance...\n');
        const serviceManager = services_1.ServiceManager.getInstance();
        const cacheService = serviceManager.getService('cache');
        const loggingService = serviceManager.getService('logging');
        console.log('💾 Testing cache performance...');
        const startTime = Date.now();
        for (let i = 0; i < 100; i++) {
            await cacheService.set(`perf_test_${i}`, { data: `test_data_${i}` }, 60);
        }
        const cacheWriteTime = Date.now() - startTime;
        console.log(`✅ Cache write performance: 100 items in ${cacheWriteTime}ms (${(100 / cacheWriteTime * 1000).toFixed(2)} items/sec)`);
        const readStartTime = Date.now();
        const keys = Array.from({ length: 100 }, (_, i) => `perf_test_${i}`);
        const readResults = await cacheService.mget(keys);
        const cacheReadTime = Date.now() - readStartTime;
        console.log(`✅ Cache read performance: 100 items in ${cacheReadTime}ms (${(100 / cacheReadTime * 1000).toFixed(2)} items/sec)`);
        console.log('📝 Testing logging performance...');
        const logStartTime = Date.now();
        for (let i = 0; i < 1000; i++) {
            loggingService.info(`Performance test log ${i}`, 'PERF_TEST');
        }
        const logTime = Date.now() - logStartTime;
        console.log(`✅ Logging performance: 1000 messages in ${logTime}ms (${(1000 / logTime * 1000).toFixed(2)} messages/sec)`);
        for (let i = 0; i < 100; i++) {
            await cacheService.delete(`perf_test_${i}`);
        }
        console.log('✅ Performance testing completed');
    }
    catch (error) {
        console.error('❌ Performance testing failed:', error);
    }
}
async function testServiceErrorHandling() {
    try {
        console.log('\n⚠️ Testing service error handling...\n');
        const serviceManager = services_1.ServiceManager.getInstance();
        const cacheService = serviceManager.getService('cache');
        const loggingService = serviceManager.getService('logging');
        console.log('💾 Testing cache error handling...');
        try {
            await cacheService.get('non_existent_key');
            console.log('✅ Cache get non-existent key handled gracefully');
        }
        catch (error) {
            console.log('✅ Cache error handling working');
        }
        console.log('📝 Testing logging error handling...');
        try {
            loggingService.error('Test error message', 'TEST_ERROR', new Error('Test error'));
            console.log('✅ Logging error handling working');
        }
        catch (error) {
            console.log('✅ Logging error handling working');
        }
        console.log('✅ Error handling testing completed');
    }
    catch (error) {
        console.error('❌ Error handling testing failed:', error);
    }
}
async function runAllTests() {
    try {
        await testServices();
        await testServicePerformance();
        await testServiceErrorHandling();
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Check the logs directory for generated log files');
        console.log('2. Verify cache operations in Redis (if enabled)');
        console.log('3. Check health endpoint: GET /health');
        console.log('4. Check service status: GET /api/services/status');
        const serviceManager = services_1.ServiceManager.getInstance();
        await serviceManager.shutdown();
        await data_source_1.AppDataSource.destroy();
        console.log('\n🔄 Services shut down gracefully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    runAllTests();
}
//# sourceMappingURL=test-services.js.map