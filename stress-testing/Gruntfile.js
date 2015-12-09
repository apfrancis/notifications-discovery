module.exports = function(grunt) {

    grunt.initConfig({
        nodemon: {
            dev: {
                script: 'server/index.js',
                options: {
                    env: {
                        ELASTICSEARCH_PORT: '9200',
                        ELASTICSEARCH_HOST: 'elasticsearch'
                    },
                    ignore: ['node_modules/**'],
                    ext: 'js',
                    watch: ['server'],
                    delay: 500,
                    legacyWatch: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-nodemon');
    grunt.registerTask('dev', ['nodemon']);

};