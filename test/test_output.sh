#!/bin/bash

node line-block-parser-pair.test.js > ../.temp/test_out_new.txt
node line-block-parser-pair.edge.test.js >> ../.temp/test_out_new.txt
node line-block-parser-other.test.js >> ../.temp/test_out_new.txt

diff test_out_orig.txt ../.temp/test_out_new.txt