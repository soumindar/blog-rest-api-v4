const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

(async () => {
  try {
    const categoryData = [
      { category: 'technology' },
      { category: 'lifestyle' },
      { category: 'games' },
      { category: 'food' },
      { category: 'science' },
      { category: 'art' },
      { category: 'music' }
    ];

    categoryData.forEach(async category => {
      await prisma.category.create({
        data: category
      });
    })
    
    const salt = await bcrypt.genSalt(10);
    const usersData = [
      {
        name: 'soumindar qolby',
        username: 'sou',
        password: await bcrypt.hash('sou123', salt),
      },
      {
        name: 'reno agil',
        username: 'reno',
        password: await bcrypt.hash('reno123', salt),
      },
    ]
    usersData.forEach(async user => {
      await prisma.users.create({
        data: user
      });
    });
    
    console.log('seeder success');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();