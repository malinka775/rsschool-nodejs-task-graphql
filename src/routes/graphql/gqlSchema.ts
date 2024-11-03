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

const CreateUserInput = new GraphQLInputObjectType ({
  name: 'CreateUserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  },
})

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
      type: new GraphQLNonNull(Profile),
      resolve: async(parent, __, {prisma}: Context) => {
        return prisma.profile.findUnique({
          where: {
            id: parent.id
          }
        })
      }
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      resolve: (parent, _, { prisma }) => {
        return prisma.post.findMany({
          where: {
            id: parent.id,
          },
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: (parent, _, { prisma }) =>
        prisma.user.findMany({
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
      resolve: (parent, _, { prisma }) =>
        prisma.user.findMany({
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

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType<unknown, Context>({
    name: 'RootQueryType',
    fields: {
      memberTypes: { type: new GraphQLList(MemberType) },
      memberType: {
        type: MemberType,
        args: { id: { type: MemberTypeId } },
        resolve: async (_, args: {id: string}, {prisma}) => {
          return prisma.memberType.findUnique({
            where: {
              id: args.id,
            }
          })
        }
      },
      users: {
        type: new GraphQLList(User),
        resolve: async (_, __, {prisma}) => {
          return prisma.user.findMany();
        }
      },
      user: {
        type: User,
        args: { id: { type: UUIDType } },
        resolve: async (_, args: {id: string}, {prisma}) => {
          return prisma.user.findUnique({
            where: {
              id: args.id,
            }
          })
        }
      },
      posts: {
        type: new GraphQLList(Post),
        resolve: async (_, __, {prisma}) => {
          return prisma.post.findMany();
        }
      },
      post: {
        type: Post,
        args: { id: { type: UUIDType } },
        resolve: async (_, args: {id: string}, {prisma}) => {
          return prisma.post.findUnique({
            where: {
              id: args.id,
            }
          })
        }
      },
      profiles: {
        type: new GraphQLList(Profile),
        resolve: async (_, __, {prisma}) => {
          return prisma.profile.findMany();
        },
      },
      profile: {
        type: Profile,
        args: { id: { type: UUIDType } },
        resolve: async (_, args: {id: string}, {prisma}) => {
          return prisma.profile.findUnique({
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
        resolve: (_, args: {input: UserInput}, {prisma}) => {
          return prisma.user.create({data: args.input})
        }
      },
      changeUser,
      // deleteUser,
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
