import prisma from '../prisma';
import { User } from '../models/user';

export class UserService {
  public async register(user: User): Promise<User> {
      const newUserData: User = await prisma.user.create({data: user});
      return newUserData;
  }
  
  public async count() {
      const count: number = await prisma.user.count();
      return count;
  }

  public async findAll(): Promise<User[]> {
    const userList: User[] = await prisma.user.findMany({
        include: {
            _count: {
                select: {
                    userDevices: true
                }
            },
        }
    });
    return userList;
  }

  public async findUserByUserId(userId: string): Promise<User | null> {
      const user: User | null  = await prisma.user.findUnique({
          where: {
              user_id: userId
          },
          include: {
            userDevices: {
                include: { 
                    device: true
                }
            }
          }
      });
      return user;
  }

  public async findUserById(id: number): Promise<User | null> {
      const user: User | null  = await prisma.user.findUnique({
        where: {
            id: id 
        },
      });
      return user;
  }

  public async find(page: number, count: number): Promise<User[]> {
      const userList: User[] = await prisma.user.findMany({
          orderBy: {
              created_date: 'desc'
          },
          skip: (page - 1) * count,
          take: count
      });
      return userList;
  }

  public async updateLastLoginDate(id: number) {
    await prisma.user.update({
      where: {
          id: id
      },
      data: {
        last_login_date: new Date()
      }
    });
  }

  public async update(id: number, user: User): Promise<User | null> {
      const userData: User | null  = await prisma.user.update({
          where: {
              id: id
          },
          data: user
      });
      return userData;
  }

  public async delete(id: number) {
    const deleteUser = prisma.user.delete({
        where: {
            id: id
        }
    })
    return deleteUser;
  }
}