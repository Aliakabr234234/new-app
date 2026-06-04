"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.project.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    // Create users
    const superAdmin = await prisma.user.create({
        data: {
            email: 'superadmin@resourceflow.app',
            password: await bcrypt_1.default.hash('SuperAdmin@123', 12),
            name: 'Super Admin',
            role: client_1.Role.SUPER_ADMIN,
        },
    });
    const admin = await prisma.user.create({
        data: {
            email: 'admin@resourceflow.app',
            password: await bcrypt_1.default.hash('Admin@123', 12),
            name: 'Admin User',
            role: client_1.Role.ADMIN,
        },
    });
    const user = await prisma.user.create({
        data: {
            email: 'user@resourceflow.app',
            password: await bcrypt_1.default.hash('User@123', 12),
            name: 'Regular User',
            role: client_1.Role.USER,
        },
    });
    console.log('✅ Users created');
    // Create resources
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alexChen = await prisma.resource.create({
        data: {
            name: 'Alex Chen',
            role: 'Developer',
            dailyCapacityHours: 8,
            colorTag: '#6366F1',
            createdById: superAdmin.id,
        },
    });
    const saraKim = await prisma.resource.create({
        data: {
            name: 'Sara Kim',
            role: 'Designer',
            dailyCapacityHours: 8,
            colorTag: '#8B5CF6',
            createdById: superAdmin.id,
        },
    });
    const mikeJohnson = await prisma.resource.create({
        data: {
            name: 'Mike Johnson',
            role: 'QA',
            dailyCapacityHours: 8,
            colorTag: '#10B981',
            createdById: superAdmin.id,
        },
    });
    const emilyDavis = await prisma.resource.create({
        data: {
            name: 'Emily Davis',
            role: 'PM',
            dailyCapacityHours: 8,
            colorTag: '#F59E0B',
            createdById: superAdmin.id,
        },
    });
    console.log('✅ Resources created');
    // Helper to add days
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    // Create projects
    const websiteRedesign = await prisma.project.create({
        data: {
            name: 'New Website Redesign',
            description: 'Complete redesign of the company website with modern UI/UX',
            startDate: today,
            endDate: addDays(today, 21),
            colorTag: '#6366F1',
            status: client_1.ProjectStatus.ACTIVE,
            createdById: superAdmin.id,
        },
    });
    const mobileApp = await prisma.project.create({
        data: {
            name: 'Mobile App MVP',
            description: 'Build the first version of our mobile application',
            startDate: addDays(today, -5),
            endDate: addDays(today, 25),
            colorTag: '#8B5CF6',
            status: client_1.ProjectStatus.ACTIVE,
            createdById: admin.id,
        },
    });
    const apiIntegration = await prisma.project.create({
        data: {
            name: 'API Integration',
            description: 'Integrate third-party APIs for payment and analytics',
            startDate: addDays(today, -13),
            endDate: addDays(today, 4),
            colorTag: '#10B981',
            status: client_1.ProjectStatus.ACTIVE,
            createdById: admin.id,
        },
    });
    console.log('✅ Projects created');
    // Create assignments
    await prisma.assignment.createMany({
        data: [
            {
                projectId: websiteRedesign.id,
                resourceId: saraKim.id,
                startDate: today,
                endDate: addDays(today, 7),
                dailyHours: 2,
            },
            {
                projectId: websiteRedesign.id,
                resourceId: alexChen.id,
                startDate: addDays(today, 8),
                endDate: addDays(today, 21),
                dailyHours: 3,
            },
            {
                projectId: mobileApp.id,
                resourceId: emilyDavis.id,
                startDate: addDays(today, -5),
                endDate: addDays(today, 25),
                dailyHours: 1,
            },
            {
                projectId: apiIntegration.id,
                resourceId: mikeJohnson.id,
                startDate: addDays(today, -13),
                endDate: addDays(today, 4),
                dailyHours: 4,
            },
            {
                projectId: apiIntegration.id,
                resourceId: alexChen.id,
                startDate: addDays(today, -13),
                endDate: addDays(today, -3),
                dailyHours: 2,
            },
        ],
    });
    console.log('✅ Assignments created');
    console.log('');
    console.log('🎉 Seed complete!');
    console.log('');
    console.log('Login credentials:');
    console.log('  superadmin@resourceflow.app  /  SuperAdmin@123  (SUPER_ADMIN)');
    console.log('  admin@resourceflow.app       /  Admin@123       (ADMIN)');
    console.log('  user@resourceflow.app        /  User@123        (USER)');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map