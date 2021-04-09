#!/bin/bash

node line-block-parser-pair.test.js > test_out_orig.txt
node line-block-parser-pair.edge.test.js >> test_out_orig.txt
node line-block-parser-other.test.js >> test_out_orig.txt
node line-parser.test.js >> test_out_orig.txt