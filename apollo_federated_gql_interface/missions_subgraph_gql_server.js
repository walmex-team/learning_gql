'use strict';

const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');
const axios = require('axios');

const formatDataForClient = (input) => input;

// =================
// type definitions and resolvers
// =================
const typeDefs = gql`
    type Mission {
        id: ID!
        crew: [Astronaut]
        designation: String!
        startDate: String
        endDate: String
    }

    # extensions are a way for you to extend a type definition that lives in another subgraph gql server using type definitions specified in this subgraph gql server.
    extend type Astronaut @key(fields: "id") {
        id: ID! @external # @external lets the gateway know this field is defined in the Astronaut subgraph and is not a new field to extend Astronaut type definition
        # add a missions field to the Astronaut type definition located in the Astronaut subgraph gql server
        missions: [Mission]
    }

    # in a federated graph, the Query type is owned by the gateway and thus all subgraph gql servers just extend from it
    extend type Query {
        mission(id: ID!): Mission
        missions: [Mission]
    }
`;

const resolvers = {
    /*
    when you extend another schema with new fields, you need to define a resolver to fill-in the data to populate those new fields.

    So for the new fields we specified in the Astronaut type definition, we need to write field-level resolvers.
    */
    Astronaut: {
        missions: async (parent, args, context, info) => {
            // log point to identify method call
            console.log(
                '\nAstronaut > missions field resolver() where parent => ',
                parent,
                '\n'
            );

            /*
            Because of the resolver chain, when it comes time to resolve the newly defined missions field, the baseline Astronaut object has already been resolved using the resolvers in the Astronaut subgraph gql server... but missing the new missions field. Since the next step in the resolver chain is to trigger field-level resolves - in this case the missions resolver - the parent is the return value of the previous resolver in the chain which is the Astronaut object minus the missions field:

            parent = Astronaut Object = {
                id: '1',
                name: 'Joe',
            }
            */
            const astronautObject = parent;

            // fetch the requested data from the data source
            const responseFromDataSource = await axios.get(
                'http://localhost:3000/missions'
            );

            // extract the data from the response
            const listOfAllMissions = responseFromDataSource.data;

            // filter and return the list of missions for only those which the specific astronaut is a part of
            return listOfAllMissions.filter(({ crew }) =>
                crew.includes(parseInt(astronautObject.id))
            );
        },
    },
    Mission: {
        /*
        this field-level resolver on the Mission object is needed to format the crew field from the mission data returned by the microservice which is of format => [1,2,3] into a list of Astronaut objects => [ {id: 1}, {id: 2}, ...] so that it fits the Astronaut schema which is what type definition of the crew field specifies above => crew: [Astronaut]

        The parent param in this case is the data returned by the query resolvers below since they are the parent resolvers in the resolver chain.
        */
        crew: (parent, args, context, info) => {
            // log point to identify method call
            console.log(
                '\nMission > crew field resolver() where parent => ',
                parent,
                '\n'
            );

            const mission = parent;
            return mission.crew.map((id) => ({ id }));
        },
    },

    Query: {
        mission: async (parent, args, context, info) => {
            // log point to identify method call
            console.log('\nquery mission(id) where args => ', args, '\n');

            // extract needed arguments
            const { id } = args;

            // fetch the requested data from the data source
            const responseFromDataSource = await axios.get(
                `http://localhost:3000/missions/${id}`
            );

            // format the data so it is in the schema defined
            const dataToReturn = formatDataForClient(
                responseFromDataSource.data
            );

            // return the data
            return dataToReturn;
        },
        missions: async (parent, args, context, info) => {
            // log point to identify method call
            console.log('\nquery missions()\n');

            // fetch the requested data from the data source
            const responseFromDataSource = await axios.get(
                'http://localhost:3000/missions'
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
const port = 4002;

const apolloServer = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
});

// =================
// start / turn-on the server
// =================
apolloServer.listen({ port }, () => {
    console.log(
        `The graphql server containing the Missions subgraph is ready at http://localhost:${port}`
    );
});
