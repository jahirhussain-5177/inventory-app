const UI = {
  currentPage: 1,
  pageSize: 14,
  sortKey: 'createdDate',
  sortDir: 'desc',
  deleteTargetId: null,
  masterPageSize: 10,
  masterModelPage: 1,
  masterProvincePage: 1,

  init() {
    this.initMultiPart();
    this.setupSortHandlers();
    this.setupMobileAccordion();
    this._updateMasterPageSize();
  },

  _updateMasterPageSize() {
    this.masterPageSize = window.innerWidth <= 768 ? 5 : 10;
  },

  initMultiPart() {
    this.addPartRow();

    document.getElementById('addPartBtn').addEventListener('click', () => {
      this.addPartRow();
    });

    document.getElementById('partsContainer').addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-part-btn');
      if (btn) {
        const row = btn.closest('.part-row');
        const container = document.getElementById('partsContainer');
        if (container.querySelectorAll('.part-row').length <= 1) {
          this._clearPartRow(row);
          return;
        }
        row.remove();
        this._updatePartRowNumbers();
      }
    });

    document.getElementById('partsContainer').addEventListener('change', (e) => {
      const row = e.target.closest('.part-row');
      if (!row) return;
      if (e.target.classList.contains('part-typeOfWork')) {
        this._togglePartWorkType(row, e.target.value);
      }
      if (e.target.classList.contains('part-availability')) {
        this._togglePartProvince(row, e.target.value);
      }
    });
  },

  addPartRow(data) {
    const template = document.getElementById('partRowTemplate');
    const clone = template.content.cloneNode(true);
    const container = document.getElementById('partsContainer');
    container.appendChild(clone);
    this._updatePartRowNumbers();

    const rows = container.querySelectorAll('.part-row');
    const newRow = rows[rows.length - 1];
    this._populatePartRowSelects(newRow);

    if (data) {
      this._fillPartRow(newRow, data);
    }
    return newRow;
  },

  _updatePartRowNumbers() {
    const rows = document.querySelectorAll('#partsContainer .part-row');
    rows.forEach((row, i) => {
      row.querySelector('.part-row-number').textContent = 'Part #' + (i + 1);
      row.dataset.index = i;
    });
  },

  _populatePartRowSelects(row) {
    const modelSelect = row.querySelector('.part-model');
    var models = MasterDB.getModels();
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    for (var i = 0; i < models.length; i++) {
      var opt = document.createElement('option');
      opt.value = models[i].name;
      opt.textContent = models[i].name;
      modelSelect.appendChild(opt);
    }

    const provinceSelect = row.querySelector('.part-province');
    var provinces = MasterDB.getProvinces();
    provinceSelect.innerHTML = '<option value="">-- Select Province --</option>';
    for (var i = 0; i < provinces.length; i++) {
      var opt = document.createElement('option');
      opt.value = provinces[i].name;
      opt.textContent = provinces[i].name;
      provinceSelect.appendChild(opt);
    }
  },

  _fillPartRow(row, data) {
    row.querySelector('.part-number').value = data.partNumber || '';

    var nameInput = row.querySelector('.part-name');
    nameInput.value = data.partName || '';

    var modelSelect = row.querySelector('.part-model');
    if (data.model) {
      var modelExists = Array.from(modelSelect.options).some(function(o) { return o.value === data.model; });
      if (!modelExists) {
        var opt = document.createElement('option');
        opt.value = data.model;
        opt.textContent = data.model;
        modelSelect.appendChild(opt);
      }
      modelSelect.value = data.model;
    }

    row.querySelector('.part-quantity').value = data.quantity != null ? data.quantity : '';

    var typeSelect = row.querySelector('.part-typeOfWork');
    typeSelect.value = data.typeOfWork || '';
    this._togglePartWorkType(row, typeSelect.value);

    if (data.typeOfWork === 'Counter Sale') {
      row.querySelector('.part-counterSaleNumber').value = data.counterSaleNumber || '';
    } else if (data.typeOfWork === 'Work Order') {
      row.querySelector('.part-workOrderNumber').value = data.workOrderNumber || '';
    }

    var availSelect = row.querySelector('.part-availability');
    availSelect.value = data.availabilityStatus || '';
    this._togglePartProvince(row, availSelect.value);

    if (data.availabilityStatus === 'Inside KSA' && data.province) {
      var provSelect = row.querySelector('.part-province');
      var provExists = Array.from(provSelect.options).some(function(o) { return o.value === data.province; });
      if (!provExists) {
        var opt = document.createElement('option');
        opt.value = data.province;
        opt.textContent = data.province;
        provSelect.appendChild(opt);
      }
      provSelect.value = data.province;
    }
  },

  _clearPartRow(row) {
    row.querySelectorAll('input').forEach(function(i) { i.value = ''; });
    row.querySelectorAll('select').forEach(function(s) { s.selectedIndex = 0; });
    this._togglePartWorkType(row, '');
    this._togglePartProvince(row, '');
  },

  _togglePartWorkType(row, value) {
    var csGroup = row.querySelector('.part-cs-group');
    var woGroup = row.querySelector('.part-wo-group');
    var csInput = row.querySelector('.part-counterSaleNumber');
    var woInput = row.querySelector('.part-workOrderNumber');

    if (value === 'Counter Sale') {
      csGroup.hidden = false;
      csGroup.style.display = 'flex';
      woGroup.hidden = true;
      woGroup.style.display = 'none';
      woInput.value = '';
    } else if (value === 'Work Order') {
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

  _togglePartProvince(row, value) {
    var provGroup = row.querySelector('.part-province-group');
    var provInput = row.querySelector('.part-province');
    if (value === 'Inside KSA') {
      provGroup.hidden = false;
    } else {
      provGroup.hidden = true;
      provInput.value = '';
    }
  },

  populateModelDropdown() {
    var models = MasterDB.getModels();
    var selects = document.querySelectorAll('.part-model');
    for (var s = 0; s < selects.length; s++) {
      var sel = selects[s];
      var currentVal = sel.value;
      sel.innerHTML = '<option value="">Select Model</option>';
      for (var i = 0; i < models.length; i++) {
        var opt = document.createElement('option');
        opt.value = models[i].name;
        opt.textContent = models[i].name;
        sel.appendChild(opt);
      }
      if (currentVal) sel.value = currentVal;
    }
  },

  populateProvinceDropdown() {
    var provinces = MasterDB.getProvinces();
    var selects = document.querySelectorAll('.part-province');
    for (var s = 0; s < selects.length; s++) {
      var sel = selects[s];
      var currentVal = sel.value;
      sel.innerHTML = '<option value="">-- Select Province --</option>';
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i].name;
        opt.textContent = provinces[i].name;
        sel.appendChild(opt);
      }
      if (currentVal) sel.value = currentVal;
    }
  },

  populateForm(record) {
    document.getElementById('editId').value = record.id;
    document.getElementById('chassis').value = record.chassis;

    var container = document.getElementById('partsContainer');
    container.innerHTML = '';
    this.addPartRow(record);

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

    var container = document.getElementById('partsContainer');
    container.innerHTML = '';
    this.addPartRow();

    document.getElementById('formTitle').textContent = 'Register Part';
    document.getElementById('editBadge').classList.add('hidden');
    document.getElementById('saveBtn').textContent = 'Register';

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
