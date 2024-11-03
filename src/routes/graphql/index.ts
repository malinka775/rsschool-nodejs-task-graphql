import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, parse, validate } from 'graphql';
import { schema } from './gqlSchema.js';
import depthLimit from 'graphql-depth-limit';
import { createLoaders } from './loaders.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const source = req.body.query;
      const variableValues = req.body.variables;
      const contextValue = { prisma, loaders: createLoaders(prisma) };

      const validationRules = [depthLimit(5)];
      const validationErrors = validate(schema, parse(source), validationRules);

      if (validationErrors.length > 0) {
        return { errors: validationErrors };
      }

      const response = await graphql({
        schema,
        source,
        variableValues,
        contextValue,
      });
      return response;
    },
  });
};

export default plugin;
