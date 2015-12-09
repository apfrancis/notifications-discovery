'use strict';

const Sync = require('sync');
const prompt = require('prompt');
const elasticsearchLoader = require('./elasticsearch-loader');
const client = elasticsearchLoader.getClient();

const indexName = 'percolator-index-test';
const typeName = 'test-type';
const sampleDoc = {
    "headline": "CZECH ONLINE UP FOR SALE",
    "body": "Czech Online, the Czech ISP, was put up for sale in an auction handled by HSBC Corporate Finance. America Online and Deutsche Telekom are among more than 20 bidders which are reportedly interested in the business. COL is owned by venture capitalist DB Ostereuropa.                                                ",
};

const percolateOptions = {
    index: indexName,
    type: typeName,
    body: {
        doc: {}
    }
};

const profilesPerChunk = 20000;
let run = 0;


prompt.message = "".rainbow;

var schema = {
    properties: {
        remove: {
            description: 'Do you want to remove any existing ES indicies?',
            conform: function(value){
                return (value.toLowerCase() === 'yes' || value.toLowerCase() === 'no')
            },
            message: 'Please answer "yes" or "no"',
            required:true
        },
        howManyDocs: {
            description: 'How many percolator documents would you like to create?',
            required: true
        },
        percolate: {
            description: 'Do you want to percolate the documents when they have been added?',
            conform: function(value){
                return (value.toLowerCase() === 'yes' || value.toLowerCase() === 'no')
            },
            message: 'Please answer "yes" or "no"',
            required:true
        }
    }
};

//
// Start the prompt
//
prompt.start();

//
// Get two properties from the user: email, password
//
prompt.get(schema, function (err, result) {

    let chain = new Promise(function(resolve, reject) {
            resolve();
        });

    // Run in a fiber
    Sync(function(){
        try {
            if(result.remove === 'yes') {
                chain = chain.then(function(){return elasticsearchLoader.deleteIndices()})
                             .then(function(){return elasticsearchLoader.createNewIndex(indexName)})
                             .then(function(){return elasticsearchLoader.createMapping(indexName,typeName)});
            }

            if(result.howManyDocs) {
                chain = chain.then(function(){
                    console.log('run',run+1);
                    let all = [];
                    if( (result.howManyDocs % profilesPerChunk) === 0 ){
                        let chunks = result.howManyDocs / profilesPerChunk;
                        console.log('dividing',result.howManyDocs,'profiles into',chunks,'chunks of',profilesPerChunk);
                        //console.log(getChunks(10000,chunks));
                        chunks = getChunks(result.howManyDocs,chunks);
                        for(let i=0; i<chunks.length; i++){
                            let offset = chunks[i]*i;
                            //console.log('offset=',offset);
                            all.push(elasticsearchLoader.createPercolatorQueriesFromDoc(chunks[i],sampleDoc,100,{offset:offset}));
                        }
                    } else {
                        all.push(elasticsearchLoader.createPercolatorQueriesFromDoc(result.howManyDocs,sampleDoc,100));
                    }
                    return Promise.all(all);
                });
            }

            if(result.percolate === 'yes') {
                chain = chain.then(function(){
                    percolateOptions.body.doc = sampleDoc;
                    client.percolate(percolateOptions, function (error, response) {
                        if(error) console.log(error);
                        //console.log(response);
                        console.log('percolate took',response.took,'ms');
                        console.log('matched',response.total,'documents');
                    });
                });
            }
        }
        catch (e) {
            // If some of async functions returned an error to a callback
            // it will be thrown as exception
            console.error(e);
        }
    });
});

//elasticsearchLoader.deleteIndices()
//    .then(function(){
//        //console.log('done');
//        return elasticsearchLoader.createNewIndex(indexName)
//    }).then(function(){
//        return elasticsearchLoader.createMapping(indexName,typeName)
//    }).then(function(){
//        console.log('run',run+1);
//        let all = [];
//        if( (numberOfProfiles % profilesPerChunk) === 0 ){
//            let chunks = numberOfProfiles / profilesPerChunk;
//            console.log('dividing',numberOfProfiles,'profiles into',chunks,'chunks of',profilesPerChunk);
//            //console.log(getChunks(10000,chunks));
//            chunks = getChunks(numberOfProfiles,chunks);
//            for(let i=0; i<chunks.length; i++){
//                let offset = chunks[i]*i;
//                //console.log('offset=',offset);
//                all.push(elasticsearchLoader.createPercolatorQueriesFromDoc(chunks[i],sampleDoc,100,{offset:offset}));
//            }
//        } else {
//            all.push(elasticsearchLoader.createPercolatorQueriesFromDoc(numberOfProfiles,sampleDoc,100));
//        }
//        return Promise.all(all);
//    }).then(function(){
//        percolateOptions.body.doc = sampleDoc;
//        client.percolate(percolateOptions, function (error, response) {
//            if(error) console.log(error);
//            //console.log(response);
//            console.log('percolate took',response.took,'ms');
//            console.log('matched',response.total,'documents');
//        });
//    }).catch(function(error){console.log(error)});


function getChunks(total,chunks){
    let a;
    let values = [];
    while (total > 0 && chunks > 0) {
        if (a%2 == 0)
            a = Math.floor(total / chunks / 50) * 50;
        else
            a = Math.ceil(total / chunks / 50) * 50;
        total -= a;
        chunks--;
        values.push(a);
    }
    return values;
}