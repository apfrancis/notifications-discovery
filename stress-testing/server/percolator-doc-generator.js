const _ = require('lodash');

const queries = [
    {
        "query": {
            "filtered": {
                "query": {
                    "match": {
                        "body": "Skylift"
                    }
                },
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "terms": {
                                    "editionRestrictions": [
                                        "1_1"
                                    ]
                                }
                            }
                        ],
                        "should": [
                            {
                                "term": {
                                    "dominantCountry": "finland"
                                }
                            },
                            {
                                "terms": {
                                    "sectors": [
                                        "Automotive"
                                    ]
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
                }
            }
        }
    },
    {
        "query": {
            "filtered": {
                "query": {
                    "match": {
                        "body": "Chairman"
                    }
                },
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "terms": {
                                    "editionRestrictions": [
                                        "8_8",
                                        "1024_8"
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
        }
    },
    {
        "query": {
            "filtered": {
                "query": {
                    "match": {
                        "headline": "COURT opt-out financing"
                    }
                },
                "filter": {
                    "bool": {
                        "should": [
                            {
                                "terms": {
                                    "editionRestrictions": [
                                        "8_2",
                                        "1024_2"
                                    ]
                                }
                            },
                            {
                                "term": {
                                    "dominantCountry": "USA"
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
                }
            }
        }
    }
];

function getRandomQuery() {
    return _(queries).shuffle().first();
}

module.exports = {
    getRandomQuery: getRandomQuery
};