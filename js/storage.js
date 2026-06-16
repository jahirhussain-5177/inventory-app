var MasterDB = {
  _models: [],
  _provinces: [],
  _supabaseUrl: '',
  _supabaseKey: '',

  init: function() {
    var self = this;
    var configEl = document.getElementById('supabase-config');
    if (configEl) {
      try {
        var cfg = JSON.parse(configEl.textContent);
        this._supabaseUrl = cfg.url;
        this._supabaseKey = cfg.key;
      } catch (e) {}
    }
    if (!this._supabaseUrl) {
      this._supabaseUrl = 'REPLACE_WITH_YOUR_SUPABASE_URL';
      this._supabaseKey = 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';
    }
    return Promise.all([this._fetchModels(), this._fetchProvinces()]);
  },

  getModels: function() {
    return this._models;
  },

  getProvinces: function() {
    return this._provinces;
  },

  addModel: function(name) {
    var self = this;
    var tempId = 'tmp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    this._models.push({ id: tempId, name: name });
    this._apiCall('POST', 'master_models', '', { name: name }).then(function() {
      return self._fetchModels();
    }).catch(function(e) {
      console.error('Supabase POST master_models error:', e.message);
    });
  },

  addProvince: function(name) {
    var self = this;
    var tempId = 'tmp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    this._provinces.push({ id: tempId, name: name });
    this._apiCall('POST', 'master_provinces', '', { name: name }).then(function() {
      return self._fetchProvinces();
    }).catch(function(e) {
      console.error('Supabase POST master_provinces error:', e.message);
    });
  },

  updateModel: function(id, name) {
    var self = this;
    var idx = this._models.findIndex(function(m) { return m.id === id; });
    if (idx === -1) return null;
    this._models[idx].name = name;
    this._apiCall('PATCH', 'master_models', '?id=eq.' + encodeURIComponent(id), { name: name }).then(function() {
      return self._fetchModels();
    }).catch(function(e) {
      console.error('Supabase PATCH master_models error:', e.message);
    });
    return this._models[idx];
  },

  updateProvince: function(id, name) {
    var self = this;
    var idx = this._provinces.findIndex(function(p) { return p.id === id; });
    if (idx === -1) return null;
    this._provinces[idx].name = name;
    this._apiCall('PATCH', 'master_provinces', '?id=eq.' + encodeURIComponent(id), { name: name }).then(function() {
      return self._fetchProvinces();
    }).catch(function(e) {
      console.error('Supabase PATCH master_provinces error:', e.message);
    });
    return this._provinces[idx];
  },

  deleteModel: function(id) {
    var self = this;
    var idx = this._models.findIndex(function(m) { return m.id === id; });
    if (idx === -1) return false;
    this._models.splice(idx, 1);
    this._apiCall('DELETE', 'master_models', '?id=eq.' + encodeURIComponent(id)).then(function() {
      return self._fetchModels();
    }).catch(function(e) {
      console.error('Supabase DELETE master_models error:', e.message);
    });
    return true;
  },

  deleteProvince: function(id) {
    var self = this;
    var idx = this._provinces.findIndex(function(p) { return p.id === id; });
    if (idx === -1) return false;
    this._provinces.splice(idx, 1);
    this._apiCall('DELETE', 'master_provinces', '?id=eq.' + encodeURIComponent(id)).then(function() {
      return self._fetchProvinces();
    }).catch(function(e) {
      console.error('Supabase DELETE master_provinces error:', e.message);
    });
    return true;
  },

  _fetchModels: function() {
    var self = this;
    return this._apiCall('GET', 'master_models', '?select=*&order=name.asc')
      .then(function(data) {
        self._models = (data || []).map(function(r) { return { id: r.id, name: r.name, createdAt: r.created_at }; });
        return self._models;
      })
      .catch(function(e) {
        console.error('Supabase GET master_models error:', e.message);
        self._models = [];
        return self._models;
      });
  },

  _fetchProvinces: function() {
    var self = this;
    return this._apiCall('GET', 'master_provinces', '?select=*&order=name.asc')
      .then(function(data) {
        self._provinces = (data || []).map(function(r) { return { id: r.id, name: r.name, createdAt: r.created_at }; });
        return self._provinces;
      })
      .catch(function(e) {
        console.error('Supabase GET master_provinces error:', e.message);
        self._provinces = [];
        return self._provinces;
      });
  },

  _lowKeys: function(obj) {
    var out = {};
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      out[keys[i].toLowerCase()] = obj[keys[i]];
    }
    return out;
  },

  _apiCall: function(method, table, query, body) {
    var url = this._supabaseUrl + '/rest/v1/' + table + query;
    var headers = {
      'apikey': this._supabaseKey,
      'Authorization': 'Bearer ' + this._supabaseKey,
      'Content-Type': 'application/json'
    };
    var opts = {
      method: method,
      headers: headers
    };
    if (method === 'POST' || method === 'PATCH') {
      opts.headers['Prefer'] = 'return=minimal';
    }
    if (body && (method === 'POST' || method === 'PATCH')) {
      opts.body = JSON.stringify(this._lowKeys(body));
    }
    return fetch(url, opts).then(function(res) {
      if (!res.ok) {
        return res.clone().json().then(function(body) {
          throw new Error('API error ' + res.status + ': ' + (body.message || JSON.stringify(body)));
        }).catch(function() {
          return res.text().then(function(text) {
            throw new Error('API error ' + res.status + ': ' + (text || '(no body)'));
          });
        });
      }
      if (method === 'DELETE') return null;
      return res.json().catch(function() { return null; });
    });
  },

  reloadModels: function() {
    return this._fetchModels();
  },

  reloadProvinces: function() {
    return this._fetchProvinces();
  }
};

