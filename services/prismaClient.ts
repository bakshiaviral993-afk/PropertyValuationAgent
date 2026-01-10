// services/prismaClient.ts
// Query your database using the Accelerate Client extension

// Note: In a browser environment, standard Prisma Client generation won't work 
// as it requires a Node.js runtime and local file system access.
// This client setup is provided as part of the project structure for backend/edge use.

// @ts-ignore
import { PrismaClient } from '../generated/prisma/client.js'
// @ts-ignore
import { withAccelerate } from '@prisma/extension-accelerate'

/**
 * Initializes and exports the Prisma Client with Accelerate extension.
 * DATABASE_URL must be a connection string from Prisma Accelerate.
 */
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate())

export default prisma;

/**
 * Example query to create a user based on the example schema
 */
export async function createExampleUser() {
  try {
    const user = await prisma.user.create({
      data: {
        name: 'Alice',
        email: 'alice@prisma.io',
      },
    })
    console.log('User created:', user)
    return user
  } catch (error) {
    console.error('Error creating user:', error)
  }
}
