'use strict';

const elasticsearch = require('elasticsearch');
var Spinner = require('cli-spinner').Spinner;

var spinner = new Spinner('processing.. %s');
spinner.setSpinnerString('|/-\\');

const clientConfig = {
    host: process.env['ELASTICSEARCH_HOST']+':'+process.env['ELASTICSEARCH_PORT'],
    log: 'error'
};

if(process.env['ELASTICSEARCH_AUTH']){
    clientConfig.host = {
        host: process.env['ELASTICSEARCH_HOST']+':'+process.env['ELASTICSEARCH_PORT'],
        auth: process.env['ELASTICSEARCH_AUTH']
    }
}

const client = new elasticsearch.Client(clientConfig);

function createPercolatorQueriesFromDoc(number,sampleDoc,percentageToMatch,opts){
    spinner.start();
    let percent = (percentageToMatch / 100);
    let bulkArray = [];
    let offset = (opts) ? opts.offset : 0;

    for(let i=0+offset; i<number+offset; i++){
        const num = Math.random();

        let randomProperty = (num < percent) ? chooseRandomProperty(sampleDoc) : {"headline":"willnotmatch"};
        //console.info('creating','alert-'+i, 'percolator query on','percolator-index-test','with property',Object.keys(randomProperty)[0]);
        let o = {};
        o.index = createPercoatorQuery('percolator-index-test','alert-'+i,randomProperty);
        bulkArray.push(o);
        o = {};
        o.query = {match:{}};
        o.query.match = randomProperty;
        bulkArray.push(o);
    }


    spinner.stop();
    return client.bulk({
        body: bulkArray
    });
}

function createPercoatorQuery(index,id,query){
    //const queryWrapper =  {
    //    // This query will be run against documents sent to percolate
    //    query: {match:'{{query}}'}
    //};
    //
    //queryWrapper.query.match = query;

    return {
        _index: index,
        _type: '.percolator',
        _id: id
    };


    //var x = {
    //    "index" : {
    //        "_index" : "my-index",
    //        "_type" : ".percolator",
    //        "_id" : "1"
    //    } }
    //{ "query" : { "match" : { "message" : "bonsai tree" } }}
}

function chooseRandomProperty (doc) {
    const keys = Object.keys(doc);
    const randomishNumber = keys.length * Math.random() << 0;
    const o = {};
    //console.log(keys[randomishNumber]);
    //console.log(obj[keys[randomishNumber]]);
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

function createMapping(indexName,type){

    console.log('creating new mapping on index:',indexName,'type:',type);
    return client.indices.putMapping({
        index:indexName,
        type:type,
        body: {
            "properties": {
                "body": {
                    "type": "string"
                },
                "headline": {
                    "type": "string"
                }
            }
        }
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





