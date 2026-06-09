const UI = {
  currentPage: 1,
  pageSize: window.innerWidth <= 768 ? 5 : 10,
  sortKey: 'createdDate',
  sortDir: 'desc',
  deleteTargetId: null,
  masterPageSize: 10,
  masterModelPage: 1,
  masterProvincePage: 1,

  _parts: [],
  _editingPartIndex: -1,

  init() {
    this.initPartAccumulator();
    this.setupSortHandlers();
    this.setupMobileAccordion();
    this._updateMasterPageSize();
  },

  _updateMasterPageSize() {
    this.masterPageSize = window.innerWidth <= 768 ? 5 : 10;
  },

  initPartAccumulator() {
    var self = this;

    document.getElementById('addPartBtn').addEventListener('click', function() {
      self.showPartEntry();
    });

    document.getElementById('entryAddBtn').addEventListener('click', function() {
      if (self._editingPartIndex >= 0) {
        self.updatePart(self._editingPartIndex);
      } else {
        self.addPart();
      }
    });

    document.getElementById('entryCancelBtn').addEventListener('click', function() {
      self._editingPartIndex = -1;
      self.hidePartEntry();
    });

    document.getElementById('typeOfWork').addEventListener('change', function() {
      self._toggleWorkType();
    });

    document.getElementById('entryAvailability').addEventListener('change', function() {
      self._toggleEntryProvince();
    });

    document.getElementById('partsList').addEventListener('click', function(e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var index = parseInt(btn.dataset.index, 10);
      if (isNaN(index)) return;

      if (btn.classList.contains('part-card-edit')) {
        self.showPartEntry(self._parts[index], index);
      } else if (btn.classList.contains('part-card-delete')) {
        self.deletePart(index);
      }
    });
  },

  showPartEntry(data, index) {
    this._editingPartIndex = index >= 0 ? index : -1;
    document.getElementById('partEntryTitle').textContent = index >= 0 ? 'Edit Part' : 'Enter Part Details';
    document.getElementById('entryAddBtn').textContent = index >= 0 ? 'Update' : 'Add';
    document.getElementById('partEntryForm').classList.remove('hidden');
    document.getElementById('addPartBtn').classList.add('hidden');
    if (index >= 0) document.getElementById('partsList').classList.add('hidden');

    if (data) {
      document.getElementById('entryPartNumber').value = data.partNumber || '';
      document.getElementById('entryPartName').value = data.partName || '';
      document.getElementById('entryQuantity').value = data.quantity != null ? data.quantity : '';
      document.getElementById('entryAvailability').value = data.availabilityStatus || '';
      this._toggleEntryProvince();
      if (data.availabilityStatus === 'Inside KSA' && data.province) {
        var provSelect = document.getElementById('entryProvince');
        var provExists = Array.from(provSelect.options).some(function(o) { return o.value === data.province; });
        if (!provExists) {
          var opt = document.createElement('option');
          opt.value = data.province;
          opt.textContent = data.province;
          provSelect.appendChild(opt);
        }
        provSelect.value = data.province;
      }
    } else {
      this.clearEntryForm();
    }

    document.getElementById('partEntryForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  hidePartEntry() {
    document.getElementById('partEntryForm').classList.add('hidden');
    document.getElementById('addPartBtn').classList.remove('hidden');
    document.getElementById('partsList').classList.remove('hidden');
    this._editingPartIndex = -1;
    Validator.clearErrors();
  },

  clearEntryForm() {
    document.getElementById('entryPartNumber').value = '';
    document.getElementById('entryPartName').value = '';
    document.getElementById('entryQuantity').value = '';
    document.getElementById('entryAvailability').value = '';
    document.getElementById('entryProvince').value = '';
    document.getElementById('entryProvinceCustom').value = '';
    this._toggleEntryProvince();
    Validator.clearErrors();
  },

  gatherEntryData() {
    return {
      partNumber: document.getElementById('entryPartNumber').value.trim(),
      partName: document.getElementById('entryPartName').value.trim(),
      quantity: document.getElementById('entryQuantity').value === '' ? null : Number(document.getElementById('entryQuantity').value),
      availabilityStatus: document.getElementById('entryAvailability').value,
      province: document.getElementById('entryProvince').value
    };
  },

  addPart() {
    var data = this.gatherEntryData();
    var errors = this._validateEntry(data);
    if (errors.length > 0) {
      UI.showNotification(errors[0], 'error');
      return;
    }
    this._parts.push(data);
    this.hidePartEntry();
    this.renderPartsList();
    this._updateRegisterBtn();
  },

  updatePart(index) {
    var data = this.gatherEntryData();
    var errors = this._validateEntry(data);
    if (errors.length > 0) {
      UI.showNotification(errors[0], 'error');
      return;
    }
    this._parts[index] = data;
    this.hidePartEntry();
    this.renderPartsList();
    this._updateRegisterBtn();
  },

  deletePart(index) {
    this._parts.splice(index, 1);
    this.renderPartsList();
    this._updateRegisterBtn();
  },

  _validateEntry(data) {
    var errs = [];
    if (!data.partName) { errs.push('Part Name is required.'); return errs; }
    if (data.quantity === null || data.quantity === '' || !Number.isInteger(Number(data.quantity)) || Number(data.quantity) < 1) {
      errs.push('Quantity must be a positive integer.');
      return errs;
    }
    if (data.availabilityStatus === 'Inside KSA' && !data.province) { errs.push('Province is required for Inside KSA.'); return errs; }
    return errs;
  },

  renderPartsList() {
    var container = document.getElementById('partsList');
    if (this._parts.length === 0) {
      container.innerHTML = '';
      return;
    }
    var html = '';
    for (var i = 0; i < this._parts.length; i++) {
      var p = this._parts[i];
      html += '<div class="part-card">';
      html += '<div class="part-card-info"><strong>' + this._esc(p.partName) + '</strong>';
      if (p.partNumber) html += ' <span class="part-card-partno">(' + this._esc(p.partNumber) + ')</span>';
      html += ' <span class="part-card-qty">Qty: ' + p.quantity + '</span></div>';
      html += '<div class="part-card-actions">';
      html += '<button type="button" class="btn btn-small btn-edit part-card-edit" data-index="' + i + '" title="Edit">&#9998;</button> ';
      html += '<button type="button" class="btn btn-small btn-delete part-card-delete" data-index="' + i + '" title="Delete">&#128465;</button>';
      html += '</div></div>';
    }
    container.innerHTML = html;
  },

  _updateRegisterBtn() {
    var btn = document.getElementById('saveBtn');
    var count = this._parts.length;
    var editId = document.getElementById('editId').value.trim();
    if (editId) {
      btn.textContent = 'Update Record';
    } else {
      btn.textContent = 'Register (' + count + ' part' + (count !== 1 ? 's' : '') + ')';
    }
  },

  _toggleWorkType() {
    var val = document.getElementById('typeOfWork').value;
    var csGroup = document.getElementById('csGroup');
    var woGroup = document.getElementById('woGroup');
    var csInput = document.getElementById('counterSaleNumber');
    var woInput = document.getElementById('workOrderNumber');

    if (val === 'Counter Sale') {
      csGroup.hidden = false;
      csGroup.style.display = 'flex';
      woGroup.hidden = true;
      woGroup.style.display = 'none';
      woInput.value = '';
    } else if (val === 'Work Order') {
      woGroup.hidden = false;
      woGroup.style.display = 'flex';
      csGroup.hidden = true;
      csGroup.style.display = 'none';
      csInput.value = '';
    } else {
      csGroup.hidden = true;
      csGroup.style.display = 'none';
      csInput.value = '';
      woGroup.hidden = true;
      woGroup.style.display = 'none';
      woInput.value = '';
    }
  },

  _toggleEntryProvince() {
    var val = document.getElementById('entryAvailability').value;
    var provGroup = document.getElementById('entryProvinceGroup');
    var provInput = document.getElementById('entryProvince');
    if (val === 'Inside KSA') {
      provGroup.hidden = false;
    } else {
      provGroup.hidden = true;
      provInput.value = '';
    }
  },

  populateModelDropdown() {
    var select = document.getElementById('model');
    var models = MasterDB.getModels();
    select.innerHTML = '<option value="">Select Model</option>';
    for (var i = 0; i < models.length; i++) {
      var opt = document.createElement('option');
      opt.value = models[i].name;
      opt.textContent = models[i].name;
      select.appendChild(opt);
    }
  },

  populateProvinceDropdown() {
    var select = document.getElementById('entryProvince');
    var provinces = MasterDB.getProvinces();
    select.innerHTML = '<option value="">-- Select Province --</option>';
    for (var i = 0; i < provinces.length; i++) {
      var opt = document.createElement('option');
      opt.value = provinces[i].name;
      opt.textContent = provinces[i].name;
      select.appendChild(opt);
    }
  },

  populateForm(record) {
    this.hidePartEntry();
    this.clearEntryForm();
    document.getElementById('editId').value = record.id;
    document.getElementById('chassis').value = record.chassis;
    document.getElementById('chassis').setAttribute('readonly', 'readonly');
    document.getElementById('model').value = record.model || '';
    document.getElementById('typeOfWork').value = record.typeOfWork || '';
    this._toggleWorkType();
    if (record.typeOfWork === 'Counter Sale') {
      document.getElementById('counterSaleNumber').value = record.counterSaleNumber || '';
    } else if (record.typeOfWork === 'Work Order') {
      document.getElementById('workOrderNumber').value = record.workOrderNumber || '';
    }

    this._parts = [];
    this._parts.push({
      partNumber: record.partNumber || '',
      partName: record.partName || '',
      quantity: record.quantity,
      availabilityStatus: record.availabilityStatus || '',
      province: record.province || ''
    });
    this.renderPartsList();
    this._updateRegisterBtn();

    document.getElementById('formTitle').textContent = 'Edit Record';
    document.getElementById('editBadge').classList.remove('hidden');
    document.getElementById('saveBtn').textContent = 'Update Record';

    Validator.clearErrors();
    if (window.matchMedia('(max-width: 768px)').matches) {
      document.querySelector('.form-section.card').removeAttribute('data-collapsed');
    }
    document.getElementById('recordForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  clearForm() {
    document.getElementById('editId').value = '';
    document.getElementById('chassis').value = '';
    document.getElementById('chassis').removeAttribute('readonly');
    document.getElementById('model').value = '';
    document.getElementById('typeOfWork').value = '';
    document.getElementById('counterSaleNumber').value = '';
    document.getElementById('workOrderNumber').value = '';
    this._toggleWorkType();

    this._parts = [];
    this._editingPartIndex = -1;
    this.renderPartsList();
    this.hidePartEntry();
    this._updateRegisterBtn();

    document.getElementById('formTitle').textContent = 'Register Part';
    document.getElementById('editBadge').classList.add('hidden');
    document.getElementById('saveBtn').textContent = 'Register (0 parts)';

    Validator.clearErrors();
  },

  setupSortHandlers() {
    document.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (this.sortKey === key) {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortKey = key;
          this.sortDir = 'asc';
        }
        UI.currentPage = 1;
        App.refresh();
        this.updateSortIndicators();
      });
    });
  },

  updateSortIndicators() {
    document.querySelectorAll('.sort-indicator').forEach(el => el.textContent = '');
    const active = document.querySelector(`.sortable[data-sort="${this.sortKey}"]`);
    if (active) {
      const indicator = active.querySelector('.sort-indicator');
      if (indicator) {
        indicator.textContent = this.sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
      }
    }
  },

  sortRecords(records) {
    const key = this.sortKey;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    const sorted = [...records];

    sorted.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (key === 'quantity') {
        valA = Number(valA);
        valB = Number(valB);
      } else if (key === 'createdDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

    return sorted;
  },

  setupMobileAccordion() {
    var title = document.querySelector('.section-title');
    var card = document.querySelector('.form-section.card');
    if (!title || !card) return;

    title.addEventListener('click', function() {
      if (window.matchMedia('(min-width: 769px)').matches) return;
      if (card.hasAttribute('data-collapsed')) {
        card.removeAttribute('data-collapsed');
      } else {
        card.setAttribute('data-collapsed', '');
      }
    });
  },

  renderTable(records) {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const recordCount = document.getElementById('recordCount');

    if (records.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      document.querySelector('.table-wrapper').classList.add('hidden');
      recordCount.textContent = '0 records';
      return;
    }

    emptyState.classList.add('hidden');
    document.querySelector('.table-wrapper').classList.remove('hidden');

    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, records.length);
    const pageRecords = records.slice(start, end);

    let html = '';
    for (let i = 0; i < pageRecords.length; i++) {
      const r = pageRecords[i];
      html += `<tr class="${this.isActionRequired(r) ? 'action-required-tr' : ''}">
        <td data-label="Part Number">${this._esc(r.partNumber)}</td>
        <td data-label="Part Name">${this._esc(r.partName)}</td>
        <td data-label="Model">${this._esc(r.model)}</td>
        <td data-label="Quantity">${r.quantity}</td>
        <td data-label="Chassis">${this._esc(r.chassis)}</td>
        <td data-label="Type of Work">${this._esc(r.typeOfWork)}</td>
        <td data-label="${r.typeOfWork === 'Counter Sale' ? 'Counter Sale #' : r.typeOfWork === 'Work Order' ? 'Work Order #' : ''}">${r.typeOfWork === 'Counter Sale' ? this._esc(r.counterSaleNumber) : r.typeOfWork === 'Work Order' ? this._esc(r.workOrderNumber) : '-'}</td>
        <td data-label="Availability">${r.availabilityStatus ? `<span class="status-badge ${r.availabilityStatus === 'Inside KSA' ? 'status-inside' : 'status-outside'}">${this._esc(r.availabilityStatus)}</span>` : ''}</td>
        <td data-label="${r.availabilityStatus === 'Inside KSA' ? 'Province' : ''}">${r.availabilityStatus === 'Inside KSA' ? this._esc(r.province) : '-'}</td>
        <td class="date-col" data-label="Created">${r.createdDate}</td>
        <td class="toggle-col" data-label="Received">
          <button class="toggle-switch received-toggle-btn ${r.received ? 'toggle-on' : ''}" data-id="${r.id}" data-received="${r.received}" title="${r.received ? 'Mark as not received' : 'Mark as received'}">
            <span class="toggle-slider"></span>
          </button>
        </td>
        <td data-label="Received Date">${r.received ? (r.receivedDate || '-') : '-'}</td>
        <td class="actions-col" data-label="">
          <span class="action-pill edit-pill"><button class="btn btn-small btn-edit" data-id="${r.id}" title="Edit">&#9998; Edit</button></span>
          <span class="action-pill delete-pill"><button class="btn btn-small btn-delete" data-id="${r.id}" title="Delete">&#128465; Delete</button></span>
        </td>
      </tr>`;
    }
    tbody.innerHTML = html;
    recordCount.textContent = `${records.length} record${records.length !== 1 ? 's' : ''}`;
    this.renderPagination(records.length);
  },

  renderPagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));

    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    document.getElementById('pageInfo').textContent = `Page ${this.currentPage} of ${totalPages}`;
    document.getElementById('prevPageBtn').disabled = this.currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = this.currentPage >= totalPages;
  },

  isActionRequired(r) {
    return !r.partNumber || !r.availabilityStatus || !r.received;
  },

  getPaginatedRecords(records) {
    return records;
  },

  showConfirmDialog(message, onConfirm) {
    this.deleteTargetId = null;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.remove('hidden');

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    const cleanup = () => {
      document.getElementById('confirmModal').classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    const handleConfirm = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
      cleanup();
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
  },

  showNotification(message, type = 'info') {
    const el = document.getElementById('notification');
    el.textContent = message;
    el.className = `notification ${type}`;
    el.classList.remove('hidden');

    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, 3500);
  },

  showReceivedDialog(record, id) {
    const modal = document.getElementById('receivedModal');
    modal.dataset.recordId = id;
    document.getElementById('receivedModalTitle').textContent = 'Mark as Received';
    this._populateReceivedDetails(record);
    document.getElementById('receivedModalBody').classList.remove('hidden');
    document.getElementById('receivedUnconfirmBody').classList.add('hidden');
    document.getElementById('receivedDateInput').value = '';
    document.getElementById('receivedDateError').textContent = '';
    modal.classList.remove('hidden');
  },

  showUnreceivedConfirm(record, id) {
    const modal = document.getElementById('receivedModal');
    modal.dataset.recordId = id;
    document.getElementById('receivedModalTitle').textContent = 'Mark as Not Received';
    this._populateReceivedDetails(record);
    document.getElementById('receivedModalBody').classList.add('hidden');
    document.getElementById('receivedUnconfirmBody').classList.remove('hidden');
    modal.classList.remove('hidden');
  },

  _populateReceivedDetails(record) {
    document.getElementById('recPartNumber').textContent = record.partNumber;
    document.getElementById('recPartName').textContent = record.partName;
    document.getElementById('recModel').textContent = record.model;
    document.getElementById('recQuantity').textContent = record.quantity;
    document.getElementById('recChassis').textContent = record.chassis;
    document.getElementById('recTypeOfWork').textContent = record.typeOfWork;
    var refLabel = document.getElementById('recRefLabel');
    var refRow = document.getElementById('recRefRow');
    if (record.typeOfWork === 'Counter Sale') {
      refLabel.textContent = 'Counter Sale #';
      document.getElementById('recWorkerNumber').textContent = record.counterSaleNumber || '-';
      refRow.hidden = false;
    } else if (record.typeOfWork === 'Work Order') {
      refLabel.textContent = 'Work Order #';
      document.getElementById('recWorkerNumber').textContent = record.workOrderNumber || '-';
      refRow.hidden = false;
    } else {
      refRow.hidden = true;
    }
    document.getElementById('recAvailability').textContent = record.availabilityStatus;
    var provRow = document.getElementById('recProvinceRow');
    if (record.availabilityStatus === 'Inside KSA') {
      document.getElementById('recProvince').textContent = record.province || '-';
      provRow.hidden = false;
    } else {
      provRow.hidden = true;
    }
  },

  hideReceivedDialog() {
    document.getElementById('receivedModal').classList.add('hidden');
  },

  _esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  renderMasterTables() {
    this._renderModelsTable();
    this._renderProvincesTable();
  },

  _renderModelsTable() {
    var allModels = MasterDB.getModels();
    var query = document.getElementById('masterModelSearch').value.trim().toLowerCase();
    var filtered = query ? allModels.filter(function(m) { return m.name.toLowerCase().indexOf(query) !== -1; }) : allModels;
    var tbody = document.getElementById('masterModelsBody');
    var empty = document.getElementById('masterModelsEmpty');
    var pagination = document.getElementById('masterModelsPagination');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty.hidden = false;
      pagination.classList.add('hidden');
      return;
    }
    empty.hidden = true;
    pagination.classList.remove('hidden');

    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / this.masterPageSize));
    if (this.masterModelPage > totalPages) this.masterModelPage = totalPages;
    if (this.masterModelPage < 1) this.masterModelPage = 1;

    var start = (this.masterModelPage - 1) * this.masterPageSize;
    var end = Math.min(start + this.masterPageSize, total);
    var pageItems = filtered.slice(start, end);

    var html = '';
    for (var i = 0; i < pageItems.length; i++) {
      var m = pageItems[i];
      html += '<tr data-master-id="' + m.id + '">';
      html += '<td class="master-name-cell" data-label="Name">' + this._esc(m.name) + '</td>';
      html += '<td class="actions-col" data-label="">';
      html += '<span class="action-pill edit-pill"><button class="btn btn-small btn-edit master-edit-btn" data-id="' + m.id + '" data-type="model" title="Edit">&#9998; Edit</button></span> ';
      html += '<span class="action-pill delete-pill"><button class="btn btn-small btn-delete master-delete-btn" data-id="' + m.id + '" data-type="model" title="Delete">&#128465; Delete</button></span>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;

    document.getElementById('masterModelsPageInfo').textContent = 'Page ' + this.masterModelPage + ' of ' + totalPages;
    var prevBtn = pagination.querySelector('[data-dir="prev"]');
    var nextBtn = pagination.querySelector('[data-dir="next"]');
    if (prevBtn) prevBtn.disabled = this.masterModelPage <= 1;
    if (nextBtn) nextBtn.disabled = this.masterModelPage >= totalPages;
  },

  _renderProvincesTable() {
    var allProvinces = MasterDB.getProvinces();
    var query = document.getElementById('masterProvinceSearch').value.trim().toLowerCase();
    var filtered = query ? allProvinces.filter(function(p) { return p.name.toLowerCase().indexOf(query) !== -1; }) : allProvinces;
    var tbody = document.getElementById('masterProvincesBody');
    var empty = document.getElementById('masterProvincesEmpty');
    var pagination = document.getElementById('masterProvincesPagination');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty.hidden = false;
      pagination.classList.add('hidden');
      return;
    }
    empty.hidden = true;
    pagination.classList.remove('hidden');

    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / this.masterPageSize));
    if (this.masterProvincePage > totalPages) this.masterProvincePage = totalPages;
    if (this.masterProvincePage < 1) this.masterProvincePage = 1;

    var start = (this.masterProvincePage - 1) * this.masterPageSize;
    var end = Math.min(start + this.masterPageSize, total);
    var pageItems = filtered.slice(start, end);

    var html = '';
    for (var i = 0; i < pageItems.length; i++) {
      var p = pageItems[i];
      html += '<tr data-master-id="' + p.id + '">';
      html += '<td class="master-name-cell" data-label="Name">' + this._esc(p.name) + '</td>';
      html += '<td class="actions-col" data-label="">';
      html += '<span class="action-pill edit-pill"><button class="btn btn-small btn-edit master-edit-btn" data-id="' + p.id + '" data-type="province" title="Edit">&#9998; Edit</button></span> ';
      html += '<span class="action-pill delete-pill"><button class="btn btn-small btn-delete master-delete-btn" data-id="' + p.id + '" data-type="province" title="Delete">&#128465; Delete</button></span>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;

    document.getElementById('masterProvincesPageInfo').textContent = 'Page ' + this.masterProvincePage + ' of ' + totalPages;
    var prevBtn = pagination.querySelector('[data-dir="prev"]');
    var nextBtn = pagination.querySelector('[data-dir="next"]');
    if (prevBtn) prevBtn.disabled = this.masterProvincePage <= 1;
    if (nextBtn) nextBtn.disabled = this.masterProvincePage >= totalPages;
  }
};
