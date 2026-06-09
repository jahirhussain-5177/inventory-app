const App = {
  currentRecords: [],
  actionRequiredFilter: false,

  init() {
    var self = this;
    var dbInit = InventoryDB.init();
    var masterInit = MasterDB.init();
    Promise.all([dbInit, masterInit]).then(function() {
      UI.init();
      self.setupEventListeners();
      self.setupMasterEventListeners();
      self.setupTabs();
      UI.populateModelDropdown();
      UI.populateProvinceDropdown();
      UI.renderMasterTables();
      self.refresh();
    });
  },

  setupEventListeners() {
    const form = document.getElementById('recordForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      UI.clearForm();
    });

    document.getElementById('tableBody').addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.received-toggle-btn');
      if (toggleBtn) {
        this.handleToggle(toggleBtn.dataset.id, toggleBtn.dataset.received === 'true');
        return;
      }
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.dataset.id;
      if (!id) return;

      if (btn.classList.contains('btn-edit')) {
        this.handleEdit(id);
      } else if (btn.classList.contains('btn-delete')) {
        this.handleDelete(id);
      }
    });

    const searchInput = document.getElementById('searchInput');
    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        UI.currentPage = 1;
        this.refresh();
      }, 300);
    });

    document.getElementById('filterTypeOfWork').addEventListener('change', () => {
      UI.currentPage = 1;
      this.refresh();
    });

    document.getElementById('filterAvailability').addEventListener('change', () => {
      UI.currentPage = 1;
      this.refresh();
    });

    document.getElementById('filterReceived').addEventListener('change', () => {
      const showRange = document.getElementById('filterReceived').value === 'received';
      document.getElementById('receivedDateRange').classList.toggle('hidden', !showRange);
      UI.currentPage = 1;
      this.refresh();
    });

    const todayStr = () => new Date().toISOString().split('T')[0];
    document.getElementById('filterDateFrom').addEventListener('change', (e) => {
      const dateTo = document.getElementById('filterDateTo');
      dateTo.min = e.target.value || '';
    });
    document.getElementById('filterDateTo').addEventListener('change', () => {
      UI.currentPage = 1;
      this.refresh();
    });
    document.getElementById('filterDateTo').max = todayStr();

    document.getElementById('prevPageBtn').addEventListener('click', () => {
      if (UI.currentPage > 1) {
        UI.currentPage--;
        this.refresh();
      }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
      const total = this.currentRecords.length;
      const totalPages = Math.max(1, Math.ceil(total / UI.pageSize));
      if (UI.currentPage < totalPages) {
        UI.currentPage++;
        this.refresh();
      }
    });

    document.getElementById('actionRequiredBtn').addEventListener('click', () => {
      this.actionRequiredFilter = !this.actionRequiredFilter;
      if (this.actionRequiredFilter) {
        document.getElementById('filterReceived').value = 'all';
      }
      UI.currentPage = 1;
      this.refresh();
    });

    document.getElementById('exportExcelBtn').addEventListener('click', () => {
      this.exportExcel();
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.refreshFromCloud();
    });

    document.getElementById('receivedConfirmBtn').addEventListener('click', () => {
      this.handleReceivedConfirm();
    });

    document.getElementById('receivedCancelBtn').addEventListener('click', () => {
      UI.hideReceivedDialog();
      this.refresh();
    });
  },

  setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
        document.getElementById('tab' + this.dataset.tab.charAt(0).toUpperCase() + this.dataset.tab.slice(1)).classList.add('active');
        if (this.dataset.tab === 'master') UI.renderMasterTables();
      });
    });
  },

  _editingMaster: null,

  setupMasterEventListeners() {
    var self = this;

    document.getElementById('addModelBtn').addEventListener('click', function() {
      self._addMasterItem('model');
    });

    document.getElementById('masterModelInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); self._addMasterItem('model'); }
    });

    document.getElementById('cancelModelEditBtn').addEventListener('click', function() {
      self._cancelMasterEdit('model');
    });

    document.getElementById('addProvinceBtn').addEventListener('click', function() {
      self._addMasterItem('province');
    });

    document.getElementById('masterProvinceInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); self._addMasterItem('province'); }
    });

    document.getElementById('cancelProvinceEditBtn').addEventListener('click', function() {
      self._cancelMasterEdit('province');
    });

    document.getElementById('masterModelsBody').addEventListener('click', function(e) {
      self._handleMasterClick(e, 'model');
    });

    document.getElementById('masterProvincesBody').addEventListener('click', function(e) {
      self._handleMasterClick(e, 'province');
    });

    document.getElementById('masterModelSearch').addEventListener('input', function() {
      clearTimeout(self._masterSearchTimer);
      self._masterSearchTimer = setTimeout(function() {
        UI.masterModelPage = 1;
        UI._renderModelsTable();
      }, 300);
    });

    document.getElementById('masterProvinceSearch').addEventListener('input', function() {
      clearTimeout(self._masterSearchTimer);
      self._masterSearchTimer = setTimeout(function() {
        UI.masterProvincePage = 1;
        UI._renderProvincesTable();
      }, 300);
    });

    document.querySelectorAll('.master-page-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var table = this.dataset.table;
        var dir = this.dataset.dir;
        if (table === 'models') {
          if (dir === 'prev' && UI.masterModelPage > 1) UI.masterModelPage--;
          if (dir === 'next') UI.masterModelPage++;
        } else {
          if (dir === 'prev' && UI.masterProvincePage > 1) UI.masterProvincePage--;
          if (dir === 'next') UI.masterProvincePage++;
        }
        UI.renderMasterTables();
      });
    });
  },

  _handleMasterClick(e, type) {
    var self = this;
    var btn = e.target.closest('button');
    if (!btn) return;
    var id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains('master-edit-btn')) {
      var collection = type === 'model' ? MasterDB.getModels() : MasterDB.getProvinces();
      var item = collection.find(function(it) { return it.id === id; });
      if (!item) return;
      var inputId = type === 'model' ? 'masterModelInput' : 'masterProvinceInput';
      var btnId = type === 'model' ? 'addModelBtn' : 'addProvinceBtn';
      var cancelId = type === 'model' ? 'cancelModelEditBtn' : 'cancelProvinceEditBtn';
      document.getElementById(inputId).value = item.name;
      document.getElementById(btnId).textContent = 'Update';
      document.getElementById(cancelId).style.visibility = 'visible';
      this._editingMaster = { type: type, id: id };
    }

    if (btn.classList.contains('master-delete-btn')) {
      var name = type === 'model' ? 'model' : 'province';
      UI.showConfirmDialog('Delete this ' + name + '? It may affect existing records.', function() {
        if (type === 'model') {
          MasterDB.deleteModel(id);
          UI.populateModelDropdown();
        } else {
          MasterDB.deleteProvince(id);
          UI.populateProvinceDropdown();
        }
        UI.renderMasterTables();
        UI.showNotification(name.charAt(0).toUpperCase() + name.slice(1) + ' deleted.', 'success');
      });
    }
  },

  _addMasterItem(type) {
    var inputId = type === 'model' ? 'masterModelInput' : 'masterProvinceInput';
    var input = document.getElementById(inputId);
    var name = input.value.trim();
    if (!name) {
      UI.showNotification('Please enter a name.', 'error');
      return;
    }

    var editing = this._editingMaster && this._editingMaster.type === type;

    if (editing) {
      var collection = type === 'model' ? MasterDB.getModels() : MasterDB.getProvinces();
      var exists = collection.some(function(item) { return item.name.toLowerCase() === name.toLowerCase() && item.id !== this._editingMaster.id; }.bind(this));
      if (exists) {
        UI.showNotification('Duplicate name.', 'error');
        return;
      }
      if (type === 'model') {
        MasterDB.updateModel(this._editingMaster.id, name);
        UI.populateModelDropdown();
      } else {
        MasterDB.updateProvince(this._editingMaster.id, name);
        UI.populateProvinceDropdown();
      }
    } else {
      var collection = type === 'model' ? MasterDB.getModels() : MasterDB.getProvinces();
      var exists = collection.some(function(item) { return item.name.toLowerCase() === name.toLowerCase(); });
      if (exists) {
        UI.showNotification(type.charAt(0).toUpperCase() + type.slice(1) + ' already exists.', 'error');
        return;
      }
      if (type === 'model') {
        MasterDB.addModel(name);
        UI.populateModelDropdown();
      } else {
        MasterDB.addProvince(name);
        UI.populateProvinceDropdown();
      }
    }

    this._cancelMasterEdit(type);
    UI.renderMasterTables();
    UI.showNotification(editing ? 'Updated.' : 'Added.', 'success');
  },

  _cancelMasterEdit(type) {
    var inputId = type === 'model' ? 'masterModelInput' : 'masterProvinceInput';
    var btnId = type === 'model' ? 'addModelBtn' : 'addProvinceBtn';
    var cancelId = type === 'model' ? 'cancelModelEditBtn' : 'cancelProvinceEditBtn';
    document.getElementById(inputId).value = '';
    document.getElementById(btnId).textContent = 'Add';
    document.getElementById(cancelId).style.visibility = 'hidden';
    this._editingMaster = null;
  },

  handleFormSubmit() {
    const editId = document.getElementById('editId').value.trim();
    const chassis = document.getElementById('chassis').value.trim();
    const allRecords = InventoryDB.getAll();
    const partRows = document.querySelectorAll('#partsContainer .part-row');

    if (!chassis) {
      UI.showNotification('Chassis is required.', 'error');
      document.getElementById('chassis').focus();
      return;
    }

    var self = this;
    var errors = [];
    var partsData = [];

    partRows.forEach(function(row, idx) {
      var data = self._gatherPartData(row);
      var rowErrors = self._validatePartData(data, allRecords, editId);
      if (rowErrors.length > 0) {
        rowErrors.forEach(function(e) { errors.push({ msg: e, row: idx + 1 }); });
      }
      partsData.push(data);
    });

    if (errors.length > 0) {
      var first = errors[0];
      UI.showNotification('Part #' + first.row + ': ' + first.msg, 'error');
      return;
    }

    Validator.clearErrors();

    if (editId) {
      var record = partsData[0];
      record.chassis = chassis;
      InventoryDB.update(editId, record).then(function() {
        UI.showNotification('Record updated successfully.', 'success');
        UI.clearForm();
        self.refreshFromCloud();
      });
    } else {
      var promises = [];
      var now = this.getCurrentDateTime();
      partsData.forEach(function(partData) {
        var id = InventoryDB.generateId();
        var record = {
          id: id,
          chassis: chassis,
          partNumber: partData.partNumber,
          partName: partData.partName,
          model: partData.model,
          quantity: partData.quantity,
          typeOfWork: partData.typeOfWork,
          counterSaleNumber: partData.counterSaleNumber,
          workOrderNumber: partData.workOrderNumber,
          availabilityStatus: partData.availabilityStatus,
          province: partData.province,
          createdDate: now,
          received: false,
          receivedDate: ''
        };
        promises.push(InventoryDB.add(record));
      });

      Promise.all(promises).then(function() {
        UI.showNotification(partsData.length + ' record(s) added successfully.', 'success');
        UI.clearForm();
        self.refreshFromCloud();
      });
    }
  },

  _gatherPartData(row) {
    var typeOfWork = row.querySelector('.part-typeOfWork').value;
    return {
      partNumber: row.querySelector('.part-number').value.trim(),
      partName: row.querySelector('.part-name').value.trim(),
      model: row.querySelector('.part-model').value.trim(),
      quantity: row.querySelector('.part-quantity').value === '' ? null : Number(row.querySelector('.part-quantity').value),
      typeOfWork: typeOfWork,
      counterSaleNumber: typeOfWork === 'Counter Sale' ? row.querySelector('.part-counterSaleNumber').value.trim() : '',
      workOrderNumber: typeOfWork === 'Work Order' ? row.querySelector('.part-workOrderNumber').value.trim() : '',
      availabilityStatus: row.querySelector('.part-availability').value,
      province: row.querySelector('.part-province').value
    };
  },

  _validatePartData(data, existingRecords, editId) {
    var errs = [];

    if (data.partNumber) {
      var dup = existingRecords.find(function(r) {
        return r.partNumber.toLowerCase() === data.partNumber.toLowerCase() && r.id !== editId;
      });
      if (dup) {
        errs.push('Part Number "' + data.partNumber + '" already exists.');
      }
    }

    if (!data.partName) {
      errs.push('Part Name is required.');
    }

    if (!data.model) {
      errs.push('Model is required.');
    }

    if (data.quantity === null || data.quantity === undefined || data.quantity === '') {
      errs.push('Quantity is required.');
    } else if (!Number.isInteger(Number(data.quantity)) || Number(data.quantity) < 1) {
      errs.push('Quantity must be a positive integer.');
    }

    if (!data.typeOfWork) {
      errs.push('Type of Work is required.');
    }

    if (data.availabilityStatus === 'Inside KSA' && !data.province) {
      errs.push('Province is required for Inside KSA.');
    }

    return errs;
  },

  handleEdit(id) {
    const record = InventoryDB.getById(id);
    if (!record) {
      UI.showNotification('Record not found.', 'error');
      return;
    }
    UI.populateForm(record);
  },

  handleToggle(id, currentlyReceived) {
    const record = InventoryDB.getById(id);
    if (!record) return;

    if (!currentlyReceived) {
      UI.showReceivedDialog(record, id);
    } else {
      UI.showUnreceivedConfirm(record, id);
    }
  },

  handleReceivedConfirm() {
    const id = document.getElementById('receivedModal').dataset.recordId;
    if (!id) return;

    const isReceiveFlow = !document.getElementById('receivedModalBody').classList.contains('hidden');

    var self = this;
    if (isReceiveFlow) {
      const dateInput = document.getElementById('receivedDateInput');
      const dateVal = dateInput.value;
      const errorEl = document.getElementById('receivedDateError');
      if (!dateVal) {
        errorEl.textContent = 'Received Date is required.';
        return;
      }
      errorEl.textContent = '';
      var formattedDate = dateVal.replace('T', ' ') + ':00';
      InventoryDB.update(id, { received: true, receivedDate: formattedDate }).then(function() {
        UI.hideReceivedDialog();
        UI.showNotification('Marked as received. Switch filter to "Received" to view.', 'success');
        self.refreshFromCloud();
      });
    } else {
      InventoryDB.update(id, { received: false, receivedDate: '' }).then(function() {
        UI.hideReceivedDialog();
        UI.showNotification('Marked as not received.', 'success');
        self.refreshFromCloud();
      });
    }
  },

  handleDelete(id) {
    const record = InventoryDB.getById(id);
    if (!record) return;
    var self = this;
    UI.showConfirmDialog(
      'Delete record "' + (record.partNumber || '') + ' - ' + record.partName + '"?',
      function() {
        InventoryDB.delete(id).then(function() {
          UI.showNotification('Record deleted.', 'success');
          self.refreshFromCloud();
        });
      }
    );
  },

  refresh() {
    const query = document.getElementById('searchInput').value.trim();
    const filters = {
      typeOfWork: document.getElementById('filterTypeOfWork').value,
      availabilityStatus: document.getElementById('filterAvailability').value,
      received: document.getElementById('filterReceived').value,
      receivedDateFrom: document.getElementById('filterDateFrom').value,
      receivedDateTo: document.getElementById('filterDateTo').value,
      actionRequired: this.actionRequiredFilter
    };

    let records = InventoryDB.search(query, filters);
    records = UI.sortRecords(records);
    this.currentRecords = records;

    const allRecords = InventoryDB.search(query, {
      typeOfWork: filters.typeOfWork,
      availabilityStatus: filters.availabilityStatus,
      received: filters.received,
      receivedDateFrom: filters.receivedDateFrom,
      receivedDateTo: filters.receivedDateTo
    });
    const actionCount = allRecords.filter(r => !r.availabilityStatus || !r.received || !r.partNumber).length;
    document.getElementById('actionCount').textContent = actionCount;
    document.getElementById('actionRequiredBtn').classList.toggle('active', this.actionRequiredFilter);

    UI.renderTable(records);
  },

  refreshFromCloud() {
    var self = this;
    InventoryDB.reload().then(function() {
      UI.showNotification('Data synced from cloud.', 'success');
      self.refresh();
    }).catch(function() {
      UI.showNotification('Failed to sync from cloud.', 'error');
    });
  },

  exportExcel() {
    const records = this.currentRecords;
    if (records.length === 0) {
      UI.showNotification('No records to export.', 'error');
      return;
    }

    const headers = ['Part Number', 'Part Name', 'Model', 'Quantity', 'Chassis', 'Availability Status', 'Province', 'Type of Work', 'Counter Sale #', 'Work Order #', 'Received', 'Received Date', 'Created Date'];
    const rows = records.map(r => [
      r.partNumber,
      r.partName,
      r.model,
      r.quantity,
      r.chassis,
      r.availabilityStatus,
      r.availabilityStatus === 'Inside KSA' ? (r.province || '') : '-',
      r.typeOfWork,
      r.typeOfWork === 'Counter Sale' ? (r.counterSaleNumber || '') : '-',
      r.typeOfWork === 'Work Order' ? (r.workOrderNumber || '') : '-',
      r.received ? 'Yes' : 'No',
      r.receivedDate || '-',
      r.createdDate
    ]);

    let html = '<table>';
    html += '<tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr>';
    for (const row of rows) {
      html += '<tr>' + row.map(c => '<td>' + String(c) + '</td>').join('') + '</tr>';
    }
    html += '</table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-' + this.getCurrentDate() + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.showNotification('Excel downloaded successfully.', 'success');
  },

  getCurrentDate() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  },

  getCurrentDateTime() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
