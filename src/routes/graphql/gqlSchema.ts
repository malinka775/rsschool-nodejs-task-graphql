import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { UUIDType } from "./types/uuid.js";
import { PrismaClient } from "@prisma/client";

type Context = {
  prisma: PrismaClient
}

interface IUser {
  id: string,
}
interface IProfile {
  id: string,
}

type UserInput = {
  name: string;
  balance: number;
};

const UserInputFields = {
  name: { type: new GraphQLNonNull(GraphQLString) },
  balance: { type: new GraphQLNonNull(GraphQLFloat) },
};

const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: () => ({
    ...UserInputFields,
  }),
});

const ChangeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: () => ({
    ...UserInputFields,
  }),
});



const MemberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    BASIC: { value: 'BASIC' },
    BUSINESS: { value: 'BUSINESS' },
  },
});

const MemberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: new GraphQLNonNull(MemberTypeId) },
    discount: { type: new GraphQLNonNull(GraphQLFloat) },
    postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

const Profile = new GraphQLObjectType<IProfile, Context>({
  name: 'Profile',
  fields: {
    id: {type: new GraphQLNonNull(UUIDType)},
    isMale: {type: new GraphQLNonNull(GraphQLBoolean)},
    yearOfBirth: {type: new GraphQLNonNull(GraphQLInt)},
    memberType: {
      type: new GraphQLNonNull(MemberType),
      resolve: async (parent, _, { prisma }) => {
        const profileWithMemberTypeId = await prisma.profile.findUnique({
          where: { userId: parent.id },
          select: { memberTypeId: true },
        });

        if (!profileWithMemberTypeId?.memberTypeId) {
          throw new Error('Member type not found for this profile.');
        }

        return prisma.memberType.findUnique({
          where: {
            id: profileWithMemberTypeId.memberTypeId,
          },
        });
      },
    },
  }
})

const Post = new GraphQLObjectType ({
  name: 'Post',
  fields: {
    id: {type: new GraphQLNonNull(UUIDType)},
    title: {type: new GraphQLNonNull(GraphQLString)},
    content: {type: new GraphQLNonNull(GraphQLString)},
  }
})

const User = new GraphQLObjectType<IUser, Context>({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType)},
    name: { type: new GraphQLNonNull(GraphQLString)},
    balance: { type: new GraphQLNonNull(GraphQLFloat)},
    profile: {
      type: Profile,
      resolve: async(parent, _, {prisma}) => {
        return prisma.profile.findUnique({
          where: {
            userId: parent.id,
          },
        });
      },
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      resolve: async (parent, _, { prisma }) => {
        return await prisma.post.findMany({
          where: {
            authorId: parent.id,
          },
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: async (parent, _, { prisma }) =>
        await prisma.user.findMany({
          where: {
            subscribedToUser: {
              some: {
                subscriberId: parent.id,
              },
            },
          },
        }),
    },
    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: async (parent, _, { prisma }) =>
        await prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: parent.id,
              },
            },
          },
        }),
    },
  })
})

export const gqlSchema = new GraphQLSchema({
  query: new GraphQLObjectType<unknown, Context>({
    name: 'RootQuery',
    fields: {
      memberTypes: {
        type: new GraphQLList(MemberType),
        resolve: async (_, __, {prisma}) => {
          return await prisma.memberType.findMany();
        }
      },
      memberType: {
        type: MemberType,
        args: { id: { type: MemberTypeId } },
        resolve: async (_, args: {id: string}, {prisma}) => {
          return await prisma.memberType.findUnique({
            where: {
              id: args.id,
            }
          })
        }
      },
      users: {
        type: new GraphQLList(User),
        resolve: async (_, __, {prisma}) => {
          return await prisma.user.findMany();
        }
      },
      user: {
        type: User,
        args: { id: { type: UUIDType } },
        resolve: async (_, args: {id: string}, {prisma}) => {
          return await prisma.user.findUnique({
            where: {
              id: args.id,
            }
          })
        }
      },
      posts: {
        type: new GraphQLList(Post),
        resolve: async (_, __, {prisma}) => {
          return await prisma.post.findMany();
        }
      },
      post: {
        type: Post,
        args: { id: { type: UUIDType } },
        resolve: async (_, args: {id: string}, {prisma}) => {
          return await prisma.post.findUnique({
            where: {
              id: args.id,
            }
          })
        }
      },
      profiles: {
        type: new GraphQLList(Profile),
        resolve: async (_, __, {prisma}) => {
          return await prisma.profile.findMany();
        },
      },
      profile: {
        type: Profile,
        args: { id: { type: UUIDType } },
        resolve: async (_, args: {id: string}, {prisma}) => {
          return await prisma.profile.findUnique({
            where: {
              id: args.id,
            }
          })
        }
      },
    },
  }),
  mutation: new GraphQLObjectType<unknown, Context>({
    name: 'Mutation',
    fields: {
      createUser: {
        type: new GraphQLNonNull(User),
        args: {
          input: { type: new GraphQLNonNull(CreateUserInput) },
        },
        resolve: async (_, args: {input: UserInput}, {prisma}) => {
          return await prisma.user.create({data: args.input})
        }
      },
      deleteUser: {
        type: GraphQLBoolean,
        args: {
          id: {
            type: new GraphQLNonNull(UUIDType),
          },
        },
        resolve: async (_source, { id }: { id: string }, { prisma }) =>
          !!(await prisma.user.delete({
            where: {
              id,
            },
          })),
      },
      changeUser: {
        type: User,
        args: {
          id: {
            type: new GraphQLNonNull(UUIDType),
          },
          dto: {
            type: new GraphQLNonNull(ChangeUserInput),
          },
        },
        resolve: (
          _source,
          { id, dto }: { id: string; dto: UserInput },
          { prisma }: Context,
        ) =>
          prisma.user.update({
            where: { id },
            data: dto,
          }),
      },
      // createPost,
      // changePost,
      // deletePost,
      // createProfile,
      // changeProfile,
      // deleteProfile,
      // subscribeTo,
      // unsubscribeFrom
    },
  })
 });
