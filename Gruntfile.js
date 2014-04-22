'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    var paths = {
        site: 'site',
        chrome_extension: 'chrome-extension',
        dist: {
            site: 'dist/site',
            chrome_extension: 'dist/chrome-extension',
        },
    };

    grunt.initConfig({
        paths: paths,
        watch: {
            options: {
                nospawn: true,
                livereload: true
            },

            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    '<%= paths.site %>/*.html',
                    '<%= paths.site %>/elements/**/*.html',
                    '{.tmp,<%= paths.site %>}/styles/{,*/}*.css',
                    '{.tmp,<%= paths.site %>}/scripts/{,*/}*.js',
                    '<%= paths.site %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    middleware: function (connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, paths.dist.site)
                        ];
                    }
                }
            },
            test: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, 'test'),
                            mountFolder(connect, paths.site)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, paths.dist.site)
                        ];
                    }
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>'
            }
        },
        clean: {
            dist: ['.tmp', 'dist'],
            server: '.tmp'
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                '<%= paths.site %>/scripts/{,*/}*.js',
                '!<%= paths.site %>/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        },
        mocha: {
            all: {
                options: {
                    run: true,
                    urls: ['http://localhost:<%= connect.options.port %>/index.html']
                }
            }
        },
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= paths.chrome_extension %>/icons',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= paths.dist.chrome_extension %>/icons'
                }]
            }
        },
        copy: {
            static: {
                files: [{
                    nonull: true,
                    expand: true,
                    cwd: '<%= paths.site %>',
                    dest: '<%= paths.dist.site %>',
                    src: [
                        'bower_components/**',
                        'elements/**',
                        'index.html',
                        'scripts/**',
                    ]
                }, {
                    nonull: true,
                    expand: true,
                    cwd: '<%= paths.site %>',
                    dest: '<%= paths.dist.chrome_extension %>',
                    src: [
                        'bower_components/**',
                        'elements/**',
                        'index.html',
                        'scripts/**',
                    ]
                }, {
                    nonull: true,
                    expand: true,
                    cwd: '<%= paths.chrome_extension %>',
                    dest: '<%= paths.dist.chrome_extension %>',
                    src: [
                        'event.js',
                        'manifest.json',
                    ]
                }],
            },
        },
    });

    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'open', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',

            'connect:livereload',
            'copy',
            'open',
            'watch'
        ]);
    });

    grunt.registerTask('test', [
        'clean:server',


        'connect:test',
        'mocha'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'copy',
        'imagemin',
    ]);

    grunt.registerTask('default', [
        'jshint',
        // 'test'
        'build'
    ]);
};
