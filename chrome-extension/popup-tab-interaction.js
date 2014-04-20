(function() {
  'use strict';
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
})();
