/* 
 * Location: within the server itself
 * State: bare
*/
module.exports = function(grunt) {
	grunt.registerTask('initiate', 'normalize the build call, ie grunt build named_task', function( ) {

        var util = require('util');
        var lastout;
        
        function output_stream(sdt_stream,prefix,sufix){
			prefix = prefix||"";
			sufix = sufix||"";
			var out = sdt_stream.toString().trim();
			if( '\n' !== out && null !== out && "" !== out && lastout !== out){
				lastout = out;
				out = out.split('\n\n').join('\n');
				util.print( prefix + out + sufix );
				grunt.stdoutlog( "[output_stream] " + prefix + out + sufix ,true);
			}
		}
/*
        var spawnCommand = require('spawn-command'),
            ls = spawnCommand('cd / && '+gitArg.join(' '));

        var lastout;
        ls.stdout.on('data', function (data) {
            output_stream(data,'\n');
        });
        ls.stderr.on('data', function (data) {
            output_stream(data,'\n');
        });
        ls.on('exit', function (code) {
            output_stream(code,'\n','<<<<<<<< finished sever '+_app_op.install_dir+'\n');
            if(app_obj.length>0){
                load_apps(app_obj,callback);
            }else{
                grunt.stdoutlog("Finished app downloads",true);
                if( "function" === typeof callback ){
                    callback(); //we just finished the last one exit out
                }
            }
        });
        */
        
        
		//done();
		grunt.task.current.async();
	});
};