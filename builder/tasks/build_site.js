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
		var env = nunjucks.configure('./');
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
		var fsx = require('fs-extra');
		var extend = require('extend');
		var wrench = require('wrench'),
			util = require('util');

		var sitemap = grunt.file.readJSON('src/sitemap.json');
		
		// overwrite : templates/blocks/* => src/blocks/*
		// overwrite : templates/assests/* => src/assests/*
		// overwrite : templates/pages/* => src/page/*
		// overwrite : templates/main.tmpl => src/main.tmpl
		var content_folders = {
			"assests":"assests/",
				"js":"js/",
				"css":"css/",
				"img":"img/",
			"pages":"pages/",
			"blocks":"blocks/",
			"templates":"templates/",
			"template":"main.tmpl",
		};
		if( "undefined" === sitemap.page_defaults.content_folders ){
			sitemap.page_defaults.content_folders = {};
		}
		for (var item in content_folders){
			if( "undefined" === sitemap.page_defaults.content_folders[item] ){
				sitemap.page_defaults.content_folders[item] = content_folders[item];
			}
		}
		
		var defaults = sitemap.page_defaults;
		var folders = defaults.content_folders;

		/*
		 * set up folders and file paths based on the sitemap with fallbacks to the builder template folder
		 */
		function resolve_path(relative_path,tested){
			tested = tested||false;
			var _path = "src/" + relative_path;
			if( true === tested ){
				_path = "builder/" + folders.templates +""+ relative_path;
			}
			try {
				var pass_test = fs.statSync(_path).isFile()||fs.statSync(_path).isDirectory();
				return pass_test ? _path : (tested ? false : resolve_path(relative_path,true));
			}
			catch (err) {
				return tested ? false : resolve_path(relative_path,true);
			}
		}

		/*
		 * set up folders and defaults
		 */
		function create_structure(){
			wrench.mkdirSyncRecursive('site/'+folders.assests, 0777);
			
			//do defaults first
			fsx.copy('builder/'+folders.templates+folders.assests, 'site/'+folders.assests+'/', function (err) {
			  if (err) {
				grunt.log.writeln(err);
			  } else {
				  grunt.log.writeln(resolve_path(folders.assests));
				grunt.log.writeln("copied defaults and is ready to recive the overrides");
			  }
			}); 
			
			//check for overrides
			fsx.copy(resolve_path(folders.assests), 'site/'+folders.assests, function (err) {
			  if (err) {
				grunt.log.writeln(err);
			  } else {
				  grunt.log.writeln(resolve_path(folders.assests));
				grunt.log.writeln("copied defaults and is ready to recive the overrides");
			  }
			}); 
		}
		create_structure();
		
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
				grunt.log.writeln(folders.template+"<<<---folders.template");
				var sourceFile = resolve_path(folders.template);
				grunt.log.writeln(sourceFile+"<<<---sourceFile");
				
				
				//var tmpFile = 'build/deletable.tmp';
				var root = page_obj.root.replace(new RegExp("[\/]+$", "g"), "");
				
				var page = page_obj.nav_key+".html";
				var targetFile = root+'/'+page;
				var content = fs.readFileSync(sourceFile,'utf8');
				
				//check for the need to use a fall back if it exists
				var re = /(?:{% include ")(.*?)(?:" -%})/gmi;
				var m;
				while ((m = re.exec(content)) !== null) {
					if (m.index === re.lastIndex) {
						re.lastIndex++;
					}
					var _path = m[1];
					var page_path = false;
					if(_path.indexOf('"+current_build+"')>0){
						page_path = _path.split('"+current_build+"').join(page_obj.nav_key);
					}
					var _resoled = resolve_path(false!==page_path?page_path:_path);
					grunt.log.writeln((false!==page_path?page_path:_path)+"<<<< LOOKING FOR THIS PATH HERE <<<<<<<<<<<<<<");
					grunt.log.writeln(_resoled+"<<<< found <<<<---------------<<<<<<<<<<");
					if( false !== _resoled){
						content = content.split('{% include "'+_path+'" -%}').join('{% include "'+_resoled+'" -%}');
					}
				}
				
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