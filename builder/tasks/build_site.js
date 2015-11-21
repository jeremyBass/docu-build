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
		//clear all of the site first thing and start fresh
		fsx.removeSync('../site');
		fsx.removeSync('./build');
		
		//read the setting and load as an object
		var sitemap_path = '../src/sitemap.json';
		var sitemap = {};
		try {
			if( fs.statSync(sitemap_path).isFile() ){
				sitemap = grunt.file.readJSON(sitemap_path);
			}
		}
		catch (err) {
			// really see no need to stop for node js not having a file_exists() :\
		}


		var settings_defaults = {
			"globals":{
				"repo":{
					"name":"docu-build",
					"owner":"jeremyBass"
				},
				"google_analytics":"UA-XXXXXXXX-XX",
				"contact":{
					"department":"University Communications",
					"name":"Washington State University",
					"location":"ITB",
					"streetAddress":"ITB",
					"addressLocality":"Pullman",
					"addressRegion":"WA",
					"postalCode":"99164",
					"telephone":"(509) 335-2700",
					"email":"web.support@wsu.edu",
					"contactPoint":"https://ucomm.wsu.edu/contact/",
					"url":"https://github.com/washingtonstateuniversity"
				}
			},
			"page_defaults":{
				"root":"site/",
				"nav_root":"site/",
				"folder_root":"../site/"
			},
			"pages":{
			}
		};
		// deep so we keep what is there and only lose undefinds
		sitemap = extend(true,settings_defaults,sitemap);

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
		
		if( "undefined" === typeof sitemap.page_defaults.content_folders  ){
			sitemap.page_defaults.content_folders = {};
		}
		for (var item in content_folders){
			//grunt.log.writeln("looking for --------------->> "+item);
			if( "undefined" === typeof sitemap.page_defaults.content_folders[item] ){
				sitemap.page_defaults.content_folders[item] = content_folders[item];
			}
		}
		console.log(sitemap);
		var defaults = sitemap.page_defaults;
		var folders = defaults.content_folders;

		/*
		 * set up folders and file paths based on the sitemap with fallbacks to the builder template folder
		 */
		function resolve_path(relative_path,tested){
			tested = tested || false;
			var _path = "./build/src/" + relative_path;
			if( true === tested ){
				_path = "./builder/" + folders.templates +""+ relative_path;
			}
			try {
				return fs.existsSync(_path) ? _path : ( tested ? false : resolve_path(relative_path, true) );
			}
			catch (err) {
				return tested ? false : resolve_path(relative_path, true);
			}
		}

		/*
		 * set up folders and defaults
		 */
		function create_structure(callback){
			wrench.mkdirSyncRecursive('../site/'+folders.assests, 0777);
			wrench.mkdirSyncRecursive('./build/src', 0777);
			//wrench.mkdirSyncRecursive('./build/src', 0777);
			fsx.copy( path.resolve('../src'), path.resolve('./build/src'), function (err) {
				if (err) grunt.log.writeln(err);

				//do defaults first
				fsx.copy( path.resolve('./builder/'+folders.templates+folders.assests), path.resolve('../site/'+folders.assests), {"clobber" :true}, function (err) {
					if (err) return grunt.log.writeln(err);
					var custom_src = path.resolve('./build/src/'+folders.assests);
					if( !fs.existsSync(custom_src) || !fs.statSync(custom_src).isDirectory() ){
						// we don't need to do anything if the src is not there
						callback();
					}else{
						// we have done the defaults and know there is a 
						// src assests folder so we do the overrides now
						fsx.copy( custom_src, path.resolve('../site/'+folders.assests), {"clobber" :true}, function (err) {
							if (err) return grunt.log.writeln(err);
							callback();
						});
					}
				});
			});
		}
		

		/*
		 * This will apply defaults and build the nav
		 */
		function build_site_obj(callback){
			var nav = {};
			var pages = path.resolve('./builder/'+folders.templates+folders.pages)
			try {
				var _pages = path.resolve('./build/src/'+folders.pages);
				if( !fs.statSync(_pages).isDirectory() ){
					pages = _pages
				}
			}
			catch (err) {
				//console.log(err);
				// we don't really need to state that we couldn't find the src pages
			}
			fsx.walk(pages)
			.on('readable', function () {
				var item;
				while ((item = this.read())) {
					if( !fs.statSync(item.path).isDirectory() ){
						var content = fs.readFileSync(item.path);
						var file_name = item.path.split('\\').pop().split('.')[0];
						var re = /(?:{#\s+?\n?\r?)((?:^.*?\n?\r?)+)(?:\s+?\n?\r?#})/gmi;
						var m;
						var data_block = {};
						//console.log(content);
						while ((m = re.exec(content)) !== null) {
							if ( m.index === re.lastIndex ) {
								re.lastIndex++;
							}
							var _page_meta = m[1];
							console.log(_page_meta);
							try {
								data_block = JSON.parse(_page_meta);
							}
							catch (err) {
								console.log(err);
							}

						}
						console.log("json parsing -- ON "+file_name+"---------------/////");
						console.log(data_block);
						if( 0 < data_block.length ){
							if( "undefined" === typeof data_block.title){
								data_block["title"] = file_name.split('-').join(" ");
							}
							data_block["vars"]={
								"showstuff":true
							};
							sitemap.pages[file_name] = extend(true,data_block,sitemap.pages[file_name]);
							console.log("added to sitemap.pages[file_name] on "+file_name+"---------------/////");
						}
					}
				}
			})
			.on('end', function () {
				console.log("Starting page parsing -----------------/////");
				console.log(sitemap);
				for (var page_key in sitemap.pages) {
					//apply defaults were needed
					sitemap.pages[page_key].nav_key = page_key;
					// note extend will not work here, for some reason it'll alter the ref of defaults
					// we'll have to do it by hand for the moment
					for (var objKey in defaults){
						if( undefined ===  sitemap.pages[page_key][objKey] ){
							sitemap.pages[page_key][objKey] = defaults[objKey];
						}
					}

					//build nav
					var tmpobj={};
					var root = sitemap.pages[page_key].nav_root.replace(new RegExp("[\/]+$", "g"), "");

					var linkTitle = "";
					if( "undefined" !== typeof sitemap.pages[page_key].title  ){
						linkTitle = sitemap.pages[page_key].title;
					}
					if( "undefined" !== typeof sitemap.pages[page_key].nav_title  ){
						linkTitle = sitemap.pages[page_key].nav_title;
					}

					if( "undefined" !== typeof sitemap.pages[page_key].nav_link ){
						tmpobj[linkTitle]=sitemap.pages[page_key].nav_link;
					}else{
						tmpobj[linkTitle]= root+'/'+sitemap.pages[page_key].nav_key+".html";
					}
					if( "undefined" !== typeof sitemap.pages[page_key].child_nav ){
						var r = tmpobj[linkTitle];
						var navarray = {};
						
						var mainlink= "";
						if( "undefined" !== typeof sitemap.pages[page_key].title  ){
							mainlink= sitemap.pages[page_key].title;
						}
						if( "undefined" !== sitemap.pages[page_key].nav_title ){
							mainlink = sitemap.pages[page_key].nav_title;
						}
						navarray[mainlink] = r;
						for (var link in sitemap.pages[page_key].child_nav){
							var url = link;
							var title = sitemap.pages[page_key].child_nav[link];
							if( 0 == link.indexOf('#') ){
								url=r+link;
							}
							navarray[title] = url;
						}
						tmpobj[linkTitle]=navarray;
					}
					nav = extend(true,tmpobj,nav);
					//grunt.log.writeln("worked "+page_key);
				}
				sitemap.nav = nav;

				build_pages();
			});
		}




		/*
		 * Construct the static pages
		 */
		function build_pages(){
			console.log(sitemap);
			for (var key in sitemap.pages) {

				var site_obj = sitemap;
				var page_obj = site_obj.pages[key];

				var sourceFile = resolve_path(folders.template);

				//var tmpFile = 'build/deletable.tmp';
				var root = page_obj.root.replace(new RegExp("[\/]+$", "g"), "");

				var page = page_obj.nav_key+".html";
				var targetFile = page_obj.folder_root+page;
				var content = fs.readFileSync(sourceFile,'utf8');

				if( 0 < content.indexOf('"+current_build+"') ){
					content = content.split('"+current_build+"').join(page_obj.nav_key);
				}
				//check for the need to use a fall back if it exists
				var re = /(?:{% include ")(.*?)(?:" -%})/gmi;
				var m;
				while ((m = re.exec(content)) !== null) {
					if ( m.index === re.lastIndex ) {
						re.lastIndex++;
					}
					var _path = m[1];
					var page_path = false;
					grunt.log.writeln("resolving >> "+_path);
					var _resoled = resolve_path(_path);
					grunt.log.writeln("resolved << << "+_resoled);
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
		
		create_structure(build_site_obj);

		grunt.task.current.async();
	});
};