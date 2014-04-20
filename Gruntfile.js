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
                    cwd: '<%= paths.chrome_extension %>/images',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= paths.dist.chrome_extension %>/images'
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
          combine: {
                    options: {
                        inline: true,
                    },
                    files: {
                        '<%= paths.dist.site %>/index.html': ['<%= paths.site %>/index.html'],
                    }
            },
          csp: {
                    options: {
                        csp: true,
                    },
                    files: {
                        '<%= paths.dist.site %>/index.html': ['<%= paths.dist.site %>/index.html'],
                    }
            }
        },
        uglify: {
          index_js: {
            beautify: true,
            src: '<%= paths.dist.site %>/index.js',
          }
        },
        concat: {
          chrome_extension: {
            nonull: true,
            files: {
              '<%= paths.dist.chrome_extension %>/index.js': [
                '<%= paths.dist.site %>/index.js',
                '<%= paths.chrome_extension %>/popup-tab-interaction.js',
              ],
            },
          },
          vulcanizer_bug_29_workaround: {
            nonull: true,
            files: {
              '<%= paths.dist.site %>/index.html': [
                '<%= paths.dist.site %>/index.html',
                '<%= paths.site %>/script-include.html',
              ],
            },
          },
        },
        copy: {
            static: {
                files: [{
                    nonull: true,
                    expand: true,
                    cwd: '<%= paths.site %>',
                    dest: '<%= paths.dist.site %>',
                    src: [
                        'bower_components/platform/platform.js',
                        'bower_components/polymer/polymer.js',
                        'scripts/*',
                    ]
                }, {
                    nonull: true,
                    expand: true,
                    cwd: '<%= paths.site %>',
                    dest: '<%= paths.dist.chrome_extension %>',
                    src: [
                        'bower_components/platform/platform.js',
                        'bower_components/polymer/polymer.js',
                        'scripts/*',
                    ]
                }, {
                    nonull: true,
                    expand: true,
                    cwd: '<%= paths.chrome_extension %>',
                    dest: '<%= paths.dist.chrome_extension %>',
                    src: [
                        'manifest.json',
                        'event.js',
                        'icons/*',
                    ]
                }],
            },
            dist: {
                files: [{
                    nonull: true,
                    expand: true,
                    cwd: '<%= paths.dist.site %>',
                    dest: '<%= paths.dist.chrome_extension %>',
                    src: [
                        'index.html',
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
        'copy:static',
        'vulcanize:combine',
        'vulcanize:csp',
        'uglify',
        //'useminPrepare',
        'imagemin',
        //'htmlmin',
        'concat',
        //'cssmin',
        'copy:dist',
        //'usemin'
    ]);

    grunt.registerTask('default', [
        'jshint',
        // 'test'
        'build'
    ]);
};
