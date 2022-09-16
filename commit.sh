#!/bin/zsh
git add $@.html
git commit -a -m "$@"
git push origin master
