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
                    require: ['react', 'rx-react', 'fluxxor']
                }
            },            
            client: {
                src: ['react_components/**/*.jsx'],
                dest: 'bundle.js',
                options: {
                    transform: [require('grunt-react').browserify],
                    external: ['react', 'rx-react', 'fluxxor']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['browserify', 'watch']);
};