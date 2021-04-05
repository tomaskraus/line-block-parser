#!/bin/bash

node line-block-parser-pair.test.js > ../.temp/test_out_orig.txt
node line-block-parser-pair.edge.test.js >> ../.temp/test_out_orig.txt
