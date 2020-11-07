const chai = require('chai');
const mock = require('mock-require');
const rewire = require('rewire');

const expect = chai.expect;

describe('siteBuilder walk', function() {
  let siteBuilder;
  let walk;

  before(function() {
    mock('aws-sdk', {
      CloudFront: function() {},
      S3: function() {}
    });

    mock('fs', {
      readdir: function(dir, cb) {
        if (dir == null || !dir.includes('foo')) {
          cb(null, []);
        }
        else if (dir.includes('oink')) {
          cb(null, ['quack.html']);
        }
        else if (dir.includes('baa')) {
          cb(null, ['woof.csv']);
        }
        else {
          cb(null, ['oink', 'baa.txt', 'moo.pdf', 'baa']);
        }
      },
      stat: function(file, cb) {
        cb(null, {isDirectory: function() { return file.indexOf('.') === -1; }});
      }
    });

    siteBuilder = rewire('../../site-builder/index');

    walk = siteBuilder.__get__('walk');
  });

  it('lists all files in a directory tree', function() {
    let foundFiles;

    walk('/foo', function(err, files) {
      foundFiles = files;
    });

    const expectedFiles = [
      '/foo/oink/quack.html',
      '/foo/baa.txt',
      '/foo/moo.pdf',
      '/foo/baa/woof.csv',
    ];

    expect(foundFiles).to.eql(expectedFiles);
  });

  it('lists no files when directory is empty', function() {
    let foundFiles;

    walk('/oonga', function(err, files) {
      foundFiles = files;
    });

    expect(foundFiles).to.be.empty;
  });

  it('lists no files if dir is null', function() {
    let foundFiles;

    walk(null, function(err, files) {
      foundFiles = files;
    });

    expect(foundFiles).to.be.empty;
  });

  it('raises error if done is null', function() {
    expect(function() { walk('/daffodils', null); }).to.throw(TypeError);
  });

  after(function() {
    mock.stop('aws-sdk');
    mock.stop('fs');
  });
});
