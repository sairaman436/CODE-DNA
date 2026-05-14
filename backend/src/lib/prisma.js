const { PrismaClient } = require('@prisma/client');

// Singleton pattern — avoid creating multiple PrismaClient instances
// which causes connection pool exhaustion in development
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

module.exports = prisma;
