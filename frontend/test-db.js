/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.chatMessage
  .findMany({
    select: { id: true, sessionId: true, role: true, text: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })
  .then((m) => console.log(m))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
