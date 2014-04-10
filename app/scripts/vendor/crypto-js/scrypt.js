/*-
 * Copyright 2013 Jeffrey Yasskin
 * Copied from original C code under the following license, and then
 * translated to JavaScript.
 *
 * Copyright 2009 Colin Percival
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * This file was originally written by Colin Percival as part of the Tarsnap
 * online backup system.
 */

(function() {
    function scrypt_env(N, r, p) {
        N = N|0;
        r = r|0;
        p = p|0;
        var V_size = 128 * r * N |0;
        var Input_size = 128 * r * p |0;
        var XY_size = 256 * r + 64 |0;
        var salsa20_8_x_size = 16<<2;

        function asm(stdlib, foreign, heap) {
            // In Firefox, add: "use asm";

            var imul = stdlib.Math.imul;

            var HEAP8 = new stdlib.Uint8Array(heap);
            var HEAP32 = new stdlib.Uint32Array(heap);

            var N = foreign.N|0;
            var r = foreign.r|0;
            var p = foreign.p|0;
            var V_size = foreign.V_size|0;
            var XY_size = foreign.XY_size|0;
            var salsa20_8_x_size = foreign.salsa20_8_x_size |0;
            var Input_size = foreign.Input_size|0;
            var V = 0;
            var XY = foreign.XY |0;
            var salsa20_8_x = foreign.salsa20_8_x |0;
            var Input = foreign.Input|0;

            // Array access:
            function get8(array, index) {
                array = array|0;
                index = index|0;
                return HEAP8[array + index >>0]|0;
            }
            function set8(array, index, value) {
                array = array|0;
                index = index|0;
                value = value|0;
                HEAP8[array + index >>0] = value;
            }
            function get32(array, index) {
                array = array|0;
                index = index|0;
                return HEAP32[array + (index<<2) >>2]|0;
            }
            function set32(array, index, value) {
                array = array|0;
                index = index|0;
                value = value|0;
                HEAP32[array + (index << 2) >>2] = value;
            }
            /** Returns &array[index] for a 32-bit array. */
            function offset32(array, index) {
                array = array|0;
                index = index|0;
                return array + (index<<2) |0;
            }

            function blkcpy8(dest, src, len)
            {
                dest = dest|0;
                src = src|0;
                len = len|0;
                var i = 0;

                for (i = 0; (i|0) < (len|0); i=i+4|0)
                    HEAP32[dest + i >>2] = HEAP32[src + i >>2];
            }

            function blkxor8(dest, src, len)
            {
                dest = dest|0;
                src = src|0;
                len = len|0;
                var i = 0;

                for (i = 0; (i|0) < (len|0); i=i+4|0)
                    HEAP32[dest + i >>2] = HEAP32[dest + i >>2] ^ HEAP32[src + i >>2];
            }

            // scrypt components:
            function xor_rotate(target_index, src1, src2, rotation) {
                target_index = target_index|0;
                src1 = src1|0;
                src2 = src2|0;
                rotation = rotation|0;
                var a = 0;
                var b = 0;
                a = (get32(salsa20_8_x, src1)|0) +
                    (get32(salsa20_8_x, src2)|0) |0;
                b = rotation|0;
                set32(salsa20_8_x, target_index,
                      (get32(salsa20_8_x, target_index)|0) ^
                      ((a << b) | (a >>> (32 - b))));
            };


            /**
             * salsa20_8(B):
             * Apply the salsa20/8 core to the provided (int32) block.
             */
            function salsa20_8(B)
            {
                B = B|0;
                var i = 0;

                blkcpy8(salsa20_8_x, B, 64);
                for (i = 0; (i|0) < 8; i = i+2|0) {
                    /* Operate on columns. */
                    xor_rotate(4, 0, 12, 7); xor_rotate(8, 4, 0, 9);
                    xor_rotate(12, 8, 4, 13); xor_rotate(0, 12, 8, 18);

                    xor_rotate(9, 5, 1, 7); xor_rotate(13, 9, 5, 9);
                    xor_rotate(1, 13, 9, 13); xor_rotate(5, 1, 13, 18);

                    xor_rotate(14, 10, 6, 7); xor_rotate(2, 14, 10, 9);
                    xor_rotate(6, 2, 14, 13); xor_rotate(10, 6, 2, 18);

                    xor_rotate(3, 15, 11, 7); xor_rotate(7, 3, 15, 9);
                    xor_rotate(11, 7, 3, 13); xor_rotate(15, 11, 7, 18);

                    /* Operate on rows. */
                    xor_rotate(1, 0, 3, 7); xor_rotate(2, 1, 0, 9);
                    xor_rotate(3, 2, 1, 13); xor_rotate(0, 3, 2, 18);

                    xor_rotate(6, 5, 4, 7); xor_rotate(7, 6, 5, 9);
                    xor_rotate(4, 7, 6, 13); xor_rotate(5, 4, 7, 18);

                    xor_rotate(11, 10, 9, 7); xor_rotate(8, 11, 10, 9);
                    xor_rotate(9, 8, 11, 13); xor_rotate(10, 9, 8, 18);

                    xor_rotate(12, 15, 14, 7); xor_rotate(13, 12, 15, 9);
                    xor_rotate(14, 13, 12, 13); xor_rotate(15, 14, 13, 18);
                }
                for (i = 0; (i|0) < 16; i=i+1|0)
                    set32(B, i, (get32(B, i)|0) + (get32(salsa20_8_x, i)|0) |0);
            }

            /**
             * blockmix_salsa8(Bin, Bout, X, r):
             * Compute Bout = BlockMix_{salsa20/8, r}(Bin).  The input Bin must be 128r
             * bytes in length; the output Bout must also be the same size.  The
             * temporary space X must be 64 bytes.
             *
             * Bin = uint32*
             * Bout = uint32*
             * X = uint32*
             */
            function blockmix_salsa8(Bin, Bout, X)
            {
                Bin = Bin|0;
                Bout = Bout|0;
                X = X|0;
                var i = 0;

                /* 1: X <-- B_{2r - 1} */
                blkcpy8(X, offset32(Bin, imul(((2 * r)|0) - 1, 16)|0)|0, 64);

                /* 2: for i = 0 to 2r - 1 do */
                for (i = 0; (i|0) < (2 * r|0); i = i+2|0) {
                    /* 3: X <-- H(X \xor B_i) */
                    blkxor8(X, offset32(Bin, (i * 16)|0)|0, 64);
                    salsa20_8(X);

                    /* 4: Y_i <-- X */
                    /* 6: B' <-- (Y_0, Y_2 ... Y_{2r-2}, Y_1, Y_3 ... Y_{2r-1}) */
                    blkcpy8(offset32(Bout, (i * 8)|0)|0, X, 64);

                    /* 3: X <-- H(X \xor B_i) */
                    blkxor8(X, offset32(Bin, (i * 16)|0 + 16)|0, 64);
                    salsa20_8(X);

                    /* 4: Y_i <-- X */
                    /* 6: B' <-- (Y_0, Y_2 ... Y_{2r-2}, Y_1, Y_3 ... Y_{2r-1}) */
                    blkcpy8(offset32(Bout, ((i * 8)|0) + ((r * 16)|0) |0)|0, X, 64);
                }
            }

            /**
             * integerify(B, r):
             * @param {int} B the address of a block
             * @return {int} the result of parsing B_{2r-1} as a little-endian integer.
             */
            function integerify(B)
            {
                B = B|0;
                // The original code parses a 64-bit little-endian number,
                // but JS can't support >32-bit arrays anyway.
                return HEAP32[(B + (imul(((2 * r)|0) - 1, 64)|0)) >>2] |0;
            }

            function le32dec(addr) {
                addr = addr|0;
                return ((get8(addr, 0)|0) << 0   |
                        (get8(addr, 1)|0) << 8   |
                        (get8(addr, 2)|0) << 16  |
                        (get8(addr, 3)|0) << 24) |0;
            }
            function le32enc(addr, value) {
                addr = addr|0;
                value = value|0;
                set8(addr, 0, (value >> 0) & 0xff);
                set8(addr, 1, (value >> 8) & 0xff);
                set8(addr, 2, (value >> 16) & 0xff);
                set8(addr, 3, (value >> 24) & 0xff);
            }

            /**
             * smix(B, r, N, V, XY):
             * Compute B = SMix_r(B, N).  The input B must be 128r bytes in length;
             * the temporary storage V must be 128rN bytes in length; the temporary
             * storage XY must be 256r + 64 bytes in length.  The value N must be a
             * power of 2 greater than 1.  The arrays B, V, and XY must be aligned to a
             * multiple of 64 bytes.
             */
            function smix(B)
            {
                B = B|0;
                var X = 0;
                var Y = 0;
                var Z = 0;
                var i = 0;
                var j = 0;
                var k = 0;
                X = XY;
                Y = offset32(XY, (32 * r)|0) |0;
                Z = offset32(XY, (64 * r)|0) |0;

                /* 1: X <-- B */
                for (k = 0; (k|0) < (32 * r|0); k=k+1|0)
                    set32(X, k, le32dec(B + ((4 * k)|0)|0)|0);

                /* 2: for i = 0 to N - 1 do */
                for (i = 0; (i|0) < (N|0); i = i+2|0) {
                    /* 3: V_i <-- X */
                    blkcpy8(offset32(V, imul(i, (32 * r)|0)|0)|0, X, (128 * r)|0);

                    /* 4: X <-- H(X) */
                    blockmix_salsa8(X, Y, Z);

                    /* 3: V_i <-- X */
                    blkcpy8(offset32(V, imul(i + 1, (32 * r)|0)|0)|0, Y, (128 * r)|0);

                    /* 4: X <-- H(X) */
                    blockmix_salsa8(Y, X, Z);
                }

                /* 6: for i = 0 to N - 1 do */
                for (i = 0; (i|0) < (N|0); i = i+2|0) {
                    /* 7: j <-- Integerify(X) mod N */
                    j = (integerify(X)|0) & (N - 1);

                    /* 8: X <-- H(X \xor V_j) */
                    blkxor8(X, offset32(V, imul(j, (32 * r)|0)|0)|0, (128 * r)|0);
                    blockmix_salsa8(X, Y, Z);

                    /* 7: j <-- Integerify(X) mod N */
                    j = (integerify(Y)|0) & (N - 1);

                    /* 8: X <-- H(X \xor V_j) */
                    blkxor8(Y, offset32(V, imul(j, (32 * r)|0)|0)|0, (128 * r)|0);
                    blockmix_salsa8(Y, X, Z);
                }

                /* 10: B' <-- X */
                for (k = 0; (k|0) < (32 * r|0); k=k+1|0)
                    le32enc(B + ((4 * k)|0) |0, get32(X, k)|0);
            }

            function smix_loop() {
                var i = 0;
                for (i = 0; (i|0) < (p|0); i=i+1|0) {
                    smix(Input + (imul((i * 128)|0, r)|0)|0);
                }
            }
            return {salsa20_8: salsa20_8,
                    blockmix_salsa8: blockmix_salsa8,
                    smix: smix,
                    smix_loop: smix_loop};
        }
        var total_size = V_size + XY_size + salsa20_8_x_size + Input_size;
        if ((total_size & (total_size - 1)) != 0) {
            // Round up to a power of 2
            var orig_size = total_size;
            total_size = 1;
            while (orig_size > 0) {
                orig_size = orig_size >>> 1;
                total_size = total_size << 1;
            }
        }
        var heap = new ArrayBuffer(total_size);
        var input_addr = V_size + XY_size + salsa20_8_x_size;
        // In Firefox, avoid "TypeError: asm.js link error: As a temporary
        // limitation, modules cannot be linked more than once. This limitation
        // should be removed in a future release. To work around this, compile a
        // second module (e.g., using the Function constructor)."
        if (navigator.userAgent.indexOf('Firefox') != -1) {
            var asm_src = asm.toString();
            asm_src = asm_src.split('\n').slice(1, -1).join('\n');
            asm = new Function('stdlib', 'foreign', 'heap', '"use asm";\n' + asm_src);
        }

        asm_module = asm(window,
                         {N: N, r: r, p: p,
                          V_size: V_size,
                          XY_size: XY_size,
                          salsa20_8_x_size: salsa20_8_x_size,
                          Input_size: Input_size,
                          XY: V_size,
                          salsa20_8_x: V_size + XY_size,
                          Input: input_addr,
                         }, heap);
        return {input_output: new Uint8Array(heap, input_addr, Input_size),
                input_addr: input_addr,
                salsa20_8: asm_module.salsa20_8,
                blockmix_salsa8: asm_module.blockmix_salsa8,
                smix: asm_module.smix,
                smix_loop: asm_module.smix_loop};
    }

    function string_to_array(str) {
      var result = [];
      var bytes = str.toUpperCase().replace(/[^0-9A-F]/g, '');
      function fromHex(c) {
        if (c <= '9'.charCodeAt(0))
          return c - '0'.charCodeAt(0);
        return c - 'A'.charCodeAt(0) + 10;
      }
      for (var i = 0; i+1 < bytes.length; i+=2) {
        result[i/2] = fromHex(bytes.charCodeAt(i))<<4 | fromHex(bytes.charCodeAt(i+1));
      }
      return result;
    }

    // Depends on:
    //    <script src="core.js"></script>
    //    <script src="lib-typedarrays.js"></script>
    //    <script src="sha256.js"></script>
    //    <script src="hmac.js"></script>
    //    <script src="pbkdf2.js"></script>

    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var C_algo = C.algo;
    var SHA256 = C_algo.SHA256;

    C_algo.scrypt = Base.extend({
        /**
         * Configuration options.
         *
         * @property {number} N CPU/memory cost parameter. Must be a power of 2.
         * @property {number} r Block size parameter. Default: 8
         * @property {number} p Parallelization parameter. Default: 1
         * @property {number} outLen The output length to generate, in bytes. Default: 64
         * @property {Hasher} hasher The hasher to use. Default: SHA256
         */
        cfg: Base.extend({
            N: 0,
            r: 8,
            p: 1,
            outLen: 64,
            hasher: SHA256
        }),

        /**
         * Allocates memory for the scrypt key derivation function.
         *
         * @param {Object} cfg The configuration options to use. At least 'N' is required.
         */
        init: function(cfg) {
            this.cfg = this.cfg.extend(cfg);
            this.env = scrypt_env(this.cfg.N, this.cfg.r, this.cfg.p);
        },

        /**
         * Computes scrypt.
         *
         * @param {WordArray|string} password
         * @param {WordArray|string} salt
         *
         * @return {WordArray} The derived key.
         */
        compute: function (password, salt) {
            var cfg = this.cfg;
            function PBKDF(passwd, salt, c, keylen) {
                return C.PBKDF2(passwd, salt, {
                    hasher: cfg.hasher,
                    iterations: c,
                    keySize: keylen / 4});
            }
            var input = string_to_array(CryptoJS.enc.Hex.stringify(
                PBKDF(password, salt, 1, 128 * cfg.p * cfg.r)));
            this.env.input_output.set(input);
            this.env.smix_loop();
            return PBKDF(password, this.env.input_output, 1, cfg.outLen);
        }
    });

    C.scrypt = function(password, salt, cfg) {
        return C_algo.scrypt.create(cfg).compute(password, salt);
    }
})();
