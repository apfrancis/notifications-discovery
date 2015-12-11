'use strict';

const elasticsearch = require('elasticsearch');
const percolatorDocGenerator = require('./percolator-doc-generator');
var Spinner = require('cli-spinner').Spinner;

var spinner = new Spinner('processing.. %s');
spinner.setSpinnerString('|/-\\');

const clientConfig = {
    host: process.env['ELASTICSEARCH_HOST']+':'+process.env['ELASTICSEARCH_PORT'],
    log: 'info'
};

if(process.env['ELASTICSEARCH_AUTH']){
    clientConfig.host = {
        host: process.env['ELASTICSEARCH_HOST']+':'+process.env['ELASTICSEARCH_PORT'],
        auth: process.env['ELASTICSEARCH_AUTH']
    }
}

const client = new elasticsearch.Client(clientConfig);

function createPercolatorQueriesFromDoc(number,percentageToMatch,opts) {

    let bulkArray = [];
    let percent = (percentageToMatch / 100);
    let offset = (opts) ? opts.offset : 0;

    for(let i=0+offset; i<number+offset; i++){

        bulkArray.push({index:createPercoatorQuery('percolator-index-test','alert-'+i)});

        const query = (Math.random() < percent) ? percolatorDocGenerator.getRandomQuery() : {query:{"headline":"willnotmatch"}};
        bulkArray.push(query);
    }

    return client.bulk({
        body: bulkArray
    });
}

function createPercoatorQuery(index,id){

    return {
        _index: index,
        _type: '.percolator',
        _id: id
    };
}

function chooseRandomProperty (doc) {
    const keys = Object.keys(doc);
    const randomishNumber = keys.length * Math.random() << 0;
    const o = {};
    o[keys[randomishNumber].toString()] = doc[keys[randomishNumber]];
    return o;
}

function deleteIndices(){

    console.log('deleting indexes...');
    return client.indices.delete({
        index: '_all'
    });
}

function createNewIndex(indexName) {

    console.log('creating new index',indexName);
    return client.indices.create({index:indexName});
}

function createMapping(indexName,type,sampleDoc){

    console.log('creating new mapping on index:',indexName,'type:',type);
    client.create({
        index: indexName,
        type: type,
        body: sampleDoc,
        id: 1
    });
}

module.exports = {
    run:function(idx,type,sampleDoc){
        return deleteIndices()
            .then(function(){
                //console.log('done');
                return createNewIndex(idx)
            }).then(function(){
                return createMapping(idx,type)
            }).then(function(){
                return createPercolatorQueriesFromDoc(100000,sampleDoc,100)
            }).catch(function(error){console.log(error)});
    },
    getClient:function(){return client},
    deleteIndices:deleteIndices,
    createNewIndex:createNewIndex,
    createMapping:createMapping,
    createPercolatorQueriesFromDoc:createPercolatorQueriesFromDoc


};





