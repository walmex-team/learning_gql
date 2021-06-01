'use strict';

const express = require('express');
const app = express();
//--------------------
const axios = require('axios');
const _ = require('lodash');

const formatDataForClient = (input) => input;

// =================
// configure the server
// =================
const port = 4000;

// =================
// register RESTful routes
// =================
app.get('/test', (req, res) => res.send('test is good!'));

// create endpoint for GET astronauts or an astronaut by id
app.get('/astronauts', async (request, response) => {
    // extract needed arguments
    const { id } = request.query;

    // validate the input
    if (_.isString(id) && !_.isInteger(Number(id))) {
        return response.status(400).send('id is not an integer')
    }

    let responseFromDataSource;
    if (id) {
        // if an id is specified, fetch the single astronaut
        responseFromDataSource = await axios.get(
            `http://localhost:3000/astronauts/${id}`
        );
    } else {
        // else fetch all astronauts
        responseFromDataSource = await axios.get(
            'http://localhost:3000/astronauts'
        );
    }

    // format the data for the client
    const dataToReturn = formatDataForClient(responseFromDataSource.data);

    // return the data
    return response.send(dataToReturn);
});

// =================
// start / turn-on the server
// =================
app.listen({ port }, () => {
    console.log(
        `RESTful endpoints are ready at => http://localhost:${port}/_your_endpoint_path_`
    );
});
