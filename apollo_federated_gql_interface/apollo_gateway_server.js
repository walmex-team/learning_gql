'use strict';

const { ApolloServer } = require('apollo-server');
const { ApolloGateway } = require('@apollo/gateway');

// =================
// configure the server
// =================
const port = 4000;

/*
configure the gateway by telling it where to look for the federated schemas

Note that these services (subgraph servers) must be up and running BEFORE the gateway is started. If they are not up by the time you start the gateway or their schemas change after you have connected the gateway to them, then something needs to tell the gateway to reconnect or refresh the schema that it believes these subgraphs have. TODO - need to research into how this actually happens.
*/
const gateway = new ApolloGateway({
    serviceList: [
        { name: 'astronauts', url: 'http://localhost:4001' },
        { name: 'missions', url: 'http://localhost:4002' },
    ],
});

const apolloServer = new ApolloServer({
    gateway,
    subscriptions: false,
});

// =================
// start / turn-on the server
// =================
apolloServer.listen({ port }, () => {
    console.log(
        `The Apollo gateway server is ready at http://localhost:${port}`
    );
});
