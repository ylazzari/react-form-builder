var vendorScripts = ['react', 'react-dnd', 'rx-react', 'fluxxor', 'json-stringify-safe', 'rx', 'rest', 'clone'];

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            react: {
                files: 'react_components/*.js*',
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
        } /*,
                
        copy: {
            main: {
                src: 'vendor.js',
                dest: 'H:/workspace/mets/mets-app-form-builder/src/main/webapp/scripts/form-creator/'
            }
        }
        */
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['browserify', 'watch']);
};