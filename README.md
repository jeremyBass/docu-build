## Getting Started
To get started with the `docu build` github page builder, you first need to make sure you have the prerquicesit in place

1. Must have node.js installed
1. must have grunt and grunt cli installed
1. must enter in the docu git command alias
    - ***docuroot*** - sets up a way for the other aliases to get to the root of the gh-pages for the repo
    - ***docuinit*** - sets up the `docu build` repo as a submodule and then installs node packages via `npm install`
    - ***docuupdate*** - This will update the `docu` submodule for any new changes
    - ***docudraft*** - This create the site from scratch by wiping the old folders and rendering it all again
    - ***docupublish*** - Will run `docudraft`  then publish (*commit*) your pages to github, NOTE: the format here is `git docupublish "your commit message"`
    
Command lines to add git aliases (**NOTE** this will be *global*, if you wish to not have this global remove the ` --global` flag )
```bash
git config --global alias.docuroot '!f() { cd ./$(git rev-parse --show-cdup); }; f'
git config --global alias.docuinit '!f() { git submodule add https://github.com/jeremyBass/docu-build.git docu; git docuupdate; cd docu; npm install; git checkout master; cd ../; git branch --set-upstream-to=origin/gh-pages gh-pages;}; f'
git config --global alias.docuupdate '!f() { git docuroot; git submodule init; git submodule update --remote; cd docu; git checkout master; git pull; npm install; cd ../; }; f'
git config --global alias.docudraft '!f() { git docuroot; git docuupdate; cd docu; grunt build -site; cd ../; }; f'
git config --global alias.docupublish '!f() { git docudraft; git add . -A; git commit -m "$1"; git push; }; f'
```

