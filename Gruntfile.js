var vendorScripts = ['react', 'react-dnd', 'rx-react', 'fluxxor', 'json-stringify-safe', 'rx', 'rest', 'clone'];

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            react: {
                files: 'react_components/*.js*',
                tasks: ['browserify:app']
            }
        },

        browserify: {
            vendor: {
                src: [],
                dest: './public/scripts/vendor.js',
                options: {
                    require: vendorScripts
                }
            },            
            app: {
                src: ['react_components/**/*.jsx'],
                dest: './public/scripts/app.js',
                options: {
                    transform: [require('grunt-react').browserify],
                    external: vendorScripts
                }
            }
        },
        
        nodeunit: {
            all: ['test/test_*.js']
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('default', ['browserify', 'watch']);
};