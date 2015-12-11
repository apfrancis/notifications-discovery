var prompt = require('prompt');

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

    let chain = new Promise();

    // Run in a fiber
    Sync(function(){
        try {
            if(result.remove === 'no') {
                chain = chain.then(elasticsearchLoader.deleteIndices());
            }

            if(result.howManyDocs) {
                chain = chain.then(function(){
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