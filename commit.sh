#!/bin/zsh
git add $@
git commit -a -m "$@"
git push origin master
