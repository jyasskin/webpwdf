(function() {
  'use strict';
  Polymer('webpwdf-main', {
    observe: {
      'password': 'validatePassword',
      'password2': 'validatePassword',
      'retypePassword': 'validatePassword',
    },
    url: '',
    nickname: '',
    password: '',
    retypePassword: false,
    password2: '',
    N: 16384,
    r: 8,
    p: 1,
    pwLen: 16,
    suffix: '',
    urlChanged: function() {
      if (this.$.datastore.authenticated) {
        var sites = this.$.datastore.T.sites;
        var site = sites.query({origin: new URL(this.url).origin})[0];
        if (site) {
          this.nickname = site.get('nickname');
        } else if (this.nickname === '') {
          // Give a rough default for the nickname. I'd like to use the
          // component just before the ETLD, but that's harder to parse out.
          this.nickname = new URL(this.url).hostname;
        }
      }
    },
    nicknameChanged: function() {
      if (this.$.datastore.authenticated) {
        var nicknames = this.$.datastore.T.nicknames;
        var nickname = nicknames.query({name: this.nickname})[0];
        if (nickname) {
          var options = nickname.getFields();
          for (var option in options) {
            if (!options.hasOwnProperty(option)) continue;
            if (['N', 'r', 'p', 'pwLen', 'suffix'].indexOf(option) != -1) {
              this[option] = options[option];
            }
          }
        }
      }
    },
    toggleOptions: function(e) {
      this.showOptions = !this.showOptions;
      e.preventDefault();
    },
    validatePassword: function() {
      this.passwordValid = this.password !== '' && (!this.retypePassword || this.password == this.password2);
    },
    persistOptions: function() {
      if (!this.$.datastore.authenticated)
        return;
      var origin = new URL(this.url).origin;
      var sites = this.$.datastore.T.sites;
      var site = sites.query({origin: origin})[0];
      if (site)
        site.update({nickname: this.nickname});
      else
        sites.insert({origin: origin, nickname: this.nickname});

      var nicknames = this.$.datastore.T.nicknames;
      var nickname = nicknames.query({name: this.nickname})[0];
      var options = {
        name: this.nickname,
        N: this.N,
        r: this.r,
        p: this.p,
        pwLen: this.pwLen,
        suffix: this.suffix,
      };
      if (nickname)
        nickname.update(options);
      else
        nicknames.insert(options);
    },
    derivePassword: function() {
      this.persistOptions();
      this.$.scrypt.compute();
    },
    rawSitePasswordChanged: function() {
      if (this.rawSitePassword === '') {
          this.$.computedPassword.placeholder = '';
        return;
      }
      this.computedPassword = this.rawSitePassword.slice(0, this.pwLen) + this.suffix;
      this.async(function() {
        // Async to allow the bindings to fill in $.computedPassword before we try to select it.
        this.$.computedPassword.select();
        if (document.execCommand('copy')) {
          this.computedPassword = '';
          this.$.computedPassword.placeholder = 'Copied to clipboard';
        }
      })
    },
    computedPasswordChanged: function() {
      // Make it easy to clear out all the passwords.
      if (this.computedPassword === '') {
        this.password = this.password2 = '';
      }
    },
    authenticate: function(e) {
      e.preventDefault();
      this.$.datastore.authenticate();
    },
  });

  if (window.chrome && chrome.tabs) {
    // Inside a chrome extension, fill in the URL with the current page.
    var activeTab = new Promise(function(resolve, reject) {
      chrome.tabs.query({
        active: true,
        currentWindow: true,
      }, function(activeTabs) {
        if (activeTabs.length != 1) {
          console.error('Wrong number of active tabs:', activeTabs);
        }
        resolve(activeTabs[0]);
      });
    });

    document.addEventListener('WebComponentsReady', function() {
      var main = document.querySelector('webpwdf-main');
      activeTab.then(function(activeTab) {
        main.url = activeTab.url;
      });
    });
  }
})();
