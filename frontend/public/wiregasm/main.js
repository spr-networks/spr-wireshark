function $parcel$exportWildcard(dest, source) {
  Object.keys(source).forEach(function(key) {
    if (key === 'default' || key === '__esModule' || dest.hasOwnProperty(key)) {
      return;
    }

    Object.defineProperty(dest, key, {
      enumerable: true,
      get: function get() {
        return source[key];
      }
    });
  });

  return dest;
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "Wiregasm", () => $882b6d93070905b3$export$c4e6ddb7806910b1);
var $9ba0f9a5c47c04f2$exports = {};

$parcel$export($9ba0f9a5c47c04f2$exports, "vectorToArray", () => $9ba0f9a5c47c04f2$export$4b978bcb0889dc66);
function $9ba0f9a5c47c04f2$export$4b978bcb0889dc66(vec) {
    return new Array(vec.size()).fill(0).map((_, id)=>vec.get(id));
}


var $faefaad95e5fcca0$exports = {};



class $882b6d93070905b3$export$c4e6ddb7806910b1 {
    constructor(){
        this.initialized = false;
        this.session = null;
    }
    /**
   * Initialize the wrapper and the Wiregasm module
   *
   * @param loader Loader function for the Emscripten module
   * @param overrides Overrides
   */ async init(loader, overrides = {}, beforeInit = null) {
        if (this.initialized) return;
        this.lib = await loader(overrides);
        this.uploadDir = this.lib.getUploadDirectory();
        this.pluginsDir = this.lib.getPluginsDirectory();
        if (beforeInit !== null) await beforeInit(this.lib);
        this.lib.init();
        this.initialized = true;
    }
    /**
   * Check the validity of a filter expression.
   *
   * @param filter A display filter expression
   */ test_filter(filter) {
        return this.lib.checkFilter(filter);
    }
    complete_filter(filter) {
        const out = this.lib.completeFilter(filter);
        return {
            err: out.err,
            fields: (0, $9ba0f9a5c47c04f2$export$4b978bcb0889dc66)(out.fields)
        };
    }
    reload_lua_plugins() {
        this.lib.reloadLuaPlugins();
    }
    add_plugin(name, data, opts = {}) {
        const path = this.pluginsDir + "/" + name;
        this.lib.FS.writeFile(path, data, opts);
    }
    /**
   * Load a packet trace file for analysis.
   *
   * @returns Response containing the status and summary
   */ load(name, data, opts = {}) {
        if (this.session != null) this.session.delete();
        const path = this.uploadDir + "/" + name;
        this.lib.FS.writeFile(path, data, opts);
        this.session = new this.lib.DissectSession(path);
        return this.session.load();
    }
    /**
   * Get Packet List information for a range of packets.
   *
   * @param filter Output those frames that pass this filter expression
   * @param skip Skip N frames
   * @param limit Limit the output to N frames
   */ frames(filter, skip = 0, limit = 0) {
        return this.session.getFrames(filter, skip, limit);
    }
    /**
   * Get full information about a frame including the protocol tree.
   *
   * @param number Frame number
   */ frame(num) {
        return this.session.getFrame(num);
    }
    follow(follow, filter) {
        return this.session.follow(follow, filter);
    }
    destroy() {
        if (this.initialized) {
            if (this.session !== null) {
                this.session.delete();
                this.session = null;
            }
            this.lib.destroy();
            this.initialized = false;
        }
    }
    /**
   * Returns the column headers
   */ columns() {
        const vec = this.lib.getColumns();
        // convert it from a vector to array
        return (0, $9ba0f9a5c47c04f2$export$4b978bcb0889dc66)(vec);
    }
}
$parcel$exportWildcard(module.exports, $9ba0f9a5c47c04f2$exports);
$parcel$exportWildcard(module.exports, $faefaad95e5fcca0$exports);


//# sourceMappingURL=main.js.map
