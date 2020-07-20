const fs = require('fs');
const path = require('path');
const UglifyJS = require("uglify-js");
const sass = require('node-sass');
module.exports = function(waw){
	/*
	*	Pages Management
	*/
		fs.mkdirSync(process.cwd()+'/pages', { recursive: true });
		let pages = waw.getDirectories(process.cwd()+'/pages');
		const build = function(page){
			waw.afterWhile(page, function(){
				if (!fs.existsSync(process.cwd()+'/index.html')) {
					return console.log('Missing index.html in template root folder');
				}
				let code = fs.readFileSync(process.cwd()+'/index.html', 'utf8');
				if (fs.existsSync(page.__root+'/index.css')) {
					code = code.replace('<!-- CSS -->', fs.readFileSync(page.__root+'/index.css', 'utf8'));
				}else code = code.replace('<!-- CSS -->', '');
				if (fs.existsSync(page.__root+'/index.html')) {
					code = code.replace('<!-- HTML -->', fs.readFileSync(page.__root+'/index.html', 'utf8'));
				}else code = code.replace('<!-- HTML -->', '');
				if (fs.existsSync(page.__root+'/index.js')) {
					code = code.replace('<!-- JS -->', fs.readFileSync(page.__root+'/index.js', 'utf8'));
				}else code = code.replace('<!-- JS -->', '');
				fs.writeFileSync(page.__dist, code, 'utf8');
			});
		}
		const serve = function(page){
			let url = '/' + (page.__name!='index'&&page.__name||'');
			waw.app.get(url, function(req, res){
				res.send(waw._derer.renderFile(page.__dist, page));
			});
			build(page);
			fs.watch(page.__root, {
				recursive: true
			}, (curr, prev) => {
				build(page);
			});
		}
		for (let i = pages.length-1; i >= 0; i--) {
			let __root = pages[i];
			pages[i] = pages[i].split(path.sep).pop();
			let name = pages[i];
			if (fs.existsSync(process.cwd()+'/pages/'+name+'/page.json')) {
				pages[i] = {};
				let template = JSON.parse(fs.readFileSync(process.cwd()+'/template.json'));
				for(let each in template){
					pages[i][each] = template[each];
				}
				let page = JSON.parse(fs.readFileSync(process.cwd()+'/pages/'+name+'/page.json'));
				for(let each in page){
					pages[i][each] = page[each];
				}
				pages[i].__root = __root;
				pages[i].__dist = process.cwd()+'/dist/'+name+'.html';
				pages[i].__name = name;
				serve(pages[i]);
			}else{
				pages.splice(i, 1);
			}
		}
	/*
	*	Assets Management
	*/
		fs.mkdirSync(process.cwd()+'/dist/assets', { recursive: true });
		waw.app.use(waw.express.static(path.join(process.cwd(), 'dist')))
		fs.mkdirSync(process.cwd()+'/css', { recursive: true });
		fs.mkdirSync(process.cwd()+'/js', { recursive: true });
		const assets = function(){
			waw.afterWhile(function(){
				let files = waw.getFilesRecursively(process.cwd()+'/css', {
					end: '.css'
				});
				let css = '';
				for (var i = 0; i < files.length; i++) {
					css += fs.readFileSync(files[i], 'utf8');
				}
				css = sass.renderSync({
					data: css,
					outputStyle: 'compressed'
				}).css.toString();
				fs.writeFileSync(process.cwd()+'/dist/template.css', css, 'utf8');
				files = waw.getFilesRecursively(process.cwd()+'/js', {
					end: '.js'
				});
				let js = '';
				for (var i = 0; i < files.length; i++) {
					js += fs.readFileSync(files[i], 'utf8');
				}
				js = UglifyJS.minify(js).code;
				fs.writeFileSync(process.cwd()+'/dist/template.js', js, 'utf8');
			});
		}
		assets();
		fs.watch(process.cwd()+'/css', {
			recursive: true
		}, function(kind, name){
			if(name.endsWith('.css')) assets();
		});
		fs.watch(process.cwd()+'/js', {
			recursive: true
		}, function(kind, name){
			if(name.endsWith('.css')) assets();
		});
	/* End of */
}