(function() {
  'use strict';
  Polymer('dropbox-datastore', {
    authenticated: false,
    client: null,
    T: {},

    keyChanged: function() {
      this.client = new Dropbox.Client({key: this.key});

      // Try to finish OAuth authorization.
      this.authenticate({interactive: false});
    },

    authenticate: function(options) {
      if (!options) {
        options = {interactive: true};
      }
      this.client.authenticate(options, function(error) {
        if (error) {
          console.error('Authentication error: ' + error);
        }
        this.authenticated = this.client.isAuthenticated();
      }.bind(this));
    },
    authenticatedChanged: function() {
      if (!this.authenticated) {
        this._datastore = null;
        return;
      }

      var datastoreManager = this.client.getDatastoreManager();
      datastoreManager.openDefaultDatastore(function (error, datastore) {
          if (error) {
              console.error('Error opening default datastore: ' + error);
          }
          this._datastore = datastore;
          this.loadTables();
      }.bind(this));
    },
    loadTables: function () {
      var tablenames = this.tables.split(/\s+/);
      tablenames.forEach(function(tablename) {
        this.T[tablename] = this._datastore.getTable(tablename);
      }, this);
    }
  });
})();
