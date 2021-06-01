'use strict';

const express = require('express');
const app = express();
//--------------------
const { ApolloServer, gql } = require('apollo-server-express');
const axios = require('axios');

const formatDataForClient = (input) => input;

// =================
// type definitions and resolvers
// =================

/*
Type definitions outline how to query and what the response schema will be of a query. This is no different that the type of information you look for in Swagger Docs (how to call an endpoint, what the endpoint can return).

Resolvers are the functions that define how a query will end up responding with the schema. This is the equivalent of what is commonly called a "handler" method for any RESTful endpoint in an express server.
*/

const typeDefs = gql`
    # this type definition defines the schema of the responses for the below query types
    type Astronaut {
        id: ID!
        name: String
    }

    # a Query or Mutation are the 2 types of actions a client can request of the graph server (get me data or mutate data for me). (see the TLDR section below in the "Necessary learning of graphql basics" section to learn about these 2 actions)
    type Query {
        # defining this query type field is basically the equivalent of defining a RESTful endpoint of GET astronaut by id and defining the schema of the response, in this case, an Astronaut type object
        astronaut(id: ID!): Astronaut

        # defining this query type field is basically the equivalent of a defining RESTful endpoint of GET all astronauts and defining the schema of the response, in this case, a list of Astronaut type objects
        astronauts: [Astronaut]
    }
`;

const resolvers = {
    Query: {
        // https://www.apollographql.com/docs/apollo-server/data/resolvers/#defining-a-resolver
        astronaut: async (parent, args, context, info) => {
            // extract needed arguments
            const { id } = args;

            // fetch the requested data from the data source
            const responseFromDataSource = await axios.get(
                `http://localhost:3000/astronauts/${id}`
            );

            /*
            format the data so it is in the schema defined

            The returned data NEEDS TO HAVE the schema of an astronaut object as defined in the type definitions.
            ex. {
                id: '1',
                name: 'Joe'
            }
            Otherwise, server will respond with an error to the client
            */
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

/*
apply the apollo server as middleware to the express server so it will create a /graphql endpoint on your server where you can make graphql requests by calling

POST .../graphql
requestBody = {
    // in the body will be the graphql query as a string
}

https://www.apollographql.com/blog/backend/using-express-with-graphql-server-node-js/
*/
apolloServer.applyMiddleware({ app });

// =================
// register RESTful routes
// =================

/*
since we are just applying the apollo server as middleware to our express server, you could add REST endpoints on your express server as well if you want.

If you wanted a node server that was purely dedicated to serve only graphql queries and will never have RESTful endpoints, see the simple_gql_server for this implementation.
*/
app.get('/test', (req, res) => res.send('test is good!'));

// =================
// start / turn-on the server
// =================
app.listen({ port }, () => {
    console.log(
        `Graphql endpoint is at http://localhost:${port}${apolloServer.graphqlPath}`
    );
    console.log(
        `RESTful endpoints are ready too! => http://localhost:${port}/_your_endpoint_path_`
    );
});

// =================
// TLDR:
/*
-------------------------------------
These different resolver syntax represent the same thing
-------------------------------------

const resolvers = {
    Query: {
        // where the function name is the key name and the value is the function
        astronaut(parent, args, context, info) { ... }

        // where they key name is explicitly a key and the value is explicitly a function
        astronaut: (parent, args, context, info) => { ... }
    }
}
-------------------------------------
Bare minimum to create a way to query data on your graph server:
-------------------------------------

To create a way to query data, all you need is:

- type definitions that define the schema of the data your query will return

ex. my query will return an astronaut object that has the id and name of the astronaut

type Astronaut: {
    id: ID!, => ex return value is '1'
    name: String => ex return value is 'Joe'
}

- a Query type definition that defines what the query will return and how to call it

ex. my query will be called using the syntax => astronaut(the_id_of_the_astronaut_I_want), and I will expect an astronaut object in return

type Query {
    // <how to call the query>: <return data's schema>
    astronaut(id: ID!): Astronaut
}

- a Resolver function mapped to that Query or Mutation type definition that will return the data in schema that you defined

const resolvers = {
    Query {
        astronaut: (parent, args, context, info) => {
            // logic to return the Astronaut object defined in your type definition

            return astronautObject
        }
    }
}

-------------------------------------
Necessary learning of graphql basics: (syntax, calling patterns, etc.)
-------------------------------------
- Data Types / Type Defs = https://graphql.org/learn/schema/#scalar-types

- Queries / Mutations and a bunch of stuff related to how to specify what is essentially the equivalent of a REST endpoint = https://graphql.org/learn/queries/

- How to call the client can call the graph server and use variables = https://atheros.ai/blog/graphql-quick-tip-how-to-pass-variables-in-graphiql

- Intro to resolvers - https://www.apollographql.com/docs/apollo-server/data/resolvers/#defining-a-resolver

- Video showing how to code a resolver - https://www.youtube.com/watch?v=pI5CKxyrbiI

- Resolver chain and how Graphql resolves nested fields => - https://www.apollographql.com/docs/apollo-server/data/resolvers/#resolver-chains

- how to optimize resolver calls using data loaders (https://www.youtube.com/watch?v=ld2_AS4l19g)

*/
// =================