var InventoryDB = {
  _data: [],
  _supabaseUrl: '',
  _supabaseKey: '',

  init: function() {
    var self = this;
    var configEl = document.getElementById('supabase-config');
    if (configEl) {
      try {
        var cfg = JSON.parse(configEl.textContent);
        this._supabaseUrl = cfg.url;
        this._supabaseKey = cfg.key;
      } catch (e) {}
    }
    if (!this._supabaseUrl) {
      this._supabaseUrl = 'REPLACE_WITH_YOUR_SUPABASE_URL';
      this._supabaseKey = 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';
    }
    return this._fetchAll();
  },

  getAll: function() {
    return this._data;
  },

  getById: function(id) {
    return this._data.find(function(r) { return r.id === id; }) || null;
  },

  add: function(record) {
    var self = this;
    this._data.push(record);
    return this._apiCall('POST', '', record).catch(function(e) {
      console.error('Supabase POST error:', e.message);
      self._showSyncError('Failed to save record to cloud');
    });
  },

  update: function(id, updatedFields) {
    var self = this;
    var index = this._data.findIndex(function(r) { return r.id === id; });
    if (index === -1) return Promise.resolve();
    var record = this._data[index];
    var keys = Object.keys(updatedFields);
    for (var i = 0; i < keys.length; i++) {
      record[keys[i]] = updatedFields[keys[i]];
    }
    return this._apiCall('PATCH', '?id=eq.' + encodeURIComponent(id), updatedFields).catch(function(e) {
      console.error('Supabase PATCH error:', e.message);
      self._showSyncError('Failed to update record in cloud');
    });
  },

  delete: function(id) {
    var self = this;
    var index = this._data.findIndex(function(r) { return r.id === id; });
    if (index === -1) return Promise.resolve();
    this._data.splice(index, 1);
    return this._apiCall('DELETE', '?id=eq.' + encodeURIComponent(id)).catch(function(e) {
      console.error('Supabase DELETE error:', e.message);
      self._showSyncError('Failed to delete record from cloud');
    });
  },

  search: function(query, filters) {
    if (!filters) filters = {};
    var records = this._data;

    if (query) {
      var lowerQuery = query.toLowerCase();
      records = records.filter(function(r) {
        return (r.partNumber && r.partNumber.toLowerCase().includes(lowerQuery)) ||
          (r.partName && r.partName.toLowerCase().includes(lowerQuery)) ||
          (r.model && r.model.toLowerCase().includes(lowerQuery)) ||
          (r.chassis && r.chassis.toLowerCase().includes(lowerQuery));
      });
    }

    if (filters.typeOfWork) {
      records = records.filter(function(r) { return r.typeOfWork === filters.typeOfWork; });
    }

    if (filters.availabilityStatus) {
      records = records.filter(function(r) { return r.availabilityStatus === filters.availabilityStatus; });
    }

    if (filters.received === 'received') {
      records = records.filter(function(r) { return r.received === true; });
      if (filters.receivedDateFrom) {
        records = records.filter(function(r) { return r.receivedDate && r.receivedDate >= filters.receivedDateFrom; });
      }
      if (filters.receivedDateTo) {
        records = records.filter(function(r) { return r.receivedDate && r.receivedDate <= filters.receivedDateTo; });
      }
    } else if (filters.received === 'not_received') {
      records = records.filter(function(r) { return !r.received; });
    }

    if (filters.actionRequired) {
      records = records.filter(function(r) { return !r.availabilityStatus || !r.partNumber; });
    }

    return records;
  },

  generateId: function() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var rand = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
    return 'INV-' + y + m + d + '-' + rand;
  },

  _fetchAll: function() {
    var self = this;
    return this._apiCall('GET', '?select=*')
      .then(function(data) {
        self._data = (data || []).map(function(r) { return self._camelizeKeys(r); });
        return self._data;
      })
      .catch(function(e) {
        console.error('Supabase GET error:', e.message);
        self._data = [];
        return self._data;
      });
  },

  _apiCall: function(method, query, body) {
    var url = this._supabaseUrl + '/rest/v1/records' + query;
    var headers = {
      'apikey': this._supabaseKey,
      'Authorization': 'Bearer ' + this._supabaseKey,
      'Content-Type': 'application/json'
    };
    var opts = {
      method: method,
      headers: headers
    };
    if (method === 'POST' || method === 'PATCH') {
      opts.headers['Prefer'] = 'return=minimal';
    }
    if (body && (method === 'POST' || method === 'PATCH')) {
      opts.body = JSON.stringify(this._lowerKeys(body));
    }
    return fetch(url, opts).then(function(res) {
      if (!res.ok) {
        return res.clone().json().then(function(body) {
          throw new Error('API error ' + res.status + ': ' + (body.message || JSON.stringify(body)));
        }).catch(function() {
          return res.text().then(function(text) {
            throw new Error('API error ' + res.status + ': ' + (text || '(no body)'));
          });
        });
      }
      if (method === 'DELETE') return null;
      return res.json().catch(function() { return null; });
    });
  },

  _today: function() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  _lowerKeys: function(obj) {
    var out = {};
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      out[keys[i].toLowerCase()] = obj[keys[i]];
    }
    return out;
  },

  _camelizeKeys: function(obj) {
    var camelMap = {
      id: 'id',
      partnumber: 'partNumber',
      partname: 'partName',
      model: 'model',
      chassis: 'chassis',
      quantity: 'quantity',
      availabilitystatus: 'availabilityStatus',
      province: 'province',
      typeofwork: 'typeOfWork',
      countersalenumber: 'counterSaleNumber',
      workordernumber: 'workOrderNumber',
      received: 'received',
      receiveddate: 'receivedDate',
      createddate: 'createdDate'
    };
    var out = {};
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      out[camelMap[keys[i]] || keys[i]] = obj[keys[i]];
    }
    return out;
  },

  reload: function() {
    return this._fetchAll();
  },

  _showSyncError: function(msg) {
    if (typeof UI !== 'undefined' && UI.showNotification) {
      UI.showNotification(msg, 'error');
    }
  }

};
