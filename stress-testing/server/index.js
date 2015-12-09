'use strict';

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

const numberOfProfiles = 50000;
const profilesPerChunk = 20000;
let run = 0;

elasticsearchLoader.deleteIndices()
    .then(function(){
        //console.log('done');
        return elasticsearchLoader.createNewIndex(indexName)
    }).then(function(){
        return elasticsearchLoader.createMapping(indexName,typeName)
    }).then(function(){
        console.log('run',run+1);
        let all = [];
        if( (numberOfProfiles % profilesPerChunk) === 0 ){
            let chunks = numberOfProfiles / profilesPerChunk;
            console.log('dividing',numberOfProfiles,'profiles into',chunks,'chunks of',profilesPerChunk);
            //console.log(getChunks(10000,chunks));
            chunks = getChunks(numberOfProfiles,chunks);
            for(let i=0; i<chunks.length; i++){
                let offset = chunks[i]*i;
                //console.log('offset=',offset);
                all.push(elasticsearchLoader.createPercolatorQueriesFromDoc(chunks[i],sampleDoc,100,{offset:offset}));
            }
        } else {
            all.push(elasticsearchLoader.createPercolatorQueriesFromDoc(numberOfProfiles,sampleDoc,100));
        }
        return Promise.all(all);
    }).then(function(){
        percolateOptions.body.doc = sampleDoc;
        client.percolate(percolateOptions, function (error, response) {
            if(error) console.log(error);
            //console.log(response);
            console.log('percolate took',response.took,'ms');
            console.log('matched',response.total,'documents');
        });
    }).catch(function(error){console.log(error)});


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