var vendorScripts = ['react', 'react-dnd', 'rx-react', 'fluxxor', 'json-stringify-safe', 'rx', 'rest'];

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            react: {
                files: 'react_components/*.jsx',
                tasks: ['browserify:client']
            }
        },

        browserify: {
            vendor: {
                src: [],
                dest: 'vendor.js',
                options: {
                    require: vendorScripts
                }
            },            
            client: {
                src: ['react_components/**/*.jsx'],
                dest: 'bundle.js',
                options: {
                    transform: [require('grunt-react').browserify],
                    external: vendorScripts
                }
            }
        },
        
        nodeunit: {
            all: ['test/test_*.js']
        },
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('default', ['browserify', 'watch']);
};