## Getting Started
To get started with the `docu build` github page builder, you first need to make sure you have the prerquicesit in place

1. Must have node.js installed
1. must have grunt and grunt cli installed
1. must enter in the docu git command alias
    - ***docuroot*** - sets up a way for the other aliases to get to the root of the gh-pages for the repo
    - ***docuinit*** - sets up the `docu build` repo as a submodule and then installs node packages via `npm install`
    - ***docuupdate*** - This will update the `docu` submodule for any new changes
    - ***docupublish*** - Publish your pages to github, NOTE: the format here is `git docupublish "your commit message"`
    
Command lines to add git aliases (**NOTE** this will be global, if you wish to not have this global remove the ` --global` flag )
```bash
git config --global alias.docuroot '!f() { cd ./$(git rev-parse --show-cdup); }; f'
git config --global alias.docuinit '!f() { git submodule add https://github.com/jeremyBass/docu-build.git docu; git docuupdate; cd docu; npm install; cd ../;}; f'
git config --global alias.docuupdate '!f() { git docuroot; git submodule init; git submodule update; }; f'
git config --global alias.docupublish '!f() { git docuroot; git docuupdate; cd docu; grunt build_site; cd ../; git add -A; git commit -m "$1"; git push; }; f'
```

