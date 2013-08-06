// Generated by CoffeeScript 1.6.2
(function() {
  module.exports = function(grunt) {
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
    grunt.loadNpmTasks('docular');
    grunt.registerTask("build", ["clean", "coffee:dev", "uglify", "copy:example", "copy:build", "server", "watch:coffee"]);
    grunt.registerTask("server", "preview server", function() {
      grunt.log.writeln("Express server listening on port 8000");
      require("./app-server.js").listen(8000);
      return require("child_process").exec("open \"http://localhost:8000\"");
    });
    grunt.registerTask("timestamp", function() {
      return grunt.log.subhead(Date());
    });
    return grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),
      banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today(\"yyyy-mm-dd\") %>\n" + "<%= pkg.homepage ? \" * \" + pkg.homepage + \"\\n\" : \"\" %>" + " * Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.author %>;\n" + " * Licensed <%= _.pluck(pkg.licenses, \"type\").join(\", \") %>\n */\n",
      clean: ["build", "infowrap-filepicker.js", "infowrap-filepicker.min.js"],
      copy: {
        example: {
          files: [
            {
              dest: "examples/js/",
              src: ["infowrap-filepicker.js", "infowrap-filepicker.min.js"]
            }
          ]
        },
        build: {
          files: [
            {
              dest: "build/",
              src: ["infowrap-filepicker.js", "infowrap-filepicker.min.js"]
            }
          ]
        }
      },
      coffee: {
        dev: {
          options: {
            bare: true
          },
          expand: true,
          cwd: ".",
          src: ["infowrap-filepicker.coffee"],
          dest: ".",
          ext: ".js"
        }
      },
      karma: {
        options: {
          preprocessor: {
            '*.coffee': 'coffee'
          },
          singleRun: false,
          colors: true,
          growl: true,
          reporters: ['progress'],
          browsers: ['Chrome'],
          proxies: {
            '/': 'http://localhost:8000/'
          },
          captureTimeout: 10000,
          runnerPort: 9301,
          port: 9201
        },
        unit: {
          configFile: 'test/config/unit.js',
          autoWatch: true
        },
        midway: {
          configFile: "test/config/midway.js",
          autoWatch: true
        },
        e2e: {
          configFile: "test/config/e2e.js",
          singleRun: true
        }
      },
      uglify: {
        dist: {
          options: {
            banner: "<%= banner %>"
          },
          src: ["infowrap-filepicker.js"],
          dest: "infowrap-filepicker.min.js"
        }
      },
      watch: {
        coffee: {
          files: ["infowrap-filepicker.coffee"],
          tasks: ["coffee:dev"]
        }
      },
      changelog: {
        options: {
          dest: "CHANGELOG.md",
          templateFile: "lib/changelog.tpl.md",
          github: "https://github.com/infowrap/infowrap-filepicker"
        }
      },
      docular: {
        showDocularDocs: false,
        showAngularDocs: false,
        githubUrl: 'https://github.com/infowrap/infowrap-filepicker',
        docular_partial_home: 'docs/home.html',
        discussions: {
          shortName: 'infowrapfilepicker',
          url: 'http://dev.infowrap.com',
          dev: true
        },
        analytics: {
          account: 'UA-42942836-1',
          domainName: 'dev.infowrap.com'
        },
        groups: [
          {
            groupTitle: 'Develop',
            groupId: 'develop',
            groupIcon: 'icon-beer',
            showSource: true,
            sections: [
              {
                id: "setup",
                title: "Setup",
                showSource: false,
                docs: ["docs/lib/scripts/docs/setup"],
                rank: {
                  'configuration': 1,
                  'installgrunt': 2,
                  'installdocular': 3
                }
              }, {
                id: "api",
                title: "API Reference",
                showSource: false,
                docs: ["docs/lib/scripts/docs/api"],
                scripts: ["infowrap-filepicker.js"]
              }
            ]
          }
        ]
      }
    });
  };

}).call(this);
