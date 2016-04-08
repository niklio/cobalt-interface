Cobalt Interface Challenge
==========================

Prerequisites
-------------

* Xcode
    * ``xcode-select --install``
* Homebrew
    * ``/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"``
* Npm
    * ``brew install npm``
* Bower
    * ``npm install -g bower``

Setup
-----

- Clone the Github repo
```
$ git clone https://github.com/nliolios24/cobalt-interface.git
$ cd cobalt-interface
```

- Install backend dependencies
```
$ pip install -r requirements.txt
$ npm install
```

- Install and build frontend dependencies
```
$ cd app
$ bower install
$ cd ../
$ gulp vendor
```

- Start Flask server
```
$ python server.py
```

- Start Gulp watcher (Error: ENOENT can be resolved by rerunning `gulp`)
```
$ gulp
```
