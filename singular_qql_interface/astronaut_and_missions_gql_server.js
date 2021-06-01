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
        missions: [Mission]
    }

    type Mission {
        id: ID!
        crew: [Astronaut]
        designation: String!
        startDate: String
        endDate: String
    }

    type Query {
        astronaut(id: ID!): Astronaut
        astronauts: [Astronaut]

        mission(id: ID!): Mission
        missions: [Mission]
    }
`;

const resolvers = {
    Astronaut: {
        name: async (parent, args, context, info) => {
            // log point to identify method call
            console.log(
                '\nAstronaut > name field resolver() where parent => ',
                parent,
                '\n'
            );

            // extract needed arguments
            const { id } = parent;

            // fetch the requested data from the data source
            const responseFromDataSource = await axios.get(
                `http://localhost:3000/astronauts/${id}`
            );

            // format the data so it is in the schema defined
            const dataToReturn = formatDataForClient(
                responseFromDataSource.data
            );

            // return the data
            return dataToReturn.name;
        },

        missions: async (parent, args, context, info) => {
            // log point to identify method call
            console.log(
                '\nAstronaut > missions field resolver() where parent => ',
                parent,
                '\n'
            );

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
const port = 4000;

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
});

// =================
// start / turn-on the server
// =================
apolloServer.listen({ port }, () => {
    console.log(`The graphql server is ready at http://localhost:${port}`);
});
