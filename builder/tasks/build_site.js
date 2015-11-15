module.exports = function(grunt) {
	grunt.registerTask('build_site', 'Set up all pages', function() {
		
		var exec = require('child_process').exec;
		var path = require('path');
		var cwd = process.cwd();
		var parentDir = path.resolve(process.cwd(), '..');
		
		function cmd_exec(cmd, args, cb_stdout, cb_end) {
			var spawn = require('child_process').spawn,
				child = spawn(cmd, args),
				me = this;
			me.exit = 0;  // Send a cb to set 1 when cmd exits
			child.stdout.on('data', function (data) { cb_stdout(me, data) });
			child.stdout.on('end', function () { cb_end(me) });
		}
		
		var nunjucks = require('nunjucks'),
			markdown = require('nunjucks-markdown');
		var env = nunjucks.configure('builder');
		env.addFilter('indexof', function(str, cmpstr) {
			return str.indexOf(cmpstr);
		});
		var marked = require('marked');
			// Async highlighting with pygmentize-bundled
			marked.setOptions({
			  highlight: function (code, lang, callback) {
				require('pygmentize-bundled')({ lang: lang, format: 'html' }, code, function (err, result) {
				  callback(err, result.toString());
				});
			  }
			});
			markdown.register(env,{
				renderer: new marked.Renderer(),
				gfm: true,
				tables: true,
				breaks: false,
				pendantic: false,
				sanitize: false,
				smartLists: true,
				smartypants: false
			});

		
		
		var fs = require('fs');
		var extend = require('extend');
		var wrench = require('wrench'),
			util = require('util');

		sitemap = grunt.file.readJSON('src/sitemap.json');
		var defaults = sitemap.page_defaults;
		
		
		/*
		 * This will apply defaults and build the nav
		 */
		function build_site_obj(){
			var nav = {};
			for (var page_key in sitemap.pages) {
				grunt.log.writeln("working "+page_key);
				
				//apply defaults were needed
				sitemap.pages[page_key].nav_key = page_key;
				//note extend will not work here, for some reason it'll alter the ref of defaults
				//we'll have to do it by hand for the moment
				for (var objKey in defaults){
					if(typeof sitemap.pages[page_key][objKey] === "undefined"){
						sitemap.pages[page_key][objKey] = defaults[objKey];
					}
				}
				
				//build nav
				var tmpobj={};
				var root = sitemap.pages[page_key].nav_root.replace(new RegExp("[\/]+$", "g"), "");
				
				var linkTitle = sitemap.pages[page_key].title;
				if(typeof sitemap.pages[page_key].nav_title !== "undefined" ){
					linkTitle = sitemap.pages[page_key].nav_title;
				}

				if(typeof sitemap.pages[page_key].nav_link !== "undefined" ){
					tmpobj[linkTitle]=sitemap.pages[page_key].nav_link;
				}else{
					tmpobj[linkTitle]=root+'/'+sitemap.pages[page_key].nav_key+".html";
				}
				if(typeof sitemap.pages[page_key].child_nav !== "undefined"){
					var r = tmpobj[linkTitle];
					var navarray = {};
					
					var mainlink= sitemap.pages[page_key].title;
					if(typeof sitemap.pages[page_key].nav_title !== "undefined" ){
						mainlink = sitemap.pages[page_key].nav_title;
					}
					navarray[mainlink] = r;
					for (var link in sitemap.pages[page_key].child_nav){
						var url = link;
						var title = sitemap.pages[page_key].child_nav[link];
						if(link.indexOf('#')==0){
							url=r+link;
						}
						navarray[title] = url;
					}
					tmpobj[linkTitle]=navarray;
				}
				nav = extend(nav,tmpobj);
				grunt.log.writeln("worked "+page_key);
			}
			sitemap.nav = nav;
		}

		build_site_obj();

		
		/*
		 * Construct the static pages
		 */
		function build_page(){
			console.log(sitemap);
			for (var key in sitemap.pages) {

				var site_obj = sitemap;
				var page_obj = site_obj.pages[key];
				grunt.log.writeln(cwd);
				var sourceFile = 'builder/templates/'+page_obj.template+'.tmpl';
				//var tmpFile = 'build/deletable.tmp';
				var root = page_obj.root.replace(new RegExp("[\/]+$", "g"), "");
				
				var page = page_obj.nav_key+".html";
				var targetFile = root+'/'+page;
				var content = fs.readFileSync(sourceFile,'utf8')
				content = content.split('{% include "').join('{% include "templates/');
				site_obj.current_page=page;
				site_obj.current_build=page_obj.nav_key;
				grunt.log.writeln("building "+targetFile);
				var tmpl = new nunjucks.Template(content,env);
				grunt.log.writeln(targetFile + " compiled");
				var res = tmpl.render(site_obj);
				grunt.log.writeln(targetFile + " renderd");
				fs.writeFile(targetFile, res, function(err){
					grunt.log.writeln("wrote to file "+targetFile);
				});

			}
		}
		build_page();

		grunt.task.current.async();
	});
};