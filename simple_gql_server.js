'use strict';

const { ApolloServer, gql } = require('apollo-server');
const axios = require('axios');

const formatDataForClient = (input) => input;

// =================
// type definitions and resolvers
// =================
const typeDefs = gql`
    type Astronaut {
        id: ID!
        name: String
    }

    type Query {
        astronaut(id: ID!): Astronaut
        astronauts: [Astronaut]
    }
`;

const resolvers = {
    Query: {
        astronaut: async (parent, args, context, info) => {
            // extract needed arguments
            const { id } = args;

            // fetch the requested data from the data source
            const responseFromDataSource = await axios.get(
                `http://localhost:3000/astronauts/${id}`
            );

            // format the data so it is in the schema defined
            const dataToReturn = formatDataForClient(
                responseFromDataSource.data
            );

            // return the data
            return dataToReturn;
        },
        astronauts: async (parent, args, context, info) => {
            // fetch the requested data from the data source
            const responseFromDataSource = await axios.get(
                `http://localhost:3000/astronauts`
            );

            // format the data so it is in the schema defined
            const dataToReturn = formatDataForClient(
                responseFromDataSource.data
            );

            // return the data
            return dataToReturn;
        },
    },
};

// =================
// configure the server
// =================
const port = 4000;

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
});

// =================
// start / turn-on the server
// =================
apolloServer.listen({ port }, () => {
    console.log(`The pure graphql server is ready at http://localhost:${port}`);
});
