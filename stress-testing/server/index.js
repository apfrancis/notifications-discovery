'use strict';

const Sync = require('sync');
const prompt = require('prompt');
const elasticsearchLoader = require('./elasticsearch-loader');
const intelDocs = require('./sample-intel-documents');

const client = elasticsearchLoader.getClient();
const indexName = 'percolator-index-test';
const typeName = 'test-type';

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
        howManyMatches: {
            description: 'How many documents would you like to match the prefined query? (expressed as a percent)',
            conform: function(value){
                return (value < 101)
            },
            message: 'Value must be less than 100%',
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

prompt.start();

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
                             .then(function(){return elasticsearchLoader.createMapping(indexName,typeName,intelDocs.getRandomDocument())});
            }

            if(result.howManyDocs) {
                chain = chain.then(function(){
                    //console.log('run',run+1);
                    console.log('pushing',result.howManyDocs, 'documents in... this may take a while');
                    let all = [];
                    if( (result.howManyDocs % profilesPerChunk) === 0 ){
                        let chunks = result.howManyDocs / profilesPerChunk;
                        console.log('dividing',result.howManyDocs,'profiles into',chunks,'chunks of',profilesPerChunk);
                        //console.log(getChunks(10000,chunks));
                        chunks = getChunks(result.howManyDocs,chunks);
                        for(let i=0; i<chunks.length; i++){
                            let offset = chunks[i]*i;
                            //console.log('offset=',offset);
                            all.push(elasticsearchLoader.createPercolatorQueriesFromDoc(chunks[i],result.howManyMatches,{offset:offset}));
                        }
                    } else {
                        all.push(elasticsearchLoader.createPercolatorQueriesFromDoc(result.howManyDocs,result.howManyMatches));
                    }
                    return Promise.all(all);
                });
            }

            if(result.percolate === 'yes') {
                chain = chain.then(function(){
                    percolateOptions.body.doc = intelDocs.getRandomDocument();
                    client.percolate(percolateOptions, function (error, response) {
                        if(error) console.log(error);
                        console.log(response);
                        console.log('percolate took',response.took,'ms');
                        console.log('matched',response.total,'documents');
                        console.log('Bye!');
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