import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

export function createLoaders(prisma: PrismaClient) {
  const userById = new DataLoader(async (ids: readonly string[]) => {
    const users = await prisma.user.findMany({
      where: {
        id: { in: [...ids] },
      },
    });
    const sortedInOriginalOrder = ids.map((id) => users.find((user) => user.id === id));
    return sortedInOriginalOrder;
  });

  const postById = new DataLoader(async (ids: readonly string[]) => {
    const posts = await prisma.post.findMany({
      where: {
        id: { in: [...ids] },
      },
    });

    const sortedInOriginalOrder = ids.map((id) => posts.find((post) => post.id === id));
    return sortedInOriginalOrder;
  });

  const postsByAuthorId = new DataLoader(async (authorIds: readonly string[]) => {
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: [...authorIds] },
      },
    });

    const sortedInOriginalOrder = authorIds.map((authorId) =>
      posts.filter((post) => post.authorId === authorId),
    );
    posts.forEach((post) => postById.prime(post.id, post));

    return sortedInOriginalOrder;
  });

  const profileById = new DataLoader(async (ids: readonly string[]) => {
    const profiles = await prisma.profile.findMany({
      where: {
        id: { in: [...ids] },
      },
    });
    const sortedInOriginalOrder = ids.map((id) =>
      profiles.find((profile) => profile.id === id),
    );
    return sortedInOriginalOrder;
  });

  const profileByUserId = new DataLoader(async (userIds: readonly string[]) => {
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { in: [...userIds] },
      },
    });
    const sortedInOriginalOrder = userIds.map((userId) =>
      profiles.find((profile) => profile.userId === userId),
    );
    return sortedInOriginalOrder;
  });

  const userSubscribedTo = new DataLoader(async (subscriberIds: readonly string[]) => {
    const users = await prisma.user.findMany({
      where: {
        subscribedToUser: {
          some: {
            subscriberId: { in: [...subscriberIds] },
          },
        },
      },
      include: { subscribedToUser: true },
    });

    const sortedInOriginalOrder = subscriberIds.map((subscriberId) =>
      users.filter((user) =>
        user.subscribedToUser.some(
          (subscribedUser) => subscribedUser.subscriberId === subscriberId,
        ),
      ),
    );

    return sortedInOriginalOrder;
  });

  const subscribedToUser = new DataLoader(async (authorIds: readonly string[]) => {
    const users = await prisma.user.findMany({
      where: {
        userSubscribedTo: {
          some: {
            authorId: { in: [...authorIds] },
          },
        },
      },
      include: { userSubscribedTo: true },
    });

    const sortedInOriginalOrder = authorIds.map((authorId) =>
      users.filter((user) =>
        user.userSubscribedTo.some((authorUser) => authorUser.authorId === authorId),
      ),
    );

    return sortedInOriginalOrder;
  });

  const memberTypeById = new DataLoader(async (ids: readonly string[]) => {
    const memberTypes = await prisma.memberType.findMany({
      where: {
        id: { in: [...ids] },
      },
    });

    const sortedInOriginalOrder = ids.map((id) =>
      memberTypes.find((memberType) => memberType.id === id),
    );
    return sortedInOriginalOrder;
  });

  return {
    userById,
    postById,
    postsByAuthorId,
    profileById,
    profileByUserId,
    userSubscribedTo,
    subscribedToUser,
    memberTypeById,
  };
}
