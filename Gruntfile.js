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
                            mountFolder(connect, paths.site)
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
                            mountFolder(connect, yeomanConfig.dist)
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
            dist: ['.tmp', '<%= paths.dist.site %>/*'],
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
    
        useminPrepare: {
            html: '<%= paths.site %>/index.html',
            options: {
                dest: '<%= paths.dist.site %>'
            }
        },
        usemin: {
            html: ['<%= paths.dist.site %>/{,*/}*.html'],
            css: ['<%= paths.dist.site %>/styles/{,*/}*.css'],
            options: {
                dirs: ['<%= paths.dist.site %>']
            }
        },
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= paths.site %>/images',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= paths.dist.site %>/images'
                }]
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= paths.dist.site %>/styles/main.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= paths.site %>/styles/{,*/}*.css'
                    ]
                }
            }
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    //collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true*/
                },
                files: [{
                    expand: true,
                    cwd: '<%= paths.site %>',
                    src: '*.html',
                    dest: '<%= paths.dist.site %>'
                }]
            }
        },
        vulcanize: {
           default: {
                    options: {
                        csp: true,
                    },
                    files: {
                        '<%= paths.dist.site %>/index.html': ['<%= paths.site %>/index.html'],
                    }
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= paths.chrome_extension %>',
                    dest: '<%= paths.dist.chrome_extension %>',
                    src: [
                        'manifest.json',
                        'event.js',
                    ]
                }]
            }
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
        'vulcanize',
        'useminPrepare',
        'imagemin',
        'htmlmin',
        // 'concat',
        'cssmin',
        // 'uglify',
        // 'copy',
        'usemin'
    ]);

    grunt.registerTask('default', [
        'jshint',
        // 'test'
        'build'
    ]);
};
