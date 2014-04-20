(function() {
  'use strict';
  Polymer('pwdf-scrypt', {
    N: 16384,
    r: 8,
    p: 1,
    outLen: 64,
    base64Output: '',
    compute: function() {
      this.base64Output = CryptoJS.enc.Base64.stringify(
        CryptoJS.scrypt(this.password, this.salt, {
          N: this.N,
          r: this.r,
          p: this.p,
          outLen: this.outLen,
        }));
    },
  });
})();
