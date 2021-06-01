'use strict';

const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');
const axios = require('axios');

const formatDataForClient = (input) => input;

// =================
// type definitions and resolvers
// =================
const typeDefs = gql`
    type Astronaut @key(fields: "id") {
        id: ID!
        name: String
    }

    type Query {
        astronaut(id: ID!): Astronaut
        astronauts: [Astronaut]
    }
`;

const resolvers = {
    Astronaut: {
        /*
        Because we have extended the Astronaut type definition over in the Missions subgraph gql server, and a Mission's crew list contains Astronauts, that means someone could query for a mission and request for each crew member's Astronaut name which is not defined in the extended type definition of an Astronaut in the Mission subgraph. That field of "name" is defined in the Astronaut subgraph only.

        In that scenario, the query originates from the mission query type defined in the Mission subgraph and the resolver chain to fetch the mission data and the Astronaut name of every crew member goes:

        mission query resolver => Mission object's field-level resolvers (there are none in this case) => for a Mission object's crew field, the resolvers in the Mission subgraph only returns { id, missions } for an Astronaut so to resolve the "name" field, the gateway will then call this __resolveReference resolver to fetch the remainder of the requested Astronaut info as defined in this subgraph => { id, name } => and merge it with the data from the parent resolver.
        */
        __resolveReference: async (ref) => {
            // log point to identify method call
            console.log('\n__resolveReference(ref) where ref => ', ref, '\n');

            /*
            ref = {
                __typename: 'Astronaut', // this is automatically added by Apollo graphql in order for it to programatically identify objects

                id: '1' // the id is the primary @key field that is shared between subgraphs similar to use case of a primary key in a sql table.
            }
            */

            // extract needed arguments
            const { id } = ref;

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
    },
    Query: {
        astronaut: async (parent, args, context, info) => {
            // log point to identify method call
            console.log('\nquery astronaut(id) where args => ', args, '\n');

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
            // log point to identify method call
            console.log('\nquery astronauts()\n');

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
const port = 4001;

const apolloServer = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
});

// =================
// start / turn-on the server
// =================
apolloServer.listen({ port }, () => {
    console.log(
        `The graphql server containing the Astronaut subgraph is ready at http://localhost:${port}`
    );
});
