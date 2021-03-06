// sharedflow.js
// ------------------------------------------------------------------
//
// Tests for Sharedflow operations.
//
// Copyright 2017-2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// created: Sat Apr 29 09:17:48 2017
// last saved: <2021-March-22 17:33:58>

/* global describe, faker, it, path, before */

describe('Sharedflow', function() {
  const common = require('./common'),
        fs = require('fs'),
        resourceDir = "./test/resources/sharedflows",
        dateVal = new Date().valueOf(),
        namePrefix = 'apigee-edge-js-test-' + dateVal;

  this.timeout(common.testTimeout);
  this.slow(common.slowThreshold);
  common.connectApigee(function(org) {

    describe('sf-import-from-zip-and-get', function() {
      var sharedFlowList;
      var zipFileList;
      var envList;

      before(function(done){
        const actualPath = path.resolve(resourceDir);
        fs.readdir(actualPath, function(e, items) {
          assert.isNull(e, "error getting zips: " + JSON.stringify(e));
          var re = new RegExp('^sharedflow-.+\.zip$');
          items = items.filter(function(item){ return item.match(re);});
          zipFileList = items.map(function(item){ return path.resolve( path.join(resourceDir, item));});
          org.environments.get(function(e, result) {
            assert.isNull(e, "error listing: " + JSON.stringify(e));
            envList = result;
            done();
          });
        });
      });

      it('should import sharedflow zips into an org', () => {
        this.timeout(15000);
        //org.conn.verbosity = 2;
        let reducer = (p, zip) =>
          p.then( () => org.sharedflows.importFromZip({name: namePrefix + '-fromzip-' + faker.random.alphaNumeric(12), zipArchive:zip})
                  // .then ( (result) => console.log(JSON.stringify(result)))
                );

        return zipFileList
          .reduce(reducer, Promise.resolve());

      });

      it('should import sharedflow zips via the simple method', () => {
        this.timeout(15000);
        let reducer = (p, zip) =>
          p.then( () => org.sharedflows.import({name: namePrefix + '-fromzip-' + faker.random.alphaNumeric(12), source:zip}) );

        return zipFileList
          .reduce(reducer, Promise.resolve());
      });

      // DO NOT want to factor these out.
      // These tests need SFs to exist, and some orgs do not have them.

      it('should list all sharedflows for an org', function(done) {
        org.sharedflows.get({}, function(e, result){
          assert.isNull(e, "error getting sharedflows: " + JSON.stringify(e));
          assert.isDefined(result.length, "sharedflow list");
          assert.isAbove(result.length, 1, "length of sharedflow list");
          sharedFlowList = result;
          done();
        });
      });

      it('should get a few randomly-selected sharedFlows', function(done) {
        assert.isTrue(sharedFlowList && sharedFlowList.length>0);
        let fn = (item, ix, list) =>
          org.sharedflows.get({name:item})
          .then(($) => assert.equal(item, $.name, "sharedflow name"));
        common.selectNRandom(sharedFlowList, 4, fn, done);
      });

      it('should export a few sharedflows', function(done) {
        assert.isTrue(sharedFlowList && sharedFlowList.length>0);
        let fn = (item, ix, list) =>
          org.sharedflows.export({name:item})
          .then(($) => assert.isTrue($.filename.startsWith('sharedflow-'), "file name"));
        common.selectNRandom(sharedFlowList, 4, fn, done);
      });

      it('should fail to get a non-existent sharedflow', function(done) {
        var fakeName = 'sharedflow-' + faker.random.alphaNumeric(23);
        org.sharedflows.get({name:fakeName}, function(e, result){
          assert.isNotNull(e, "the expected error did not occur");
          done();
        });
      });

      it('should delete test sharedflows previously imported into this org', function(done) {
        org.sharedflows.get({}, function(e, sharedflows) {
          var numDone = 0, L = 0;
          let tick = function() { if (++numDone >= L) { done(); } };

          assert.isNull(e, "error getting sharedflows: " + JSON.stringify(e));
          assert.isAbove(sharedflows.length, 1, "length of SF list");
          L = sharedflows.length;
          sharedflows.forEach(function(sf) {
            if (sf.startsWith(namePrefix + '-fromzip-')) {
              org.sharedflows.del({name:sf}, function(e, proxies) {
                assert.isNull(e, "error deleting sharedflow: " + JSON.stringify(e));
                tick();
              });
            }
            else { tick(); }
          });
        });
      });
    });


    // describe('get', function() {
    //
    //   before(function(done){
    //     org.sharedflows.get({}, function(e, result){
    //       assert.isNull(e, "error getting sharedflows: " + JSON.stringify(e));
    //       assert.isDefined(result.length, "sharedflow list");
    //       assert.isAbove(result.length, 1, "length of sharedflow list");
    //       sharedFlowList = result;
    //       done();
    //     });
    //   });
    //
    //
    // });

  });


});
