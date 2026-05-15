#!/usr/bin/env bash
cd ~/Projects/Overlord
git status -sb
git rev-list --left-right --count main...HEAD
